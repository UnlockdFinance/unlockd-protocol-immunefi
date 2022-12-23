// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTXVaultFactoryV2} from "../../interfaces/nftx/INFTXVaultFactoryV2.sol";
import {NFTXVault} from "./NFTXVault.sol";

/**
 * @dev https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/NFTXVaultFactoryUpgradeable.sol
 * This is minimal mock implementation of NFTXVaultFactory for the test
 */
contract NFTXVaultFactoryV2 is INFTXVaultFactoryV2 {
    mapping(address => address[]) _vaultsForAsset;
    address public override feeDistributor;

    address[] internal vaults;

    struct VaultFees {
        bool active;
        uint64 mintFee;
        uint64 randomRedeemFee;
        uint64 targetRedeemFee;
        uint64 randomSwapFee;
        uint64 targetSwapFee;
    }
    mapping(uint256 => VaultFees) private _vaultFees;

    uint64 public factoryMintFee;
    uint64 public factoryRandomRedeemFee;
    uint64 public factoryTargetRedeemFee;
    uint64 public factoryRandomSwapFee;
    uint64 public factoryTargetSwapFee;

    constructor(address _feeDistributor) {
        feeDistributor = _feeDistributor;
        setFactoryFees(0.1 ether, 0.05 ether, 0.1 ether, 0.05 ether, 0.1 ether);
    }

    function setFactoryFees(
        uint256 mintFee,
        uint256 randomRedeemFee,
        uint256 targetRedeemFee,
        uint256 randomSwapFee,
        uint256 targetSwapFee
    ) public virtual {
        require(mintFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomSwapFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetSwapFee <= 0.5 ether, "Cannot > 0.5 ether");

        factoryMintFee = uint64(mintFee);
        factoryRandomRedeemFee = uint64(randomRedeemFee);
        factoryTargetRedeemFee = uint64(targetRedeemFee);
        factoryRandomSwapFee = uint64(randomSwapFee);
        factoryTargetSwapFee = uint64(targetSwapFee);
    }

    function createVault(
        string memory name,
        string memory symbol,
        address _assetAddress,
        bool is1155,
        bool allowAllItems
    ) external virtual override returns (uint256) {
        address vaultAddr = deployVault(
            name,
            symbol,
            _assetAddress,
            is1155,
            allowAllItems
        );
        uint256 _vaultId = vaults.length;
        _vaultsForAsset[_assetAddress].push(vaultAddr);
        vaults.push(vaultAddr);

        return _vaultId;
    }

    function deployVault(
        string memory name,
        string memory symbol,
        address _assetAddress,
        bool is1155,
        bool allowAllItems
    ) internal returns (address) {
        address nftxVault = address(
            new NFTXVault(name, symbol, _assetAddress, is1155, allowAllItems)
        );
        return nftxVault;
    }

    function vaultFees(
        uint256 vaultId
    )
        external
        view
        virtual
        override
        returns (uint256, uint256, uint256, uint256, uint256)
    {
        VaultFees memory fees = _vaultFees[vaultId];
        if (fees.active) {
            return (
                uint256(fees.mintFee),
                uint256(fees.randomRedeemFee),
                uint256(fees.targetRedeemFee),
                uint256(fees.randomSwapFee),
                uint256(fees.targetSwapFee)
            );
        }

        return (
            uint256(factoryMintFee),
            uint256(factoryRandomRedeemFee),
            uint256(factoryTargetRedeemFee),
            uint256(factoryRandomSwapFee),
            uint256(factoryTargetSwapFee)
        );
    }

    function vaultsForAsset(
        address assetAddress
    ) external view virtual override returns (address[] memory) {
        return _vaultsForAsset[assetAddress];
    }

    function numVaults() external view virtual override returns (uint256) {
        return vaults.length;
    }
}
