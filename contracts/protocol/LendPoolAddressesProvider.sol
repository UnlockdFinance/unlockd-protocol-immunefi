// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

// Prettier ignore to prevent buidler flatter bug
// prettier-ignore
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {UnlockdUpgradeableProxy} from "../libraries/proxy/UnlockdUpgradeableProxy.sol";
import {Errors} from "../libraries/helpers/Errors.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title LendPoolAddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol, including permissioned roles
 * - Acting also as factory of proxies and admin of those, so with right to change its implementations
 * - Owned by the Unlockd Governance
 * @author Unlockd
 **/
contract LendPoolAddressesProvider is Ownable, ILendPoolAddressesProvider {
    string private _marketId;
    mapping(bytes32 => address) private _addresses;

    bytes32 private constant LEND_POOL = "LEND_POOL";
    bytes32 private constant LEND_POOL_CONFIGURATOR = "LEND_POOL_CONFIGURATOR";
    bytes32 private constant POOL_ADMIN = "POOL_ADMIN";
    bytes32 private constant EMERGENCY_ADMIN = "EMERGENCY_ADMIN";
    bytes32 private constant RESERVE_ORACLE = "RESERVE_ORACLE";
    bytes32 private constant NFT_ORACLE = "NFT_ORACLE";
    bytes32 private constant LEND_POOL_LOAN = "LEND_POOL_LOAN";
    bytes32 private constant UNFT_REGISTRY = "UNFT_REGISTRY";
    bytes32 private constant LEND_POOL_LIQUIDATOR = "LEND_POOL_LIQUIDATOR";
    bytes32 private constant INCENTIVES_CONTROLLER = "INCENTIVES_CONTROLLER";
    bytes32 private constant UNLOCKD_DATA_PROVIDER = "UNLOCKD_DATA_PROVIDER";
    bytes32 private constant UI_DATA_PROVIDER = "UI_DATA_PROVIDER";
    bytes32 private constant WALLET_BALANCE_PROVIDER =
        "WALLET_BALANCE_PROVIDER";
    bytes32 private constant NFTX_VAULT_FACTORY = "NFTX_VAULT_FACTORY";
    bytes32 private constant SUSHI_SWAP_ROUTER = "SUSHI_SWAP_ROUTER";
    bytes32 private constant LSSVM_ROUTER = "LSSVM_ROUTER";

    constructor(string memory marketId) {
        _setMarketId(marketId);
    }

    /**
     * @dev Returns the id of the Unlockd market to which this contracts points to
     * @return The market id
     **/
    function getMarketId() external view override returns (string memory) {
        return _marketId;
    }

    /**
     * @dev Allows to set the market which this LendPoolAddressesProvider represents
     * @param marketId The market id
     */
    function setMarketId(string memory marketId) external override onlyOwner {
        _setMarketId(marketId);
    }

    /**
     * @dev General function to update the implementation of a proxy registered with
     * certain `id`. If there is no proxy registered, it will instantiate one and
     * set as implementation the `implementationAddress`
     * IMPORTANT Use this function carefully, only for ids that don't have an explicit
     * setter function, in order to avoid unexpected consequences
     * @param id The id
     * @param implementationAddress The address of the new implementation
     */
    function setAddressAsProxy(
        bytes32 id,
        address implementationAddress,
        bytes memory encodedCallData
    ) external override onlyOwner {
        require(
            implementationAddress != address(0),
            Errors.INVALID_ZERO_ADDRESS
        );
        _updateImpl(id, implementationAddress);
        emit AddressSet(id, implementationAddress, true, encodedCallData);

        if (encodedCallData.length > 0) {
            Address.functionCall(_addresses[id], encodedCallData);
        }
    }

    /**
     * @dev Sets an address for an id replacing the address saved in the addresses map
     * IMPORTANT Use this function carefully, as it will do a hard replacement
     * @param id The id
     * @param newAddress The address to set
     */
    function setAddress(
        bytes32 id,
        address newAddress
    ) external override onlyOwner {
        require(newAddress != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[id] = newAddress;
        emit AddressSet(id, newAddress, false, new bytes(0));
    }

    /**
     * @dev Returns an address by id
     * @return The address
     */
    function getAddress(bytes32 id) public view override returns (address) {
        return _addresses[id];
    }

    /**
     * @dev Returns the address of the LendPool proxy
     * @return The LendPool proxy address
     **/
    function getLendPool() external view override returns (address) {
        return getAddress(LEND_POOL);
    }

    /**
     * @dev Updates the implementation of the LendPool, or creates the proxy
     * setting the new `pool` implementation on the first time calling it
     * @param pool The new LendPool implementation
     * @param encodedCallData calldata to execute
     **/
    function setLendPoolImpl(
        address pool,
        bytes memory encodedCallData
    ) external override onlyOwner {
        require(pool != address(0), Errors.INVALID_ZERO_ADDRESS);
        _updateImpl(LEND_POOL, pool);
        emit LendPoolUpdated(pool, encodedCallData);

        if (encodedCallData.length > 0) {
            Address.functionCall(_addresses[LEND_POOL], encodedCallData);
        }
    }

    /**
     * @dev Returns the address of the LendPoolConfigurator proxy
     * @return The LendPoolConfigurator proxy address
     **/
    function getLendPoolConfigurator()
        external
        view
        override
        returns (address)
    {
        return getAddress(LEND_POOL_CONFIGURATOR);
    }

    /**
     * @dev Updates the implementation of the LendPoolConfigurator, or creates the proxy
     * setting the new `configurator` implementation on the first time calling it
     * @param configurator The new LendPoolConfigurator implementation
     * @param encodedCallData calldata to execute
     **/
    function setLendPoolConfiguratorImpl(
        address configurator,
        bytes memory encodedCallData
    ) external override onlyOwner {
        require(configurator != address(0), Errors.INVALID_ZERO_ADDRESS);
        _updateImpl(LEND_POOL_CONFIGURATOR, configurator);
        emit LendPoolConfiguratorUpdated(configurator, encodedCallData);

        if (encodedCallData.length > 0) {
            Address.functionCall(
                _addresses[LEND_POOL_CONFIGURATOR],
                encodedCallData
            );
        }
    }

    /**
     * @dev returns the address of the LendPool admin
     * @return the LendPoolAdmin address
     **/

    function getPoolAdmin() external view override returns (address) {
        return getAddress(POOL_ADMIN);
    }

    /**
     * @dev sets the address of the LendPool admin
     * @param admin the LendPoolAdmin address
     **/
    function setPoolAdmin(address admin) external override onlyOwner {
        require(admin != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[POOL_ADMIN] = admin;
        emit ConfigurationAdminUpdated(admin);
    }

    /**
     * @dev returns the address of the emergency admin
     * @return the EmergencyAdmin address
     **/
    function getEmergencyAdmin() external view override returns (address) {
        return getAddress(EMERGENCY_ADMIN);
    }

    /**
     * @dev sets the address of the emergency admin
     * @param emergencyAdmin the EmergencyAdmin address
     **/
    function setEmergencyAdmin(
        address emergencyAdmin
    ) external override onlyOwner {
        require(emergencyAdmin != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[EMERGENCY_ADMIN] = emergencyAdmin;
        emit EmergencyAdminUpdated(emergencyAdmin);
    }

    /**
     * @dev returns the address of the reserve oracle
     * @return the ReserveOracle address
     **/
    function getReserveOracle() external view override returns (address) {
        return getAddress(RESERVE_ORACLE);
    }

    /**
     * @dev sets the address of the reserve oracle
     * @param reserveOracle the ReserveOracle address
     **/
    function setReserveOracle(
        address reserveOracle
    ) external override onlyOwner {
        require(reserveOracle != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[RESERVE_ORACLE] = reserveOracle;
        emit ReserveOracleUpdated(reserveOracle);
    }

    /**
     * @dev returns the address of the NFT oracle
     * @return the NFTOracle address
     **/
    function getNFTOracle() external view override returns (address) {
        return getAddress(NFT_ORACLE);
    }

    /**
     * @dev sets the address of the NFT oracle
     * @param nftOracle the NFTOracle address
     **/
    function setNFTOracle(address nftOracle) external override onlyOwner {
        require(nftOracle != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[NFT_ORACLE] = nftOracle;
        emit NftOracleUpdated(nftOracle);
    }

    /**
     * @dev returns the address of the lendpool loan
     * @return the LendPoolLoan address
     **/
    function getLendPoolLoan() external view override returns (address) {
        return getAddress(LEND_POOL_LOAN);
    }

    /**
     * @dev sets the address of the lendpool loan
     * @param loanAddress the LendPoolLoan address
     * @param encodedCallData calldata to execute
     **/
    function setLendPoolLoanImpl(
        address loanAddress,
        bytes memory encodedCallData
    ) external override onlyOwner {
        require(loanAddress != address(0), Errors.INVALID_ZERO_ADDRESS);
        _updateImpl(LEND_POOL_LOAN, loanAddress);
        emit LendPoolLoanUpdated(loanAddress, encodedCallData);

        if (encodedCallData.length > 0) {
            Address.functionCall(_addresses[LEND_POOL_LOAN], encodedCallData);
        }
    }

    /**
     * @dev returns the address of the UNFT Registry
     * @return the UNFTRegistry address
     **/
    function getUNFTRegistry() external view override returns (address) {
        return getAddress(UNFT_REGISTRY);
    }

    /**
     * @dev sets the address of the UNFT registry
     * @param factory the UNFTRegistry address
     **/
    function setUNFTRegistry(address factory) external override onlyOwner {
        require(factory != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[UNFT_REGISTRY] = factory;
        emit UNFTRegistryUpdated(factory);
    }

    /**
     * @dev returns the address of the incentives controller
     * @return the IncentivesController address
     **/
    function getIncentivesController()
        external
        view
        override
        returns (address)
    {
        return getAddress(INCENTIVES_CONTROLLER);
    }

    /**
     * @dev sets the address of the incentives controller
     * @param controller the IncentivesController address
     **/
    function setIncentivesController(
        address controller
    ) external override onlyOwner {
        require(controller != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[INCENTIVES_CONTROLLER] = controller;
        emit IncentivesControllerUpdated(controller);
    }

    /**
     * @dev returns the address of the UI data provider
     * @return the UIDataProvider address
     **/
    function getUIDataProvider() external view override returns (address) {
        return getAddress(UI_DATA_PROVIDER);
    }

    /**
     * @dev sets the address of the UI data provider
     * @param provider the UIDataProvider address
     **/
    function setUIDataProvider(address provider) external override onlyOwner {
        _addresses[UI_DATA_PROVIDER] = provider;
        emit UIDataProviderUpdated(provider);
    }

    /**
     * @dev returns the address of the Unlockd data provider
     * @return the UnlockdDataProvider address
     **/
    function getUnlockdDataProvider() external view override returns (address) {
        return getAddress(UNLOCKD_DATA_PROVIDER);
    }

    /**
     * @dev sets the address of the Unlockd data provider
     * @param provider the UnlockdDataProvider address
     **/
    function setUnlockdDataProvider(
        address provider
    ) external override onlyOwner {
        require(provider != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[UNLOCKD_DATA_PROVIDER] = provider;
        emit UnlockdDataProviderUpdated(provider);
    }

    /**
     * @dev returns the address of the wallet balance provider
     * @return the WalletBalanceProvider address
     **/
    function getWalletBalanceProvider()
        external
        view
        override
        returns (address)
    {
        return getAddress(WALLET_BALANCE_PROVIDER);
    }

    /**
     * @dev sets the address of the wallet balance provider
     * @param provider the WalletBalanceProvider address
     **/
    function setWalletBalanceProvider(
        address provider
    ) external override onlyOwner {
        require(provider != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[WALLET_BALANCE_PROVIDER] = provider;
        emit WalletBalanceProviderUpdated(provider);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function getNFTXVaultFactory() external view override returns (address) {
        return getAddress(NFTX_VAULT_FACTORY);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function setNFTXVaultFactory(address factory) external override onlyOwner {
        require(factory != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[NFTX_VAULT_FACTORY] = factory;
        emit NFTXVaultFactoryUpdated(factory);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function getLSSVMRouter() external view override returns (address) {
        return getAddress(LSSVM_ROUTER);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function setLSSVMRouter(address router) external override onlyOwner {
        require(router != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[LSSVM_ROUTER] = router;
        emit LSSVMRouterUpdated(router);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function getSushiSwapRouter() external view override returns (address) {
        return getAddress(SUSHI_SWAP_ROUTER);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function setSushiSwapRouter(address router) external override onlyOwner {
        require(router != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[SUSHI_SWAP_ROUTER] = router;
        emit SushiSwapRouterUpdated(router);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function getLendPoolLiquidator() external view override returns (address) {
        return getAddress(LEND_POOL_LIQUIDATOR);
    }

    /**
     * @inheritdoc ILendPoolAddressesProvider
     */
    function setLendPoolLiquidator(
        address liquidator
    ) external override onlyOwner {
        require(liquidator != address(0), Errors.INVALID_ZERO_ADDRESS);
        _addresses[LEND_POOL_LIQUIDATOR] = liquidator;
        emit LendPoolLiquidatorUpdated(liquidator);
    }

    /**
     * @dev Returns the implementation contract pointed by a proxy
     * @param proxyAddress the proxy to request the implementation from
     */
    function getImplementation(
        address proxyAddress
    ) external view onlyOwner returns (address) {
        UnlockdUpgradeableProxy proxy = UnlockdUpgradeableProxy(
            payable(proxyAddress)
        );
        return proxy.getImplementation();
    }

    /**
     * @dev Internal function to update the implementation of a specific proxied component of the protocol
     * - If there is no proxy registered in the given `id`, it creates the proxy setting `newAdress`
     *   as implementation and calls the initialize() function on the proxy
     * - If there is already a proxy registered, it just updates the implementation to `newAddress` and
     *   calls the encoded method function via upgradeToAndCall() in the proxy
     * @param id The id of the proxy to be updated
     * @param newAddress The address of the new implementation
     **/
    function _updateImpl(bytes32 id, address newAddress) internal {
        address payable proxyAddress = payable(_addresses[id]);

        if (proxyAddress == address(0)) {
            bytes memory params = abi.encodeWithSignature(
                "initialize(address)",
                address(this)
            );

            // create proxy, then init proxy & implementation
            UnlockdUpgradeableProxy proxy = new UnlockdUpgradeableProxy(
                newAddress,
                address(this),
                params
            );

            _addresses[id] = address(proxy);
            emit ProxyCreated(id, address(proxy));
        } else {
            // upgrade implementation
            UnlockdUpgradeableProxy proxy = UnlockdUpgradeableProxy(
                proxyAddress
            );

            proxy.upgradeTo(newAddress);
        }
    }

    /**
     * @dev Allows to set the market which this LendPoolAddressesProvider represents
     * @param marketId The market id
     */
    function _setMarketId(string memory marketId) internal {
        _marketId = marketId;
        emit MarketIdSet(marketId);
    }
}
