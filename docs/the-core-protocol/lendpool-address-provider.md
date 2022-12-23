---
description: LendPoolAddressProvider.sol
---

# Lendpool Address Provider

An Immutable contract address that stores the addresses of the main contracts in the protocol.

{% hint style="info" %}
If you are searching for a smart contract address, we recommend fetching it from the LendPoolAddressProvider.&#x20;
{% endhint %}

The source can be found on [GitHub](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/master/contracts/protocol/LendPoolAddressesProvider.sol).

## View Methods

### getMarketId

`function getMarketId() external view override returns (string memory)`

Returns the id of the associated Unlockd Market.

#### Return Values

| Type     | Description                              |
| -------- | ---------------------------------------- |
| `string` | a string representation of the market id |

### getAddress

`function getAddress(bytes32 id) public view override returns (address)`

Returns the latest deployed address of a protocol smart contract stored at a given id.&#x20;

#### Call Params

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| `id` | bytes32 | id. Example, the Protocol Data Provider uses id 0x1 |

#### Return Values

| Type    | Description                                             |
| ------- | ------------------------------------------------------- |
| address | The address associated with the given bytes32 variable. |

```
// Get the address of the NFTX vault factory
import { utils } from '@ethers/lib/utils';

const id =  utils.keccak256(utils.toUtf8Bytes("NFTX_VAULT_FACTORY"));
const address = poolAddressProvider.getAddress(id);
```

### getLendPool

`function getLendPool() external view override returns (address)`

Returns the proxy address of the lendpool deployed.

#### Return Values

| Type    | Description                            |
| ------- | -------------------------------------- |
| address | The address of the associated LendPool |

### getLendPoolConfigurator

`function getLendPoolConfigurator() external view override returns (address)`

Returns the proxy address of the LendPoolConfigurator deployed.&#x20;

#### Return Values

| Type    | Description                                        |
| ------- | -------------------------------------------------- |
| address | The address of the associated LendPoolConfigurator |

### getPoolAdmin

`function getPoolAdmin() external view override returns (address)`

Returns the address of the LendPool Admin (wallet or contract).

#### Return Values

| Type    | Description                                  |
| ------- | -------------------------------------------- |
| address | The address of the associated LendPool Admin |

### getEmergencyAdmin

`function getEmergencyAdmin() external view override returns (address)`

Returns the address of the Emergency LendPool Admin (wallet or contract).

#### Return Values

| Type    | Description                                            |
| ------- | ------------------------------------------------------ |
| address | The address of the associated Emergency LendPool Admin |

### `getReserveOracle`

`function getReserveOracle() external view override returns (address)`

Returns the proxy address of the ReserveOracle (Will be used for reserves ERC20).

#### Return Values

| Type    | Description                                  |
| ------- | -------------------------------------------- |
| address | The address of the associated Reserve Oracle |

### getNFTOracle

`function getNFTOracle() external view override returns (address)`

Returns the proxy address of the NFTOracle (Will be used for collateral ERC721)

#### Return Values

| Type    | Description                              |
| ------- | ---------------------------------------- |
| address | The address of the associated NFT Oracle |

### getLendPoolLoan

`function getLendPoolLoan() external view override returns (address)`

Returns the proxy address of the LendPoolLoan (Contract associated with the collaterals - loans).

#### Return Values

| Type    | Description                                |
| ------- | ------------------------------------------ |
| address | The address of the associated LendPoolLoan |

### getUNFTRegistry

`function getUNFTRegistry() external view override returns (address)`

Returns the proxy address of the UNFTRegistry.

#### Return Values

| Type    | Description                                |
| ------- | ------------------------------------------ |
| address | The address of the associated UNFTRegistry |

### getIncentivesController

`function getIncentivesController() external view override returns (address)`

Returns the latest deployed address of the IncentivesController.

#### Return Values

| Type    | Description                                          |
| ------- | ---------------------------------------------------- |
| address | The address of the associated Incentives Controller. |

### getUIDataProvider

`function getUIDataProvider() external view override returns (address)`

Returns the proxy address of the UIDataProvider.

#### Return Values

| Type    | Description                                   |
| ------- | --------------------------------------------- |
| address | The address of the associated UIDataProvider. |

### getUnlockdDataProvider

`function getUnlockdDataProvider() external view override returns (address)`

Returns the proxy address of the UnlockdDataProvider.

#### Return Values

| Type    | Description                                        |
| ------- | -------------------------------------------------- |
| address | The address of the associated UnlockdDataProvider. |

### getWalletBalanceProvider

`function getWalletBalanceProvider() external view override returns (address)`

Returns the latest deployed address of the WalletBalanceProvider.

#### Return Values

| Type    | Description                                          |
| ------- | ---------------------------------------------------- |
| address | The address of the associated WalletBalanceProvider. |

### getNFTXVaultFactory

`function getNFTXVaultFactory() external view override returns (address)`

Returns the latest deployed address of the NFTXVaultFactory.

#### Return Values

| Type    |                                                 |
| ------- | ----------------------------------------------- |
| address | The address of the associated NFTXVaultFactory. |

### getSushiSwapRouter

`function getSushiSwapRouter() external view override returns (address)`

Return the latest deployed address of the SushiSwapRouter.

#### Return Values

| Type    |                                                |
| ------- | ---------------------------------------------- |
| address | The address of the associated SushiSwapRouter. |

### getImplementation

`function getImplementation(address proxyAddress) external view onlyOwner returns (address)`

Returns the latest deployed Implementation address for the given proxy address.

#### Call Params

| Name         | Type    | Description                                                           |
| ------------ | ------- | --------------------------------------------------------------------- |
| proxyAddress | address | the proxy address will return the associated implementation contract. |

#### Return Values

| Type    | Description                                                 |
| ------- | ----------------------------------------------------------- |
| address | The implementation address of the associated proxy Address. |

## Write Methods

### setMarketId

`function setMarketId(string memory marketId) external override onlyOwner`

Set/update the id (Identifier) of the Unlockd market.

#### Call Params

| Name     | Type   | Description              |
| -------- | ------ | ------------------------ |
| marketId | string | the new id of the market |

### setAddressAsProxy

`function setAddressAsProxy(bytes32 id, address implementationAddress, bytes memory encodedDataCall) external override onlyOwner`

Set/update the implementation address of a specified proxied protocol contract

#### Call Params

| Name                  | Type    | Description                                                             |
| --------------------- | ------- | ----------------------------------------------------------------------- |
| id                    | bytes32 | the id of Proxy contract                                                |
| implementationAddress | address | the address of the new implementation contract for the specified proxy. |
| encodedDataCall       | bytes   | \[]                                                                     |

### setAddress

`function setAddress(bytes32 id, address newAddress) external override onlyOwner`

Sets the address of a protocol contract stored at a given id.

#### Call Params

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| id         | bytes32 | keccak256 hash of UTF8Bytes string representing Contract |
| newAddress | address | The new address to be set corresponding to the id        |

### setLendPoolImpl

`function setLendPoolImpl(address pool, bytes memory encodedCallData) external override onlyOwner`

Sets/Update the implementation address of the LendPool proxy contract.

#### Call Params

| Name            | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| pool            | address | the new lendpool implementation address |
| encodedCallData | bytes   | \[]                                     |

### setLendPoolConfiguratorImpl

`function setLendPoolConfiguratorImpl(address configurator, bytes memory encodedCallData) external override onlyOwner`

Sets/updates the implementation address of the LendPoolConfigurator proxy contract.

#### Call Params

| Name            | Type    | Description                                         |
| --------------- | ------- | --------------------------------------------------- |
| configurator    | address | the new lendPoolConfigurator implementation address |
| encodedCallData | bytes   | \[]                                                 |

### setPoolAdmin

`function setPoolAdmin(address admin) external override onlyOwner`

Sets/updates the LendPoolAdmin wallet or contract address.

#### Call Params

| Name  | Type    | Description                                      |
| ----- | ------- | ------------------------------------------------ |
| admin | address | the new LendPoolAdmin wallet or contract address |

### setEmergencyAdmin

`function setEmergencyAdmin(address emergencyAdmin) external override onlyOwner`

Sets/updates the EmergencyAdmin wallet or contract address.

#### Call Params

| Name           | Type    | Description                                       |
| -------------- | ------- | ------------------------------------------------- |
| emergencyAdmin | address | the new EmergencyAdmin wallet or contract address |

### setReserveOracle

`function setReserveOracle(address reserveOracle) external override onlyOwner`

Sets/updates the ReserveOracle implementation address.

#### Call Params

| Name          | Type    | Description                                   |
| ------------- | ------- | --------------------------------------------- |
| reserveOracle | address | the new Reserve Oracle implementation address |

### setNFTOracle

`function setNFTOracle(address nftOracle) external override onlyOwner`

Sets/updates the NFTOracle implementation address.

#### Call Params

| Name      | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| nftOracle | address | the new NFT Oracle implementation address.  |

### setLendPoolLoanImpl

`function setLendPoolLoanImpl(address loanAddress, bytes memory encodedCallData) external override onlyOwner`

Sets/updates the LendPoolLoan implementation address.

#### Call Params

| Name            | Type     | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| loanAddress     | address  | the new LendPool Loan implementation address |
| encodedCallData | bytes    | \[]                                          |

### setUNFTRegistry

`function setUNFTRegistry(address factory) external override onlyOwner`

Sets/updates the new unftRegisty contract address.

#### Call Params

| Name    |         |                                       |
| ------- | ------- | ------------------------------------- |
| factory | address | the new UNFT Registy contract address |

### setIncentivesController

`function setIncentivesController(address controller) external override onlyOwner`

Sets/updates the new Incentives Controller wallet or contract address.

#### Call Params

| Name       | Type    | Description                                               |
| ---------- | ------- | --------------------------------------------------------- |
| controller | address | the new Incentives Controller wallet or contract address. |

### setUIDataProvider

`function setUIDataProvider(address provider) external override onlyOwner`

Sets/updates the new UIDataProvider contract address.

#### Call Params

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| provider | address | the new UI Data Provider contract address |

### setUnlockdDataProvider

`function setUnlockdDataProvider(address provider) external override onlyOwner`

Sets/updates the new Unlockd Data Provider contract address.

#### Call Params

| Name     | Type    | Description                                    |
| -------- | ------- | ---------------------------------------------- |
| provider | address | the new Unlockd Data Provider contract address |

### setWalletBalanceProvider

`function setWalletBalanceProvider(address provider) external override onlyOwner`

Sets/updates the new WalletBalanceProvider wallet or contract address.

#### Call Params

| Name     | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| provider | address | the new Wallet Balance Provider wallet or contract address. |

### setNFTXVaultFactory

`function setNFTXVaultFactory(address factory) external override onlyOwner`

Sets/updates the new NFTXVaultFactory contract address.

#### Call Params

| Name    | Type    | Description                                  |
| ------- | ------- | -------------------------------------------- |
| factory | address | the new NFTX Vault Factory contract address. |

### setSushiSwapRouter

`function setSushiSwapRouter(address router) external override onlyOwner`

Sets/updates the new SushiSwapRouter contract address.

#### Call Params

| Name   | Type    | Description                        |
| ------ | ------- | ---------------------------------- |
| router | address | the new Sushiswap contract address |

