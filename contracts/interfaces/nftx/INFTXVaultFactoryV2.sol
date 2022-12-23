// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @dev https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/interface/INFTXVaultFactory.sol
 */
interface INFTXVaultFactoryV2 {
    // Read functions.
    function feeDistributor() external view returns (address);

    function numVaults() external view returns (uint256);

    function vaultsForAsset(
        address asset
    ) external view returns (address[] memory);

    function vaultFees(
        uint256 vaultId
    ) external view returns (uint256, uint256, uint256, uint256, uint256);

    // Write functions.
    function createVault(
        string calldata name,
        string calldata symbol,
        address _assetAddress,
        bool is1155,
        bool allowAllItems
    ) external returns (uint256);
}
