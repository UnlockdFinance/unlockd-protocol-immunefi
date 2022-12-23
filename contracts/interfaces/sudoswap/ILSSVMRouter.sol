// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {SudoSwapSeller} from "../../libraries/markets/SudoSwapSeller.sol";

/**
 * @title ILSSVMRouter
 * @author Unlockd
 * @notice Defines the basic interface for the NFTX Marketplace Zap.
 **/

interface ILSSVMRouter {
    function swapNFTsForToken(
        SudoSwapSeller.PairSwapSpecific[] calldata swapList,
        uint256 minOutput,
        address tokenRecipient,
        uint256 deadline
    ) external returns (uint256 outputAmount);
}
