// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GScoopVault
 * @notice Trust-minimized decentralized cooperative savings pool (Rotating Savings Circle / ROSCA) on Arc Mainnet.
 *         Operates with Arc's native USDC (18 decimals at protocol level, msg.value is native USDC).
 */
contract GScoopVault is ReentrancyGuard, Pausable {
    string public name;
    uint256 public contributionAmount; // Native USDC (18 decimals)
    uint256 public cycleDuration;      // In seconds
    uint256 public cycleDeadline;      // Timestamp of current cycle completion
    uint256 public currentCycle;       // Active cycle number (0-indexed)
    uint256 public maxMembers;         // 0 for unlimited, or specific cap (e.g. 5, 10)

    address public creator;
    address public factory;

    address[] public memberQueue;
    mapping(address => bool) public isMember;
    mapping(address => uint256) public memberIndex;
    mapping(uint256 => mapping(address => bool)) public hasDeposited;
    mapping(uint256 => uint256) public cycleDepositCount;

    // Events
    event MemberJoined(address indexed member, uint256 queuePosition);
    event DepositReceived(address indexed member, uint256 indexed cycle, uint256 amount);
    event PayoutDistributed(address indexed beneficiary, uint256 indexed cycle, uint256 amount, uint256 nextDeadline);
    event CycleExtended(uint256 indexed cycle, uint256 newDeadline);

    // Custom errors for gas efficiency
    error NotAuthorized();
    error AlreadyMember();
    error MaxMembersReached();
    error IncorrectContributionAmount(uint256 sent, uint256 expected);
    error DuplicateDepositForCycle(uint256 cycle, address member);
    error CycleNotReadyForPayout(uint256 currentTime, uint256 deadline, uint256 deposits, uint256 totalMembers);
    error NoBalanceForPayout();
    error PayoutTransferFailed(address beneficiary, uint256 amount);
    error NoMembersInQueue();

    modifier onlyAdmin() {
        if (msg.sender != creator && msg.sender != factory) revert NotAuthorized();
        _;
    }

    constructor(
        string memory _name,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint256 _maxMembers,
        address _creator,
        address _factory
    ) {
        require(_contributionAmount > 0, "Contribution must be > 0");
        require(_cycleDuration >= 60, "Cycle duration must be at least 1 min");

        name = _name;
        contributionAmount = _contributionAmount;
        cycleDuration = _cycleDuration;
        maxMembers = _maxMembers;
        creator = _creator;
        factory = _factory;
        currentCycle = 0;
        cycleDeadline = block.timestamp + _cycleDuration;
    }

    /**
     * @notice Join the cooperative savings pool queue.
     */
    function joinPool() public whenNotPaused {
        if (isMember[msg.sender]) revert AlreadyMember();
        if (maxMembers > 0 && memberQueue.length >= maxMembers) revert MaxMembersReached();

        memberIndex[msg.sender] = memberQueue.length;
        memberQueue.push(msg.sender);
        isMember[msg.sender] = true;

        emit MemberJoined(msg.sender, memberQueue.length - 1);
    }

    /**
     * @notice Deposit the required cycle contribution in native USDC.
     *         On Arc Mainnet, USDC is native gas & native currency (msg.value).
     */
    function deposit() external payable nonReentrant whenNotPaused {
        if (msg.value != contributionAmount) {
            revert IncorrectContributionAmount(msg.value, contributionAmount);
        }

        // Auto-join member if not already joined
        if (!isMember[msg.sender]) {
            joinPool();
        }

        if (hasDeposited[currentCycle][msg.sender]) {
            revert DuplicateDepositForCycle(currentCycle, msg.sender);
        }

        hasDeposited[currentCycle][msg.sender] = true;
        cycleDepositCount[currentCycle]++;

        emit DepositReceived(msg.sender, currentCycle, msg.value);

        // Instant settlement trigger if all members have deposited
        if (memberQueue.length > 0 && cycleDepositCount[currentCycle] == memberQueue.length) {
            _executePayout();
        }
    }

    /**
     * @notice Distribute the pool payout to the scheduled cycle beneficiary.
     *         Can be executed once cycle deadline passes OR all members deposited.
     */
    function distributePayout() external nonReentrant whenNotPaused {
        if (memberQueue.length == 0) revert NoMembersInQueue();

        bool deadlineReached = block.timestamp >= cycleDeadline;
        bool allMembersDeposited = cycleDepositCount[currentCycle] >= memberQueue.length;

        if (!deadlineReached && !allMembersDeposited) {
            revert CycleNotReadyForPayout(
                block.timestamp,
                cycleDeadline,
                cycleDepositCount[currentCycle],
                memberQueue.length
            );
        }

        _executePayout();
    }

    /**
     * @dev Internal payout execution adhering to Checks-Effects-Interactions.
     */
    function _executePayout() internal {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalanceForPayout();

        uint256 beneficiaryIndex = currentCycle % memberQueue.length;
        address payable beneficiary = payable(memberQueue[beneficiaryIndex]);

        uint256 paidCycle = currentCycle;
        currentCycle++;
        cycleDeadline = block.timestamp + cycleDuration;

        (bool success, ) = beneficiary.call{value: balance}("");
        if (!success) {
            revert PayoutTransferFailed(beneficiary, balance);
        }

        emit PayoutDistributed(beneficiary, paidCycle, balance, cycleDeadline);
    }

    /**
     * @notice Get the active beneficiary for the current cycle.
     */
    function getCurrentBeneficiary() external view returns (address) {
        if (memberQueue.length == 0) return address(0);
        return memberQueue[currentCycle % memberQueue.length];
    }

    /**
     * @notice Get all enrolled members in rotating queue order.
     */
    function getMembers() external view returns (address[] memory) {
        return memberQueue;
    }

    /**
     * @notice Get member count.
     */
    function getMemberCount() external view returns (uint256) {
        return memberQueue.length;
    }

    /**
     * @notice Check if an address has deposited for a specific cycle.
     */
    function hasMemberDeposited(uint256 cycle, address member) external view returns (bool) {
        return hasDeposited[cycle][member];
    }

    /**
     * @notice Get high-level vault state for frontends.
     */
    function getVaultState() external view returns (
        string memory vaultName,
        uint256 contribution,
        uint256 duration,
        uint256 deadline,
        uint256 cycle,
        uint256 balance,
        uint256 memberCount,
        uint256 cycleDeposits,
        address currentBeneficiaryAddress
    ) {
        address beneficiary = memberQueue.length > 0 ? memberQueue[currentCycle % memberQueue.length] : address(0);
        return (
            name,
            contributionAmount,
            cycleDuration,
            cycleDeadline,
            currentCycle,
            address(this).balance,
            memberQueue.length,
            cycleDepositCount[currentCycle],
            beneficiary
        );
    }

    // Emergency controls
    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    // Accept native USDC transfers directly if needed
    receive() external payable {}
}
