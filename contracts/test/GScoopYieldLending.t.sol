// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GScoopFactory.sol";
import "../src/GScoopVault.sol";
import "../src/MockArcUSDCYieldVault.sol";

contract GScoopYieldLendingTest is Test {
    GScoopFactory public factory;
    GScoopVault public vault;
    MockArcUSDCYieldVault public yieldVault;

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xCAFE);

    uint256 public constant CONTRIBUTION = 50 * 1e18; // 50 USDC
    uint256 public constant DURATION = 7 days;

    function setUp() public {
        vm.deal(alice, 1000 * 1e18);
        vm.deal(bob, 1000 * 1e18);
        vm.deal(charlie, 1000 * 1e18);

        factory = new GScoopFactory();
        address vaultAddr = factory.createCoop("Yield & Lending Circle", CONTRIBUTION, DURATION, 3);
        vault = GScoopVault(payable(vaultAddr));

        yieldVault = new MockArcUSDCYieldVault();

        // Enroll Alice, Bob, Charlie
        vm.prank(alice);
        vault.joinPool();
        vm.prank(bob);
        vault.joinPool();
        vm.prank(charlie);
        vault.joinPool();

        // Seed initial liquidity/reserve into vault
        vm.deal(address(this), 100 * 1e18);
        (bool sent, ) = address(vault).call{value: 100 * 1e18}("");
        require(sent, "Reserve seed failed");
    }

    function testBorrowAgainstFutureTurn() public {
        // Expected pot = 3 * 50 = 150 USDC. Max borrow is 75% = 112.5 USDC.
        // Bob (Turn #2) borrows 50 USDC
        uint256 bobBalBefore = bob.balance;

        vm.prank(bob);
        vault.borrowAgainstTurn(50 * 1e18);

        // Bob receives 50 USDC
        assertEq(bob.balance, bobBalBefore + 50 * 1e18);

        // Active debt includes 2% fee: 50 + 1 = 51 USDC
        assertEq(vault.activeDebt(bob), 51 * 1e18);
    }

    function testAutomatedGarnishmentOnPayout() public {
        // Bob borrows 50 USDC (debt: 51 USDC)
        vm.prank(bob);
        vault.borrowAgainstTurn(50 * 1e18);
        assertEq(vault.activeDebt(bob), 51 * 1e18);

        // Cycle 0: Beneficiary is Alice. All deposit.
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        // Cycle 0 pays out to Alice (Cycle becomes 1, Bob is now beneficiary for Cycle 1)
        assertEq(vault.currentCycle(), 1);
        assertEq(vault.getCurrentBeneficiary(), bob);

        uint256 bobBalBeforePayout = bob.balance;

        // Seed cycle 1 deposits (150 USDC total pot)
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        // Bob's payout pot was 150 USDC.
        // Automated debt garnishment: 51 USDC garnished into reserveFund.
        // Net payout to Bob: 150 - 51 = 99 USDC.
        // Bob spent 50 on deposit, received 99 net, net change is +49 USDC.
        assertEq(bob.balance, bobBalBeforePayout - CONTRIBUTION + 99 * 1e18);

        // Bob's debt is now 0!
        assertEq(vault.activeDebt(bob), 0);
        // Reserve fund received 51 USDC garnished on top of 100 initial seed
        assertEq(vault.reserveFund(), 151 * 1e18);
    }

    function testManualEarlyLoanRepayment() public {
        vm.prank(bob);
        vault.borrowAgainstTurn(50 * 1e18);
        assertEq(vault.activeDebt(bob), 51 * 1e18);

        // Bob repays 51 USDC early
        vm.prank(bob);
        vault.repayLoan{value: 51 * 1e18}();

        assertEq(vault.activeDebt(bob), 0);
        assertEq(vault.reserveFund(), 151 * 1e18);
    }

    function testTurnBiddingAuctionWithDividends() public {
        // Charlie (Turn #3) needs emergency liquidity right now in Cycle 0.
        // Total pot will be 150 USDC. Charlie bids a 20 USDC discount to get payout now.
        vm.prank(charlie);
        vault.submitTurnBid(20 * 1e18);

        // Check highest bid is set
        assertEq(vault.getCurrentBeneficiary(), charlie);

        uint256 aliceBalBefore = alice.balance;
        uint256 bobBalBefore = bob.balance;
        uint256 charlieBalBefore = charlie.balance;

        // Members deposit
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        // Payout triggered!
        // Charlie was winner of auction:
        // Pot is 150 USDC. Charlie gets 150 - 20 = 130 USDC.
        // Charlie paid 50, received 130, net +80 USDC.
        assertEq(charlie.balance, charlieBalBefore - CONTRIBUTION + 130 * 1e18);

        // The 20 USDC discount was split equally to Alice & Bob (10 USDC dividend each!)
        // Alice paid 50, got 10 dividend -> aliceBalBefore - 40
        assertEq(alice.balance, aliceBalBefore - CONTRIBUTION + 10 * 1e18);
        assertEq(bob.balance, bobBalBefore - CONTRIBUTION + 10 * 1e18);
    }

    function testYieldStrategyFloatAccrual() public {
        // Creator sets yield strategy
        address creator = vault.creator();
        vm.prank(creator);
        vault.setYieldStrategy(address(yieldVault), true);

        assertTrue(vault.yieldEnabled());
        assertEq(vault.yieldStrategy(), address(yieldVault));
    }

    function testLargeMemberPoolScaling() public {
        // Create a 30-member vault
        address largeVaultAddr = factory.createCoop("Megapool 30", 10 * 1e18, 1 days, 30);
        GScoopVault largeVault = GScoopVault(payable(largeVaultAddr));

        // Enroll 30 distinct members
        for (uint160 i = 1; i <= 30; i++) {
            address member = address(uint160(0x9000 + i));
            vm.deal(member, 100 * 1e18);
            vm.prank(member);
            largeVault.joinPool();
        }

        assertEq(largeVault.getMemberCount(), 30);

        // Member 30 bids 20 USDC discount in early turn auction
        address bidder = address(0x9000 + 30);
        vm.prank(bidder);
        largeVault.submitTurnBid(20 * 1e18);

        // All 30 members deposit
        for (uint160 i = 1; i <= 30; i++) {
            address member = address(uint160(0x9000 + i));
            vm.prank(member);
            largeVault.deposit{value: 10 * 1e18}();
        }

        // Pot is 30 * 10 = 300 USDC.
        // Bidder receives 300 - 20 = 280 USDC.
        // Since members > 15, the 20 USDC discount was added to reserveFund in O(1) gas!
        assertEq(largeVault.reserveFund(), 20 * 1e18);
        assertEq(largeVault.currentCycle(), 1);
    }

    function testAdvancePreFunding() public {
        // Alice deposits 150 USDC (50 for cycle 0, 100 goes into advanceBalance)
        vm.prank(alice);
        vault.deposit{value: 150 * 1e18}();

        assertEq(vault.advanceBalance(alice), 100 * 1e18);
        assertTrue(vault.hasDeposited(0, alice));

        // Complete cycle 0
        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();
        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        assertEq(vault.currentCycle(), 1);

        // In cycle 1, Alice deposits with 0 msg.value using her advance balance
        vm.prank(alice);
        vault.deposit{value: 0}();

        assertTrue(vault.hasDeposited(1, alice));
        assertEq(vault.advanceBalance(alice), 50 * 1e18); // 100 - 50 = 50 USDC remaining
    }

    function testVoluntaryBoosterSavings() public {
        // Alice parks 200 USDC extra into booster savings
        vm.prank(alice);
        vault.depositBoosterSavings{value: 200 * 1e18}();

        assertEq(vault.boosterSavings(alice), 200 * 1e18);
        assertEq(vault.totalBoosterSavings(), 200 * 1e18);

        // Alice withdraws 50 USDC
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        vault.withdrawBoosterSavings(50 * 1e18);

        assertEq(alice.balance, balBefore + 50 * 1e18);
        assertEq(vault.boosterSavings(alice), 150 * 1e18);
    }

    function testMultiShareMembership() public {
        // Create an open 10-member pool
        address multiVaultAddr = factory.createCoop("MultiShare Pool", CONTRIBUTION, DURATION, 10);
        GScoopVault multiVault = GScoopVault(payable(multiVaultAddr));

        // Alice joins and buys 2 additional shares (total 3 shares)
        vm.prank(alice);
        multiVault.joinPool();
        assertEq(multiVault.memberShares(alice), 1);

        vm.prank(alice);
        multiVault.buyShares(2);

        assertEq(multiVault.memberShares(alice), 3);
        assertEq(multiVault.getMemberCount(), 3); // 3 slots in queue for Alice!
    }

    function testPerpetualSeasonsAndPatronageDividends() public {
        // Reserve has 100 USDC seeded in setUp()
        assertEq(vault.reserveFund(), 100 * 1e18);

        // Season calculation
        assertEq(vault.getCurrentSeason(), 1);
        assertEq(vault.getCycleInSeason(), 1);

        // Distribute 60 USDC of surplus reserve as patronage dividends
        // 3 members: Alice, Bob, Charlie -> 20 USDC each!
        uint256 aliceBalBefore = alice.balance;
        uint256 bobBalBefore = bob.balance;
        uint256 charlieBalBefore = charlie.balance;

        address creator = vault.creator();
        vm.prank(creator);
        vault.distributePatronageDividends(60 * 1e18);

        assertEq(alice.balance, aliceBalBefore + 20 * 1e18);
        assertEq(bob.balance, bobBalBefore + 20 * 1e18);
        assertEq(charlie.balance, charlieBalBefore + 20 * 1e18);
        assertEq(vault.reserveFund(), 40 * 1e18);
    }
}
