// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GScoopFactory.sol";
import "../src/GScoopVault.sol";

contract GScoopTest is Test {
    GScoopFactory public factory;
    GScoopVault public vault;

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xCAFE);

    uint256 public constant CONTRIBUTION = 50 * 1e18; // 50 native USDC
    uint256 public constant DURATION = 7 days;

    function setUp() public {
        vm.deal(alice, 1000 * 1e18);
        vm.deal(bob, 1000 * 1e18);
        vm.deal(charlie, 1000 * 1e18);

        factory = new GScoopFactory();
        address vaultAddr = factory.createCoop("Synergy Alpha Pool", CONTRIBUTION, DURATION, 3);
        vault = GScoopVault(payable(vaultAddr));
    }

    function testFactoryCreation() public view {
        assertEq(factory.getCoopCount(), 1);
        assertEq(vault.name(), "Synergy Alpha Pool");
        assertEq(vault.contributionAmount(), CONTRIBUTION);
        assertEq(vault.cycleDuration(), DURATION);
        assertEq(vault.maxMembers(), 3);
        assertEq(vault.currentCycle(), 0);
    }

    function testJoinPool() public {
        vm.prank(alice);
        vault.joinPool();

        assertEq(vault.getMemberCount(), 1);
        assertTrue(vault.isMember(alice));
    }

    function testSoloMemberDepositDoesNotAutoSettle() public {
        vm.prank(alice);
        vault.joinPool();

        // Alice deposits into the 3-member vault as the sole member so far
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();

        // Funds MUST stay in the vault to accumulate, NOT auto-settle back to Alice!
        assertEq(address(vault).balance, CONTRIBUTION);
        assertEq(vault.currentCycle(), 0);
        assertTrue(vault.hasMemberDeposited(0, alice));
        assertEq(alice.balance, 1000 * 1e18 - CONTRIBUTION);
    }

    function testDuplicateDepositReverts() public {
        vm.prank(alice);
        vault.joinPool();

        vm.prank(bob);
        vault.joinPool();

        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();

        vm.expectRevert(
            abi.encodeWithSelector(GScoopVault.DuplicateDepositForCycle.selector, 0, alice)
        );
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();
    }

    function testIncorrectContributionReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                GScoopVault.IncorrectContributionAmount.selector,
                CONTRIBUTION - 1,
                CONTRIBUTION
            )
        );
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION - 1}();
    }

    function testFullCyclePayoutRotation() public {
        // Members: Alice, Bob, Charlie
        vm.prank(alice);
        vault.joinPool();

        vm.prank(bob);
        vault.joinPool();

        vm.prank(charlie);
        vault.joinPool();

        assertEq(vault.getMemberCount(), 3);
        // Turn 0 beneficiary: Alice
        assertEq(vault.getCurrentBeneficiary(), alice);

        uint256 aliceBalBefore = alice.balance;

        // Alice & Bob deposit
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();

        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();

        assertEq(address(vault).balance, 100 * 1e18);

        // Charlie deposits -> triggers instant settlement payout to Alice (Cycle 0 beneficiary)
        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        // 3 * 50 = 150 USDC payout to Alice
        // Alice spent 50, so net gain is +100
        assertEq(alice.balance, aliceBalBefore - CONTRIBUTION + 150 * 1e18);

        // Cycle increments to 1
        assertEq(vault.currentCycle(), 1);
        // Turn 1 beneficiary: Bob
        assertEq(vault.getCurrentBeneficiary(), bob);

        // Vault balance is 0 after complete payout
        assertEq(address(vault).balance, 0);

        // Next cycle: Alice, Bob, Charlie deposit again
        uint256 bobBalBefore = bob.balance;

        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();

        vm.prank(bob);
        vault.deposit{value: CONTRIBUTION}();

        vm.prank(charlie);
        vault.deposit{value: CONTRIBUTION}();

        // Bob receives Cycle 1 payout
        assertEq(bob.balance, bobBalBefore - CONTRIBUTION + 150 * 1e18);
        assertEq(vault.currentCycle(), 2);
        // Turn 2 beneficiary: Charlie
        assertEq(vault.getCurrentBeneficiary(), charlie);
    }

    function testDistributePayoutAfterDeadline() public {
        vm.prank(alice);
        vault.joinPool();

        vm.prank(bob);
        vault.joinPool();

        // Only Alice deposits
        vm.prank(alice);
        vault.deposit{value: CONTRIBUTION}();

        // Payout before deadline fails
        vm.expectRevert();
        vault.distributePayout();

        // Fast forward past deadline
        vm.warp(block.timestamp + DURATION + 1);

        uint256 aliceBal = alice.balance;
        vault.distributePayout();

        // Alice receives the accumulated pool balance
        assertEq(alice.balance, aliceBal + CONTRIBUTION);
        assertEq(vault.currentCycle(), 1);
    }

    function testPauseReverts() public {
        vm.prank(address(this));
        // Creator is address(this) because factory was deployed by address(this) and created by factory
        // Let's test pausing by creator
        address creator = vault.creator();
        vm.prank(creator);
        vault.pause();

        assertTrue(vault.paused());

        vm.prank(alice);
        vm.expectRevert();
        vault.deposit{value: CONTRIBUTION}();

        vm.prank(creator);
        vault.unpause();
        assertFalse(vault.paused());
    }

    function testMaxMembersEnforced() public {
        // Pool has maxMembers = 3
        vm.prank(alice);
        vault.joinPool();
        vm.prank(bob);
        vault.joinPool();
        vm.prank(charlie);
        vault.joinPool();

        address dave = address(0xDA7E);
        vm.deal(dave, 100 * 1e18);
        vm.prank(dave);
        vm.expectRevert(abi.encodeWithSelector(GScoopVault.MaxMembersReached.selector));
        vault.joinPool();
    }
}
