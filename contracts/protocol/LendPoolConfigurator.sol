// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IUNFTRegistry} from "../interfaces/IUNFTRegistry.sol";
import {ILendPoolConfigurator} from "../interfaces/ILendPoolConfigurator.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../libraries/configuration/NftConfiguration.sol";
import {ConfiguratorLogic} from "../libraries/logic/ConfiguratorLogic.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {ConfigTypes} from "../libraries/types/ConfigTypes.sol";
import {INFTOracle} from "../interfaces/INFTOracle.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title LendPoolConfigurator contract
 * @author Unlockd
 * @dev Implements the configuration methods for the Unlockd protocol
 **/

contract LendPoolConfigurator is Initializable, ILendPoolConfigurator {
    using PercentageMath for uint256;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using NftConfiguration for DataTypes.NftConfigurationMap;
    ILendPoolAddressesProvider internal _addressesProvider;

    mapping(address => bool) public isLtvManager;

    modifier onlyLtvManager() {
        require(isLtvManager[msg.sender], Errors.CALLER_NOT_LTV_MANAGER);
        _;
    }

    modifier onlyPoolAdmin() {
        require(
            _addressesProvider.getPoolAdmin() == msg.sender,
            Errors.CALLER_NOT_POOL_ADMIN
        );
        _;
    }

    modifier onlyEmergencyAdmin() {
        require(
            _addressesProvider.getEmergencyAdmin() == msg.sender,
            Errors.LPC_CALLER_NOT_EMERGENCY_ADMIN
        );
        _;
    }

    /**
     * @dev Function is invoked by the proxy contract when the LendPoolConfigurator contract is added to the
     * LendPoolAddressesProvider of the market.
     * @param provider The address of the LendPoolAddressesProvider
     **/
    function initialize(
        ILendPoolAddressesProvider provider
    ) public initializer {
        _addressesProvider = provider;
    }

    /**
     * @dev Initializes reserves in batch
     * @param input the input array with data to initialize each reserve
     **/
    function batchInitReserve(
        ConfigTypes.InitReserveInput[] calldata input
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 inputLength = input.length;
        for (uint256 i = 0; i < inputLength; ) {
            ConfiguratorLogic.executeInitReserve(
                _addressesProvider,
                cachedPool,
                input[i]
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Initializes NFTs in batch
     * @param input the input array with data to initialize each NFT
     **/
    function batchInitNft(
        ConfigTypes.InitNftInput[] calldata input
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        IUNFTRegistry cachedRegistry = _getUNFTRegistry();
        uint256 inputLength = input.length;
        for (uint256 i = 0; i < inputLength; ) {
            ConfiguratorLogic.executeInitNft(
                cachedPool,
                cachedRegistry,
                input[i]
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Updates the uToken implementation for the reserve
     * @param inputs the inputs array with data to update each UToken
     **/
    function updateUToken(
        ConfigTypes.UpdateUTokenInput[] calldata inputs
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 inputLength = inputs.length;
        for (uint256 i = 0; i < inputLength; ) {
            ConfiguratorLogic.executeUpdateUToken(cachedPool, inputs[i]);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Updates the debt token implementation for the asset
     * @param inputs the inputs array with data to update each debt token
     **/
    function updateDebtToken(
        ConfigTypes.UpdateDebtTokenInput[] calldata inputs
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 inputLength = inputs.length;
        for (uint256 i = 0; i < inputLength; ) {
            ConfiguratorLogic.executeUpdateDebtToken(cachedPool, inputs[i]);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Enables or disables borrowing on each reserve
     * @param asset the assets to update the flag to
     * @param flag the flag to set to the each reserve
     **/
    function setBorrowingFlagOnReserve(
        address asset,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.ReserveConfigurationMap memory currentConfig = cachedPool
            .getReserveConfiguration(asset);

        if (flag) {
            currentConfig.setBorrowingEnabled(true);
        } else {
            currentConfig.setBorrowingEnabled(false);
        }

        cachedPool.setReserveConfiguration(asset, currentConfig.data);

        if (flag) {
            emit BorrowingEnabledOnReserve(asset);
        } else {
            emit BorrowingDisabledOnReserve(asset);
        }
    }

    /**
     * @dev Activates or deactivates each reserve
     * @param asset the assets to update the flag to
     * @param flag the flag to set to the each reserve
     **/
    function setActiveFlagOnReserve(
        address asset,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.ReserveConfigurationMap memory currentConfig = cachedPool
            .getReserveConfiguration(asset);

        if (!flag) {
            _checkReserveNoLiquidity(asset);
        }
        currentConfig.setActive(flag);
        cachedPool.setReserveConfiguration(asset, currentConfig.data);
        if (flag) {
            emit ReserveActivated(asset);
        } else {
            emit ReserveDeactivated(asset);
        }
    }

    /**
     * @dev Freezes or unfreezes each reserve
     * @param asset the assets to update the flag to
     * @param flag the flag to set to the each reserve
     **/
    function setFreezeFlagOnReserve(
        address asset,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.ReserveConfigurationMap memory currentConfig = cachedPool
            .getReserveConfiguration(asset);

        currentConfig.setFrozen(flag);
        cachedPool.setReserveConfiguration(asset, currentConfig.data);

        if (flag) {
            emit ReserveFrozen(asset);
        } else {
            emit ReserveUnfrozen(asset);
        }
    }

    /**
     * @dev Updates the reserve factor of a reserve
     * @param asset The address of the underlying asset of the reserve
     * @param reserveFactor The new reserve factor of the reserve
     **/
    function setReserveFactor(
        address asset,
        uint256 reserveFactor
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.ReserveConfigurationMap memory currentConfig = cachedPool
            .getReserveConfiguration(asset);

        currentConfig.setReserveFactor(reserveFactor);

        cachedPool.setReserveConfiguration(asset, currentConfig.data);

        emit ReserveFactorChanged(asset, reserveFactor);
    }

    /**
     * @dev Sets the interest rate strategy of a reserve
     * @param assets The addresses of the underlying asset of the reserve
     * @param rateAddress The new address of the interest strategy contract
     **/
    function setReserveInterestRateAddress(
        address[] calldata assets,
        address rateAddress
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 assetsLength = assets.length;
        for (uint256 i = 0; i < assetsLength; ) {
            cachedPool.setReserveInterestRateAddress(assets[i], rateAddress);
            emit ReserveInterestRateChanged(assets[i], rateAddress);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Configures reserves in batch
     * @param inputs the input array with data to configure each reserve
     **/
    function batchConfigReserve(
        ConfigReserveInput[] calldata inputs
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 inputLength = inputs.length;
        for (uint256 i = 0; i < inputLength; ) {
            DataTypes.ReserveConfigurationMap memory currentConfig = cachedPool
                .getReserveConfiguration(inputs[i].asset);

            currentConfig.setReserveFactor(inputs[i].reserveFactor);

            cachedPool.setReserveConfiguration(
                inputs[i].asset,
                currentConfig.data
            );

            emit ReserveFactorChanged(inputs[i].asset, inputs[i].reserveFactor);

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Activates or deactivates each NFT
     * @param asset the NFTs to update the flag to
     * @param flag the flag to set to the each NFT
     **/
    function setActiveFlagOnNft(
        address asset,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.NftConfigurationMap memory currentConfig = cachedPool
            .getNftConfiguration(asset);

        if (!flag) {
            _checkNftNoLiquidity(asset);
        }
        currentConfig.setActive(flag);
        cachedPool.setNftConfiguration(asset, currentConfig.data);

        if (flag) {
            emit NftActivated(asset);
        } else {
            emit NftDeactivated(asset);
        }
    }

    /**
     * @dev Activates or deactivates each NFT asset
     * @param assets the NFTs to update the flag to
     * @param tokenIds the NFT token ids to update the flag to
     * @param flag the flag to set to the each NFT
     **/
    function setActiveFlagOnNftByTokenId(
        address[] calldata assets,
        uint256[] calldata tokenIds,
        bool flag
    ) external onlyPoolAdmin {
        uint256 assetsLength = assets.length;
        require(assetsLength == tokenIds.length, Errors.LPC_PARAMS_MISMATCH);

        ILendPool cachedPool = _getLendPool();

        for (uint256 i = 0; i < assetsLength; ) {
            DataTypes.NftConfigurationMap memory currentConfig = cachedPool
                .getNftConfigByTokenId(assets[i], tokenIds[i]);

            currentConfig.setActive(flag);
            cachedPool.setNftConfigByTokenId(
                assets[i],
                tokenIds[i],
                currentConfig.data
            );

            if (flag) {
                emit NftTokenActivated(assets[i], tokenIds[i]);
            } else {
                emit NftTokenDeactivated(assets[i], tokenIds[i]);
            }

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Freezes or unfreezes each NFT
     * @param asset the assets to update the flag to
     * @param flag the flag to set to the each NFT
     **/
    function setFreezeFlagOnNft(
        address asset,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.NftConfigurationMap memory currentConfig = cachedPool
            .getNftConfiguration(asset);
        currentConfig.setFrozen(flag);
        cachedPool.setNftConfiguration(asset, currentConfig.data);
        if (flag) {
            emit NftFrozen(asset);
        } else {
            emit NftUnfrozen(asset);
        }
    }

    /**
     * @dev Freezes or unfreezes each NFT token
     * @param assets the assets to update the flag to
     * @param tokenIds the NFT token ids to update the flag to
     * @param flag the flag to set to the each NFT
     **/
    function setFreezeFlagOnNftByTokenId(
        address[] calldata assets,
        uint256[] calldata tokenIds,
        bool flag
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 assetsLength = assets.length;
        for (uint256 i = 0; i < assetsLength; ) {
            DataTypes.NftConfigurationMap memory currentConfig = cachedPool
                .getNftConfigByTokenId(assets[i], tokenIds[i]);

            currentConfig.setFrozen(flag);
            cachedPool.setNftConfigByTokenId(
                assets[i],
                tokenIds[i],
                currentConfig.data
            );

            if (flag) {
                emit NftTokenFrozen(assets[i], tokenIds[i]);
            } else {
                emit NftTokenUnfrozen(assets[i], tokenIds[i]);
            }

            unchecked {
                ++i;
            }
        }
    }

    function configureNftsAsCollateral(
        ConfigNftAsCollateralInput[] calldata collateralData
    ) external onlyLtvManager {
        uint256 cachedLength = collateralData.length;
        for (uint8 i; i < cachedLength; ) {
            _configureNftAsCollateral(collateralData[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Configures the NFT collateralization parameters
     * all the values are expressed in percentages with two decimals of precision. A valid value is 10000, which means 100.00%
     * @param collateralData The NFT collateral configuration data
     **/
    function _configureNftAsCollateral(
        ConfigNftAsCollateralInput calldata collateralData
    ) internal {
        {
            ILendPool cachedPool = _getLendPool();

            DataTypes.NftConfigurationMap memory currentConfig = cachedPool
                .getNftConfigByTokenId(
                    collateralData.asset,
                    collateralData.nftTokenId
                );

            //validation of the parameters: the LTV can
            //only be lower or equal than the liquidation threshold
            //(otherwise a loan against the asset would cause instantaneous liquidation)
            require(
                collateralData.ltv <= collateralData.liquidationThreshold,
                Errors.LPC_INVALID_CONFIGURATION
            );

            if (collateralData.liquidationThreshold != 0) {
                //liquidation bonus must be smaller than 100.00%
                require(
                    collateralData.liquidationBonus <
                        PercentageMath.PERCENTAGE_FACTOR,
                    Errors.LPC_INVALID_CONFIGURATION
                );
            } else {
                require(
                    collateralData.liquidationBonus == 0,
                    Errors.LPC_INVALID_CONFIGURATION
                );
            }

            currentConfig.setLtv(collateralData.ltv);
            currentConfig.setLiquidationThreshold(
                collateralData.liquidationThreshold
            );
            currentConfig.setRedeemThreshold(collateralData.redeemThreshold);
            currentConfig.setLiquidationBonus(collateralData.liquidationBonus);
            currentConfig.setActive(true);
            currentConfig.setFrozen(false);

            //validation of the parameters: the redeem duration can
            //only be lower or equal than the auction duration
            require(
                collateralData.redeemDuration <= collateralData.auctionDuration,
                Errors.LPC_INVALID_CONFIGURATION
            );

            currentConfig.setRedeemDuration(collateralData.redeemDuration);
            currentConfig.setAuctionDuration(collateralData.auctionDuration);
            currentConfig.setRedeemFine(collateralData.redeemFine);
            currentConfig.setMinBidFine(collateralData.minBidFine);
            currentConfig.setConfigTimestamp(block.timestamp);

            cachedPool.setNftConfigByTokenId(
                collateralData.asset,
                collateralData.nftTokenId,
                currentConfig.data
            );

            INFTOracle(_addressesProvider.getNFTOracle()).setNFTPrice(
                collateralData.asset,
                collateralData.nftTokenId,
                collateralData.newPrice
            );
        }
        emit NftConfigurationChanged(
            collateralData.asset,
            collateralData.nftTokenId,
            collateralData.ltv,
            collateralData.liquidationThreshold,
            collateralData.liquidationBonus
        );
    }

    /**
     * @dev Configures the NFT auction parameters
     * @param asset The address of the underlying NFT asset
     * @param redeemDuration The max duration for the redeem
     * @param auctionDuration The auction duration
     * @param redeemFine The fine for the redeem
     **/
    function configureNftAsAuction(
        address asset,
        uint256 nftTokenId,
        uint256 redeemDuration,
        uint256 auctionDuration,
        uint256 redeemFine
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.NftConfigurationMap memory currentConfig = cachedPool
            .getNftConfigByTokenId(asset, nftTokenId);

        //validation of the parameters: the redeem duration can
        //only be lower or equal than the auction duration
        require(
            redeemDuration <= auctionDuration,
            Errors.LPC_INVALID_CONFIGURATION
        );

        currentConfig.setRedeemDuration(redeemDuration);
        currentConfig.setAuctionDuration(auctionDuration);
        currentConfig.setRedeemFine(redeemFine);

        cachedPool.setNftConfigByTokenId(asset, nftTokenId, currentConfig.data);

        emit NftAuctionChanged(
            asset,
            nftTokenId,
            redeemDuration,
            auctionDuration,
            redeemFine
        );
    }

    /**
     * @dev Configures the redeem threshold
     * @param asset The address of the underlying NFT asset
     * @param nftTokenId the tokenId of the asset
     * @param redeemThreshold The threshold for the redeem
     **/
    function setNftRedeemThreshold(
        address asset,
        uint256 nftTokenId,
        uint256 redeemThreshold
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.NftConfigurationMap memory currentConfig = cachedPool
            .getNftConfigByTokenId(asset, nftTokenId);

        currentConfig.setRedeemThreshold(redeemThreshold);

        cachedPool.setNftConfigByTokenId(asset, nftTokenId, currentConfig.data);

        emit NftRedeemThresholdChanged(asset, nftTokenId, redeemThreshold);
    }

    /**
     * @dev Configures the minimum fine for the underlying asset
     * @param asset The address of the underlying NFT asset
     * @param nftTokenId the tokenId of the asset
     * @param minBidFine The minimum bid fine value
     **/
    function setNftMinBidFine(
        address asset,
        uint256 nftTokenId,
        uint256 minBidFine
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        DataTypes.NftConfigurationMap memory currentConfig = cachedPool
            .getNftConfigByTokenId(asset, nftTokenId);

        currentConfig.setMinBidFine(minBidFine);

        cachedPool.setNftConfigByTokenId(asset, nftTokenId, currentConfig.data);

        emit NftMinBidFineChanged(asset, nftTokenId, minBidFine);
    }

    /**
     * @dev Configures the maximum supply and token Id for the underlying NFT assets
     * @param assets The address of the underlying NFT assets
     * @param maxSupply The max supply value
     * @param maxTokenId The max token Id value
     **/
    function setNftMaxSupplyAndTokenId(
        address[] calldata assets,
        uint256 maxSupply,
        uint256 maxTokenId
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 assetsLength = assets.length;
        for (uint256 i = 0; i < assetsLength; ) {
            cachedPool.setNftMaxSupplyAndTokenId(
                assets[i],
                maxSupply,
                maxTokenId
            );

            emit NftMaxSupplyAndTokenIdChanged(
                assets[i],
                maxSupply,
                maxTokenId
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Configures NFTs in batch
     * @param inputs the input array with data to configure each NFT asset
     **/
    //TODO: solve this to accept multi Ids
    function batchConfigNft(
        ConfigNftInput[] calldata inputs
    ) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        uint256 inputsLength = inputs.length;
        for (uint256 i = 0; i < inputsLength; ) {
            DataTypes.NftConfigurationMap memory currentConfig = cachedPool
                .getNftConfigByTokenId(inputs[i].asset, inputs[i].tokenId);

            //validation of the parameters: the LTV can
            //only be lower or equal than the liquidation threshold
            //(otherwise a loan against the asset would cause instantaneous liquidation)
            require(
                inputs[i].baseLTV <= inputs[i].liquidationThreshold,
                Errors.LPC_INVALID_CONFIGURATION
            );

            if (inputs[i].liquidationThreshold != 0) {
                //liquidation bonus must be smaller than 100.00%
                require(
                    inputs[i].liquidationBonus <
                        PercentageMath.PERCENTAGE_FACTOR,
                    Errors.LPC_INVALID_CONFIGURATION
                );
            } else {
                require(
                    inputs[i].liquidationBonus == 0,
                    Errors.LPC_INVALID_CONFIGURATION
                );
            }

            // Active & Frozen Flag
            currentConfig.setActive(true);
            currentConfig.setFrozen(false);

            // collateral parameters
            currentConfig.setLtv(inputs[i].baseLTV);
            currentConfig.setLiquidationThreshold(
                inputs[i].liquidationThreshold
            );
            currentConfig.setLiquidationBonus(inputs[i].liquidationBonus);

            // auction parameters
            currentConfig.setRedeemDuration(inputs[i].redeemDuration);
            currentConfig.setAuctionDuration(inputs[i].auctionDuration);
            currentConfig.setRedeemFine(inputs[i].redeemFine);
            currentConfig.setRedeemThreshold(inputs[i].redeemThreshold);
            currentConfig.setMinBidFine(inputs[i].minBidFine);

            cachedPool.setNftConfigByTokenId(
                inputs[i].asset,
                inputs[i].tokenId,
                currentConfig.data
            );

            emit NftConfigurationChanged(
                inputs[i].asset,
                inputs[i].tokenId,
                inputs[i].baseLTV,
                inputs[i].liquidationThreshold,
                inputs[i].liquidationBonus
            );
            emit NftAuctionChanged(
                inputs[i].asset,
                inputs[i].tokenId,
                inputs[i].redeemDuration,
                inputs[i].auctionDuration,
                inputs[i].redeemFine
            );
            emit NftRedeemThresholdChanged(
                inputs[i].asset,
                inputs[i].tokenId,
                inputs[i].redeemThreshold
            );
            emit NftMinBidFineChanged(
                inputs[i].asset,
                inputs[i].tokenId,
                inputs[i].minBidFine
            );

            // max limit
            cachedPool.setNftMaxSupplyAndTokenId(
                inputs[i].asset,
                inputs[i].maxSupply,
                inputs[i].maxTokenId
            );
            emit NftMaxSupplyAndTokenIdChanged(
                inputs[i].asset,
                inputs[i].maxSupply,
                inputs[i].maxTokenId
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev sets the max amount of reserves
     * @param newVal the new value to set as the max reserves
     **/
    function setMaxNumberOfReserves(uint256 newVal) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        //default value is 32
        uint256 curVal = cachedPool.getMaxNumberOfReserves();
        require(newVal > curVal, Errors.LPC_INVALID_CONFIGURATION);
        cachedPool.setMaxNumberOfReserves(newVal);
    }

    /**
     * @dev sets the max amount of NFTs
     * @param newVal the new value to set as the max NFTs
     **/
    function setMaxNumberOfNfts(uint256 newVal) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        //default value is 256
        uint256 curVal = cachedPool.getMaxNumberOfNfts();
        require(newVal > curVal, Errors.LPC_INVALID_CONFIGURATION);
        cachedPool.setMaxNumberOfNfts(newVal);
    }

    /**
     * @dev sets the liquidation fee percentage
     * @param newVal the new value to set as the max fee percentage
     **/
    function setLiquidationFeePercentage(
        uint256 newVal
    ) external onlyPoolAdmin {
        require(newVal < 1000, Errors.LPC_FEE_PERCENTAGE_TOO_HIGH); //prevent setting incorrect values and ensure fee is not too high (10% max)
        ILendPool cachedPool = _getLendPool();
        cachedPool.setLiquidateFeePercentage(newVal);
    }

    /**
     * @dev sets the max timeframe between an NFT config trigger and a borrow
     * @param newTimeframe the new value to set as the timeframe
     **/
    function setTimeframe(uint256 newTimeframe) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        cachedPool.setTimeframe(newTimeframe);
    }

    /**
     * @dev Allows and address to be sold on NFTX
     * @param nftAsset the address of the NFT
     * @param marketId the id of the market
     * @param val `true` if it is supported, `false`otherwise
     **/
    function setIsMarketSupported(
        address nftAsset,
        uint8 marketId,
        bool val
    ) external onlyLtvManager {
        require(nftAsset != address(0), Errors.INVALID_ZERO_ADDRESS);
        ILendPool cachedPool = _getLendPool();
        cachedPool.setIsMarketSupported(nftAsset, marketId, val);
    }

    /**
     * @dev Sets configFee amount to be charged for ConfigureNFTAsColleteral
     * @param configFee the number of seconds for the timeframe
     **/
    function setConfigFee(uint256 configFee) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        cachedPool.setConfigFee(configFee);
    }

    /**
     * @dev pauses or unpauses all the actions of the protocol, including uToken transfers
     * @param val true if protocol needs to be paused, false otherwise
     **/
    function setPoolPause(bool val) external onlyEmergencyAdmin {
        ILendPool cachedPool = _getLendPool();
        cachedPool.setPause(val);
    }

    function setLtvManagerStatus(
        address newLtvManager,
        bool val
    ) external onlyPoolAdmin {
        require(
            newLtvManager != address(0),
            Errors.LPC_INVALID_LTVMANAGER_ADDRESS
        );
        isLtvManager[newLtvManager] = val;
    }

    /**
     * @dev Sets new pool rescuer
     * @param rescuer the new rescuer address
     **/
    function setPoolRescuer(address rescuer) external onlyPoolAdmin {
        ILendPool cachedPool = _getLendPool();
        cachedPool.updateRescuer(rescuer);
    }

    /**
     * @dev Returns the token implementation contract address
     * @param proxyAddress  The address of the proxy contract
     * @return The address of the token implementation contract
     **/
    function getTokenImplementation(
        address proxyAddress
    ) external view onlyPoolAdmin returns (address) {
        return ConfiguratorLogic.getTokenImplementation(proxyAddress);
    }

    /**
     * @dev Checks the liquidity of reserves
     * @param asset  The address of the underlying reserve asset
     **/
    function _checkReserveNoLiquidity(address asset) internal view {
        DataTypes.ReserveData memory reserveData = _getLendPool()
            .getReserveData(asset);

        uint256 availableLiquidity = IERC20Upgradeable(asset).balanceOf(
            reserveData.uTokenAddress
        );

        require(
            availableLiquidity == 0 && reserveData.currentLiquidityRate == 0,
            Errors.LPC_RESERVE_LIQUIDITY_NOT_0
        );
    }

    /**
     * @dev Checks the liquidity of NFTs
     * @param asset  The address of the underlying NFT asset
     **/
    function _checkNftNoLiquidity(address asset) internal view {
        uint256 collateralAmount = _getLendPoolLoan().getNftCollateralAmount(
            asset
        );

        require(collateralAmount == 0, Errors.LPC_NFT_LIQUIDITY_NOT_0);
    }

    /**
     * @dev Returns the LendPool address stored in the addresses provider
     **/
    function _getLendPool() internal view returns (ILendPool) {
        return ILendPool(_addressesProvider.getLendPool());
    }

    /**
     * @dev Returns the LendPoolLoan address stored in the addresses provider
     **/
    function _getLendPoolLoan() internal view returns (ILendPoolLoan) {
        return ILendPoolLoan(_addressesProvider.getLendPoolLoan());
    }

    /**
     * @dev Returns the UNFTRegistry address stored in the addresses provider
     **/
    function _getUNFTRegistry() internal view returns (IUNFTRegistry) {
        return IUNFTRegistry(_addressesProvider.getUNFTRegistry());
    }
}
