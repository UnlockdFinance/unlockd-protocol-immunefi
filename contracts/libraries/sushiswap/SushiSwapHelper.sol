// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

library SushiSwapHelper {
    function swapExactETHForTokens(
        ILendPoolAddressesProvider addressesProvider,
        uint256 amountInEth,
        address reserveAsset
    ) internal returns (uint256) {
        address sushiSwapRouterAddress = addressesProvider.getSushiSwapRouter();
        address lendPoolAddress = addressesProvider.getLendPool();
        address wethAddress = IUniswapV2Router02(sushiSwapRouterAddress).WETH();

        // Swap ETH to reserve on SushiSwap
        address[] memory swapPath = new address[](2);
        swapPath[0] = wethAddress;
        swapPath[1] = reserveAsset;
        uint256[] memory amounts = IUniswapV2Router02(sushiSwapRouterAddress)
            .swapExactETHForTokens{value: amountInEth}(
            0,
            swapPath,
            lendPoolAddress,
            block.timestamp
        );

        return amounts[1];
    }
}
