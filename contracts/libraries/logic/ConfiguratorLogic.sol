// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IUToken} from "../../interfaces/IUToken.sol";
import {IDebtToken} from "../../interfaces/IDebtToken.sol";
import {ILendPool} from "../../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";

import {IUNFT} from "../../interfaces/IUNFT.sol";
import {IUNFTRegistry} from "../../interfaces/IUNFTRegistry.sol";

import {UnlockdUpgradeableProxy} from "../../libraries/proxy/UnlockdUpgradeableProxy.sol";
import {ReserveConfiguration} from "../../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../../libraries/configuration/NftConfiguration.sol";
import {DataTypes} from "../../libraries/types/DataTypes.sol";
import {ConfigTypes} from "../../libraries/types/ConfigTypes.sol";
import {Errors} from "../../libraries/helpers/Errors.sol";

/**
 * @title ConfiguratorLogic library
 * @author Unlockd
 * @notice Implements the logic to configuration feature
 */
library ConfiguratorLogic {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using NftConfiguration for DataTypes.NftConfigurationMap;

    /**
     * @dev Emitted when a reserve is initialized.
     * @param asset The address of the underlying asset of the reserve
     * @param uToken The address of the associated uToken contract
     * @param debtToken The address of the associated debtToken contract
     * @param interestRateAddress The address of the interest rate strategy for the reserve
     **/
    event ReserveInitialized(
        address indexed asset,
        address indexed uToken,
        address debtToken,
        address interestRateAddress
    );

    /**
     * @dev Emitted when a nft is initialized.
     * @param asset The address of the underlying asset of the nft
     * @param uNft The address of the associated uNFT contract
     **/
    event NftInitialized(address indexed asset, address indexed uNft);

    /**
     * @dev Emitted when an uToken implementation is upgraded
     * @param asset The address of the underlying asset of the reserve
     * @param proxy The uToken proxy address
     * @param implementation The new uToken implementation
     **/
    event UTokenUpgraded(
        address indexed asset,
        address indexed proxy,
        address indexed implementation
    );

    /**
     * @dev Emitted when the implementation of a debt token is upgraded
     * @param asset The address of the underlying asset of the reserve
     * @param proxy The debt token proxy address
     * @param implementation The new debtToken implementation
     **/
    event DebtTokenUpgraded(
        address indexed asset,
        address indexed proxy,
        address indexed implementation
    );

    /**
     * @notice Initializes a reserve
     * @dev Emits the `ReserveInitialized()` event.
     * @param addressProvider The addresses provider
     * @param cachePool The lend pool
     * @param input The data to initialize the reserve
     */
    function executeInitReserve(
        ILendPoolAddressesProvider addressProvider,
        ILendPool cachePool,
        ConfigTypes.InitReserveInput calldata input
    ) external {
        address uTokenProxyAddress = _initTokenWithProxy(
            input.uTokenImpl,
            abi.encodeWithSelector(
                IUToken.initialize.selector,
                addressProvider,
                input.treasury,
                input.underlyingAsset,
                input.underlyingAssetDecimals,
                input.uTokenName,
                input.uTokenSymbol
            )
        );

        address debtTokenProxyAddress = _initTokenWithProxy(
            input.debtTokenImpl,
            abi.encodeWithSelector(
                IDebtToken.initialize.selector,
                addressProvider,
                input.underlyingAsset,
                input.underlyingAssetDecimals,
                input.debtTokenName,
                input.debtTokenSymbol
            )
        );

        cachePool.initReserve(
            input.underlyingAsset,
            uTokenProxyAddress,
            debtTokenProxyAddress,
            input.interestRateAddress
        );

        DataTypes.ReserveConfigurationMap memory currentConfig = cachePool
            .getReserveConfiguration(input.underlyingAsset);

        currentConfig.setDecimals(input.underlyingAssetDecimals);

        currentConfig.setActive(true);
        currentConfig.setFrozen(false);

        cachePool.setReserveConfiguration(
            input.underlyingAsset,
            currentConfig.data
        );

        emit ReserveInitialized(
            input.underlyingAsset,
            uTokenProxyAddress,
            debtTokenProxyAddress,
            input.interestRateAddress
        );
    }

    /**
     * @notice Initializes an NFT
     * @dev Emits the `NftInitialized()` event.
     * @param pool_ The lend pool
     * @param registry_ The UNFT Registry
     * @param input The data to initialize the NFT
     */
    function executeInitNft(
        ILendPool pool_,
        IUNFTRegistry registry_,
        ConfigTypes.InitNftInput calldata input
    ) external {
        // UNFT proxy and implementation are created in UNFTRegistry
        (address uNftProxy, ) = registry_.getUNFTAddresses(
            input.underlyingAsset
        );
        require(uNftProxy != address(0), Errors.LPC_INVALID_UNFT_ADDRESS);

        pool_.initNft(input.underlyingAsset, uNftProxy);

        DataTypes.NftConfigurationMap memory currentConfig = pool_
            .getNftConfiguration(input.underlyingAsset);

        currentConfig.setActive(true);
        currentConfig.setFrozen(false);

        pool_.setNftConfiguration(input.underlyingAsset, currentConfig.data);

        emit NftInitialized(input.underlyingAsset, uNftProxy);
    }

    /**
     * @notice Updates the uToken
     * @dev Emits the `UTokenUpgraded()` event.
     * @param cachedPool The lend pool
     * @param input The data to initialize the uToken
     */
    function executeUpdateUToken(
        ILendPool cachedPool,
        ConfigTypes.UpdateUTokenInput calldata input
    ) external {
        DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(
            input.asset
        );

        _upgradeTokenImplementation(
            reserveData.uTokenAddress,
            input.implementation,
            input.encodedCallData
        );

        emit UTokenUpgraded(
            input.asset,
            reserveData.uTokenAddress,
            input.implementation
        );
    }

    /**
     * @notice Updates the debt token
     * @dev Emits the `DebtTokenUpgraded()` event.
     * @param cachedPool The lend pool
     * @param input The data to initialize the debt token
     */
    function executeUpdateDebtToken(
        ILendPool cachedPool,
        ConfigTypes.UpdateDebtTokenInput calldata input
    ) external {
        DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(
            input.asset
        );

        _upgradeTokenImplementation(
            reserveData.debtTokenAddress,
            input.implementation,
            input.encodedCallData
        );

        emit DebtTokenUpgraded(
            input.asset,
            reserveData.debtTokenAddress,
            input.implementation
        );
    }

    /**
     * @notice Gets the token implementation contract
     * @param proxyAddress The proxy contract to fetch the implementation from
     */
    function getTokenImplementation(
        address proxyAddress
    ) external view returns (address) {
        UnlockdUpgradeableProxy proxy = UnlockdUpgradeableProxy(
            payable(proxyAddress)
        );
        return proxy.getImplementation();
    }

    /**
     * @notice Initializes the proxy contract
     * @param implementation The proxy contract
     * @param initParams The initial params to set in the initialization
     */
    function _initTokenWithProxy(
        address implementation,
        bytes memory initParams
    ) internal returns (address) {
        UnlockdUpgradeableProxy proxy = new UnlockdUpgradeableProxy(
            implementation,
            address(this),
            initParams
        );

        return address(proxy);
    }

    /**
     * @notice Upgrades the implementation contract for the proxy
     * @param proxyAddress The proxy contract
     * @param implementation The new implementation contract
     * @param encodedCallData calldata to be executed
     */
    function _upgradeTokenImplementation(
        address proxyAddress,
        address implementation,
        bytes memory encodedCallData
    ) internal {
        UnlockdUpgradeableProxy proxy = UnlockdUpgradeableProxy(
            payable(proxyAddress)
        );

        if (encodedCallData.length > 0) {
            proxy.upgradeToAndCall(implementation, encodedCallData);
        } else {
            proxy.upgradeTo(implementation);
        }
    }
}
