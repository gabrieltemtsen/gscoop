// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./GScoopVault.sol";

/**
 * @title GScoopFactory
 * @notice Factory & Registry for trust-minimized cooperative vaults on Arc Mainnet.
 */
contract GScoopFactory {
    address[] public allCoops;
    mapping(address => bool) public isCoop;
    mapping(address => address[]) public userCreatedCoops;

    event CoopCreated(
        address indexed vaultAddress,
        string name,
        address indexed creator,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers
    );

    /**
     * @notice Deploy a new cooperative pool with default max members (10).
     */
    function createCoop(
        string memory name,
        uint256 contributionAmount,
        uint256 cycleDuration
    ) external returns (address vault) {
        return createCoop(name, contributionAmount, cycleDuration, 10);
    }

    /**
     * @notice Deploy a new cooperative pool with custom max members.
     */
    function createCoop(
        string memory name,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers
    ) public returns (address vault) {
        GScoopVault newVault = new GScoopVault(
            name,
            contributionAmount,
            cycleDuration,
            maxMembers,
            msg.sender,
            address(this)
        );

        vault = address(newVault);
        allCoops.push(vault);
        isCoop[vault] = true;
        userCreatedCoops[msg.sender].push(vault);

        emit CoopCreated(
            vault,
            name,
            msg.sender,
            contributionAmount,
            cycleDuration,
            maxMembers
        );
    }

    /**
     * @notice Returns list of all deployed cooperative pools.
     */
    function getCoops() external view returns (address[] memory) {
        return allCoops;
    }

    /**
     * @notice Total number of registered cooperatives.
     */
    function getCoopCount() external view returns (uint256) {
        return allCoops.length;
    }

    /**
     * @notice Return vaults created by a given address.
     */
    function getUserCreatedCoops(address user) external view returns (address[] memory) {
        return userCreatedCoops[user];
    }
}
