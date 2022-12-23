// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IERC20Detailed} from "../interfaces/IERC20Detailed.sol";
import {IERC721Detailed} from "../interfaces/IERC721Detailed.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IDebtToken} from "../interfaces/IDebtToken.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../libraries/configuration/NftConfiguration.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {NFTXSeller} from "../libraries/markets/NFTXSeller.sol";

contract UnlockdProtocolDataProvider {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using NftConfiguration for DataTypes.NftConfigurationMap;

    struct ReserveTokenData {
        string tokenSymbol;
        address tokenAddress;
        string uTokenSymbol;
        address uTokenAddress;
        string debtTokenSymbol;
        address debtTokenAddress;
    }

    struct NftTokenData {
        string nftSymbol;
        address nftAddress;
        string uNftSymbol;
        address uNftAddress;
    }

    ILendPoolAddressesProvider public immutable ADDRESSES_PROVIDER;

    constructor(ILendPoolAddressesProvider addressesProvider) {
        ADDRESSES_PROVIDER = addressesProvider;
    }

    /**
     * @dev Returns the reserve token data for all the reserves in the protocol
     */
    function getAllReservesTokenDatas()
        external
        view
        returns (ReserveTokenData[] memory)
    {
        ILendPool pool = ILendPool(ADDRESSES_PROVIDER.getLendPool());
        address[] memory reserves = pool.getReservesList();
        uint256 reservesLength = reserves.length;
        ReserveTokenData[] memory reservesTokens = new ReserveTokenData[](
            reservesLength
        );
        for (uint256 i = 0; i < reservesLength; ) {
            DataTypes.ReserveData memory reserveData = pool.getReserveData(
                reserves[i]
            );
            reservesTokens[i] = ReserveTokenData({
                tokenSymbol: IERC20Detailed(reserves[i]).symbol(),
                tokenAddress: reserves[i],
                uTokenSymbol: IERC20Detailed(reserveData.uTokenAddress)
                    .symbol(),
                uTokenAddress: reserveData.uTokenAddress,
                debtTokenSymbol: IERC20Detailed(reserveData.debtTokenAddress)
                    .symbol(),
                debtTokenAddress: reserveData.debtTokenAddress
            });

            unchecked {
                ++i;
            }
        }
        return reservesTokens;
    }

    /**
     * @dev Returns the reserve token data for the specified reserve
     * @param asset the reserve to get the token data from
     */
    function getReserveTokenData(
        address asset
    ) external view returns (ReserveTokenData memory) {
        ILendPool pool = ILendPool(ADDRESSES_PROVIDER.getLendPool());
        DataTypes.ReserveData memory reserveData = pool.getReserveData(asset);
        return
            ReserveTokenData({
                tokenSymbol: IERC20Detailed(asset).symbol(),
                tokenAddress: asset,
                uTokenSymbol: IERC20Detailed(reserveData.uTokenAddress)
                    .symbol(),
                uTokenAddress: reserveData.uTokenAddress,
                debtTokenSymbol: IERC20Detailed(reserveData.debtTokenAddress)
                    .symbol(),
                debtTokenAddress: reserveData.debtTokenAddress
            });
    }

    /**
     * @dev Returns the NFT token data for all the NFTs in the protocol
     */
    function getAllNftsTokenDatas()
        external
        view
        returns (NftTokenData[] memory)
    {
        ILendPool pool = ILendPool(ADDRESSES_PROVIDER.getLendPool());
        address[] memory nfts = pool.getNftsList();
        uint256 nftsLength = nfts.length;
        NftTokenData[] memory nftTokens = new NftTokenData[](nftsLength);
        for (uint256 i = 0; i < nftsLength; ) {
            DataTypes.NftData memory nftData = pool.getNftData(nfts[i]);
            nftTokens[i] = NftTokenData({
                nftSymbol: IERC721Detailed(nfts[i]).symbol(),
                nftAddress: nfts[i],
                uNftSymbol: IERC721Detailed(nftData.uNftAddress).symbol(),
                uNftAddress: nftData.uNftAddress
            });

            unchecked {
                ++i;
            }
        }
        return nftTokens;
    }

    /**
     * @dev Returns the NFT token data for the specified NFT asset
     * @param nftAsset The NFT to get the token data from
     */
    function getNftTokenData(
        address nftAsset
    ) external view returns (NftTokenData memory) {
        ILendPool pool = ILendPool(ADDRESSES_PROVIDER.getLendPool());
        DataTypes.NftData memory nftData = pool.getNftData(nftAsset);
        return
            NftTokenData({
                nftSymbol: IERC20Detailed(nftAsset).symbol(),
                nftAddress: nftAsset,
                uNftSymbol: IERC20Detailed(nftData.uNftAddress).symbol(),
                uNftAddress: nftData.uNftAddress
            });
    }

    /**
     * @dev Returns the configuration for a specific reserve
     * @param asset The asset to request the configuration
     */
    function getReserveConfigurationData(
        address asset
    )
        external
        view
        returns (
            uint256 decimals,
            uint256 reserveFactor,
            bool borrowingEnabled,
            bool isActive,
            bool isFrozen
        )
    {
        DataTypes.ReserveConfigurationMap memory configuration = ILendPool(
            ADDRESSES_PROVIDER.getLendPool()
        ).getReserveConfiguration(asset);

        (, , , decimals, reserveFactor) = configuration.getParamsMemory();

        (isActive, isFrozen, borrowingEnabled, ) = configuration
            .getFlagsMemory();
    }

    struct NftConfigurationData {
        uint256 ltv;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
        uint256 redeemDuration;
        uint256 auctionDuration;
        uint256 redeemFine;
        uint256 redeemThreshold;
        uint256 minBidFine;
        bool isActive;
        bool isFrozen;
        uint256 configTimestamp;
    }

    /**
     * @dev Returns the configuration for a specific NFT
     * @param asset The NFT to request the configuration
     */
    function getNftConfigurationData(
        address asset
    ) external view returns (NftConfigurationData memory configData) {
        DataTypes.NftConfigurationMap memory configuration = ILendPool(
            ADDRESSES_PROVIDER.getLendPool()
        ).getNftConfiguration(asset);

        (
            configData.ltv,
            configData.liquidationThreshold,
            configData.liquidationBonus
        ) = configuration.getCollateralParamsMemory();
        (
            configData.redeemDuration,
            configData.auctionDuration,
            configData.redeemFine,
            configData.redeemThreshold
        ) = configuration.getAuctionParamsMemory();

        (configData.isActive, configData.isFrozen) = configuration
            .getFlagsMemory();

        (configData.minBidFine) = configuration.getMinBidFineMemory();
    }

    /**
     * @dev Returns the configuration for a specific NFT token
     * @param asset The NFT to request the configuration
     * @param tokenId The token id of the NFT
     */
    function getNftConfigurationDataByTokenId(
        address asset,
        uint256 tokenId
    ) external view returns (NftConfigurationData memory configData) {
        DataTypes.NftConfigurationMap memory configuration = ILendPool(
            ADDRESSES_PROVIDER.getLendPool()
        ).getNftConfigByTokenId(asset, tokenId);

        (
            configData.ltv,
            configData.liquidationThreshold,
            configData.liquidationBonus
        ) = configuration.getCollateralParamsMemory();
        (
            configData.redeemDuration,
            configData.auctionDuration,
            configData.redeemFine,
            configData.redeemThreshold
        ) = configuration.getAuctionParamsMemory();

        (configData.isActive, configData.isFrozen) = configuration
            .getFlagsMemory();

        (configData.minBidFine) = configuration.getMinBidFineMemory();
        (configData.configTimestamp) = configuration.getConfigTimestampMemory();
    }

    /**
     * @dev Returns the stored data for a specific reserve
     * @param asset The asset to request the data
     */
    function getReserveData(
        address asset
    )
        external
        view
        returns (
            uint256 availableLiquidity,
            uint256 totalVariableDebt,
            uint256 liquidityRate,
            uint256 variableBorrowRate,
            uint256 liquidityIndex,
            uint256 variableBorrowIndex,
            uint40 lastUpdateTimestamp
        )
    {
        DataTypes.ReserveData memory reserve = ILendPool(
            ADDRESSES_PROVIDER.getLendPool()
        ).getReserveData(asset);

        return (
            IERC20Detailed(asset).balanceOf(reserve.uTokenAddress),
            IERC20Detailed(reserve.debtTokenAddress).totalSupply(),
            reserve.currentLiquidityRate,
            reserve.currentVariableBorrowRate,
            reserve.liquidityIndex,
            reserve.variableBorrowIndex,
            reserve.lastUpdateTimestamp
        );
    }

    /**
     * @dev Returns the stored reserve data for a specific yser
     * @param asset The asset to request the data
     * @param asset The user to request the data
     */
    function getUserReserveData(
        address asset,
        address user
    )
        external
        view
        returns (
            uint256 currentUTokenBalance,
            uint256 currentVariableDebt,
            uint256 scaledVariableDebt,
            uint256 liquidityRate
        )
    {
        DataTypes.ReserveData memory reserve = ILendPool(
            ADDRESSES_PROVIDER.getLendPool()
        ).getReserveData(asset);

        currentUTokenBalance = IERC20Detailed(reserve.uTokenAddress).balanceOf(
            user
        );
        currentVariableDebt = IERC20Detailed(reserve.debtTokenAddress)
            .balanceOf(user);
        scaledVariableDebt = IDebtToken(reserve.debtTokenAddress)
            .scaledBalanceOf(user);
        liquidityRate = reserve.currentLiquidityRate;
    }

    struct LoanData {
        uint256 loanId;
        uint8 state;
        address borrower;
        address nftAsset;
        uint256 nftTokenId;
        address reserveAsset;
        uint256 scaledAmount;
        uint256 currentAmount;
        uint256 bidStartTimestamp;
        address bidderAddress;
        uint256 bidPrice;
        uint256 bidBorrowAmount;
    }

    /**
     * @dev Returns the loan data for a specific NFT used as collateral
     * @param nftAsset The NFT address
     * @param nftTokenId The token ID for the NFT
     */
    function getLoanDataByCollateral(
        address nftAsset,
        uint256 nftTokenId
    ) external view returns (LoanData memory loanData) {
        loanData.loanId = ILendPoolLoan(ADDRESSES_PROVIDER.getLendPoolLoan())
            .getCollateralLoanId(nftAsset, nftTokenId);
        DataTypes.LoanData memory loan = ILendPoolLoan(
            ADDRESSES_PROVIDER.getLendPoolLoan()
        ).getLoan(loanData.loanId);
        _fillLoanData(loanData, loan);
    }

    /**
     * @dev Returns the loan data for a specific loan
     * @param loanId The loan identifier
     */
    function getLoanDataByLoanId(
        uint256 loanId
    ) external view returns (LoanData memory loanData) {
        DataTypes.LoanData memory loan = ILendPoolLoan(
            ADDRESSES_PROVIDER.getLendPoolLoan()
        ).getLoan(loanId);
        _fillLoanData(loanData, loan);
    }

    /**
     * @dev Stores the specified loan data to the protocol
     * @param loanData The loan data where the data will be stored
     * @param loanData The loan data which contains the data to be stored
     */
    function _fillLoanData(
        LoanData memory loanData,
        DataTypes.LoanData memory loan
    ) internal view {
        loanData.loanId = loan.loanId;
        loanData.state = uint8(loan.state);
        loanData.borrower = loan.borrower;
        loanData.nftAsset = loan.nftAsset;
        loanData.nftTokenId = loan.nftTokenId;
        loanData.reserveAsset = loan.reserveAsset;
        loanData.scaledAmount = loan.scaledAmount;
        (, loanData.currentAmount) = ILendPoolLoan(
            ADDRESSES_PROVIDER.getLendPoolLoan()
        ).getLoanReserveBorrowAmount(loan.loanId);
        loanData.bidStartTimestamp = loan.bidStartTimestamp;
        loanData.bidderAddress = loan.bidderAddress;
        loanData.bidPrice = loan.bidPrice;
        loanData.bidBorrowAmount = loan.bidBorrowAmount;
    }

    /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
    /**
  @dev returns the NFT price for a given NFT valued by NFTX
  @param asset the NFT collection
  @param tokenId the NFT token Id
   */
    function getNFTXPrice(
        address asset,
        uint256 tokenId,
        address reserveAsset
    ) external view returns (uint256) {
        return
            NFTXSeller.getNFTXPrice(
                ADDRESSES_PROVIDER,
                asset,
                tokenId,
                reserveAsset
            );
    }
}
