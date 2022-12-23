// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title IFlashLoanReceiver interface
 * @notice Interface for the IFlashLoanReceiver.
 * @author UNLOCKD
 **/
interface IFlashLoanReceiver {
    /**
     * @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
     * @param asset the asset to execute the flash loan with
     * @param tokenIds implement this interface to develop a flashloan-compatible flashLoanReceiver contract
     * @param initiator the flash loan  initiator
     * @param operator the flash loan  operator
     * @param params flash loan calldata params
     **/
    function executeOperation(
        address asset,
        uint256[] calldata tokenIds,
        address initiator,
        address operator,
        bytes calldata params
    ) external returns (bool);
}
