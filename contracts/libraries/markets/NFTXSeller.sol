// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {INFTXVaultFactoryV2} from "../../interfaces/nftx/INFTXVaultFactoryV2.sol";
import {INFTXVault} from "../../interfaces/nftx/INFTXVault.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

import {Errors} from "../../libraries/helpers/Errors.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title NFTXSeller library
 * @author Unlockd
 * @notice Implements NFTX selling logic
 */
library NFTXSeller {
    address internal constant WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;

    /**
     * @dev Sells an asset in an NFTX liquid market
     * @param addressesProvider The addresses provider
     * @param nftAsset The underlying NFT address
     * @param nftTokenId The underlying NFT token Id
     * @param reserveAsset The reserve asset to exchange for the NFT
     */
    function sellNFTX(
        ILendPoolAddressesProvider addressesProvider,
        address nftAsset,
        uint256 nftTokenId,
        address reserveAsset
    ) internal returns (uint256) {
        address vaultFactoryAddress = addressesProvider.getNFTXVaultFactory();
        address sushiSwapRouterAddress = addressesProvider.getSushiSwapRouter();
        address lendPoolAddress = addressesProvider.getLendPool();

        // Get NFTX Vaults for the asset
        address[] memory vaultAddresses = INFTXVaultFactoryV2(
            vaultFactoryAddress
        ).vaultsForAsset(nftAsset);

        require(vaultAddresses.length > 0, Errors.NFTX_INVALID_VAULTS_LENGTH);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = nftTokenId;

        //Always get the first vault address
        address vaultAddress = vaultAddresses[0];
        INFTXVault nftxVault = INFTXVault(vaultAddress);

        if (nftxVault.allValidNFTs(tokenIds)) {
            // Deposit NFT to NFTX Vault
            IERC721Upgradeable(nftAsset).approve(vaultAddress, nftTokenId);
            nftxVault.mint(tokenIds, new uint256[](1));
            uint256 depositAmount = IERC20Upgradeable(vaultAddress).balanceOf(
                address(this)
            );

            // Swap on SushiSwap
            IERC20Upgradeable(vaultAddress).approve(
                sushiSwapRouterAddress,
                depositAmount
            );

            address[] memory swapPath;
            if (reserveAsset != address(WETH)) {
                swapPath = new address[](3);
                swapPath[2] = reserveAsset;
            } else {
                swapPath = new address[](2);
            }
            swapPath[0] = vaultAddress;
            swapPath[1] = WETH;

            uint256[] memory amounts = IUniswapV2Router02(
                sushiSwapRouterAddress
            ).swapExactTokensForTokens(
                    depositAmount,
                    0,
                    swapPath,
                    lendPoolAddress,
                    block.timestamp
                );

            return amounts[1];
        }

        revert("NFTX: vault not available");
    }

    /**
     * @dev Get the NFTX price in reserve asset
     * @param addressesProvider The addresses provider
     * @param nftAsset The underlying NFT address
     * @param nftTokenId The underlying NFT token Id
     * @param reserveAsset The ERC20 reserve asset
     */
    function getNFTXPrice(
        ILendPoolAddressesProvider addressesProvider,
        address nftAsset,
        uint256 nftTokenId,
        address reserveAsset
    ) internal view returns (uint256) {
        address vaultFactoryAddress = addressesProvider.getNFTXVaultFactory();
        address sushiSwapRouterAddress = addressesProvider.getSushiSwapRouter();

        // Get NFTX Vaults for the asset
        address[] memory vaultAddresses = INFTXVaultFactoryV2(
            vaultFactoryAddress
        ).vaultsForAsset(nftAsset);

        require(vaultAddresses.length > 0, Errors.NFTX_INVALID_VAULTS_LENGTH);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = nftTokenId;

        // Always get the first vault address
        address vaultAddress = vaultAddresses[0];
        INFTXVault nftxVault = INFTXVault(vaultAddress);
        (uint256 mintFee, , , , ) = INFTXVaultFactoryV2(vaultFactoryAddress)
            .vaultFees(nftxVault.vaultId());

        if (nftxVault.allValidNFTs(tokenIds)) {
            address[] memory swapPath;
            if (reserveAsset != address(WETH)) {
                swapPath = new address[](3);
                swapPath[2] = reserveAsset;
            } else {
                swapPath = new address[](2);
            }
            swapPath[0] = vaultAddress;
            swapPath[1] = WETH;

            uint256 depositAmount = 1 ether - mintFee;

            uint256[] memory amounts = IUniswapV2Router02(
                sushiSwapRouterAddress
            ).getAmountsOut(depositAmount, swapPath);

            if (amounts.length == 3) {
                return amounts[2];
            }
            return amounts[1];
        }

        revert("NFTX: vault not available");
    }
}
