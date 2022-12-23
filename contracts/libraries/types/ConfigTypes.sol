// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

library ConfigTypes {
    struct InitReserveInput {
        address uTokenImpl;
        address debtTokenImpl;
        uint8 underlyingAssetDecimals;
        address interestRateAddress;
        address underlyingAsset;
        address treasury;
        string underlyingAssetName;
        string uTokenName;
        string uTokenSymbol;
        string debtTokenName;
        string debtTokenSymbol;
    }

    struct InitNftInput {
        address underlyingAsset;
    }

    struct UpdateUTokenInput {
        address asset;
        address implementation;
        bytes encodedCallData;
    }

    struct UpdateDebtTokenInput {
        address asset;
        address implementation;
        bytes encodedCallData;
    }
}
