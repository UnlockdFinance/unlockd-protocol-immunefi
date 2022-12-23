// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";
import {ILSSVMRouter} from "../../interfaces/sudoswap/ILSSVMRouter.sol";
import {ILSSVMPair} from "../../interfaces/sudoswap/ILSSVMPair.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {Errors} from "../../libraries/helpers/Errors.sol";
import {IUniswapV2Router02} from "../../interfaces/IUniswapV2Router02.sol";

/*
 * @title SudoSwap library
 * @author Unlockd
 * @notice Implements SudoSwap selling logic
 */
library SudoSwapSeller {
    struct PairSwapSpecific {
        ILSSVMPair pair;
        uint256[] nftIds;
    }

    /**
     * @dev Sells an asset in a SudoSwap liquid market
     * @param addressesProvider The addresses provider
     * @param nftTokenId The underlying NFT token Id
     */
    function sellSudoSwap(
        ILendPoolAddressesProvider addressesProvider,
        address nftAsset,
        uint256 nftTokenId,
        address LSSVMPair
    ) internal returns (uint256 amount) {
        address LSSVMRouterAddress = addressesProvider.getLSSVMRouter();
        address lendPoolAddress = addressesProvider.getLendPool();

        ILSSVMRouter LSSVMRouter = ILSSVMRouter(LSSVMRouterAddress);

        uint256[] memory nftTokenIds = new uint256[](1);
        nftTokenIds[0] = nftTokenId;

        PairSwapSpecific[] memory pairSwaps = new PairSwapSpecific[](1);
        pairSwaps[0] = PairSwapSpecific({
            pair: ILSSVMPair(LSSVMPair),
            nftIds: nftTokenIds
        });

        IERC721Upgradeable(nftAsset).approve(LSSVMRouterAddress, nftTokenId);
        amount = LSSVMRouter.swapNFTsForToken(
            pairSwaps,
            0,
            lendPoolAddress,
            block.timestamp
        );
    }
}
