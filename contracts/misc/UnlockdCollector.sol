// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title UnlockdCollector
 * @notice Stores all the UNLOCKD kept for incentives, just giving approval to the different
 * systems that will pull UNLOCKD funds for their specific use case
 * @author Unlockd
 **/
contract UnlockdCollector is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /**
     * @dev initializes the contract upon assignment to the UnlockdUpgradeableProxy
     */
    function initialize() external initializer {
        __Ownable_init();
    }

    /**
     * @dev Approves the specified token to a recipient
     * @param token the ERC20 token
     * @param recipient the address to be approved
     * @param amount the amount to approve
     */
    function approve(
        IERC20Upgradeable token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        token.safeApprove(recipient, amount);
    }

    /**
     * @dev Transfers the specified token to a recipient
     * @param token the ERC20 token
     * @param recipient the address to transfer the tokens to
     * @param amount the amount to transfer
     */
    function transfer(
        IERC20Upgradeable token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        token.safeTransfer(recipient, amount);
    }
}
