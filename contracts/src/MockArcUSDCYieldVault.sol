// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockArcUSDCYieldVault
 * @notice Simulated ERC-4626 native USDC yield vault on Arc Mainnet.
 *         Demonstrates automated float compounding (e.g. 5% APY).
 */
contract MockArcUSDCYieldVault {
    string public name = "Arc Native USDC Yield Strategy";
    string public symbol = "ayUSDC";
    uint8 public decimals = 18;

    uint256 public constant APY_BPS = 500; // 5.00% annual yield
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    mapping(address => uint256) public shares;
    mapping(address => uint256) public depositTimestamp;
    uint256 public totalAssets;

    event Deposited(address indexed user, uint256 assets, uint256 sharesIssued);
    event Redeemed(address indexed user, uint256 assetsReturned, uint256 yieldEarned);

    receive() external payable {
        deposit();
    }

    /**
     * @notice Deposit native USDC into the yield strategy.
     */
    function deposit() public payable returns (uint256 sharesIssued) {
        require(msg.value > 0, "Deposit must be > 0");

        // Harvest any existing yield first
        _compoundYield(msg.sender);

        sharesIssued = msg.value;
        shares[msg.sender] += sharesIssued;
        depositTimestamp[msg.sender] = block.timestamp;
        totalAssets += msg.value;

        emit Deposited(msg.sender, msg.value, sharesIssued);
    }

    /**
     * @notice Calculate accrued yield for an account.
     */
    function getAccruedYield(address account) public view returns (uint256) {
        uint256 balance = shares[account];
        if (balance == 0 || depositTimestamp[account] == 0) return 0;

        uint256 duration = block.timestamp - depositTimestamp[account];
        // yield = balance * (500 / 10000) * (duration / 365 days)
        return (balance * APY_BPS * duration) / (10000 * SECONDS_PER_YEAR);
    }

    /**
     * @notice Redeem shares and accrued yield back to caller.
     */
    function redeem(uint256 shareAmount) external returns (uint256 totalReturned) {
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");

        uint256 yieldEarned = getAccruedYield(msg.sender);
        totalReturned = shareAmount + yieldEarned;

        shares[msg.sender] -= shareAmount;
        if (shares[msg.sender] == 0) {
            depositTimestamp[msg.sender] = 0;
        } else {
            depositTimestamp[msg.sender] = block.timestamp;
        }

        totalAssets = totalAssets > totalReturned ? totalAssets - totalReturned : 0;

        (bool sent, ) = payable(msg.sender).call{value: totalReturned}("");
        require(sent, "Redeem transfer failed");

        emit Redeemed(msg.sender, totalReturned, yieldEarned);
    }

    function _compoundYield(address account) internal {
        uint256 yieldEarned = getAccruedYield(account);
        if (yieldEarned > 0) {
            shares[account] += yieldEarned;
            totalAssets += yieldEarned;
        }
    }
}
