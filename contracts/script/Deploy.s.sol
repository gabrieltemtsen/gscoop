// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GScoopFactory.sol";
import "../src/GScoopVault.sol";

contract DeployGScoop is Script {
    function run() external returns (GScoopFactory factory, address showcaseVault) {
        uint256 deployerPrivateKey;
        
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // Default demo anvil key if PRIVATE_KEY is not set
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        vm.startBroadcast(deployerPrivateKey);

        factory = new GScoopFactory();
        
        // Deploy showcase cooperative vault (50 native USDC per cycle, 7 days cycle duration, 5 members)
        showcaseVault = factory.createCoop(
            "Arc Global Synergy Alpha",
            50 * 1e18, // 50 USDC
            7 days,
            5
        );

        vm.stopBroadcast();
    }
}
