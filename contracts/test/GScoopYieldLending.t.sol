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
        // Reserve fund received 51 USDC garnished
        assertEq(vault.reserveFund(), 51 * 1e18);
    }

    function testManualEarlyLoanRepayment() public {
        vm.prank(bob);
        vault.borrowAgainstTurn(50 * 1e18);
        assertEq(vault.activeDebt(bob), 51 * 1e18);

        // Bob repays 51 USDC early
        vm.prank(bob);
        vault.repayLoan{value: 51 * 1e18}();

        assertEq(vault.activeDebt(bob), 0);
        assertEq(vault.reserveFund(), 51 * 1e18);
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
}
