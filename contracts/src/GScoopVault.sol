// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IArcYieldStrategy {
    function deposit() external payable returns (uint256);
    function redeem(uint256 shareAmount) external returns (uint256);
    function getAccruedYield(address account) external view returns (uint256);
}

/**
 * @title GScoopVault
 * @notice Trust-minimized decentralized cooperative savings pool (Rotating Savings Circle / ROSCA) on Arc Mainnet.
 *         Operates with Arc's native USDC (18 decimals at protocol level, msg.value is native USDC).
 *         Features:
 *         1. Native USDC Gas & Micro-fees.
 *         2. Idle Capital Float Yield Compounding (ERC-4626 style strategy).
 *         3. Collateralized Borrowing against Future Payout Turns with Automated Smart Contract Garnishment.
 *         4. Turn-Bidding Auction for Instant Discount Liquidity with Immediate Saver Dividends.
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

    // Yield Strategy Float Configuration
    address public yieldStrategy;
    bool public yieldEnabled;
    uint256 public totalYieldHarvested;
    uint256 public reserveFund; // Community reserve / safety pool

    // Credit & Borrowing Parameters
    uint256 public constant MAX_BORROW_BPS = 7500; // 75.00% max borrow of future scheduled pot
    uint256 public constant LOAN_FEE_BPS = 200;    // 2.00% fixed loan fee credited to reserve fund
    mapping(address => uint256) public activeDebt;
    mapping(address => uint256) public totalLifetimeBorrowed;

    // Flexible Timing & Advance Pre-Funding Buffer
    mapping(address => uint256) public advanceBalance;

    // Voluntary Booster Float Savings ("Save More")
    mapping(address => uint256) public boosterSavings;
    uint256 public totalBoosterSavings;

    // Multi-Share Cooperative Membership ("Buy Shares")
    mapping(address => uint256) public memberShares;

    // Discount Bidding Auction for Early Turn Liquidity
    struct DiscountBid {
        address bidder;
        uint256 discountAmount; // Native USDC discount offered
    }
    DiscountBid public currentHighestBid;

    // Events
    event MemberJoined(address indexed member, uint256 queuePosition);
    event DepositReceived(address indexed member, uint256 indexed cycle, uint256 amount);
    event PayoutDistributed(address indexed beneficiary, uint256 indexed cycle, uint256 amount, uint256 nextDeadline);
    event YieldCompounded(address indexed strategy, uint256 yieldHarvested, uint256 newReserveBalance);
    event LoanDisbursed(address indexed borrower, uint256 principal, uint256 fee, uint256 totalDebt);
    event LoanRepaid(address indexed borrower, uint256 amountPaid, uint256 remainingDebt);
    event LoanGarnished(address indexed borrower, uint256 garnishedAmount, uint256 netPayoutReceived);
    event TurnBidPlaced(address indexed bidder, uint256 discountAmount);
    event BidDividendDistributed(address indexed recipient, uint256 dividendAmount);
    event AdvanceFunded(address indexed member, uint256 amount, uint256 totalAdvance);
    event AdvanceDrawn(address indexed member, uint256 indexed cycle, uint256 amount);
    event BoosterSavingsDeposited(address indexed member, uint256 amount, uint256 totalBooster);
    event BoosterSavingsWithdrawn(address indexed member, uint256 amount, uint256 remainingBooster);
    event SharesPurchased(address indexed member, uint256 additionalShares, uint256 newTotalShares);
    event PatronageDividendsDistributed(uint256 totalDistributed, uint256 dividendPerSlot);

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
    error ExceedsBorrowCapacity(uint256 requested, uint256 maxAllowed);
    error ActiveLoanAlreadyExists(address member, uint256 outstandingDebt);
    error InsufficientReserveLiquidity(uint256 requested, uint256 available);
    error BidTooLow(uint256 submitted, uint256 currentHighest);
    error NoActiveDebt();
    error InsufficientAdvanceBalance(uint256 available, uint256 required);
    error InsufficientBoosterBalance(uint256 available, uint256 requested);
    error InsufficientReserveForDividends(uint256 requested, uint256 available);

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
        memberShares[msg.sender] = 1;

        emit MemberJoined(msg.sender, memberQueue.length - 1);
    }

    /**
     * @notice Deposit the required cycle contribution in native USDC.
     *         On Arc Mainnet, USDC is native gas & native currency (msg.value).
     *         Supports flexible advance pre-funding: excess deposit is buffered in advanceBalance!
     */
    function deposit() external payable nonReentrant whenNotPaused {
        // Auto-join member if not already joined
        if (!isMember[msg.sender]) {
            joinPool();
        }

        if (hasDeposited[currentCycle][msg.sender]) {
            revert DuplicateDepositForCycle(currentCycle, msg.sender);
        }

        uint256 cycleCost = contributionAmount;

        // Flexible timing handling:
        // Case 1: Member sent exact or more funds
        if (msg.value >= cycleCost) {
            hasDeposited[currentCycle][msg.sender] = true;
            cycleDepositCount[currentCycle]++;

            uint256 excess = msg.value - cycleCost;
            if (excess > 0) {
                advanceBalance[msg.sender] += excess;
                emit AdvanceFunded(msg.sender, excess, advanceBalance[msg.sender]);
            }
            emit DepositReceived(msg.sender, currentCycle, cycleCost);
        } 
        // Case 2: Member sent partial/0 funds, but has sufficient advance buffer
        else if (msg.value + advanceBalance[msg.sender] >= cycleCost) {
            uint256 neededFromAdvance = cycleCost - msg.value;
            advanceBalance[msg.sender] -= neededFromAdvance;
            hasDeposited[currentCycle][msg.sender] = true;
            cycleDepositCount[currentCycle]++;

            emit AdvanceDrawn(msg.sender, currentCycle, neededFromAdvance);
            emit DepositReceived(msg.sender, currentCycle, cycleCost);
        } else {
            revert IncorrectContributionAmount(msg.value + advanceBalance[msg.sender], cycleCost);
        }

        // Optional: Route idle float to yield strategy if enabled
        if (yieldEnabled && yieldStrategy != address(0)) {
            _depositToYieldStrategy(cycleCost);
        }

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
        // Harvest float yield and redeem principal from strategy if active
        if (yieldEnabled && yieldStrategy != address(0)) {
            _harvestFromYieldStrategy();
        }

        uint256 cyclePot = cycleDepositCount[currentCycle] * contributionAmount;
        if (cyclePot == 0 || cyclePot > address(this).balance) {
            cyclePot = address(this).balance;
        }
        if (cyclePot == 0) revert NoBalanceForPayout();

        address payable beneficiary;
        uint256 discountDeduction = 0;

        // Check if an early discount bid was accepted for this cycle
        if (currentHighestBid.bidder != address(0) && currentHighestBid.discountAmount > 0) {
            beneficiary = payable(currentHighestBid.bidder);
            discountDeduction = currentHighestBid.discountAmount;
            
            // Distribute the discount as instant cash dividends to remaining savers
            _distributeBidDividends(beneficiary, discountDeduction);

            // Reset auction bid
            currentHighestBid = DiscountBid(address(0), 0);
        } else {
            // Standard FIFO rotation
            uint256 beneficiaryIndex = currentCycle % memberQueue.length;
            beneficiary = payable(memberQueue[beneficiaryIndex]);
        }

        uint256 paidCycle = currentCycle;
        currentCycle++;
        cycleDeadline = block.timestamp + cycleDuration;

        // Base payout calculation (cycle pot minus discount)
        uint256 payoutAmount = cyclePot > discountDeduction ? cyclePot - discountDeduction : cyclePot;

        // Automated Debt Garnishment: Check if beneficiary has an active loan
        uint256 outstandingDebt = activeDebt[beneficiary];
        uint256 garnishedAmount = 0;

        if (outstandingDebt > 0) {
            if (payoutAmount >= outstandingDebt) {
                garnishedAmount = outstandingDebt;
                activeDebt[beneficiary] = 0;
                payoutAmount -= garnishedAmount;
            } else {
                garnishedAmount = payoutAmount;
                activeDebt[beneficiary] -= garnishedAmount;
                payoutAmount = 0;
            }
            reserveFund += garnishedAmount;
            emit LoanGarnished(beneficiary, garnishedAmount, payoutAmount);
        }

        // Transfer net payout to beneficiary
        if (payoutAmount > 0) {
            (bool success, ) = beneficiary.call{value: payoutAmount}("");
            if (!success) {
                revert PayoutTransferFailed(beneficiary, payoutAmount);
            }
        }

        emit PayoutDistributed(beneficiary, paidCycle, payoutAmount, cycleDeadline);
    }

    /**
     * @notice Distribute early turn discount as instant cash dividends to the other members.
     */
    function _distributeBidDividends(address winningBidder, uint256 totalDiscount) internal {
        if (memberQueue.length <= 1) return;
        uint256 eligibleSavers = memberQueue.length - 1;
        uint256 dividendPerSaver = totalDiscount / eligibleSavers;

        if (dividendPerSaver > 0) {
            // For small pools (<= 15 members), execute direct instant cash transfers
            if (memberQueue.length <= 15) {
                for (uint256 i = 0; i < memberQueue.length; i++) {
                    address saver = memberQueue[i];
                    if (saver != winningBidder) {
                        (bool sent, ) = payable(saver).call{value: dividendPerSaver}("");
                        if (sent) {
                            emit BidDividendDistributed(saver, dividendPerSaver);
                        }
                    }
                }
            } else {
                // Scalable O(1) constant-gas path for large pools (20, 50, 100+ members):
                // Credit discount directly to the shared community reserveFund, preventing unbounded gas loops
                reserveFund += totalDiscount;
                emit BidDividendDistributed(address(this), totalDiscount);
            }
        }
    }

    // =========================================================================
    // SECURE LENDING & BORROWING FUNCTIONS
    // =========================================================================

    /**
     * @notice Borrow native USDC liquidity against the member's guaranteed future payout turn.
     *         The smart contract locks future payout rights and auto-garnishes upon their turn.
     * @param amount The native USDC amount to borrow.
     */
    function borrowAgainstTurn(uint256 amount) external nonReentrant whenNotPaused {
        if (!isMember[msg.sender]) revert NotAuthorized();
        if (activeDebt[msg.sender] > 0) revert ActiveLoanAlreadyExists(msg.sender, activeDebt[msg.sender]);

        // Max borrow capacity is 75% of expected full pool pot
        uint256 expectedPot = contributionAmount * memberQueue.length;
        uint256 maxBorrow = (expectedPot * MAX_BORROW_BPS) / 10000;
        if (amount > maxBorrow) revert ExceedsBorrowCapacity(amount, maxBorrow);

        // Ensure contract has sufficient available liquidity
        uint256 cycleRequiredPot = cycleDepositCount[currentCycle] * contributionAmount;
        uint256 availableLiquidity = address(this).balance > cycleRequiredPot 
            ? address(this).balance - cycleRequiredPot 
            : 0;
        
        // Also check if reserve fund can cover
        if (amount > address(this).balance || availableLiquidity + reserveFund < amount) {
            revert InsufficientReserveLiquidity(amount, availableLiquidity + reserveFund);
        }

        // Calculate 2% loan fee credited to reserve fund
        uint256 loanFee = (amount * LOAN_FEE_BPS) / 10000;
        uint256 totalDebt = amount + loanFee;

        activeDebt[msg.sender] = totalDebt;
        totalLifetimeBorrowed[msg.sender] += amount;

        // Disburse loan in native USDC to borrower
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Loan disbursement failed");

        emit LoanDisbursed(msg.sender, amount, loanFee, totalDebt);
    }

    /**
     * @notice Manually repay an active loan early.
     */
    function repayLoan() external payable nonReentrant {
        uint256 debt = activeDebt[msg.sender];
        if (debt == 0) revert NoActiveDebt();
        require(msg.value > 0, "Payment must be > 0");

        uint256 paidAmount = msg.value;
        if (paidAmount >= debt) {
            activeDebt[msg.sender] = 0;
            reserveFund += debt;
            uint256 refund = paidAmount - debt;
            if (refund > 0) {
                (bool refundSent, ) = payable(msg.sender).call{value: refund}("");
                require(refundSent, "Refund failed");
            }
            emit LoanRepaid(msg.sender, debt, 0);
        } else {
            activeDebt[msg.sender] -= paidAmount;
            reserveFund += paidAmount;
            emit LoanRepaid(msg.sender, paidAmount, activeDebt[msg.sender]);
        }
    }

    // =========================================================================
    // TURN-BIDDING (AUCTION) FOR INSTANT DISCOUNT LIQUIDITY
    // =========================================================================

    /**
     * @notice Submit a discount bid to receive an immediate cycle payout advance.
     *         The highest bidder receives the pot minus their discount.
     *         The discount is immediately distributed as dividends to patient savers!
     */
    function submitTurnBid(uint256 discountAmount) external whenNotPaused {
        if (!isMember[msg.sender]) revert NotAuthorized();
        uint256 maxDiscount = (contributionAmount * memberQueue.length * 2000) / 10000; // Max 20% discount
        require(discountAmount <= maxDiscount, "Discount exceeds 20% cap");

        if (discountAmount <= currentHighestBid.discountAmount) {
            revert BidTooLow(discountAmount, currentHighestBid.discountAmount);
        }

        currentHighestBid = DiscountBid({
            bidder: msg.sender,
            discountAmount: discountAmount
        });

        emit TurnBidPlaced(msg.sender, discountAmount);
    }

    // =========================================================================
    // YIELD STRATEGY INTEGRATION
    // =========================================================================

    function setYieldStrategy(address _strategy, bool _enabled) external onlyAdmin {
        yieldStrategy = _strategy;
        yieldEnabled = _enabled;
    }

    function _depositToYieldStrategy(uint256 amount) internal {
        if (yieldStrategy == address(0)) return;
        (bool success, ) = yieldStrategy.call{value: amount}(abi.encodeWithSignature("deposit()"));
        if (!success) {
            // Non-blocking: If strategy deposit reverts, continue native custody
        }
    }

    function _harvestFromYieldStrategy() internal {
        if (yieldStrategy == address(0)) return;
        try IArcYieldStrategy(yieldStrategy).redeem(0) returns (uint256 returned) {
            if (returned > 0) {
                totalYieldHarvested += returned;
            }
        } catch {
            // Non-blocking fallback
        }
    }

    /**
     * @notice Harvest accrued yield from the external strategy into reserve.
     */
    function harvestYield() external returns (uint256 yieldHarvested) {
        if (yieldStrategy == address(0) || !yieldEnabled) return 0;
        uint256 accrued = IArcYieldStrategy(yieldStrategy).getAccruedYield(address(this));
        if (accrued > 0) {
            try IArcYieldStrategy(yieldStrategy).redeem(accrued) returns (uint256 returned) {
                yieldHarvested = returned;
                totalYieldHarvested += returned;
                reserveFund += returned;
                emit YieldCompounded(yieldStrategy, returned, reserveFund);
            } catch {
                return 0;
            }
        }
    }

    // =========================================================================
    // FLEXIBLE TIMING & ADVANCE PRE-FUNDING BUFFER
    // =========================================================================

    /**
     * @notice Fund an advance balance in native USDC.
     *         Enables savers to pre-pay multiple cycles ahead so they never miss a deadline.
     */
    function depositAdvance() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Advance must be > 0");
        if (!isMember[msg.sender]) {
            joinPool();
        }
        advanceBalance[msg.sender] += msg.value;
        emit AdvanceFunded(msg.sender, msg.value, advanceBalance[msg.sender]);
    }

    /**
     * @notice Settle a member's current cycle contribution using their buffered advance balance.
     *         Can be invoked by the member or any group participant before or at deadline.
     */
    function depositFromAdvanceFor(address member) external nonReentrant whenNotPaused {
        require(isMember[member], "Not a member");
        if (hasDeposited[currentCycle][member]) revert DuplicateDepositForCycle(currentCycle, member);
        if (advanceBalance[member] < contributionAmount) revert InsufficientAdvanceBalance(advanceBalance[member], contributionAmount);

        advanceBalance[member] -= contributionAmount;
        hasDeposited[currentCycle][member] = true;
        cycleDepositCount[currentCycle]++;

        emit AdvanceDrawn(member, currentCycle, contributionAmount);
        emit DepositReceived(member, currentCycle, contributionAmount);

        if (yieldEnabled && yieldStrategy != address(0)) {
            _depositToYieldStrategy(contributionAmount);
        }

        if (memberQueue.length > 0 && cycleDepositCount[currentCycle] == memberQueue.length) {
            _executePayout();
        }
    }

    // =========================================================================
    // MULTI-SHARE MEMBERSHIP ("BUY MORE SHARES")
    // =========================================================================

    /**
     * @notice Acquire additional shares in the cooperative pool.
     *         Each additional share grants an additional scheduled payout turn in the cycle rotation!
     */
    function buyShares(uint256 additionalShares) external payable nonReentrant whenNotPaused {
        require(additionalShares > 0 && additionalShares <= 5, "Shares between 1 and 5");
        if (!isMember[msg.sender]) {
            joinPool();
        }
        if (maxMembers > 0 && memberQueue.length + additionalShares > maxMembers) {
            revert MaxMembersReached();
        }

        memberShares[msg.sender] += additionalShares;
        for (uint256 i = 0; i < additionalShares; i++) {
            memberQueue.push(msg.sender);
        }

        emit SharesPurchased(msg.sender, additionalShares, memberShares[msg.sender]);
    }

    // =========================================================================
    // VOLUNTARY BOOSTER SAVINGS ("SAVE MORE")
    // =========================================================================

    /**
     * @notice Deposit voluntary flexible savings into the cooperative's float yield strategy.
     *         Allows members to save beyond the fixed rotating pot and earn compounding float yield.
     */
    function depositBoosterSavings() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be > 0");
        if (!isMember[msg.sender]) {
            joinPool();
        }
        boosterSavings[msg.sender] += msg.value;
        totalBoosterSavings += msg.value;

        if (yieldEnabled && yieldStrategy != address(0)) {
            _depositToYieldStrategy(msg.value);
        }

        emit BoosterSavingsDeposited(msg.sender, msg.value, boosterSavings[msg.sender]);
    }

    /**
     * @notice Withdraw voluntary booster savings on demand.
     */
    function withdrawBoosterSavings(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        if (boosterSavings[msg.sender] < amount) {
            revert InsufficientBoosterBalance(boosterSavings[msg.sender], amount);
        }

        boosterSavings[msg.sender] -= amount;
        totalBoosterSavings -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Booster withdrawal failed");

        emit BoosterSavingsWithdrawn(msg.sender, amount, boosterSavings[msg.sender]);
    }

    // =========================================================================
    // PERPETUAL SEASONS & PATRONAGE DIVIDENDS
    // =========================================================================

    /**
     * @notice Distribute surplus profits (from 2% loan fees, auction discounts, and float yield)
     *         from the reserveFund back to active cooperative members as an annual or season patronage dividend!
     */
    function distributePatronageDividends(uint256 totalDividendAmount) external onlyAdmin nonReentrant {
        if (memberQueue.length == 0) revert NoMembersInQueue();
        if (totalDividendAmount > reserveFund) {
            revert InsufficientReserveForDividends(totalDividendAmount, reserveFund);
        }

        reserveFund -= totalDividendAmount;
        uint256 dividendPerSlot = totalDividendAmount / memberQueue.length;

        if (dividendPerSlot > 0) {
            for (uint256 i = 0; i < memberQueue.length; i++) {
                address member = memberQueue[i];
                (bool sent, ) = payable(member).call{value: dividendPerSlot}("");
                if (!sent) {
                    advanceBalance[member] += dividendPerSlot;
                }
            }
        }

        emit PatronageDividendsDistributed(totalDividendAmount, dividendPerSlot);
    }

    // =========================================================================
    // VIEW FUNCTIONS & ADMIN
    // =========================================================================

    /**
     * @notice Get current beneficiary (accounting for active auction bid).
     */
    function getCurrentBeneficiary() external view returns (address) {
        if (currentHighestBid.bidder != address(0)) {
            return currentHighestBid.bidder;
        }
        if (memberQueue.length == 0) return address(0);
        return memberQueue[currentCycle % memberQueue.length];
    }

    function getMembers() external view returns (address[] memory) {
        return memberQueue;
    }

    function getMemberCount() external view returns (uint256) {
        return memberQueue.length;
    }

    function hasMemberDeposited(uint256 cycle, address member) external view returns (bool) {
        return hasDeposited[cycle][member];
    }

    function getVaultState() external view returns (
        string memory vaultName,
        uint256 contribution,
        uint256 duration,
        uint256 deadline,
        uint256 cycle,
        uint256 balance,
        uint256 memberCount,
        uint256 cycleDeposits,
        address currentBeneficiaryAddress,
        uint256 vaultReserve,
        uint256 currentDiscountBid
    ) {
        address beneficiary = currentHighestBid.bidder != address(0) 
            ? currentHighestBid.bidder 
            : (memberQueue.length > 0 ? memberQueue[currentCycle % memberQueue.length] : address(0));

        return (
            name,
            contributionAmount,
            cycleDuration,
            cycleDeadline,
            currentCycle,
            address(this).balance,
            memberQueue.length,
            cycleDepositCount[currentCycle],
            beneficiary,
            reserveFund,
            currentHighestBid.discountAmount
        );
    }

    /**
     * @notice Get current cooperative season (1-indexed).
     */
    function getCurrentSeason() external view returns (uint256) {
        return memberQueue.length > 0 ? (currentCycle / memberQueue.length) + 1 : 1;
    }

    /**
     * @notice Get cycle number within the current season (1-indexed).
     */
    function getCycleInSeason() external view returns (uint256) {
        return memberQueue.length > 0 ? (currentCycle % memberQueue.length) + 1 : 1;
    }

    /**
     * @notice Get comprehensive personal financial position for a member.
     */
    function getMemberFinancials(address member) external view returns (
        uint256 debt,
        uint256 advance,
        uint256 booster,
        uint256 shares
    ) {
        return (
            activeDebt[member],
            advanceBalance[member],
            boosterSavings[member],
            memberShares[member]
        );
    }

    // Emergency controls
    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    receive() external payable {
        // Accept native USDC transfers (yield redemptions, donations, top-ups)
        reserveFund += msg.value;
    }
}
