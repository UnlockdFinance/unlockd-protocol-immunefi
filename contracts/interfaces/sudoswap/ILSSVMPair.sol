// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

interface ILSSVMPair {
    enum CurveErrorCodes {
        OK, // No error
        INVALID_NUMITEMS, // The numItem value is 0
        SPOT_PRICE_OVERFLOW // The updated spot price doesn't fit into 128 bits
    }

    function getBuyNFTQuote(
        uint256 numNFTs
    )
        external
        view
        returns (
            CurveErrorCodes error,
            uint256 newSpotPrice,
            uint256 newDelta,
            uint256 inputAmount,
            uint256 protocolFee
        );
}
