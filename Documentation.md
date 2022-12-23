# Unlockd Protocol Specification

## Table of contents

1. [Introduction](#introduction)
2. [Contract Interactions and use cases](#contract-interactions-and-use-cases)
   1. [Deposit](#deposit)
   1. [Withdraw](#withdraw)
   1. [Borrow](#borrow)
   1. [Repay](#repay)
   1. [Redeem](#redeem)
   1. [Liquidate](#Liquidate)
3. [Risk Framework](#risk-framework)
4. [Contracts](#contracts)
   1. [Protocol Contracts](#protocol-contracts)
   1. [Logic Libraries](#logic-libraries)
   1. [Helper Contracts](#helper-contracts)
   1. [Interfaces](#interfaces)
   1. [Configuration Libraries](#configuration-libraries)
   1. [Types](#types)

# Introduction to Unlockd

This documentation describes the public infraastructure we are building, the Unlockd protocol.
Unlockd is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers. It is, at its core, a set of smart contracts deployed to the Ethereum Mainnet, where depositors provide liquidity in the form of ERC20 tokens in order to earn a passive income, while borrowers are able to receive overcollateralized loans by setting their non-fungible ERC721 assets as collateral.
The following document contains relevant information about the Smart Contracts designed for the Unlockd protocol, as well as an overview of the most relevant scenarios.

# Risk Framework

At Unlockd, we understand the potential risks of market volatility and how it can affect the protocol.
Because of that, we are constantly seeking for new ways to make the protocol safer and more reliable.
Unlockd’s Risk Framework breaks down some of the key risks of the protocol and the mitigation techniques in place.
You can check the risk framework documentation [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/master/RiskFramework.pdf).

# Contract interactions and use cases

## Deposit

Users can deposit ERC-20 tokens to the protocol via the deposit() function in the LendPool.sol contract. It deposits an amount of underlying asset to the reserves of the protocol, receiving in return overlying uTokens representing the deposit position. In order to deposit, the user must provide the contract with information about the asset and amount to be deposited, as well as the address that will receive the corresponding uTokens.
You can check the deposit diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/deposit.png).

## Withdraw

Users can withdraw their deposited assets by triggering the withdraw() function in the LendPool. The withdrawal process burns the equivalent uTokens owned, returning back the original asset to the user. In order to perform a succesful withdrawal, users must specify the asset and amount to withdraw, as well as the address that will receive the underlying assets.
You can check the withdraw diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/withdraw.png).

## Borrow

The Unlockd protocol allows users to borrow against their NFT assets, setting them as collateral. Each NFT provided as collateral will be linked to a single loan, which will contain all the data corresponding to the borrow position. The borrowing process requires the user to specify the asset and amount to be borrowed, the collection address and token ID for the non-fungible asset to be set as collateral, and finally an address to specify the loan receiver.
You can check the borrow diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/borrow.png).

## Repay

Providing users with over-collateralized loans implies a return of the borrowed amount plus a small fee. The repay function in the LendPool allows users to perform this return of borrowed assets, getting their collateralized non-fungible asset back. In order to repay, the collection address and token ID for the NFT must be provided, as well as the desired amount to repay. The amount is specified due to the fact that partial repayments are allowed (for example, to increase a user's health factor).
You can check the repay diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/repay.png).

## Redeem

Users can find themselves in a situation where their health factor has dropped below 1, thus triggering the auction process. In this case, the collateral owner can redeem the NFT loan, thus burning the loan and receiving the non-fungible asset back. In this case, the user must specifty the collection address and token ID for the NFT, the amount to repay the debt, and an additional bid fine as a penalty for triggering the auction process.
You can check the redeem diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/redeem.png).

## Liquidate

The liquidation process starts with a non-fungible asset used as collateral in the protocol reaching a health factor value below 1. An external server is monitoring all the protocol loans, making sure to identify unhealthy loans. When an unhealthy loan is identified, the NFT can be set to auction.
The auction process begins with Unlockd setting a minimum bid price coming from the liquid NFT marketplace, NFTX. A duration time is set for the auction, and users can bid above the minimum price or the previous highest bid (the first bid will benefit from a return fee in order to incentivize bids). There are two scenarios when an auction gets triggered:

1. If there have been bids, the NFT will be sold to the highest bidder, thus liquidating the NFT and allowing the protocol to get the loaned amount back.
2. If there are no bids, the NFT is liquidated via NFTX. An external server will be monitoring the auction duration, and trigger the NFTX liquidation if no bids are placed.
   You can check the auction diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/auction.png).
   You can check the liquidate diagrams [here](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development__documentation/assets/liquidation.png).

# Contracts

## **Protocol Contracts**

## LendPool

\_Main point of interaction with an Unlockd protocol's market

- Users can:
  - Deposit
  - Withdraw
  - Borrow
  - Repay
  - Auction
  - Liquidate
- To be covered by a proxy contract, owned by the LendPoolAddressesProvider of the specific market
- All admin functions are callable by the LendPoolConfigurator contract defined also in the
  LendPoolAddressesProvider\_

### ADDRESS_ID_WETH_GATEWAY

```solidity
bytes32 ADDRESS_ID_WETH_GATEWAY
```

### ADDRESS_ID_PUNK_GATEWAY

```solidity
bytes32 ADDRESS_ID_PUNK_GATEWAY
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### whenNotPaused

```solidity
modifier whenNotPaused()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### onlyLendPoolLiquidatorOrGateway

```solidity
modifier onlyLendPoolLiquidatorOrGateway()
```

### \_whenNotPaused

```solidity
function _whenNotPaused() internal view
```

### \_onlyLendPoolConfigurator

```solidity
function _onlyLendPoolConfigurator() internal view
```

### \_onlyLendPoolLiquidatorOrGateway

```solidity
function _onlyLendPoolLiquidatorOrGateway() internal view
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) public
```

\_Function is invoked by the proxy contract when the LendPool contract is added to the
LendPoolAddressesProvider of the market.

- Caching the address of the LendPoolAddressesProvider in order to reduce gas consumption
  on subsequent operations\_

| Name     | Type                                | Description                                  |
| -------- | ----------------------------------- | -------------------------------------------- |
| provider | contract ILendPoolAddressesProvider | The address of the LendPoolAddressesProvider |

### deposit

```solidity
function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external
```

\_Deposits an `amount` of underlying asset into the reserve, receiving in return overlying uTokens.

- E.g. User deposits 100 USDC and gets in return 100 uusdc\_

| Name         | Type    | Description                                                                                                                                                                                   |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | The address of the underlying asset to deposit                                                                                                                                                |
| amount       | uint256 | The amount to be deposited                                                                                                                                                                    |
| onBehalfOf   | address | The address that will receive the uTokens, same as msg.sender if the user wants to receive them on his own wallet, or a different address if the beneficiary of uTokens is a different wallet |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                               |

### withdraw

```solidity
function withdraw(address asset, uint256 amount, address to) external returns (uint256)
```

_Withdraws an `amount` of underlying asset from the reserve, burning the equivalent uTokens owned
E.g. User has 100 uusdc, calls withdraw() and receives 100 USDC, burning the 100 uusdc_

| Name   | Type    | Description                                                                                                                                                                     |
| ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset  | address | The address of the underlying asset to withdraw                                                                                                                                 |
| amount | uint256 | The underlying amount to be withdrawn - Send the value type(uint256).max in order to withdraw the whole uToken balance                                                          |
| to     | address | Address that will receive the underlying, same as msg.sender if the user wants to receive it on his own wallet, or a different address if the beneficiary is a different wallet |

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | uint256 | The final amount withdrawn |

### borrow

```solidity
function borrow(address asset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset

- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                       |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | The address of the underlying asset to borrow                                                                                                                     |
| amount       | uint256 | The amount to be borrowed                                                                                                                                         |
| nftAsset     | address | The address of the underlying nft used as collateral                                                                                                              |
| nftTokenId   | uint256 | The token ID of the underlying nft used as collateral                                                                                                             |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man   |

### repay

```solidity
function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay                                   |

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId) external
```

\_Function to auction a non-healthy position collateral-wise

- The collateral asset of the user getting liquidated is auctioned

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### redeem

```solidity
function redeem(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256)
```

Redeem a NFT loan which state is in Auction

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay the debt                          |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

\_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.\_

### getReserveConfiguration

```solidity
function getReserveConfiguration(address asset) external view returns (struct DataTypes.ReserveConfigurationMap)
```

_Returns the configuration of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type                                     | Description                      |
| ---- | ---------------------------------------- | -------------------------------- |
| [0]  | struct DataTypes.ReserveConfigurationMap | The configuration of the reserve |

### getNftConfiguration

```solidity
function getNftConfiguration(address asset) external view returns (struct DataTypes.NftConfigurationMap)
```

_Returns the configuration of the NFT_

| Name  | Type    | Description                         |
| ----- | ------- | ----------------------------------- |
| asset | address | The address of the asset of the NFT |

| Name | Type                                 | Description                  |
| ---- | ------------------------------------ | ---------------------------- |
| [0]  | struct DataTypes.NftConfigurationMap | The configuration of the NFT |

### getReserveNormalizedIncome

```solidity
function getReserveNormalizedIncome(address asset) external view returns (uint256)
```

_Returns the normalized income normalized income of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | uint256 | The reserve's normalized income |

### getReserveNormalizedVariableDebt

```solidity
function getReserveNormalizedVariableDebt(address asset) external view returns (uint256)
```

_Returns the normalized variable debt per unit of asset_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| [0]  | uint256 | The reserve normalized variable debt |

### getReserveData

```solidity
function getReserveData(address asset) external view returns (struct DataTypes.ReserveData)
```

_Returns the state and configuration of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type                         | Description              |
| ---- | ---------------------------- | ------------------------ |
| [0]  | struct DataTypes.ReserveData | The state of the reserve |

### getNftData

```solidity
function getNftData(address asset) external view returns (struct DataTypes.NftData)
```

_Returns the state and configuration of the nft_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the nft |

| Name | Type                     | Description          |
| ---- | ------------------------ | -------------------- |
| [0]  | struct DataTypes.NftData | The state of the nft |

### getNftCollateralData

```solidity
function getNftCollateralData(address nftAsset, uint256 nftTokenId, address reserveAsset) external view returns (uint256 totalCollateralInETH, uint256 totalCollateralInReserve, uint256 availableBorrowsInETH, uint256 availableBorrowsInReserve, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Returns the loan data of the NFT_

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| nftAsset     | address | The address of the NFT     |
| nftTokenId   | uint256 |                            |
| reserveAsset | address | The address of the Reserve |

| Name                      | Type    | Description                                |
| ------------------------- | ------- | ------------------------------------------ |
| totalCollateralInETH      | uint256 | the total collateral in ETH of the NFT     |
| totalCollateralInReserve  | uint256 | the total collateral in Reserve of the NFT |
| availableBorrowsInETH     | uint256 | the borrowing power in ETH of the NFT      |
| availableBorrowsInReserve | uint256 | the borrowing power in Reserve of the NFT  |
| ltv                       | uint256 | the loan to value of the user              |
| liquidationThreshold      | uint256 | the liquidation threshold of the NFT       |
| liquidationBonus          | uint256 | the liquidation bonus of the NFT           |

### getNftDebtData

```solidity
function getNftDebtData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address reserveAsset, uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 healthFactor)
```

_Returns the debt data of the NFT_

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| nftAsset   | address | The address of the NFT  |
| nftTokenId | uint256 | The token id of the NFT |

| Name             | Type    | Description                          |
| ---------------- | ------- | ------------------------------------ |
| loanId           | uint256 | the loan id of the NFT               |
| reserveAsset     | address | the address of the Reserve           |
| totalCollateral  | uint256 | the total power of the NFT           |
| totalDebt        | uint256 | the total debt of the NFT            |
| availableBorrows | uint256 | the borrowing power left of the NFT  |
| healthFactor     | uint256 | the current health factor of the NFT |

### getNftAuctionData

```solidity
function getNftAuctionData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, uint256 auctionStartTimestamp, address reserveAsset, uint256 minBidPrice)
```

_Returns the auction data of the NFT_

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| nftAsset   | address | The address of the NFT  |
| nftTokenId | uint256 | The token id of the NFT |

| Name                  | Type    | Description                      |
| --------------------- | ------- | -------------------------------- |
| loanId                | uint256 | the loan id of the NFT           |
| auctionStartTimestamp | uint256 | the timestamp of auction start   |
| reserveAsset          | address | the reserve asset of buy offers  |
| minBidPrice           | uint256 | the min bid price of the auction |

### GetLiquidationPriceLocalVars

```solidity
struct GetLiquidationPriceLocalVars {
  address poolLoan;
  uint256 loanId;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 paybackAmount;
  uint256 remainAmount;
}

```

### getNftLiquidatePrice

```solidity
function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId) external view returns (uint256 liquidatePrice, uint256 paybackAmount)
```

_Returns the state and configuration of the nft_

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| nftAsset   | address | The address of the underlying asset of the nft |
| nftTokenId | uint256 | The token ID of the asset                      |

### finalizeTransfer

```solidity
function finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromBefore, uint256 balanceToBefore) external view
```

\_Validates and finalizes an uToken transfer

- Only callable by the overlying uToken of the `asset`\_

| Name              | Type    | Description                                               |
| ----------------- | ------- | --------------------------------------------------------- |
| asset             | address | The address of the underlying asset of the uToken         |
| from              | address | The user from which the uToken are transferred            |
| to                | address | The user receiving the uTokens                            |
| amount            | uint256 | The amount being transferred/withdrawn                    |
| balanceFromBefore | uint256 | The uToken balance of the `from` user before the transfer |
| balanceToBefore   | uint256 | The uToken balance of the `to` user before the transfer   |

### getReservesList

```solidity
function getReservesList() external view returns (address[])
```

_Returns the list of the initialized reserves_

### getNftsList

```solidity
function getNftsList() external view returns (address[])
```

_Returns the list of the initialized nfts_

### setPause

```solidity
function setPause(bool val) external
```

\_Set the \_pause state of the pool

- Only callable by the LendPoolConfigurator contract\_

| Name | Type | Description                                      |
| ---- | ---- | ------------------------------------------------ |
| val  | bool | `true` to pause the pool, `false` to un-pause it |

### paused

```solidity
function paused() external view returns (bool)
```

_Returns if the LendPool is paused_

### getAddressesProvider

```solidity
function getAddressesProvider() external view returns (contract ILendPoolAddressesProvider)
```

_Returns the cached LendPoolAddressesProvider connected to this contract_

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 val) external
```

_Sets the max number of reserves in the protocol_

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| val  | uint256 | the value to set the max number of reserves |

### getMaxNumberOfReserves

```solidity
function getMaxNumberOfReserves() public view returns (uint256)
```

_Returns the maximum number of reserves supported to be listed in this LendPool_

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 val) external
```

_Sets the max number of NFTs in the protocol_

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| val  | uint256 | the value to set the max number of NFTs |

### getMaxNumberOfNfts

```solidity
function getMaxNumberOfNfts() public view returns (uint256)
```

_Returns the maximum number of nfts supported to be listed in this LendPool_

### setLiquidateFeePercentage

```solidity
function setLiquidateFeePercentage(uint256 percentage) external
```

_Sets the fee percentage for liquidations_

| Name       | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| percentage | uint256 | the fee percentage to be set |

### getLiquidateFeePercentage

```solidity
function getLiquidateFeePercentage() public view returns (uint256)
```

_Returns the liquidate fee percentage_

### initReserve

```solidity
function initReserve(address asset, address uTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

\_Initializes a reserve, activating it, assigning an uToken and nft loan and an
interest rate strategy

- Only callable by the LendPoolConfigurator contract\_

| Name                | Type    | Description                                                       |
| ------------------- | ------- | ----------------------------------------------------------------- |
| asset               | address | The address of the underlying asset of the reserve                |
| uTokenAddress       | address | The address of the uToken that will be assigned to the reserve    |
| debtTokenAddress    | address | The address of the debtToken that will be assigned to the reserve |
| interestRateAddress | address | The address of the interest rate strategy contract                |

### initNft

```solidity
function initNft(address asset, address uNftAddress) external
```

\_Initializes a nft, activating it, assigning nft loan and an
interest rate strategy

- Only callable by the LendPoolConfigurator contract\_

| Name        | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| asset       | address | The address of the underlying asset of the nft |
| uNftAddress | address |                                                |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address asset, address rateAddress) external
```

\_Updates the address of the interest rate strategy contract

- Only callable by the LendPoolConfigurator contract\_

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| asset       | address | The address of the underlying asset of the reserve |
| rateAddress | address | The address of the interest rate strategy contract |

### setReserveConfiguration

```solidity
function setReserveConfiguration(address asset, uint256 configuration) external
```

\_Sets the configuration bitmap of the reserve as a whole

- Only callable by the LendPoolConfigurator contract\_

| Name          | Type    | Description                                        |
| ------------- | ------- | -------------------------------------------------- |
| asset         | address | The address of the underlying asset of the reserve |
| configuration | uint256 | The new configuration bitmap                       |

### setNftConfiguration

```solidity
function setNftConfiguration(address asset, uint256 configuration) external
```

\_Sets the configuration bitmap of the NFT as a whole

- Only callable by the LendPoolConfigurator contract\_

| Name          | Type    | Description                         |
| ------------- | ------- | ----------------------------------- |
| asset         | address | The address of the asset of the NFT |
| configuration | uint256 | The new configuration bitmap        |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address asset, uint256 maxSupply, uint256 maxTokenId) external
```

_Sets the max supply and token ID for a given asset_

| Name       | Type    | Description                 |
| ---------- | ------- | --------------------------- |
| asset      | address | The address to set the data |
| maxSupply  | uint256 | The max supply value        |
| maxTokenId | uint256 | The max token ID value      |

### \_addReserveToList

```solidity
function _addReserveToList(address asset) internal
```

### \_addNftToList

```solidity
function _addNftToList(address asset) internal
```

### \_verifyCallResult

```solidity
function _verifyCallResult(bool success, bytes returndata, string errorMessage) internal pure returns (bytes)
```

## LendPoolAddressesProvider

\_Main registry of addresses part of or connected to the protocol, including permissioned roles

- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Unlockd Governance\_

### \_marketId

```solidity
string _marketId
```

### \_addresses

```solidity
mapping(bytes32 => address) _addresses
```

### LEND_POOL

```solidity
bytes32 LEND_POOL
```

### LEND_POOL_CONFIGURATOR

```solidity
bytes32 LEND_POOL_CONFIGURATOR
```

### POOL_ADMIN

```solidity
bytes32 POOL_ADMIN
```

### EMERGENCY_ADMIN

```solidity
bytes32 EMERGENCY_ADMIN
```

### RESERVE_ORACLE

```solidity
bytes32 RESERVE_ORACLE
```

### NFT_ORACLE

```solidity
bytes32 NFT_ORACLE
```

### UNLOCKD_ORACLE

```solidity
bytes32 UNLOCKD_ORACLE
```

### LEND_POOL_LOAN

```solidity
bytes32 LEND_POOL_LOAN
```

### UNFT_REGISTRY

```solidity
bytes32 UNFT_REGISTRY
```

### LEND_POOL_LIQUIDATOR

```solidity
bytes32 LEND_POOL_LIQUIDATOR
```

### INCENTIVES_CONTROLLER

```solidity
bytes32 INCENTIVES_CONTROLLER
```

### UNLOCKD_DATA_PROVIDER

```solidity
bytes32 UNLOCKD_DATA_PROVIDER
```

### UI_DATA_PROVIDER

```solidity
bytes32 UI_DATA_PROVIDER
```

### WALLET_BALANCE_PROVIDER

```solidity
bytes32 WALLET_BALANCE_PROVIDER
```

### NFTX_VAULT_FACTORY

```solidity
bytes32 NFTX_VAULT_FACTORY
```

### SUSHI_SWAP_ROUTER

```solidity
bytes32 SUSHI_SWAP_ROUTER
```

### constructor

```solidity
constructor(string marketId) public
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

_Returns the id of the Unlockd market to which this contracts points to_

| Name | Type   | Description   |
| ---- | ------ | ------------- |
| [0]  | string | The market id |

### setMarketId

```solidity
function setMarketId(string marketId) external
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name     | Type   | Description   |
| -------- | ------ | ------------- |
| marketId | string | The market id |

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address implementationAddress, bytes encodedCallData) external
```

_General function to update the implementation of a proxy registered with
certain `id`. If there is no proxy registered, it will instantiate one and
set as implementation the `implementationAddress`
IMPORTANT Use this function carefully, only for ids that don't have an explicit
setter function, in order to avoid unexpected consequences_

| Name                  | Type    | Description                           |
| --------------------- | ------- | ------------------------------------- |
| id                    | bytes32 | The id                                |
| implementationAddress | address | The address of the new implementation |
| encodedCallData       | bytes   |                                       |

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

_Sets an address for an id replacing the address saved in the addresses map
IMPORTANT Use this function carefully, as it will do a hard replacement_

| Name       | Type    | Description        |
| ---------- | ------- | ------------------ |
| id         | bytes32 | The id             |
| newAddress | address | The address to set |

### getAddress

```solidity
function getAddress(bytes32 id) public view returns (address)
```

_Returns an address by id_

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | address | The address |

### getLendPool

```solidity
function getLendPool() external view returns (address)
```

_Returns the address of the LendPool proxy_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | The LendPool proxy address |

### setLendPoolImpl

```solidity
function setLendPoolImpl(address pool, bytes encodedCallData) external
```

_Updates the implementation of the LendPool, or creates the proxy
setting the new `pool` implementation on the first time calling it_

| Name            | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| pool            | address | The new LendPool implementation |
| encodedCallData | bytes   | calldata to execute             |

### getLendPoolConfigurator

```solidity
function getLendPoolConfigurator() external view returns (address)
```

_Returns the address of the LendPoolConfigurator proxy_

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| [0]  | address | The LendPoolConfigurator proxy address |

### setLendPoolConfiguratorImpl

```solidity
function setLendPoolConfiguratorImpl(address configurator, bytes encodedCallData) external
```

_Updates the implementation of the LendPoolConfigurator, or creates the proxy
setting the new `configurator` implementation on the first time calling it_

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| configurator    | address | The new LendPoolConfigurator implementation |
| encodedCallData | bytes   | calldata to execute                         |

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

_returns the address of the LendPool admin_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the LendPoolAdmin address |

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

_sets the address of the LendPool admin_

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| admin | address | the LendPoolAdmin address |

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

_returns the address of the emergency admin_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the EmergencyAdmin address |

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address emergencyAdmin) external
```

_sets the address of the emergency admin_

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| emergencyAdmin | address | the EmergencyAdmin address |

### getReserveOracle

```solidity
function getReserveOracle() external view returns (address)
```

_returns the address of the reserve oracle_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the ReserveOracle address |

### setReserveOracle

```solidity
function setReserveOracle(address reserveOracle) external
```

_sets the address of the reserve oracle_

| Name          | Type    | Description               |
| ------------- | ------- | ------------------------- |
| reserveOracle | address | the ReserveOracle address |

### getNFTOracle

```solidity
function getNFTOracle() external view returns (address)
```

_returns the address of the NFT oracle_

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | address | the NFTOracle address |

### setNFTOracle

```solidity
function setNFTOracle(address nftOracle) external
```

_sets the address of the NFT oracle_

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| nftOracle | address | the NFTOracle address |

### getLendPoolLoan

```solidity
function getLendPoolLoan() external view returns (address)
```

_returns the address of the lendpool loan_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the LendPoolLoan address |

### setLendPoolLoanImpl

```solidity
function setLendPoolLoanImpl(address loanAddress, bytes encodedCallData) external
```

_sets the address of the lendpool loan_

| Name            | Type    | Description              |
| --------------- | ------- | ------------------------ |
| loanAddress     | address | the LendPoolLoan address |
| encodedCallData | bytes   | calldata to execute      |

### getUNFTRegistry

```solidity
function getUNFTRegistry() external view returns (address)
```

_returns the address of the UNFT Registry_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the UNFTRegistry address |

### setUNFTRegistry

```solidity
function setUNFTRegistry(address factory) external
```

_sets the address of the UNFT registry_

| Name    | Type    | Description              |
| ------- | ------- | ------------------------ |
| factory | address | the UNFTRegistry address |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (address)
```

_returns the address of the incentives controller_

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | address | the IncentivesController address |

### setIncentivesController

```solidity
function setIncentivesController(address controller) external
```

_sets the address of the incentives controller_

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| controller | address | the IncentivesController address |

### getUIDataProvider

```solidity
function getUIDataProvider() external view returns (address)
```

_returns the address of the UI data provider_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the UIDataProvider address |

### setUIDataProvider

```solidity
function setUIDataProvider(address provider) external
```

_sets the address of the UI data provider_

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| provider | address | the UIDataProvider address |

### getUnlockdDataProvider

```solidity
function getUnlockdDataProvider() external view returns (address)
```

_returns the address of the Unlockd data provider_

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | address | the UnlockdDataProvider address |

### setUnlockdDataProvider

```solidity
function setUnlockdDataProvider(address provider) external
```

_sets the address of the Unlockd data provider_

| Name     | Type    | Description                     |
| -------- | ------- | ------------------------------- |
| provider | address | the UnlockdDataProvider address |

### getWalletBalanceProvider

```solidity
function getWalletBalanceProvider() external view returns (address)
```

_returns the address of the wallet balance provider_

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | address | the WalletBalanceProvider address |

### setWalletBalanceProvider

```solidity
function setWalletBalanceProvider(address provider) external
```

_sets the address of the wallet balance provider_

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| provider | address | the WalletBalanceProvider address |

### getNFTXVaultFactory

```solidity
function getNFTXVaultFactory() external view returns (address)
```

_returns the address of the NFTXVault Factory contract_

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address factory) external
```

_sets the address of the NFTXVault Factory contract_

| Name    | Type    | Description                   |
| ------- | ------- | ----------------------------- |
| factory | address | the NFTXVault Factory address |

### getSushiSwapRouter

```solidity
function getSushiSwapRouter() external view returns (address)
```

_returns the address of the SushiSwap router contract_

### getLendPoolLiquidator

```solidity
function getLendPoolLiquidator() external view returns (address)
```

_returns the address of the LendPool liquidator contract_

### setLendPoolLiquidator

```solidity
function setLendPoolLiquidator(address liquidator) external
```

_sets the address of the LendPool liquidator contract_

| Name       | Type    | Description                     |
| ---------- | ------- | ------------------------------- |
| liquidator | address | the LendPool liquidator address |

### setSushiSwapRouter

```solidity
function setSushiSwapRouter(address router) external
```

_sets the address of the SushiSwap router contract_

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| router | address | the SushiSwap router address |

### getImplementation

```solidity
function getImplementation(address proxyAddress) external view returns (address)
```

_Returns the implementation contract pointed by a proxy_

| Name         | Type    | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| proxyAddress | address | the proxy to request the implementation from |

### \_updateImpl

```solidity
function _updateImpl(bytes32 id, address newAddress) internal
```

\_Internal function to update the implementation of a specific proxied component of the protocol

- If there is no proxy registered in the given `id`, it creates the proxy setting `newAdress`
  as implementation and calls the initialize() function on the proxy
- If there is already a proxy registered, it just updates the implementation to `newAddress` and
  calls the encoded method function via upgradeToAndCall() in the proxy\_

| Name       | Type    | Description                           |
| ---------- | ------- | ------------------------------------- |
| id         | bytes32 | The id of the proxy to be updated     |
| newAddress | address | The address of the new implementation |

### \_setMarketId

```solidity
function _setMarketId(string marketId) internal
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name     | Type   | Description   |
| -------- | ------ | ------------- |
| marketId | string | The market id |

## LendPoolAddressesProviderRegistry

\_Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets

- Used for indexing purposes of Unlockd protocol's markets
- The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
  for example with `1` for the Unlockd main market and `2` for the next created\_

### \_addressesProviders

```solidity
mapping(address => uint256) _addressesProviders
```

### \_addressesProvidersList

```solidity
address[] _addressesProvidersList
```

### getAddressesProvidersList

```solidity
function getAddressesProvidersList() external view returns (address[])
```

_Returns the list of registered addresses provider_

| Name | Type      | Description                                                                |
| ---- | --------- | -------------------------------------------------------------------------- |
| [0]  | address[] | The list of addresses provider, potentially containing address(0) elements |

### registerAddressesProvider

```solidity
function registerAddressesProvider(address provider, uint256 id) external
```

_Registers an addresses provider_

| Name     | Type    | Description                                                                         |
| -------- | ------- | ----------------------------------------------------------------------------------- |
| provider | address | The address of the new LendPoolAddressesProvider                                    |
| id       | uint256 | The id for the new LendPoolAddressesProvider, referring to the market it belongs to |

### unregisterAddressesProvider

```solidity
function unregisterAddressesProvider(address provider) external
```

_Removes a LendPoolAddressesProvider from the list of registered addresses provider_

| Name     | Type    | Description                           |
| -------- | ------- | ------------------------------------- |
| provider | address | The LendPoolAddressesProvider address |

### getAddressesProviderIdByAddress

```solidity
function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256)
```

_Returns the id on a registered LendPoolAddressesProvider_

| Name | Type    | Description                                                    |
| ---- | ------- | -------------------------------------------------------------- |
| [0]  | uint256 | The id or 0 if the LendPoolAddressesProvider is not registered |

### \_addToAddressesProvidersList

```solidity
function _addToAddressesProvidersList(address provider) internal
```

_Adds provider to addresses provider list_

| Name     | Type    | Description                      |
| -------- | ------- | -------------------------------- |
| provider | address | The provider address to be added |

## LendPoolConfigurator

_Implements the configuration methods for the Unlockd protocol_

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### onlyPoolAdmin

```solidity
modifier onlyPoolAdmin()
```

### onlyEmergencyAdmin

```solidity
modifier onlyEmergencyAdmin()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) public
```

_Function is invoked by the proxy contract when the LendPoolConfigurator contract is added to the
LendPoolAddressesProvider of the market._

| Name     | Type                                | Description                                  |
| -------- | ----------------------------------- | -------------------------------------------- |
| provider | contract ILendPoolAddressesProvider | The address of the LendPoolAddressesProvider |

### batchInitReserve

```solidity
function batchInitReserve(struct ConfigTypes.InitReserveInput[] input) external
```

_Initializes reserves in batch_

| Name  | Type                                  | Description                                          |
| ----- | ------------------------------------- | ---------------------------------------------------- |
| input | struct ConfigTypes.InitReserveInput[] | the input array with data to initialize each reserve |

### batchInitNft

```solidity
function batchInitNft(struct ConfigTypes.InitNftInput[] input) external
```

_Initializes NFTs in batch_

| Name  | Type                              | Description                                      |
| ----- | --------------------------------- | ------------------------------------------------ |
| input | struct ConfigTypes.InitNftInput[] | the input array with data to initialize each NFT |

### updateUToken

```solidity
function updateUToken(struct ConfigTypes.UpdateUTokenInput[] inputs) external
```

_Updates the uToken implementation for the reserve_

| Name   | Type                                   | Description                                      |
| ------ | -------------------------------------- | ------------------------------------------------ |
| inputs | struct ConfigTypes.UpdateUTokenInput[] | the inputs array with data to update each UToken |

### updateDebtToken

```solidity
function updateDebtToken(struct ConfigTypes.UpdateDebtTokenInput[] inputs) external
```

_Updates the debt token implementation for the asset_

| Name   | Type                                      | Description                                          |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| inputs | struct ConfigTypes.UpdateDebtTokenInput[] | the inputs array with data to update each debt token |

### setBorrowingFlagOnReserve

```solidity
function setBorrowingFlagOnReserve(address[] assets, bool flag) external
```

_Enables or disables borrowing on each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setActiveFlagOnReserve

```solidity
function setActiveFlagOnReserve(address[] assets, bool flag) external
```

_Activates or deactivates each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setFreezeFlagOnReserve

```solidity
function setFreezeFlagOnReserve(address[] assets, bool flag) external
```

_Freezes or unfreezes each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setReserveFactor

```solidity
function setReserveFactor(address[] assets, uint256 reserveFactor) external
```

_Updates the reserve factor of a reserve_

| Name          | Type      | Description                                        |
| ------------- | --------- | -------------------------------------------------- |
| assets        | address[] | The address of the underlying asset of the reserve |
| reserveFactor | uint256   | The new reserve factor of the reserve              |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address[] assets, address rateAddress) external
```

_Sets the interest rate strategy of a reserve_

| Name        | Type      | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| assets      | address[] | The addresses of the underlying asset of the reserve |
| rateAddress | address   | The new address of the interest strategy contract    |

### batchConfigReserve

```solidity
function batchConfigReserve(struct ILendPoolConfigurator.ConfigReserveInput[] inputs) external
```

_Configures reserves in batch_

| Name   | Type                                              | Description                                         |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| inputs | struct ILendPoolConfigurator.ConfigReserveInput[] | the input array with data to configure each reserve |

### setActiveFlagOnNft

```solidity
function setActiveFlagOnNft(address[] assets, bool flag) external
```

_Activates or deactivates each NFT_

| Name   | Type      | Description                     |
| ------ | --------- | ------------------------------- |
| assets | address[] | the NFTs to update the flag to  |
| flag   | bool      | the flag to set to the each NFT |

### setFreezeFlagOnNft

```solidity
function setFreezeFlagOnNft(address[] assets, bool flag) external
```

_Freezes or unfreezes each NFT_

| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
| assets | address[] | the assets to update the flag to |
| flag   | bool      | the flag to set to the each NFT  |

### configureNftAsCollateral

```solidity
function configureNftAsCollateral(address[] assets, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus) external
```

_Configures the NFT collateralization parameters
all the values are expressed in percentages with two decimals of precision. A valid value is 10000, which means 100.00%_

| Name                 | Type      | Description                                                                                                                                        |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| assets               | address[] | The address of the underlying asset of the reserve                                                                                                 |
| ltv                  | uint256   | The loan to value of the asset when used as NFT                                                                                                    |
| liquidationThreshold | uint256   | The threshold at which loans using this asset as collateral will be considered undercollateralized                                                 |
| liquidationBonus     | uint256   | The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus |

### configureNftAsAuction

```solidity
function configureNftAsAuction(address[] assets, uint256 redeemDuration, uint256 auctionDuration, uint256 redeemFine) external
```

_Configures the NFT auction parameters_

| Name            | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| assets          | address[] | The address of the underlying NFT asset |
| redeemDuration  | uint256   | The max duration for the redeem         |
| auctionDuration | uint256   | The auction duration                    |
| redeemFine      | uint256   | The fine for the redeem                 |

### setNftRedeemThreshold

```solidity
function setNftRedeemThreshold(address[] assets, uint256 redeemThreshold) external
```

_Configures the redeem threshold_

| Name            | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| assets          | address[] | The address of the underlying NFT asset |
| redeemThreshold | uint256   | The threshold for the redeem            |

### setNftMinBidFine

```solidity
function setNftMinBidFine(address[] assets, uint256 minBidFine) external
```

_Configures the minimum fine for the underlying assets_

| Name       | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| assets     | address[] | The address of the underlying NFT asset |
| minBidFine | uint256   | The minimum bid fine value              |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address[] assets, uint256 maxSupply, uint256 maxTokenId) external
```

_Configures the maximum supply and token Id for the underlying NFT assets_

| Name       | Type      | Description                              |
| ---------- | --------- | ---------------------------------------- |
| assets     | address[] | The address of the underlying NFT assets |
| maxSupply  | uint256   | The max supply value                     |
| maxTokenId | uint256   | The max token Id value                   |

### batchConfigNft

```solidity
function batchConfigNft(struct ILendPoolConfigurator.ConfigNftInput[] inputs) external
```

_Configures NFTs in batch_

| Name   | Type                                          | Description                                           |
| ------ | --------------------------------------------- | ----------------------------------------------------- |
| inputs | struct ILendPoolConfigurator.ConfigNftInput[] | the input array with data to configure each NFT asset |

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 newVal) external
```

_sets the max amount of reserves_

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| newVal | uint256 | the new value to set as the max reserves |

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 newVal) external
```

_sets the max amount of NFTs_

| Name   | Type    | Description                          |
| ------ | ------- | ------------------------------------ |
| newVal | uint256 | the new value to set as the max NFTs |

### setLiquidationFeePercentage

```solidity
function setLiquidationFeePercentage(uint256 newVal) external
```

_sets the liquidation fee percentage_

| Name   | Type    | Description                                    |
| ------ | ------- | ---------------------------------------------- |
| newVal | uint256 | the new value to set as the max fee percentage |

### setPoolPause

```solidity
function setPoolPause(bool val) external
```

_pauses or unpauses all the actions of the protocol, including uToken transfers_

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| val  | bool | true if protocol needs to be paused, false otherwise |

### getTokenImplementation

```solidity
function getTokenImplementation(address proxyAddress) external view returns (address)
```

_Returns the token implementation contract address_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| proxyAddress | address | The address of the proxy contract |

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| [0]  | address | The address of the token implementation contract |

### \_checkReserveNoLiquidity

```solidity
function _checkReserveNoLiquidity(address asset) internal view
```

_Checks the liquidity of reserves_

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| asset | address | The address of the underlying reserve asset |

### \_checkNftNoLiquidity

```solidity
function _checkNftNoLiquidity(address asset) internal view
```

_Checks the liquidity of NFTs_

| Name  | Type    | Description                             |
| ----- | ------- | --------------------------------------- |
| asset | address | The address of the underlying NFT asset |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

_Returns the LendPool address stored in the addresses provider_

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

_Returns the LendPoolLoan address stored in the addresses provider_

### \_getUNFTRegistry

```solidity
function _getUNFTRegistry() internal view returns (contract IUNFTRegistry)
```

_Returns the UNFTRegistry address stored in the addresses provider_

## LendPoolLoan

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### \_loanIdTracker

```solidity
struct CountersUpgradeable.Counter _loanIdTracker
```

### \_loans

```solidity
mapping(uint256 => struct DataTypes.LoanData) _loans
```

### \_nftToLoanIds

```solidity
mapping(address => mapping(uint256 => uint256)) _nftToLoanIds
```

### \_nftTotalCollateral

```solidity
mapping(address => uint256) _nftTotalCollateral
```

### \_userNftCollateral

```solidity
mapping(address => mapping(address => uint256)) _userNftCollateral
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

_Only lending pool can call functions marked by this modifier_

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) external
```

### initNft

```solidity
function initNft(address nftAsset, address uNftAddress) external
```

### createLoan

```solidity
function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)
```

_Create store a loan object with some params_

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| initiator    | address | The address of the user initiating the borrow |
| onBehalfOf   | address | The address receiving the loan                |
| nftAsset     | address | The address of the underlying NFT asset       |
| nftTokenId   | uint256 | The token Id of the underlying NFT asset      |
| uNftAddress  | address | The address of the uNFT token                 |
| reserveAsset | address | The address of the underlying reserve asset   |
| amount       | uint256 | The loan amount                               |
| borrowIndex  | uint256 | The index to get the scaled loan amount       |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

\_Update the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Active\_

| Name        | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| initiator   | address | The address of the user updating the loan |
| loanId      | uint256 | The loan ID                               |
| amountAdded | uint256 | The amount added to the loan              |
| amountTaken | uint256 | The amount taken from the loan            |
| borrowIndex | uint256 | The index to get the scaled loan amount   |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

\_Repay the given loan

Requirements:

- The caller must be a holder of the loan
- The caller must send in principal + interest
- The loan must be in state Active\_

| Name        | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| initiator   | address | The address of the user initiating the repay |
| loanId      | uint256 | The loan getting burned                      |
| uNftAddress | address | The address of uNFT                          |
| amount      | uint256 | The amount repaid                            |
| borrowIndex | uint256 | The index to get the scaled loan amount      |

### auctionLoan

```solidity
function auctionLoan(uint256 loanId, address uNftAddress, uint256 minBidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

\_Auction the given loan

Requirements:

- The loan must be in state Active\_

| Name         | Type    | Description                         |
| ------------ | ------- | ----------------------------------- |
| loanId       | uint256 | The loan getting auctioned          |
| uNftAddress  | address | The address of uNFT                 |
| minBidPrice  | uint256 | The start bid price of this auction |
| borrowAmount | uint256 |                                     |
| borrowIndex  | uint256 |                                     |

### redeemLoan

```solidity
function redeemLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amountTaken, uint256 borrowIndex) external
```

\_Redeem the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Auction\_

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| initiator   | address | The address of the user initiating the borrow |
| loanId      | uint256 | The loan getting redeemed                     |
| uNftAddress | address |                                               |
| amountTaken | uint256 | The taken amount                              |
| borrowIndex | uint256 | The index to get the scaled loan amount       |

### liquidateLoanNFTX

```solidity
function liquidateLoanNFTX(uint256 loanId, uint256 borrowAmount, uint256 borrowIndex) external returns (uint256 sellPrice)
```

\_Liquidate the given loan on NFTX

Requirements:

- The caller must send in principal + interest
- The loan must be in state Auction\_

| Name         | Type    | Description             |
| ------------ | ------- | ----------------------- |
| loanId       | uint256 | The loan getting burned |
| borrowAmount | uint256 |                         |
| borrowIndex  | uint256 |                         |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

\_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.\_

### borrowerOf

```solidity
function borrowerOf(uint256 loanId) external view returns (address)
```

@dev returns the borrower of a specific loan
param loanId the loan to get the borrower from

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

@dev returns the loan corresponding to a specific NFT
param nftAsset the underlying NFT asset
param tokenId the underlying token ID for the NFT

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

@dev returns the loan corresponding to a specific loan Id
param loanId the loan Id

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

@dev returns the collateral and reserve corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow amount corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow **scaled** amount corresponding to a specific loan
param loanId the loan Id

### getLoanMinBidPrice

```solidity
function getLoanMinBidPrice(uint256 loanId) external view returns (uint256)
```

@dev returns the minimum bid price for a loan
param loanId the loan Id

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT
param nftAsset the underlying NFT asset

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT and a specific user
param user the user
param nftAsset the underlying NFT asset

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

_returns the LendPool address_

### getLoanIdTracker

```solidity
function getLoanIdTracker() external view returns (struct CountersUpgradeable.Counter)
```

@dev returns the counter tracker for all the loan ID's in the protocol

## LendPoolStorage

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### \_reserves

```solidity
mapping(address => struct DataTypes.ReserveData) _reserves
```

### \_nfts

```solidity
mapping(address => struct DataTypes.NftData) _nfts
```

### \_reservesList

```solidity
mapping(uint256 => address) _reservesList
```

### \_reservesCount

```solidity
uint256 _reservesCount
```

### \_nftsList

```solidity
mapping(uint256 => address) _nftsList
```

### \_nftsCount

```solidity
uint256 _nftsCount
```

### \_paused

```solidity
bool _paused
```

### \_maxNumberOfReserves

```solidity
uint256 _maxNumberOfReserves
```

### \_maxNumberOfNfts

```solidity
uint256 _maxNumberOfNfts
```

### \_liquidateFeePercentage

```solidity
uint256 _liquidateFeePercentage
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### \_\_gap

```solidity
uint256[49] __gap
```

## NFTOracle

### CollectionAdded

```solidity
event CollectionAdded(address collection)
```

_Emitted when a collection is added to the oracle_

| Name       | Type    | Description          |
| ---------- | ------- | -------------------- |
| collection | address | The added collection |

### CollectionRemoved

```solidity
event CollectionRemoved(address collection)
```

_Emitted when a collection is removed from the oracle_

| Name       | Type    | Description            |
| ---------- | ------- | ---------------------- |
| collection | address | The removed collection |

### NFTPriceAdded

```solidity
event NFTPriceAdded(address _collection, uint256 _tokenId, uint256 _price)
```

_Emitted when a price is added for an NFT asset_

| Name         | Type    | Description        |
| ------------ | ------- | ------------------ |
| \_collection | address | The NFT collection |
| \_tokenId    | uint256 | The NFT token Id   |
| \_price      | uint256 |                    |

### FeedAdminUpdated

```solidity
event FeedAdminUpdated(address admin)
```

_Emitted when the admin has been updated_

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| admin | address | The new admin |

### NotAdmin

```solidity
error NotAdmin()
```

### NonExistingCollection

```solidity
error NonExistingCollection(address collection)
```

### AlreadyExistingCollection

```solidity
error AlreadyExistingCollection()
```

### NFTPaused

```solidity
error NFTPaused()
```

### ArraysLengthInconsistent

```solidity
error ArraysLengthInconsistent()
```

### PriceIsZero

```solidity
error PriceIsZero()
```

### nftPrices

```solidity
mapping(address => mapping(uint256 => uint256)) nftPrices
```

### collections

```solidity
mapping(address => bool) collections
```

### collectionTokenIds

```solidity
mapping(address => uint256[]) collectionTokenIds
```

### priceFeedAdmin

```solidity
address priceFeedAdmin
```

### collectionPaused

```solidity
mapping(address => bool) collectionPaused
```

### nftxVaultFactory

```solidity
address nftxVaultFactory
```

### sushiswapRouter

```solidity
address sushiswapRouter
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyExistingCollection

```solidity
modifier onlyExistingCollection(address _collection)
```

### onlyExistingCollections

```solidity
modifier onlyExistingCollections(address[] _collections)
```

### onlyNonExistingCollection

```solidity
modifier onlyNonExistingCollection(address _collection)
```

### whenNotPaused

```solidity
modifier whenNotPaused(address _nftContract)
```

### initialize

```solidity
function initialize(address _admin, address _nftxVaultFactory, address _sushiswapRouter) public
```

_Function is invoked by the proxy contract when the NFTOracle contract is added to the
LendPoolAddressesProvider of the market._

| Name               | Type    | Description       |
| ------------------ | ------- | ----------------- |
| \_admin            | address | The admin address |
| \_nftxVaultFactory | address |                   |
| \_sushiswapRouter  | address |                   |

### \_whenNotPaused

```solidity
function _whenNotPaused(address _contract) internal view
```

_checks whether the NFT oracle is paused_

| Name       | Type    | Description           |
| ---------- | ------- | --------------------- |
| \_contract | address | The NFTOracle address |

### setPriceFeedAdmin

```solidity
function setPriceFeedAdmin(address _admin) external
```

_sets the price feed admin of the oracle
@param \_admin the address to become the admin_

### setCollections

```solidity
function setCollections(address[] _collections) external
```

_adds multiple collections to the oracle
@param \_collections the array NFT collections to add_

### addCollection

```solidity
function addCollection(address _collection) external
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### \_addCollection

```solidity
function _addCollection(address _collection) internal
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### removeCollection

```solidity
function removeCollection(address _collection) external
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### \_removeCollection

```solidity
function _removeCollection(address _collection) internal
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

_sets the price for a given NFT
@param \_collections the array of NFT collections
@param \_tokenIds the array of NFT token Ids
@param \_prices the array of prices to set to the given tokens_

### \_setNFTPrice

```solidity
function _setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) internal
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

_returns the NFT price for a given array of NFTs
@param \_collections the array of NFT collections
@param \_tokenIds the array NFT token Id_

### setPause

```solidity
function setPause(address _collection, bool paused) external
```

_sets the pause status of the NFT oracle
@param \_nftContract the of NFT collection
@param val the value to set the pausing status (true for paused, false for unpaused)_

### getNFTPriceNFTX

```solidity
function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT valued by NFTX
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

## PunkGateway

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### \_wethGateway

```solidity
contract IWETHGateway _wethGateway
```

### punks

```solidity
contract IPunks punks
```

### wrappedPunks

```solidity
contract IWrappedPunks wrappedPunks
```

### proxy

```solidity
address proxy
```

### \_callerWhitelists

```solidity
mapping(address => bool) _callerWhitelists
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### initialize

```solidity
function initialize(address addressProvider, address wethGateway, address _punks, address _wrappedPunks) public
```

_Function is invoked by the proxy contract when the PunkGateway contract is added to the
LendPoolAddressesProvider of the market._

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

Returns the LendPool address

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

Returns the LendPoolLoan address

### authorizeLendPoolERC20

```solidity
function authorizeLendPoolERC20(address[] tokens) external
```

Approves the lendpool for given tokens

| Name   | Type      | Description         |
| ------ | --------- | ------------------- |
| tokens | address[] | the array of tokens |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

Authorizes/unauthorizes an array of callers to the whitelist

| Name    | Type      | Description          |
| ------- | --------- | -------------------- |
| callers | address[] | the array of callers |
| flag    | bool      |                      |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

Checks if caller is whitelisted

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| caller | address | caller address |

### \_checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

Checks the onBehalfOf address is valid for a given callet

| Name       | Type    | Description         |
| ---------- | ------- | ------------------- |
| onBehalfOf | address | the allowed address |

### \_depositPunk

```solidity
function _depositPunk(uint256 punkIndex) internal
```

Deposits a punk given its index

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                            |
| --------- | ------- | -------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserveAsset | address | The address of the underlying asset to borrow                                                                                                                                                                                                              |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk used as collateral                                                                                                                                                                                                             |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### \_withdrawPunk

```solidity
function _withdrawPunk(uint256 punkIndex, address onBehalfOf) internal
```

### repay

```solidity
function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay                            |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### \_repay

```solidity
function _repay(uint256 punkIndex, uint256 amount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay                            |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### auction

```solidity
function auction(uint256 punkIndex) external
```

Start an auction on a specific punk

| Name      | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to set in auction |

### redeem

```solidity
function redeem(uint256 punkIndex, uint256 amount) external returns (uint256)
```

Redeem loan for a specific punk in auction

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to redeem |
| amount    | uint256 | amount to pay for the redeem          |

### liquidateNFTX

```solidity
function liquidateNFTX(uint256 punkIndex) external returns (uint256)
```

Liquidate punk in NFTX

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to liquidate |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk to deposit                                                                                                                                                                                                                     |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH

- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay                  |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### \_repayETH

```solidity
function _repayETH(uint256 punkIndex, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH

- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay                  |
| accAmount | uint256 | The accumulated amount               |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay the debt         |

### \_safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| to    | address | recipient of the transfer |
| value | uint256 | the amount to send        |

### receive

```solidity
receive() external payable
```

@dev

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

## ReserveOracle

### TOKEN_DIGIT

```solidity
uint256 TOKEN_DIGIT
```

### AggregatorAdded

```solidity
event AggregatorAdded(address currencyKey, address aggregator)
```

### AggregatorRemoved

```solidity
event AggregatorRemoved(address currencyKey, address aggregator)
```

### priceFeedMap

```solidity
mapping(address => contract AggregatorV3Interface) priceFeedMap
```

### priceFeedKeys

```solidity
address[] priceFeedKeys
```

### weth

```solidity
address weth
```

### initialize

```solidity
function initialize(address _weth) public
```

### setAggregators

```solidity
function setAggregators(address[] _priceFeedKeys, address[] _aggregators) external
```

sets the aggregators and pricefeedkeys

| Name            | Type      | Description                 |
| --------------- | --------- | --------------------------- |
| \_priceFeedKeys | address[] | the array of pricefeed keys |
| \_aggregators   | address[] | the array of aggregators    |

### addAggregator

```solidity
function addAggregator(address _priceFeedKey, address _aggregator) external
```

adds a single aggregator

| Name           | Type    | Description           |
| -------------- | ------- | --------------------- |
| \_priceFeedKey | address | the pricefeed key     |
| \_aggregator   | address | the aggregator to add |

### \_addAggregator

```solidity
function _addAggregator(address _priceFeedKey, address _aggregator) internal
```

adds a single aggregator

| Name           | Type    | Description           |
| -------------- | ------- | --------------------- |
| \_priceFeedKey | address | the pricefeed key     |
| \_aggregator   | address | the aggregator to add |

### removeAggregator

```solidity
function removeAggregator(address _priceFeedKey) external
```

removes a single aggregator

| Name           | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to remove |

### getAggregator

```solidity
function getAggregator(address _priceFeedKey) public view returns (contract AggregatorV3Interface)
```

returns an aggregator gicen a pricefeed key

| Name           | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to fetch |

### getAssetPrice

```solidity
function getAssetPrice(address _priceFeedKey) external view returns (uint256)
```

### getLatestTimestamp

```solidity
function getLatestTimestamp(address _priceFeedKey) public view returns (uint256)
```

returns the aggregator's latest timestamp

| Name           | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to fetch |

### getTwapPrice

```solidity
function getTwapPrice(address _priceFeedKey, uint256 _interval) external view returns (uint256)
```

### isExistedKey

```solidity
function isExistedKey(address _priceFeedKey) private view returns (bool)
```

checks if a pricefeed key exists

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_priceFeedKey | address | the pricefeed key to check |

### requireNonEmptyAddress

```solidity
function requireNonEmptyAddress(address _addr) internal pure
```

checks if an address is 0

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| \_addr | address | the address to check |

### formatDecimals

```solidity
function formatDecimals(uint256 _price, uint8 _decimals) internal pure returns (uint256)
```

formats a price to the given decimals

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| \_price    | uint256 | the price to format                 |
| \_decimals | uint8   | the decimals to format the price to |

### getPriceFeedLength

```solidity
function getPriceFeedLength() public view returns (uint256 length)
```

returns the price feed length

## UToken

_Implementation of the interest bearing token for the Unlockd protocol_

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### \_treasury

```solidity
address _treasury
```

### \_underlyingAsset

```solidity
address _underlyingAsset
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address treasury, address underlyingAsset, uint8 uTokenDecimals, string uTokenName, string uTokenSymbol) external
```

_Initializes the uToken_

| Name            | Type                                | Description                                                            |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the address provider where this uToken will be used     |
| treasury        | address                             | The address of the Unlockd treasury, receiving the fees on this uToken |
| underlyingAsset | address                             | The address of the underlying asset of this uToken                     |
| uTokenDecimals  | uint8                               |                                                                        |
| uTokenName      | string                              |                                                                        |
| uTokenSymbol    | string                              |                                                                        |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

\_Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`

- Only callable by the LendPool, as extra state updates there need to be managed\_

| Name                 | Type    | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| user                 | address | The owner of the uTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying  |
| amount               | uint256 | The amount being burned                       |
| index                | uint256 | The new liquidity index of the reserve        |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

\_Mints `amount` uTokens to `user`

- Only callable by the LendPool, as extra state updates there need to be managed\_

| Name   | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| user   | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted     |
| index  | uint256 | The new liquidity index of the reserve  |

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| [0]  | bool | `true` if the the previous balance of the user was 0 |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

\_Mints uTokens to the reserve treasury

- Only callable by the LendPool\_

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| amount | uint256 | The amount of tokens getting minted    |
| index  | uint256 | The new liquidity index of the reserve |

### balanceOf

```solidity
function balanceOf(address user) public view returns (uint256)
```

_Calculates the balance of the user: principal balance + interest generated by the principal_

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| user | address | The user whose balance is calculated |

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | The balance of the user |

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| user | address | The user whose balance is calculated |

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| [0]  | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The scaled balance of the user                 |
| [1]  | uint256 | The scaled balance and the scaled total supply |

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_calculates the total supply of the specific uToken
since the balance of every single user increases over time, the total supply
does that too._

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | uint256 | the current total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() public view virtual returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | the scaled total supply |

### RESERVE_TREASURY_ADDRESS

```solidity
function RESERVE_TREASURY_ADDRESS() public view returns (address)
```

_Returns the address of the Unlockd treasury, receiving the fees on this uToken_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() public view returns (address)
```

_Returns the address of the underlying asset of this uToken_

### POOL

```solidity
function POOL() public view returns (contract ILendPool)
```

_Returns the address of the lending pool where this uToken is used_

### \_getIncentivesController

```solidity
function _getIncentivesController() internal view returns (contract IIncentivesController)
```

_For internal usage in the logic of the parent contract IncentivizedERC20_

### \_getUnderlyingAssetAddress

```solidity
function _getUnderlyingAssetAddress() internal view returns (address)
```

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address target, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendPool to transfer
assets in borrow(), withdraw() and flashLoan()_

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| target | address | The recipient of the uTokens   |
| amount | uint256 | The amount getting transferred |

| Name | Type    | Description            |
| ---- | ------- | ---------------------- |
| [0]  | uint256 | The amount transferred |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### \_getLendPoolConfigurator

```solidity
function _getLendPoolConfigurator() internal view returns (contract ILendPoolConfigurator)
```

### \_transfer

```solidity
function _transfer(address from, address to, uint256 amount, bool validate) internal
```

_Transfers the uTokens between two users. Validates the transfer
(ie checks for valid HF after the transfer) if required_

| Name     | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| from     | address | The source address                           |
| to       | address | The destination address                      |
| amount   | uint256 | The amount getting transferred               |
| validate | bool    | `true` if the transfer needs to be validated |

### \_transfer

```solidity
function _transfer(address from, address to, uint256 amount) internal
```

_Overrides the parent \_transfer to force validated transfer() and transferFrom()_

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| from   | address | The source address             |
| to     | address | The destination address        |
| amount | uint256 | The amount getting transferred |

## WETHGateway

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### WETH

```solidity
contract IWETH WETH
```

### \_callerWhitelists

```solidity
mapping(address => bool) _callerWhitelists
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### initialize

```solidity
function initialize(address addressProvider, address weth) public
```

_Sets the WETH address and the LendPoolAddressesProvider address. Infinite approves lend pool._

| Name            | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| addressProvider | address |                                       |
| weth            | address | Address of the Wrapped Ether contract |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

returns the LendPool address

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

returns the LendPoolLoan address

### authorizeLendPoolNFT

```solidity
function authorizeLendPoolNFT(address[] nftAssets) external
```

_approves the lendpool for the given NFT assets_

| Name      | Type      | Description             |
| --------- | --------- | ----------------------- |
| nftAssets | address[] | the array of nft assets |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

_authorizes/unauthorizes a list of callers for the whitelist_

| Name    | Type      | Description                           |
| ------- | --------- | ------------------------------------- |
| callers | address[] | the array of callers to be authorized |
| flag    | bool      | the flag to authorize/unauthorize     |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

_checks if caller is whitelisted_

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| caller | address | the caller to check |

### \_checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

_checks if caller's approved address is valid_

| Name       | Type    | Description                                 |
| ---------- | ------- | ------------------------------------------- |
| onBehalfOf | address | the address to check approval of the caller |

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (uTokens)
is minted._

| Name         | Type    | Description                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------------- |
| onBehalfOf   | address | address of the user who will receive the uTokens representing the deposit     |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH \_reserves of msg.sender._

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| amount | uint256 | amount of uWETH to withdraw and receive native ETH |
| to     | address | address of the user who will receive native ETH    |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | the amount of ETH to borrow                                                                                                                                                                                                                                |
| nftAsset     | address | The address of the underlying NFT used as collateral                                                                                                                                                                                                       |
| nftTokenId   | uint256 | The token ID of the underlying NFT used as collateral                                                                                                                                                                                                      |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards                                                                                                                                                                               |

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name       | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral                      |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral                     |
| amount     | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### \_repayETH

```solidity
function _repayETH(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name       | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral                      |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral                     |
| amount     | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |
| accAmount  | uint256 | the accumulated amount                                                    |

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId) external
```

_auction a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### redeemETH

```solidity
function redeemETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256)
```

_redeems a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay the debt                          |

### liquidateNFTX

```solidity
function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256)
```

_liquidates a borrow on the WETH reserve on NFTX_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### \_safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| to    | address | recipient of the transfer |
| value | uint256 | the amount to send        |

### getWETHAddress

```solidity
function getWETHAddress() external view returns (address)
```

_Get WETH address used by WETHGateway_

### receive

```solidity
receive() external payable
```

_Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract._

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

## SelfdestructTransfer

### destroyAndTransfer

```solidity
function destroyAndTransfer(address payable to) external payable
```

## LendPoolAddressesProvider

\_Main registry of addresses part of or connected to the protocol, including permissioned roles

- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Unlockd Governance\_

### \_marketId

```solidity
string _marketId
```

### \_addresses

```solidity
mapping(bytes32 => address) _addresses
```

### LEND_POOL

```solidity
bytes32 LEND_POOL
```

### LEND_POOL_CONFIGURATOR

```solidity
bytes32 LEND_POOL_CONFIGURATOR
```

### POOL_ADMIN

```solidity
bytes32 POOL_ADMIN
```

### EMERGENCY_ADMIN

```solidity
bytes32 EMERGENCY_ADMIN
```

### RESERVE_ORACLE

```solidity
bytes32 RESERVE_ORACLE
```

### NFT_ORACLE

```solidity
bytes32 NFT_ORACLE
```

### UNLOCKD_ORACLE

```solidity
bytes32 UNLOCKD_ORACLE
```

### LEND_POOL_LOAN

```solidity
bytes32 LEND_POOL_LOAN
```

### UNFT_REGISTRY

```solidity
bytes32 UNFT_REGISTRY
```

### LEND_POOL_LIQUIDATOR

```solidity
bytes32 LEND_POOL_LIQUIDATOR
```

### INCENTIVES_CONTROLLER

```solidity
bytes32 INCENTIVES_CONTROLLER
```

### UNLOCKD_DATA_PROVIDER

```solidity
bytes32 UNLOCKD_DATA_PROVIDER
```

### UI_DATA_PROVIDER

```solidity
bytes32 UI_DATA_PROVIDER
```

### WALLET_BALANCE_PROVIDER

```solidity
bytes32 WALLET_BALANCE_PROVIDER
```

### NFTX_VAULT_FACTORY

```solidity
bytes32 NFTX_VAULT_FACTORY
```

### SUSHI_SWAP_ROUTER

```solidity
bytes32 SUSHI_SWAP_ROUTER
```

### constructor

```solidity
constructor(string marketId) public
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

_Returns the id of the Unlockd market to which this contracts points to_

| Name | Type   | Description   |
| ---- | ------ | ------------- |
| [0]  | string | The market id |

### setMarketId

```solidity
function setMarketId(string marketId) external
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name     | Type   | Description   |
| -------- | ------ | ------------- |
| marketId | string | The market id |

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address implementationAddress, bytes encodedCallData) external
```

_General function to update the implementation of a proxy registered with
certain `id`. If there is no proxy registered, it will instantiate one and
set as implementation the `implementationAddress`
IMPORTANT Use this function carefully, only for ids that don't have an explicit
setter function, in order to avoid unexpected consequences_

| Name                  | Type    | Description                           |
| --------------------- | ------- | ------------------------------------- |
| id                    | bytes32 | The id                                |
| implementationAddress | address | The address of the new implementation |
| encodedCallData       | bytes   |                                       |

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

_Sets an address for an id replacing the address saved in the addresses map
IMPORTANT Use this function carefully, as it will do a hard replacement_

| Name       | Type    | Description        |
| ---------- | ------- | ------------------ |
| id         | bytes32 | The id             |
| newAddress | address | The address to set |

### getAddress

```solidity
function getAddress(bytes32 id) public view returns (address)
```

_Returns an address by id_

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | address | The address |

### getLendPool

```solidity
function getLendPool() external view returns (address)
```

_Returns the address of the LendPool proxy_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | The LendPool proxy address |

### setLendPoolImpl

```solidity
function setLendPoolImpl(address pool, bytes encodedCallData) external
```

_Updates the implementation of the LendPool, or creates the proxy
setting the new `pool` implementation on the first time calling it_

| Name            | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| pool            | address | The new LendPool implementation |
| encodedCallData | bytes   | calldata to execute             |

### getLendPoolConfigurator

```solidity
function getLendPoolConfigurator() external view returns (address)
```

_Returns the address of the LendPoolConfigurator proxy_

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| [0]  | address | The LendPoolConfigurator proxy address |

### setLendPoolConfiguratorImpl

```solidity
function setLendPoolConfiguratorImpl(address configurator, bytes encodedCallData) external
```

_Updates the implementation of the LendPoolConfigurator, or creates the proxy
setting the new `configurator` implementation on the first time calling it_

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| configurator    | address | The new LendPoolConfigurator implementation |
| encodedCallData | bytes   | calldata to execute                         |

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

_returns the address of the LendPool admin_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the LendPoolAdmin address |

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

_sets the address of the LendPool admin_

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| admin | address | the LendPoolAdmin address |

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

_returns the address of the emergency admin_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the EmergencyAdmin address |

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address emergencyAdmin) external
```

_sets the address of the emergency admin_

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| emergencyAdmin | address | the EmergencyAdmin address |

### getReserveOracle

```solidity
function getReserveOracle() external view returns (address)
```

_returns the address of the reserve oracle_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the ReserveOracle address |

### setReserveOracle

```solidity
function setReserveOracle(address reserveOracle) external
```

_sets the address of the reserve oracle_

| Name          | Type    | Description               |
| ------------- | ------- | ------------------------- |
| reserveOracle | address | the ReserveOracle address |

### getNFTOracle

```solidity
function getNFTOracle() external view returns (address)
```

_returns the address of the NFT oracle_

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | address | the NFTOracle address |

### setNFTOracle

```solidity
function setNFTOracle(address nftOracle) external
```

_sets the address of the NFT oracle_

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| nftOracle | address | the NFTOracle address |

### getLendPoolLoan

```solidity
function getLendPoolLoan() external view returns (address)
```

_returns the address of the lendpool loan_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the LendPoolLoan address |

### setLendPoolLoanImpl

```solidity
function setLendPoolLoanImpl(address loanAddress, bytes encodedCallData) external
```

_sets the address of the lendpool loan_

| Name            | Type    | Description              |
| --------------- | ------- | ------------------------ |
| loanAddress     | address | the LendPoolLoan address |
| encodedCallData | bytes   | calldata to execute      |

### getUNFTRegistry

```solidity
function getUNFTRegistry() external view returns (address)
```

_returns the address of the UNFT Registry_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the UNFTRegistry address |

### setUNFTRegistry

```solidity
function setUNFTRegistry(address factory) external
```

_sets the address of the UNFT registry_

| Name    | Type    | Description              |
| ------- | ------- | ------------------------ |
| factory | address | the UNFTRegistry address |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (address)
```

_returns the address of the incentives controller_

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | address | the IncentivesController address |

### setIncentivesController

```solidity
function setIncentivesController(address controller) external
```

_sets the address of the incentives controller_

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| controller | address | the IncentivesController address |

### getUIDataProvider

```solidity
function getUIDataProvider() external view returns (address)
```

_returns the address of the UI data provider_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the UIDataProvider address |

### setUIDataProvider

```solidity
function setUIDataProvider(address provider) external
```

_sets the address of the UI data provider_

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| provider | address | the UIDataProvider address |

### getUnlockdDataProvider

```solidity
function getUnlockdDataProvider() external view returns (address)
```

_returns the address of the Unlockd data provider_

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | address | the UnlockdDataProvider address |

### setUnlockdDataProvider

```solidity
function setUnlockdDataProvider(address provider) external
```

_sets the address of the Unlockd data provider_

| Name     | Type    | Description                     |
| -------- | ------- | ------------------------------- |
| provider | address | the UnlockdDataProvider address |

### getWalletBalanceProvider

```solidity
function getWalletBalanceProvider() external view returns (address)
```

_returns the address of the wallet balance provider_

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | address | the WalletBalanceProvider address |

### setWalletBalanceProvider

```solidity
function setWalletBalanceProvider(address provider) external
```

_sets the address of the wallet balance provider_

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| provider | address | the WalletBalanceProvider address |

### getNFTXVaultFactory

```solidity
function getNFTXVaultFactory() external view returns (address)
```

_returns the address of the NFTXVault Factory contract_

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address factory) external
```

_sets the address of the NFTXVault Factory contract_

| Name    | Type    | Description                   |
| ------- | ------- | ----------------------------- |
| factory | address | the NFTXVault Factory address |

### getSushiSwapRouter

```solidity
function getSushiSwapRouter() external view returns (address)
```

_returns the address of the SushiSwap router contract_

### getLendPoolLiquidator

```solidity
function getLendPoolLiquidator() external view returns (address)
```

_returns the address of the LendPool liquidator contract_

### setLendPoolLiquidator

```solidity
function setLendPoolLiquidator(address liquidator) external
```

_sets the address of the LendPool liquidator contract_

| Name       | Type    | Description                     |
| ---------- | ------- | ------------------------------- |
| liquidator | address | the LendPool liquidator address |

### setSushiSwapRouter

```solidity
function setSushiSwapRouter(address router) external
```

_sets the address of the SushiSwap router contract_

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| router | address | the SushiSwap router address |

### getImplementation

```solidity
function getImplementation(address proxyAddress) external view returns (address)
```

_Returns the implementation contract pointed by a proxy_

| Name         | Type    | Description                                  |
| ------------ | ------- | -------------------------------------------- |
| proxyAddress | address | the proxy to request the implementation from |

### \_updateImpl

```solidity
function _updateImpl(bytes32 id, address newAddress) internal
```

\_Internal function to update the implementation of a specific proxied component of the protocol

- If there is no proxy registered in the given `id`, it creates the proxy setting `newAdress`
  as implementation and calls the initialize() function on the proxy
- If there is already a proxy registered, it just updates the implementation to `newAddress` and
  calls the encoded method function via upgradeToAndCall() in the proxy\_

| Name       | Type    | Description                           |
| ---------- | ------- | ------------------------------------- |
| id         | bytes32 | The id of the proxy to be updated     |
| newAddress | address | The address of the new implementation |

### \_setMarketId

```solidity
function _setMarketId(string marketId) internal
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name     | Type   | Description   |
| -------- | ------ | ------------- |
| marketId | string | The market id |

## LendPoolAddressesProviderRegistry

\_Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets

- Used for indexing purposes of Unlockd protocol's markets
- The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
  for example with `1` for the Unlockd main market and `2` for the next created\_

### \_addressesProviders

```solidity
mapping(address => uint256) _addressesProviders
```

### \_addressesProvidersList

```solidity
address[] _addressesProvidersList
```

### getAddressesProvidersList

```solidity
function getAddressesProvidersList() external view returns (address[])
```

_Returns the list of registered addresses provider_

| Name | Type      | Description                                                                |
| ---- | --------- | -------------------------------------------------------------------------- |
| [0]  | address[] | The list of addresses provider, potentially containing address(0) elements |

### registerAddressesProvider

```solidity
function registerAddressesProvider(address provider, uint256 id) external
```

_Registers an addresses provider_

| Name     | Type    | Description                                                                         |
| -------- | ------- | ----------------------------------------------------------------------------------- |
| provider | address | The address of the new LendPoolAddressesProvider                                    |
| id       | uint256 | The id for the new LendPoolAddressesProvider, referring to the market it belongs to |

### unregisterAddressesProvider

```solidity
function unregisterAddressesProvider(address provider) external
```

_Removes a LendPoolAddressesProvider from the list of registered addresses provider_

| Name     | Type    | Description                           |
| -------- | ------- | ------------------------------------- |
| provider | address | The LendPoolAddressesProvider address |

### getAddressesProviderIdByAddress

```solidity
function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256)
```

_Returns the id on a registered LendPoolAddressesProvider_

| Name | Type    | Description                                                    |
| ---- | ------- | -------------------------------------------------------------- |
| [0]  | uint256 | The id or 0 if the LendPoolAddressesProvider is not registered |

### \_addToAddressesProvidersList

```solidity
function _addToAddressesProvidersList(address provider) internal
```

_Adds provider to addresses provider list_

| Name     | Type    | Description                      |
| -------- | ------- | -------------------------------- |
| provider | address | The provider address to be added |

## LendPoolConfigurator

_Implements the configuration methods for the Unlockd protocol_

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### onlyPoolAdmin

```solidity
modifier onlyPoolAdmin()
```

### onlyEmergencyAdmin

```solidity
modifier onlyEmergencyAdmin()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) public
```

_Function is invoked by the proxy contract when the LendPoolConfigurator contract is added to the
LendPoolAddressesProvider of the market._

| Name     | Type                                | Description                                  |
| -------- | ----------------------------------- | -------------------------------------------- |
| provider | contract ILendPoolAddressesProvider | The address of the LendPoolAddressesProvider |

### batchInitReserve

```solidity
function batchInitReserve(struct ConfigTypes.InitReserveInput[] input) external
```

_Initializes reserves in batch_

| Name  | Type                                  | Description                                          |
| ----- | ------------------------------------- | ---------------------------------------------------- |
| input | struct ConfigTypes.InitReserveInput[] | the input array with data to initialize each reserve |

### batchInitNft

```solidity
function batchInitNft(struct ConfigTypes.InitNftInput[] input) external
```

_Initializes NFTs in batch_

| Name  | Type                              | Description                                      |
| ----- | --------------------------------- | ------------------------------------------------ |
| input | struct ConfigTypes.InitNftInput[] | the input array with data to initialize each NFT |

### updateUToken

```solidity
function updateUToken(struct ConfigTypes.UpdateUTokenInput[] inputs) external
```

_Updates the uToken implementation for the reserve_

| Name   | Type                                   | Description                                      |
| ------ | -------------------------------------- | ------------------------------------------------ |
| inputs | struct ConfigTypes.UpdateUTokenInput[] | the inputs array with data to update each UToken |

### updateDebtToken

```solidity
function updateDebtToken(struct ConfigTypes.UpdateDebtTokenInput[] inputs) external
```

_Updates the debt token implementation for the asset_

| Name   | Type                                      | Description                                          |
| ------ | ----------------------------------------- | ---------------------------------------------------- |
| inputs | struct ConfigTypes.UpdateDebtTokenInput[] | the inputs array with data to update each debt token |

### setBorrowingFlagOnReserve

```solidity
function setBorrowingFlagOnReserve(address[] assets, bool flag) external
```

_Enables or disables borrowing on each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setActiveFlagOnReserve

```solidity
function setActiveFlagOnReserve(address[] assets, bool flag) external
```

_Activates or deactivates each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setFreezeFlagOnReserve

```solidity
function setFreezeFlagOnReserve(address[] assets, bool flag) external
```

_Freezes or unfreezes each reserve_

| Name   | Type      | Description                         |
| ------ | --------- | ----------------------------------- |
| assets | address[] | the assets to update the flag to    |
| flag   | bool      | the flag to set to the each reserve |

### setReserveFactor

```solidity
function setReserveFactor(address[] assets, uint256 reserveFactor) external
```

_Updates the reserve factor of a reserve_

| Name          | Type      | Description                                        |
| ------------- | --------- | -------------------------------------------------- |
| assets        | address[] | The address of the underlying asset of the reserve |
| reserveFactor | uint256   | The new reserve factor of the reserve              |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address[] assets, address rateAddress) external
```

_Sets the interest rate strategy of a reserve_

| Name        | Type      | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| assets      | address[] | The addresses of the underlying asset of the reserve |
| rateAddress | address   | The new address of the interest strategy contract    |

### batchConfigReserve

```solidity
function batchConfigReserve(struct ILendPoolConfigurator.ConfigReserveInput[] inputs) external
```

_Configures reserves in batch_

| Name   | Type                                              | Description                                         |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| inputs | struct ILendPoolConfigurator.ConfigReserveInput[] | the input array with data to configure each reserve |

### setActiveFlagOnNft

```solidity
function setActiveFlagOnNft(address[] assets, bool flag) external
```

_Activates or deactivates each NFT_

| Name   | Type      | Description                     |
| ------ | --------- | ------------------------------- |
| assets | address[] | the NFTs to update the flag to  |
| flag   | bool      | the flag to set to the each NFT |

### setFreezeFlagOnNft

```solidity
function setFreezeFlagOnNft(address[] assets, bool flag) external
```

_Freezes or unfreezes each NFT_

| Name   | Type      | Description                      |
| ------ | --------- | -------------------------------- |
| assets | address[] | the assets to update the flag to |
| flag   | bool      | the flag to set to the each NFT  |

### configureNftAsCollateral

```solidity
function configureNftAsCollateral(address[] assets, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus) external
```

_Configures the NFT collateralization parameters
all the values are expressed in percentages with two decimals of precision. A valid value is 10000, which means 100.00%_

| Name                 | Type      | Description                                                                                                                                        |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| assets               | address[] | The address of the underlying asset of the reserve                                                                                                 |
| ltv                  | uint256   | The loan to value of the asset when used as NFT                                                                                                    |
| liquidationThreshold | uint256   | The threshold at which loans using this asset as collateral will be considered undercollateralized                                                 |
| liquidationBonus     | uint256   | The bonus liquidators receive to liquidate this asset. The values is always below 100%. A value of 5% means the liquidator will receive a 5% bonus |

### configureNftAsAuction

```solidity
function configureNftAsAuction(address[] assets, uint256 redeemDuration, uint256 auctionDuration, uint256 redeemFine) external
```

_Configures the NFT auction parameters_

| Name            | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| assets          | address[] | The address of the underlying NFT asset |
| redeemDuration  | uint256   | The max duration for the redeem         |
| auctionDuration | uint256   | The auction duration                    |
| redeemFine      | uint256   | The fine for the redeem                 |

### setNftRedeemThreshold

```solidity
function setNftRedeemThreshold(address[] assets, uint256 redeemThreshold) external
```

_Configures the redeem threshold_

| Name            | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| assets          | address[] | The address of the underlying NFT asset |
| redeemThreshold | uint256   | The threshold for the redeem            |

### setNftMinBidFine

```solidity
function setNftMinBidFine(address[] assets, uint256 minBidFine) external
```

_Configures the minimum fine for the underlying assets_

| Name       | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| assets     | address[] | The address of the underlying NFT asset |
| minBidFine | uint256   | The minimum bid fine value              |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address[] assets, uint256 maxSupply, uint256 maxTokenId) external
```

_Configures the maximum supply and token Id for the underlying NFT assets_

| Name       | Type      | Description                              |
| ---------- | --------- | ---------------------------------------- |
| assets     | address[] | The address of the underlying NFT assets |
| maxSupply  | uint256   | The max supply value                     |
| maxTokenId | uint256   | The max token Id value                   |

### batchConfigNft

```solidity
function batchConfigNft(struct ILendPoolConfigurator.ConfigNftInput[] inputs) external
```

_Configures NFTs in batch_

| Name   | Type                                          | Description                                           |
| ------ | --------------------------------------------- | ----------------------------------------------------- |
| inputs | struct ILendPoolConfigurator.ConfigNftInput[] | the input array with data to configure each NFT asset |

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 newVal) external
```

_sets the max amount of reserves_

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| newVal | uint256 | the new value to set as the max reserves |

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 newVal) external
```

_sets the max amount of NFTs_

| Name   | Type    | Description                          |
| ------ | ------- | ------------------------------------ |
| newVal | uint256 | the new value to set as the max NFTs |

### setLiquidationFeePercentage

```solidity
function setLiquidationFeePercentage(uint256 newVal) external
```

_sets the liquidation fee percentage_

| Name   | Type    | Description                                    |
| ------ | ------- | ---------------------------------------------- |
| newVal | uint256 | the new value to set as the max fee percentage |

### setPoolPause

```solidity
function setPoolPause(bool val) external
```

_pauses or unpauses all the actions of the protocol, including uToken transfers_

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| val  | bool | true if protocol needs to be paused, false otherwise |

### getTokenImplementation

```solidity
function getTokenImplementation(address proxyAddress) external view returns (address)
```

_Returns the token implementation contract address_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| proxyAddress | address | The address of the proxy contract |

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| [0]  | address | The address of the token implementation contract |

### \_checkReserveNoLiquidity

```solidity
function _checkReserveNoLiquidity(address asset) internal view
```

_Checks the liquidity of reserves_

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| asset | address | The address of the underlying reserve asset |

### \_checkNftNoLiquidity

```solidity
function _checkNftNoLiquidity(address asset) internal view
```

_Checks the liquidity of NFTs_

| Name  | Type    | Description                             |
| ----- | ------- | --------------------------------------- |
| asset | address | The address of the underlying NFT asset |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

_Returns the LendPool address stored in the addresses provider_

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

_Returns the LendPoolLoan address stored in the addresses provider_

### \_getUNFTRegistry

```solidity
function _getUNFTRegistry() internal view returns (contract IUNFTRegistry)
```

_Returns the UNFTRegistry address stored in the addresses provider_

## LendPoolLoan

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### \_loanIdTracker

```solidity
struct CountersUpgradeable.Counter _loanIdTracker
```

### \_loans

```solidity
mapping(uint256 => struct DataTypes.LoanData) _loans
```

### \_nftToLoanIds

```solidity
mapping(address => mapping(uint256 => uint256)) _nftToLoanIds
```

### \_nftTotalCollateral

```solidity
mapping(address => uint256) _nftTotalCollateral
```

### \_userNftCollateral

```solidity
mapping(address => mapping(address => uint256)) _userNftCollateral
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

_Only lending pool can call functions marked by this modifier_

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider provider) external
```

### initNft

```solidity
function initNft(address nftAsset, address uNftAddress) external
```

### createLoan

```solidity
function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)
```

_Create store a loan object with some params_

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| initiator    | address | The address of the user initiating the borrow |
| onBehalfOf   | address | The address receiving the loan                |
| nftAsset     | address | The address of the underlying NFT asset       |
| nftTokenId   | uint256 | The token Id of the underlying NFT asset      |
| uNftAddress  | address | The address of the uNFT token                 |
| reserveAsset | address | The address of the underlying reserve asset   |
| amount       | uint256 | The loan amount                               |
| borrowIndex  | uint256 | The index to get the scaled loan amount       |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

\_Update the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Active\_

| Name        | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| initiator   | address | The address of the user updating the loan |
| loanId      | uint256 | The loan ID                               |
| amountAdded | uint256 | The amount added to the loan              |
| amountTaken | uint256 | The amount taken from the loan            |
| borrowIndex | uint256 | The index to get the scaled loan amount   |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

\_Repay the given loan

Requirements:

- The caller must be a holder of the loan
- The caller must send in principal + interest
- The loan must be in state Active\_

| Name        | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| initiator   | address | The address of the user initiating the repay |
| loanId      | uint256 | The loan getting burned                      |
| uNftAddress | address | The address of uNFT                          |
| amount      | uint256 | The amount repaid                            |
| borrowIndex | uint256 | The index to get the scaled loan amount      |

### auctionLoan

```solidity
function auctionLoan(uint256 loanId, address uNftAddress, uint256 minBidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

\_Auction the given loan

Requirements:

- The loan must be in state Active\_

| Name         | Type    | Description                         |
| ------------ | ------- | ----------------------------------- |
| loanId       | uint256 | The loan getting auctioned          |
| uNftAddress  | address | The address of uNFT                 |
| minBidPrice  | uint256 | The start bid price of this auction |
| borrowAmount | uint256 |                                     |
| borrowIndex  | uint256 |                                     |

### redeemLoan

```solidity
function redeemLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amountTaken, uint256 borrowIndex) external
```

\_Redeem the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Auction\_

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| initiator   | address | The address of the user initiating the borrow |
| loanId      | uint256 | The loan getting redeemed                     |
| uNftAddress | address |                                               |
| amountTaken | uint256 | The taken amount                              |
| borrowIndex | uint256 | The index to get the scaled loan amount       |

### liquidateLoanNFTX

```solidity
function liquidateLoanNFTX(uint256 loanId, uint256 borrowAmount, uint256 borrowIndex) external returns (uint256 sellPrice)
```

\_Liquidate the given loan on NFTX

Requirements:

- The caller must send in principal + interest
- The loan must be in state Auction\_

| Name         | Type    | Description             |
| ------------ | ------- | ----------------------- |
| loanId       | uint256 | The loan getting burned |
| borrowAmount | uint256 |                         |
| borrowIndex  | uint256 |                         |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external pure returns (bytes4)
```

\_Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
by `operator` from `from`, this function is called.

It must return its Solidity selector to confirm the token transfer.
If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.

The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.\_

### borrowerOf

```solidity
function borrowerOf(uint256 loanId) external view returns (address)
```

@dev returns the borrower of a specific loan
param loanId the loan to get the borrower from

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

@dev returns the loan corresponding to a specific NFT
param nftAsset the underlying NFT asset
param tokenId the underlying token ID for the NFT

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

@dev returns the loan corresponding to a specific loan Id
param loanId the loan Id

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

@dev returns the collateral and reserve corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow amount corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow **scaled** amount corresponding to a specific loan
param loanId the loan Id

### getLoanMinBidPrice

```solidity
function getLoanMinBidPrice(uint256 loanId) external view returns (uint256)
```

@dev returns the minimum bid price for a loan
param loanId the loan Id

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT
param nftAsset the underlying NFT asset

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT and a specific user
param user the user
param nftAsset the underlying NFT asset

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

_returns the LendPool address_

### getLoanIdTracker

```solidity
function getLoanIdTracker() external view returns (struct CountersUpgradeable.Counter)
```

@dev returns the counter tracker for all the loan ID's in the protocol

## LendPoolStorage

### \_addressesProvider

```solidity
contract ILendPoolAddressesProvider _addressesProvider
```

### \_reserves

```solidity
mapping(address => struct DataTypes.ReserveData) _reserves
```

### \_nfts

```solidity
mapping(address => struct DataTypes.NftData) _nfts
```

### \_reservesList

```solidity
mapping(uint256 => address) _reservesList
```

### \_reservesCount

```solidity
uint256 _reservesCount
```

### \_nftsList

```solidity
mapping(uint256 => address) _nftsList
```

### \_nftsCount

```solidity
uint256 _nftsCount
```

### \_paused

```solidity
bool _paused
```

### \_maxNumberOfReserves

```solidity
uint256 _maxNumberOfReserves
```

### \_maxNumberOfNfts

```solidity
uint256 _maxNumberOfNfts
```

### \_liquidateFeePercentage

```solidity
uint256 _liquidateFeePercentage
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### \_\_gap

```solidity
uint256[49] __gap
```

## NFTOracle

### CollectionAdded

```solidity
event CollectionAdded(address collection)
```

_Emitted when a collection is added to the oracle_

| Name       | Type    | Description          |
| ---------- | ------- | -------------------- |
| collection | address | The added collection |

### CollectionRemoved

```solidity
event CollectionRemoved(address collection)
```

_Emitted when a collection is removed from the oracle_

| Name       | Type    | Description            |
| ---------- | ------- | ---------------------- |
| collection | address | The removed collection |

### NFTPriceAdded

```solidity
event NFTPriceAdded(address _collection, uint256 _tokenId, uint256 _price)
```

_Emitted when a price is added for an NFT asset_

| Name         | Type    | Description        |
| ------------ | ------- | ------------------ |
| \_collection | address | The NFT collection |
| \_tokenId    | uint256 | The NFT token Id   |
| \_price      | uint256 |                    |

### FeedAdminUpdated

```solidity
event FeedAdminUpdated(address admin)
```

_Emitted when the admin has been updated_

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| admin | address | The new admin |

### NotAdmin

```solidity
error NotAdmin()
```

### NonExistingCollection

```solidity
error NonExistingCollection(address collection)
```

### AlreadyExistingCollection

```solidity
error AlreadyExistingCollection()
```

### NFTPaused

```solidity
error NFTPaused()
```

### ArraysLengthInconsistent

```solidity
error ArraysLengthInconsistent()
```

### PriceIsZero

```solidity
error PriceIsZero()
```

### nftPrices

```solidity
mapping(address => mapping(uint256 => uint256)) nftPrices
```

### collections

```solidity
mapping(address => bool) collections
```

### collectionTokenIds

```solidity
mapping(address => uint256[]) collectionTokenIds
```

### priceFeedAdmin

```solidity
address priceFeedAdmin
```

### collectionPaused

```solidity
mapping(address => bool) collectionPaused
```

### nftxVaultFactory

```solidity
address nftxVaultFactory
```

### sushiswapRouter

```solidity
address sushiswapRouter
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyExistingCollection

```solidity
modifier onlyExistingCollection(address _collection)
```

### onlyExistingCollections

```solidity
modifier onlyExistingCollections(address[] _collections)
```

### onlyNonExistingCollection

```solidity
modifier onlyNonExistingCollection(address _collection)
```

### whenNotPaused

```solidity
modifier whenNotPaused(address _nftContract)
```

### initialize

```solidity
function initialize(address _admin, address _nftxVaultFactory, address _sushiswapRouter) public
```

_Function is invoked by the proxy contract when the NFTOracle contract is added to the
LendPoolAddressesProvider of the market._

| Name               | Type    | Description       |
| ------------------ | ------- | ----------------- |
| \_admin            | address | The admin address |
| \_nftxVaultFactory | address |                   |
| \_sushiswapRouter  | address |                   |

### \_whenNotPaused

```solidity
function _whenNotPaused(address _contract) internal view
```

_checks whether the NFT oracle is paused_

| Name       | Type    | Description           |
| ---------- | ------- | --------------------- |
| \_contract | address | The NFTOracle address |

### setPriceFeedAdmin

```solidity
function setPriceFeedAdmin(address _admin) external
```

_sets the price feed admin of the oracle
@param \_admin the address to become the admin_

### setCollections

```solidity
function setCollections(address[] _collections) external
```

_adds multiple collections to the oracle
@param \_collections the array NFT collections to add_

### addCollection

```solidity
function addCollection(address _collection) external
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### \_addCollection

```solidity
function _addCollection(address _collection) internal
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### removeCollection

```solidity
function removeCollection(address _collection) external
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### \_removeCollection

```solidity
function _removeCollection(address _collection) internal
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

_sets the price for a given NFT
@param \_collections the array of NFT collections
@param \_tokenIds the array of NFT token Ids
@param \_prices the array of prices to set to the given tokens_

### \_setNFTPrice

```solidity
function _setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) internal
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

_returns the NFT price for a given array of NFTs
@param \_collections the array of NFT collections
@param \_tokenIds the array NFT token Id_

### setPause

```solidity
function setPause(address _collection, bool paused) external
```

_sets the pause status of the NFT oracle
@param \_nftContract the of NFT collection
@param val the value to set the pausing status (true for paused, false for unpaused)_

### getNFTPriceNFTX

```solidity
function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT valued by NFTX
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

## NFTOracle

### CollectionAdded

```solidity
event CollectionAdded(address collection)
```

_Emitted when a collection is added to the oracle_

| Name       | Type    | Description          |
| ---------- | ------- | -------------------- |
| collection | address | The added collection |

### CollectionRemoved

```solidity
event CollectionRemoved(address collection)
```

_Emitted when a collection is removed from the oracle_

| Name       | Type    | Description            |
| ---------- | ------- | ---------------------- |
| collection | address | The removed collection |

### NFTPriceAdded

```solidity
event NFTPriceAdded(address _collection, uint256 _tokenId, uint256 _price)
```

_Emitted when a price is added for an NFT asset_

| Name         | Type    | Description        |
| ------------ | ------- | ------------------ |
| \_collection | address | The NFT collection |
| \_tokenId    | uint256 | The NFT token Id   |
| \_price      | uint256 |                    |

### FeedAdminUpdated

```solidity
event FeedAdminUpdated(address admin)
```

_Emitted when the admin has been updated_

| Name  | Type    | Description   |
| ----- | ------- | ------------- |
| admin | address | The new admin |

### NotAdmin

```solidity
error NotAdmin()
```

### NonExistingCollection

```solidity
error NonExistingCollection(address collection)
```

### AlreadyExistingCollection

```solidity
error AlreadyExistingCollection()
```

### NFTPaused

```solidity
error NFTPaused()
```

### ArraysLengthInconsistent

```solidity
error ArraysLengthInconsistent()
```

### PriceIsZero

```solidity
error PriceIsZero()
```

### nftPrices

```solidity
mapping(address => mapping(uint256 => uint256)) nftPrices
```

### collections

```solidity
mapping(address => bool) collections
```

### collectionTokenIds

```solidity
mapping(address => uint256[]) collectionTokenIds
```

### priceFeedAdmin

```solidity
address priceFeedAdmin
```

### collectionPaused

```solidity
mapping(address => bool) collectionPaused
```

### nftxVaultFactory

```solidity
address nftxVaultFactory
```

### sushiswapRouter

```solidity
address sushiswapRouter
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### onlyExistingCollection

```solidity
modifier onlyExistingCollection(address _collection)
```

### onlyExistingCollections

```solidity
modifier onlyExistingCollections(address[] _collections)
```

### onlyNonExistingCollection

```solidity
modifier onlyNonExistingCollection(address _collection)
```

### whenNotPaused

```solidity
modifier whenNotPaused(address _nftContract)
```

### initialize

```solidity
function initialize(address _admin, address _nftxVaultFactory, address _sushiswapRouter) public
```

_Function is invoked by the proxy contract when the NFTOracle contract is added to the
LendPoolAddressesProvider of the market._

| Name               | Type    | Description       |
| ------------------ | ------- | ----------------- |
| \_admin            | address | The admin address |
| \_nftxVaultFactory | address |                   |
| \_sushiswapRouter  | address |                   |

### \_whenNotPaused

```solidity
function _whenNotPaused(address _contract) internal view
```

_checks whether the NFT oracle is paused_

| Name       | Type    | Description           |
| ---------- | ------- | --------------------- |
| \_contract | address | The NFTOracle address |

### setPriceFeedAdmin

```solidity
function setPriceFeedAdmin(address _admin) external
```

_sets the price feed admin of the oracle
@param \_admin the address to become the admin_

### setCollections

```solidity
function setCollections(address[] _collections) external
```

_adds multiple collections to the oracle
@param \_collections the array NFT collections to add_

### addCollection

```solidity
function addCollection(address _collection) external
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### \_addCollection

```solidity
function _addCollection(address _collection) internal
```

_adds a collection to the oracle
@param \_collection the NFT collection to add_

### removeCollection

```solidity
function removeCollection(address _collection) external
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### \_removeCollection

```solidity
function _removeCollection(address _collection) internal
```

_removes a collection from the oracle
@param \_collection the NFT collection to remove_

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

_sets the price for a given NFT
@param \_collections the array of NFT collections
@param \_tokenIds the array of NFT token Ids
@param \_prices the array of prices to set to the given tokens_

### \_setNFTPrice

```solidity
function _setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) internal
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

_returns the NFT price for a given array of NFTs
@param \_collections the array of NFT collections
@param \_tokenIds the array NFT token Id_

### setPause

```solidity
function setPause(address _collection, bool paused) external
```

_sets the pause status of the NFT oracle
@param \_nftContract the of NFT collection
@param val the value to set the pausing status (true for paused, false for unpaused)_

### getNFTPriceNFTX

```solidity
function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT valued by NFTX
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

## PunkGateway

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### \_wethGateway

```solidity
contract IWETHGateway _wethGateway
```

### punks

```solidity
contract IPunks punks
```

### wrappedPunks

```solidity
contract IWrappedPunks wrappedPunks
```

### proxy

```solidity
address proxy
```

### \_callerWhitelists

```solidity
mapping(address => bool) _callerWhitelists
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### initialize

```solidity
function initialize(address addressProvider, address wethGateway, address _punks, address _wrappedPunks) public
```

_Function is invoked by the proxy contract when the PunkGateway contract is added to the
LendPoolAddressesProvider of the market._

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

Returns the LendPool address

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

Returns the LendPoolLoan address

### authorizeLendPoolERC20

```solidity
function authorizeLendPoolERC20(address[] tokens) external
```

Approves the lendpool for given tokens

| Name   | Type      | Description         |
| ------ | --------- | ------------------- |
| tokens | address[] | the array of tokens |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

Authorizes/unauthorizes an array of callers to the whitelist

| Name    | Type      | Description          |
| ------- | --------- | -------------------- |
| callers | address[] | the array of callers |
| flag    | bool      |                      |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

Checks if caller is whitelisted

| Name   | Type    | Description    |
| ------ | ------- | -------------- |
| caller | address | caller address |

### \_checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

Checks the onBehalfOf address is valid for a given callet

| Name       | Type    | Description         |
| ---------- | ------- | ------------------- |
| onBehalfOf | address | the allowed address |

### \_depositPunk

```solidity
function _depositPunk(uint256 punkIndex) internal
```

Deposits a punk given its index

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                            |
| --------- | ------- | -------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to deposit |

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserveAsset | address | The address of the underlying asset to borrow                                                                                                                                                                                                              |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk used as collateral                                                                                                                                                                                                             |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### \_withdrawPunk

```solidity
function _withdrawPunk(uint256 punkIndex, address onBehalfOf) internal
```

### repay

```solidity
function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay                            |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### \_repay

```solidity
function _repay(uint256 punkIndex, uint256 amount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay                            |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### auction

```solidity
function auction(uint256 punkIndex) external
```

Start an auction on a specific punk

| Name      | Type    | Description                                   |
| --------- | ------- | --------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to set in auction |

### redeem

```solidity
function redeem(uint256 punkIndex, uint256 amount) external returns (uint256)
```

Redeem loan for a specific punk in auction

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to redeem |
| amount    | uint256 | amount to pay for the redeem          |

### liquidateNFTX

```solidity
function liquidateNFTX(uint256 punkIndex) external returns (uint256)
```

Liquidate punk in NFTX

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk to liquidate |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk to deposit                                                                                                                                                                                                                     |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH

- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay                  |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### \_repayETH

```solidity
function _repayETH(uint256 punkIndex, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH

- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay                  |
| accAmount | uint256 | The accumulated amount               |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay the debt         |

### \_safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| to    | address | recipient of the transfer |
| value | uint256 | the amount to send        |

### receive

```solidity
receive() external payable
```

@dev

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

## ReserveOracle

### TOKEN_DIGIT

```solidity
uint256 TOKEN_DIGIT
```

### AggregatorAdded

```solidity
event AggregatorAdded(address currencyKey, address aggregator)
```

### AggregatorRemoved

```solidity
event AggregatorRemoved(address currencyKey, address aggregator)
```

### priceFeedMap

```solidity
mapping(address => contract AggregatorV3Interface) priceFeedMap
```

### priceFeedKeys

```solidity
address[] priceFeedKeys
```

### weth

```solidity
address weth
```

### initialize

```solidity
function initialize(address _weth) public
```

### setAggregators

```solidity
function setAggregators(address[] _priceFeedKeys, address[] _aggregators) external
```

sets the aggregators and pricefeedkeys

| Name            | Type      | Description                 |
| --------------- | --------- | --------------------------- |
| \_priceFeedKeys | address[] | the array of pricefeed keys |
| \_aggregators   | address[] | the array of aggregators    |

### addAggregator

```solidity
function addAggregator(address _priceFeedKey, address _aggregator) external
```

adds a single aggregator

| Name           | Type    | Description           |
| -------------- | ------- | --------------------- |
| \_priceFeedKey | address | the pricefeed key     |
| \_aggregator   | address | the aggregator to add |

### \_addAggregator

```solidity
function _addAggregator(address _priceFeedKey, address _aggregator) internal
```

adds a single aggregator

| Name           | Type    | Description           |
| -------------- | ------- | --------------------- |
| \_priceFeedKey | address | the pricefeed key     |
| \_aggregator   | address | the aggregator to add |

### removeAggregator

```solidity
function removeAggregator(address _priceFeedKey) external
```

removes a single aggregator

| Name           | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to remove |

### getAggregator

```solidity
function getAggregator(address _priceFeedKey) public view returns (contract AggregatorV3Interface)
```

returns an aggregator gicen a pricefeed key

| Name           | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to fetch |

### getAssetPrice

```solidity
function getAssetPrice(address _priceFeedKey) external view returns (uint256)
```

### getLatestTimestamp

```solidity
function getLatestTimestamp(address _priceFeedKey) public view returns (uint256)
```

returns the aggregator's latest timestamp

| Name           | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| \_priceFeedKey | address | the pricefeed key of the aggregator to fetch |

### getTwapPrice

```solidity
function getTwapPrice(address _priceFeedKey, uint256 _interval) external view returns (uint256)
```

### isExistedKey

```solidity
function isExistedKey(address _priceFeedKey) private view returns (bool)
```

checks if a pricefeed key exists

| Name           | Type    | Description                |
| -------------- | ------- | -------------------------- |
| \_priceFeedKey | address | the pricefeed key to check |

### requireNonEmptyAddress

```solidity
function requireNonEmptyAddress(address _addr) internal pure
```

checks if an address is 0

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| \_addr | address | the address to check |

### formatDecimals

```solidity
function formatDecimals(uint256 _price, uint8 _decimals) internal pure returns (uint256)
```

formats a price to the given decimals

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| \_price    | uint256 | the price to format                 |
| \_decimals | uint8   | the decimals to format the price to |

### getPriceFeedLength

```solidity
function getPriceFeedLength() public view returns (uint256 length)
```

returns the price feed length

## UToken

_Implementation of the interest bearing token for the Unlockd protocol_

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### \_treasury

```solidity
address _treasury
```

### \_underlyingAsset

```solidity
address _underlyingAsset
```

### onlyLendPool

```solidity
modifier onlyLendPool()
```

### onlyLendPoolConfigurator

```solidity
modifier onlyLendPoolConfigurator()
```

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address treasury, address underlyingAsset, uint8 uTokenDecimals, string uTokenName, string uTokenSymbol) external
```

_Initializes the uToken_

| Name            | Type                                | Description                                                            |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the address provider where this uToken will be used     |
| treasury        | address                             | The address of the Unlockd treasury, receiving the fees on this uToken |
| underlyingAsset | address                             | The address of the underlying asset of this uToken                     |
| uTokenDecimals  | uint8                               |                                                                        |
| uTokenName      | string                              |                                                                        |
| uTokenSymbol    | string                              |                                                                        |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

\_Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`

- Only callable by the LendPool, as extra state updates there need to be managed\_

| Name                 | Type    | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| user                 | address | The owner of the uTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying  |
| amount               | uint256 | The amount being burned                       |
| index                | uint256 | The new liquidity index of the reserve        |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

\_Mints `amount` uTokens to `user`

- Only callable by the LendPool, as extra state updates there need to be managed\_

| Name   | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| user   | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted     |
| index  | uint256 | The new liquidity index of the reserve  |

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| [0]  | bool | `true` if the the previous balance of the user was 0 |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

\_Mints uTokens to the reserve treasury

- Only callable by the LendPool\_

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| amount | uint256 | The amount of tokens getting minted    |
| index  | uint256 | The new liquidity index of the reserve |

### balanceOf

```solidity
function balanceOf(address user) public view returns (uint256)
```

_Calculates the balance of the user: principal balance + interest generated by the principal_

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| user | address | The user whose balance is calculated |

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | The balance of the user |

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| user | address | The user whose balance is calculated |

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| [0]  | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The scaled balance of the user                 |
| [1]  | uint256 | The scaled balance and the scaled total supply |

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_calculates the total supply of the specific uToken
since the balance of every single user increases over time, the total supply
does that too._

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | uint256 | the current total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() public view virtual returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | the scaled total supply |

### RESERVE_TREASURY_ADDRESS

```solidity
function RESERVE_TREASURY_ADDRESS() public view returns (address)
```

_Returns the address of the Unlockd treasury, receiving the fees on this uToken_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() public view returns (address)
```

_Returns the address of the underlying asset of this uToken_

### POOL

```solidity
function POOL() public view returns (contract ILendPool)
```

_Returns the address of the lending pool where this uToken is used_

### \_getIncentivesController

```solidity
function _getIncentivesController() internal view returns (contract IIncentivesController)
```

_For internal usage in the logic of the parent contract IncentivizedERC20_

### \_getUnderlyingAssetAddress

```solidity
function _getUnderlyingAssetAddress() internal view returns (address)
```

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address target, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendPool to transfer
assets in borrow(), withdraw() and flashLoan()_

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| target | address | The recipient of the uTokens   |
| amount | uint256 | The amount getting transferred |

| Name | Type    | Description            |
| ---- | ------- | ---------------------- |
| [0]  | uint256 | The amount transferred |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

### \_getLendPoolConfigurator

```solidity
function _getLendPoolConfigurator() internal view returns (contract ILendPoolConfigurator)
```

### \_transfer

```solidity
function _transfer(address from, address to, uint256 amount, bool validate) internal
```

_Transfers the uTokens between two users. Validates the transfer
(ie checks for valid HF after the transfer) if required_

| Name     | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| from     | address | The source address                           |
| to       | address | The destination address                      |
| amount   | uint256 | The amount getting transferred               |
| validate | bool    | `true` if the transfer needs to be validated |

### \_transfer

```solidity
function _transfer(address from, address to, uint256 amount) internal
```

_Overrides the parent \_transfer to force validated transfer() and transferFrom()_

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| from   | address | The source address             |
| to     | address | The destination address        |
| amount | uint256 | The amount getting transferred |

## WETHGateway

### \_addressProvider

```solidity
contract ILendPoolAddressesProvider _addressProvider
```

### WETH

```solidity
contract IWETH WETH
```

### \_callerWhitelists

```solidity
mapping(address => bool) _callerWhitelists
```

### \_NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### \_ENTERED

```solidity
uint256 _ENTERED
```

### \_status

```solidity
uint256 _status
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and making it call a
`private` function that does the actual work._

### initialize

```solidity
function initialize(address addressProvider, address weth) public
```

_Sets the WETH address and the LendPoolAddressesProvider address. Infinite approves lend pool._

| Name            | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| addressProvider | address |                                       |
| weth            | address | Address of the Wrapped Ether contract |

### \_getLendPool

```solidity
function _getLendPool() internal view returns (contract ILendPool)
```

returns the LendPool address

### \_getLendPoolLoan

```solidity
function _getLendPoolLoan() internal view returns (contract ILendPoolLoan)
```

returns the LendPoolLoan address

### authorizeLendPoolNFT

```solidity
function authorizeLendPoolNFT(address[] nftAssets) external
```

_approves the lendpool for the given NFT assets_

| Name      | Type      | Description             |
| --------- | --------- | ----------------------- |
| nftAssets | address[] | the array of nft assets |

### authorizeCallerWhitelist

```solidity
function authorizeCallerWhitelist(address[] callers, bool flag) external
```

_authorizes/unauthorizes a list of callers for the whitelist_

| Name    | Type      | Description                           |
| ------- | --------- | ------------------------------------- |
| callers | address[] | the array of callers to be authorized |
| flag    | bool      | the flag to authorize/unauthorize     |

### isCallerInWhitelist

```solidity
function isCallerInWhitelist(address caller) external view returns (bool)
```

_checks if caller is whitelisted_

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| caller | address | the caller to check |

### \_checkValidCallerAndOnBehalfOf

```solidity
function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view
```

_checks if caller's approved address is valid_

| Name       | Type    | Description                                 |
| ---------- | ------- | ------------------------------------------- |
| onBehalfOf | address | the address to check approval of the caller |

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (uTokens)
is minted._

| Name         | Type    | Description                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------------- |
| onBehalfOf   | address | address of the user who will receive the uTokens representing the deposit     |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH \_reserves of msg.sender._

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| amount | uint256 | amount of uWETH to withdraw and receive native ETH |
| to     | address | address of the user who will receive native ETH    |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | the amount of ETH to borrow                                                                                                                                                                                                                                |
| nftAsset     | address | The address of the underlying NFT used as collateral                                                                                                                                                                                                       |
| nftTokenId   | uint256 | The token ID of the underlying NFT used as collateral                                                                                                                                                                                                      |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards                                                                                                                                                                               |

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name       | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral                      |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral                     |
| amount     | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### \_repayETH

```solidity
function _repayETH(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount) internal returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name       | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral                      |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral                     |
| amount     | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |
| accAmount  | uint256 | the accumulated amount                                                    |

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId) external
```

_auction a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### redeemETH

```solidity
function redeemETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256)
```

_redeems a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay the debt                          |

### liquidateNFTX

```solidity
function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256)
```

_liquidates a borrow on the WETH reserve on NFTX_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### \_safeTransferETH

```solidity
function _safeTransferETH(address to, uint256 value) internal
```

_transfer ETH to an address, revert if it fails._

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| to    | address | recipient of the transfer |
| value | uint256 | the amount to send        |

### getWETHAddress

```solidity
function getWETHAddress() external view returns (address)
```

_Get WETH address used by WETHGateway_

### receive

```solidity
receive() external payable
```

_Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract._

### fallback

```solidity
fallback() external payable
```

_Revert fallback calls_

## **Logic Libraries**

## BorrowLogic

Implements the logic to borrow feature

### Borrow

```solidity
event Borrow(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint256 borrowRate, uint256 loanId, uint16 referral)
```

_Emitted on borrow() when loan needs to be opened_

| Name       | Type    | Description                                                          |
| ---------- | ------- | -------------------------------------------------------------------- |
| user       | address | The address of the user initiating the borrow(), receiving the funds |
| reserve    | address | The address of the underlying asset being borrowed                   |
| amount     | uint256 | The amount borrowed out                                              |
| nftAsset   | address | The address of the underlying NFT used as collateral                 |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral                |
| onBehalfOf | address | The address that will be getting the loan                            |
| borrowRate | uint256 |                                                                      |
| loanId     | uint256 |                                                                      |
| referral   | uint16  | The referral code used                                               |

### Repay

```solidity
event Repay(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on repay()_

| Name       | Type    | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| user       | address | The address of the user initiating the repay(), providing the funds |
| reserve    | address | The address of the underlying asset of the reserve                  |
| amount     | uint256 | The amount repaid                                                   |
| nftAsset   | address | The address of the underlying NFT used as collateral                |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral               |
| borrower   | address | The beneficiary of the repayment, getting his debt reduced          |
| loanId     | uint256 | The loan ID of the NFT loans                                        |

### ExecuteBorrowLocalVars

```solidity
struct ExecuteBorrowLocalVars {
  address initiator;
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 loanId;
  address reserveOracle;
  address nftOracle;
  address loanAddress;
  uint256 totalSupply;
}

```

### executeBorrow

```solidity
function executeBorrow(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBorrowParams params) external
```

Implements the borrow feature. Through `borrow()`, users borrow assets from the protocol.

_Emits the `Borrow()` event._

| Name              | Type                                                     | Description                                                     |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      | The addresses provider                                          |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                   |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                       |
| params            | struct DataTypes.ExecuteBorrowParams                     | The additional parameters needed to execute the borrow function |

### \_borrow

```solidity
function _borrow(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteBorrowParams params) internal
```

Implements the borrow feature. Through `_borrow()`, users borrow assets from the protocol.

_Emits the `Borrow()` event._

| Name              | Type                                                     | Description                                                     |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      | The addresses provider                                          |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                   |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                       |
| params            | struct DataTypes.ExecuteBorrowParams                     | The additional parameters needed to execute the borrow function |

### RepayLocalVars

```solidity
struct RepayLocalVars {
  address initiator;
  address poolLoan;
  address onBehalfOf;
  uint256 loanId;
  bool isUpdate;
  uint256 borrowAmount;
  uint256 repayAmount;
}

```

### executeRepay

```solidity
function executeRepay(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRepayParams params) external returns (uint256, bool)
```

Implements the repay feature. Through `repay()`, users repay assets to the protocol.

_Emits the `Repay()` event._

| Name              | Type                                                     | Description                                                    |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      |                                                                |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                  |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                      |
| params            | struct DataTypes.ExecuteRepayParams                      | The additional parameters needed to execute the repay function |

### \_repay

```solidity
function _repay(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRepayParams params) internal returns (uint256, bool)
```

Implements the repay feature. Through `repay()`, users repay assets to the protocol.

_Emits the `Repay()` event._

| Name              | Type                                                     | Description                                                    |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      |                                                                |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                  |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                      |
| params            | struct DataTypes.ExecuteRepayParams                      | The additional parameters needed to execute the repay function |

## ConfiguratorLogic

Implements the logic to configuration feature

### ReserveInitialized

```solidity
event ReserveInitialized(address asset, address uToken, address debtToken, address interestRateAddress)
```

_Emitted when a reserve is initialized._

| Name                | Type    | Description                                               |
| ------------------- | ------- | --------------------------------------------------------- |
| asset               | address | The address of the underlying asset of the reserve        |
| uToken              | address | The address of the associated uToken contract             |
| debtToken           | address | The address of the associated debtToken contract          |
| interestRateAddress | address | The address of the interest rate strategy for the reserve |

### NftInitialized

```solidity
event NftInitialized(address asset, address uNft)
```

_Emitted when a nft is initialized._

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the nft |
| uNft  | address | The address of the associated uNFT contract    |

### UTokenUpgraded

```solidity
event UTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when an uToken implementation is upgraded_

| Name           | Type    | Description                                        |
| -------------- | ------- | -------------------------------------------------- |
| asset          | address | The address of the underlying asset of the reserve |
| proxy          | address | The uToken proxy address                           |
| implementation | address | The new uToken implementation                      |

### DebtTokenUpgraded

```solidity
event DebtTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when the implementation of a debt token is upgraded_

| Name           | Type    | Description                                        |
| -------------- | ------- | -------------------------------------------------- |
| asset          | address | The address of the underlying asset of the reserve |
| proxy          | address | The debt token proxy address                       |
| implementation | address | The new debtToken implementation                   |

### executeInitReserve

```solidity
function executeInitReserve(contract ILendPoolAddressesProvider addressProvider, contract ILendPool cachePool, struct ConfigTypes.InitReserveInput input) external
```

Initializes a reserve

_Emits the `ReserveInitialized()` event._

| Name            | Type                                | Description                        |
| --------------- | ----------------------------------- | ---------------------------------- |
| addressProvider | contract ILendPoolAddressesProvider | The addresses provider             |
| cachePool       | contract ILendPool                  | The lend pool                      |
| input           | struct ConfigTypes.InitReserveInput | The data to initialize the reserve |

### executeInitNft

```solidity
function executeInitNft(contract ILendPool pool_, contract IUNFTRegistry registry_, struct ConfigTypes.InitNftInput input) external
```

Initializes an NFT

_Emits the `NftInitialized()` event._

| Name       | Type                            | Description                    |
| ---------- | ------------------------------- | ------------------------------ |
| pool\_     | contract ILendPool              | The lend pool                  |
| registry\_ | contract IUNFTRegistry          | The UNFT Registry              |
| input      | struct ConfigTypes.InitNftInput | The data to initialize the NFT |

### executeUpdateUToken

```solidity
function executeUpdateUToken(contract ILendPool cachedPool, struct ConfigTypes.UpdateUTokenInput input) external
```

Updates the uToken

_Emits the `UTokenUpgraded()` event._

| Name       | Type                                 | Description                       |
| ---------- | ------------------------------------ | --------------------------------- |
| cachedPool | contract ILendPool                   | The lend pool                     |
| input      | struct ConfigTypes.UpdateUTokenInput | The data to initialize the uToken |

### executeUpdateDebtToken

```solidity
function executeUpdateDebtToken(contract ILendPool cachedPool, struct ConfigTypes.UpdateDebtTokenInput input) external
```

Updates the debt token

_Emits the `DebtTokenUpgraded()` event._

| Name       | Type                                    | Description                           |
| ---------- | --------------------------------------- | ------------------------------------- |
| cachedPool | contract ILendPool                      | The lend pool                         |
| input      | struct ConfigTypes.UpdateDebtTokenInput | The data to initialize the debt token |

### getTokenImplementation

```solidity
function getTokenImplementation(address proxyAddress) external view returns (address)
```

Gets the token implementation contract

| Name         | Type    | Description                                         |
| ------------ | ------- | --------------------------------------------------- |
| proxyAddress | address | The proxy contract to fetch the implementation from |

### \_initTokenWithProxy

```solidity
function _initTokenWithProxy(address implementation, bytes initParams) internal returns (address)
```

Initializes the proxy contract

| Name           | Type    | Description                                     |
| -------------- | ------- | ----------------------------------------------- |
| implementation | address | The proxy contract                              |
| initParams     | bytes   | The initial params to set in the initialization |

### \_upgradeTokenImplementation

```solidity
function _upgradeTokenImplementation(address proxyAddress, address implementation, bytes encodedCallData) internal
```

Upgrades the implementation contract for the proxy

| Name            | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| proxyAddress    | address | The proxy contract              |
| implementation  | address | The new implementation contract |
| encodedCallData | bytes   | calldata to be executed         |

## GenericLogic

Implements protocol-level logic to calculate and validate the state of a user

### HEALTH_FACTOR_LIQUIDATION_THRESHOLD

```solidity
uint256 HEALTH_FACTOR_LIQUIDATION_THRESHOLD
```

### CalculateLoanDataVars

```solidity
struct CalculateLoanDataVars {
  uint256 reserveUnitPrice;
  uint256 reserveUnit;
  uint256 reserveDecimals;
  uint256 healthFactor;
  uint256 totalCollateralInETH;
  uint256 totalCollateralInReserve;
  uint256 totalDebtInETH;
  uint256 totalDebtInReserve;
  uint256 nftLtv;
  uint256 nftLiquidationThreshold;
  address nftAsset;
  uint256 nftTokenId;
  uint256 nftUnitPrice;
}

```

### calculateLoanData

```solidity
function calculateLoanData(address reserveAddress, struct DataTypes.ReserveData reserveData, address nftAddress, uint256 nftTokenId, struct DataTypes.NftData nftData, address loanAddress, uint256 loanId, address reserveOracle, address nftOracle) internal view returns (uint256, uint256, uint256)
```

_Calculates the nft loan data.
this includes the total collateral/borrow balances in Reserve,
the Loan To Value, the Liquidation Ratio, and the Health factor._

| Name           | Type                         | Description                         |
| -------------- | ---------------------------- | ----------------------------------- |
| reserveAddress | address                      | the underlying asset of the reserve |
| reserveData    | struct DataTypes.ReserveData | Data of the reserve                 |
| nftAddress     | address                      | the underlying NFT asset            |
| nftTokenId     | uint256                      | the token Id for the NFT            |
| nftData        | struct DataTypes.NftData     | Data of the nft                     |
| loanAddress    | address                      | The loan address                    |
| loanId         | uint256                      | The loan identifier                 |
| reserveOracle  | address                      | The price oracle address of reserve |
| nftOracle      | address                      | The price oracle address of nft     |

| Name | Type    | Description                                                                                           |
| ---- | ------- | ----------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | The total collateral and total debt of the loan in Reserve, the ltv, liquidation threshold and the HF |
| [1]  | uint256 |                                                                                                       |
| [2]  | uint256 |                                                                                                       |

### calculateNftDebtData

```solidity
function calculateNftDebtData(address reserveAddress, struct DataTypes.ReserveData reserveData, address loanAddress, uint256 loanId, address reserveOracle) internal view returns (uint256, uint256)
```

_Calculates the nft debt data.
this includes the total collateral/borrow balances in Reserve,
the Loan To Value, the Liquidation Ratio, and the Health factor._

| Name           | Type                         | Description                         |
| -------------- | ---------------------------- | ----------------------------------- |
| reserveAddress | address                      | the underlying asset of the reserve |
| reserveData    | struct DataTypes.ReserveData | Data of the reserve                 |
| loanAddress    | address                      | The loan address                    |
| loanId         | uint256                      | The loan identifier                 |
| reserveOracle  | address                      | The price oracle address of reserve |

| Name | Type    | Description                                             |
| ---- | ------- | ------------------------------------------------------- |
| [0]  | uint256 | The total debt in ETH and the total debt in the Reserve |
| [1]  | uint256 |                                                         |

### calculateNftCollateralData

```solidity
function calculateNftCollateralData(address reserveAddress, struct DataTypes.ReserveData reserveData, address nftAddress, uint256 nftTokenId, struct DataTypes.NftData nftData, address reserveOracle, address nftOracle) internal view returns (uint256, uint256)
```

_Calculates the nft collateral data.
this includes the total collateral/borrow balances in Reserve,
the Loan To Value, the Liquidation Ratio, and the Health factor._

| Name           | Type                         | Description                         |
| -------------- | ---------------------------- | ----------------------------------- |
| reserveAddress | address                      | the underlying asset of the reserve |
| reserveData    | struct DataTypes.ReserveData | Data of the reserve                 |
| nftAddress     | address                      | The underlying NFT asset            |
| nftTokenId     | uint256                      | The underlying NFT token Id         |
| nftData        | struct DataTypes.NftData     | The NFT data                        |
| reserveOracle  | address                      | The price oracle address of reserve |
| nftOracle      | address                      | The nft price oracle address        |

| Name | Type    | Description                                             |
| ---- | ------- | ------------------------------------------------------- |
| [0]  | uint256 | The total debt in ETH and the total debt in the Reserve |
| [1]  | uint256 |                                                         |

### calculateHealthFactorFromBalances

```solidity
function calculateHealthFactorFromBalances(uint256 totalCollateral, uint256 totalDebt, uint256 liquidationThreshold) internal pure returns (uint256)
```

_Calculates the health factor from the corresponding balances_

| Name                 | Type    | Description                   |
| -------------------- | ------- | ----------------------------- |
| totalCollateral      | uint256 | The total collateral          |
| totalDebt            | uint256 | The total debt                |
| liquidationThreshold | uint256 | The avg liquidation threshold |

| Name | Type    | Description                                             |
| ---- | ------- | ------------------------------------------------------- |
| [0]  | uint256 | The health factor calculated from the balances provided |

### calculateAvailableBorrows

```solidity
function calculateAvailableBorrows(uint256 totalCollateral, uint256 totalDebt, uint256 ltv) internal pure returns (uint256)
```

_Calculates the equivalent amount that an user can borrow, depending on the available collateral and the
average Loan To Value_

| Name            | Type    | Description               |
| --------------- | ------- | ------------------------- |
| totalCollateral | uint256 | The total collateral      |
| totalDebt       | uint256 | The total borrow balance  |
| ltv             | uint256 | The average loan to value |

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| [0]  | uint256 | the amount available to borrow for the user |

### CalcLiquidatePriceLocalVars

```solidity
struct CalcLiquidatePriceLocalVars {
  uint256 ltv;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 nftPriceInETH;
  uint256 nftPriceInReserve;
  uint256 reserveDecimals;
  uint256 reservePriceInETH;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 borrowAmount;
}

```

### calculateLoanLiquidatePrice

```solidity
function calculateLoanLiquidatePrice(uint256 loanId, address reserveAsset, struct DataTypes.ReserveData reserveData, address nftAsset, uint256 nftTokenId, struct DataTypes.NftData nftData, address poolLoan, address reserveOracle, address nftOracle) internal view returns (uint256, uint256, uint256)
```

_Calculates the loan liquidation price_

| Name          | Type                         | Description                         |
| ------------- | ---------------------------- | ----------------------------------- |
| loanId        | uint256                      | the loan Id                         |
| reserveAsset  | address                      | The underlying asset of the reserve |
| reserveData   | struct DataTypes.ReserveData | the reserve data                    |
| nftAsset      | address                      | the underlying NFT asset            |
| nftTokenId    | uint256                      | the NFT token Id                    |
| nftData       | struct DataTypes.NftData     | The NFT data                        |
| poolLoan      | address                      | The pool loan address               |
| reserveOracle | address                      | The price oracle address of reserve |
| nftOracle     | address                      | The price oracle address of nft     |

| Name | Type    | Description                                              |
| ---- | ------- | -------------------------------------------------------- |
| [0]  | uint256 | The borrow amount, threshold price and liquidation price |
| [1]  | uint256 |                                                          |
| [2]  | uint256 |                                                          |

## LiquidateLogic

Implements the logic to liquidate feature

### Auction

```solidity
event Auction(address reserve, uint256 bidPrice, uint256 auctionDuration, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is auctioned._

| Name            | Type    | Description                                           |
| --------------- | ------- | ----------------------------------------------------- |
| reserve         | address | The address of the underlying asset of the reserve    |
| bidPrice        | uint256 | The start bid price of the underlying reserve         |
| auctionDuration | uint256 | Auction duration of the underlying reserve            |
| nftAsset        | address | The address of the underlying NFT used as collateral  |
| nftTokenId      | uint256 | The token id of the underlying NFT used as collateral |
| borrower        | address |                                                       |
| loanId          | uint256 | The loan ID of the NFT loans                          |

### Redeem

```solidity
event Redeem(address user, address reserve, uint256 borrowAmount, uint256 fineAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on redeem()_

| Name         | Type    | Description                                                          |
| ------------ | ------- | -------------------------------------------------------------------- |
| user         | address | The address of the user initiating the redeem(), providing the funds |
| reserve      | address | The address of the underlying asset of the reserve                   |
| borrowAmount | uint256 | The borrow amount repaid                                             |
| fineAmount   | uint256 |                                                                      |
| nftAsset     | address | The address of the underlying NFT used as collateral                 |
| nftTokenId   | uint256 | The token id of the underlying NFT used as collateral                |
| borrower     | address |                                                                      |
| loanId       | uint256 | The loan ID of the NFT loans                                         |

### Liquidate

```solidity
event Liquidate(address user, address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated._

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| user         | address | The address of the user initiating the auction     |
| reserve      | address | The address of the underlying asset of the reserve |
| repayAmount  | uint256 | The amount of reserve repaid by the liquidator     |
| remainAmount | uint256 | The amount of reserve received by the borrower     |
| nftAsset     | address |                                                    |
| nftTokenId   | uint256 |                                                    |
| borrower     | address |                                                    |
| loanId       | uint256 | The loan ID of the NFT loans                       |

### LiquidateNFTX

```solidity
event LiquidateNFTX(address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated on NFTX._

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| reserve      | address | The address of the underlying asset of the reserve |
| repayAmount  | uint256 | The amount of reserve repaid by the liquidator     |
| remainAmount | uint256 | The amount of reserve received by the borrower     |
| nftAsset     | address |                                                    |
| nftTokenId   | uint256 |                                                    |
| borrower     | address |                                                    |
| loanId       | uint256 | The loan ID of the NFT loans                       |

### AuctionLocalVars

```solidity
struct AuctionLocalVars {
  address loanAddress;
  address reserveOracle;
  address nftOracle;
  address liquidator;
  uint256 loanId;
  uint256 thresholdPrice;
  uint256 liquidatePrice;
  uint256 borrowAmount;
  uint256 auctionEndTimestamp;
  uint256 minBidDelta;
  uint256 minBidPrice;
  uint256 minBidPriceInETH;
  uint256 reserveDecimals;
  uint256 reserveUnit;
  uint256 reserveUnitPrice;
}

```

### executeAuction

```solidity
function executeAuction(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteAuctionParams params) external
```

Implements the auction feature. Through `auction()`, users auction assets in the protocol.

_Emits the `Auction()` event._

| Name              | Type                                                     | Description                                                      |
| ----------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      |                                                                  |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                    |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                        |
| params            | struct DataTypes.ExecuteAuctionParams                    | The additional parameters needed to execute the auction function |

### RedeemLocalVars

```solidity
struct RedeemLocalVars {
  address initiator;
  address liquidator;
  address poolLoan;
  address reserveOracle;
  address nftOracle;
  uint256 loanId;
  uint256 borrowAmount;
  uint256 repayAmount;
  uint256 minRepayAmount;
  uint256 maxRepayAmount;
  uint256 bidFine;
  uint256 auctionEndTimestamp;
  uint256 minBidFinePct;
  uint256 minBidFine;
}

```

### executeRedeem

```solidity
function executeRedeem(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteRedeemParams params) external returns (uint256)
```

Implements the redeem feature. Through `redeem()`, users redeem assets in the protocol.

_Emits the `Redeem()` event._

| Name              | Type                                                     | Description                                                     |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider                      |                                                                 |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                   |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                       |
| params            | struct DataTypes.ExecuteRedeemParams                     | The additional parameters needed to execute the redeem function |

### LiquidateNFTXLocalVars

```solidity
struct LiquidateNFTXLocalVars {
  address poolLoan;
  address reserveOracle;
  address nftOracle;
  address liquidator;
  uint256 loanId;
  uint256 borrowAmount;
  uint256 extraDebtAmount;
  uint256 remainAmount;
  uint256 feeAmount;
  uint256 auctionEndTimestamp;
}

```

### executeLiquidateNFTX

```solidity
function executeLiquidateNFTX(contract ILendPoolAddressesProvider addressesProvider, mapping(address => struct DataTypes.ReserveData) reservesData, mapping(address => struct DataTypes.NftData) nftsData, struct DataTypes.ExecuteLiquidateNFTXParams params) external returns (uint256)
```

Implements the liquidate feature on NFTX. Through `liquidateNFTX()`, users liquidate assets in the protocol.

_Emits the `LiquidateNFTX()` event._

| Name              | Type                                                     | Description                                                        |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| addressesProvider | contract ILendPoolAddressesProvider                      |                                                                    |
| reservesData      | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                      |
| nftsData          | mapping(address &#x3D;&gt; struct DataTypes.NftData)     | The state of all the nfts                                          |
| params            | struct DataTypes.ExecuteLiquidateNFTXParams              | The additional parameters needed to execute the liquidate function |

## NftLogic

Implements the logic to update the nft state

### init

```solidity
function init(struct DataTypes.NftData nft, address uNftAddress) external
```

_Initializes a nft_

| Name        | Type                     | Description                      |
| ----------- | ------------------------ | -------------------------------- |
| nft         | struct DataTypes.NftData | The nft object                   |
| uNftAddress | address                  | The address of the uNFT contract |

## ReserveLogic

Implements the logic to update the reserves state

### ReserveDataUpdated

```solidity
event ReserveDataUpdated(address asset, uint256 liquidityRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)
```

_Emitted when the state of a reserve is updated_

| Name                | Type    | Description                                        |
| ------------------- | ------- | -------------------------------------------------- |
| asset               | address | The address of the underlying asset of the reserve |
| liquidityRate       | uint256 | The new liquidity rate                             |
| variableBorrowRate  | uint256 | The new variable borrow rate                       |
| liquidityIndex      | uint256 | The new liquidity index                            |
| variableBorrowIndex | uint256 | The new variable borrow index                      |

### getNormalizedIncome

```solidity
function getNormalizedIncome(struct DataTypes.ReserveData reserve) internal view returns (uint256)
```

_Returns the ongoing normalized income for the reserve
A value of 1e27 means there is no income. As time passes, the income is accrued
A value of 2\*1e27 means for each unit of asset one unit of income has been accrued_

| Name    | Type                         | Description        |
| ------- | ---------------------------- | ------------------ |
| reserve | struct DataTypes.ReserveData | The reserve object |

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| [0]  | uint256 | the normalized income. expressed in ray |

### getNormalizedDebt

```solidity
function getNormalizedDebt(struct DataTypes.ReserveData reserve) internal view returns (uint256)
```

_Returns the ongoing normalized variable debt for the reserve
A value of 1e27 means there is no debt. As time passes, the income is accrued
A value of 2\*1e27 means that for each unit of debt, one unit worth of interest has been accumulated_

| Name    | Type                         | Description        |
| ------- | ---------------------------- | ------------------ |
| reserve | struct DataTypes.ReserveData | The reserve object |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The normalized variable debt. expressed in ray |

### updateState

```solidity
function updateState(struct DataTypes.ReserveData reserve) internal
```

_Updates the liquidity cumulative index and the variable borrow index._

| Name    | Type                         | Description        |
| ------- | ---------------------------- | ------------------ |
| reserve | struct DataTypes.ReserveData | the reserve object |

### cumulateToLiquidityIndex

```solidity
function cumulateToLiquidityIndex(struct DataTypes.ReserveData reserve, uint256 totalLiquidity, uint256 amount) internal
```

_Accumulates a predefined amount of asset to the reserve as a fixed, instantaneous income. Used for example to accumulate
the flashloan fee to the reserve, and spread it between all the depositors_

| Name           | Type                         | Description                                  |
| -------------- | ---------------------------- | -------------------------------------------- |
| reserve        | struct DataTypes.ReserveData | The reserve object                           |
| totalLiquidity | uint256                      | The total liquidity available in the reserve |
| amount         | uint256                      | The amount to accomulate                     |

### init

```solidity
function init(struct DataTypes.ReserveData reserve, address uTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

_Initializes a reserve_

| Name                | Type                         | Description                                        |
| ------------------- | ---------------------------- | -------------------------------------------------- |
| reserve             | struct DataTypes.ReserveData | The reserve object                                 |
| uTokenAddress       | address                      | The address of the overlying uToken contract       |
| debtTokenAddress    | address                      | The address of the overlying debtToken contract    |
| interestRateAddress | address                      | The address of the interest rate strategy contract |

### UpdateInterestRatesLocalVars

```solidity
struct UpdateInterestRatesLocalVars {
  uint256 availableLiquidity;
  uint256 newLiquidityRate;
  uint256 newVariableRate;
  uint256 totalVariableDebt;
}

```

### updateInterestRates

```solidity
function updateInterestRates(struct DataTypes.ReserveData reserve, address reserveAddress, address uTokenAddress, uint256 liquidityAdded, uint256 liquidityTaken) internal
```

_Updates the reserve current stable borrow rate, the current variable borrow rate and the current liquidity rate_

| Name           | Type                         | Description                                                                             |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| reserve        | struct DataTypes.ReserveData | The address of the reserve to be updated                                                |
| reserveAddress | address                      |                                                                                         |
| uTokenAddress  | address                      |                                                                                         |
| liquidityAdded | uint256                      | The amount of liquidity added to the protocol (deposit or repay) in the previous action |
| liquidityTaken | uint256                      | The amount of liquidity taken from the protocol (withdraw or borrow)                    |

### MintToTreasuryLocalVars

```solidity
struct MintToTreasuryLocalVars {
  uint256 currentVariableDebt;
  uint256 previousVariableDebt;
  uint256 totalDebtAccrued;
  uint256 amountToMint;
  uint256 reserveFactor;
}

```

### \_mintToTreasury

```solidity
function _mintToTreasury(struct DataTypes.ReserveData reserve, uint256 scaledVariableDebt, uint256 previousVariableBorrowIndex, uint256 newLiquidityIndex, uint256 newVariableBorrowIndex, uint40 timestamp) internal
```

_Mints part of the repaid interest to the reserve treasury as a function of the reserveFactor for the
specific asset._

| Name                        | Type                         | Description                                                            |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| reserve                     | struct DataTypes.ReserveData | The reserve reserve to be updated                                      |
| scaledVariableDebt          | uint256                      | The current scaled total variable debt                                 |
| previousVariableBorrowIndex | uint256                      | The variable borrow index before the last accumulation of the interest |
| newLiquidityIndex           | uint256                      | The new liquidity index                                                |
| newVariableBorrowIndex      | uint256                      | The variable borrow index after the last accumulation of the interest  |
| timestamp                   | uint40                       |                                                                        |

### \_updateIndexes

```solidity
function _updateIndexes(struct DataTypes.ReserveData reserve, uint256 scaledVariableDebt, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 timestamp) internal returns (uint256, uint256)
```

_Updates the reserve indexes and the timestamp of the update_

| Name                | Type                         | Description                           |
| ------------------- | ---------------------------- | ------------------------------------- |
| reserve             | struct DataTypes.ReserveData | The reserve reserve to be updated     |
| scaledVariableDebt  | uint256                      | The scaled variable debt              |
| liquidityIndex      | uint256                      | The last stored liquidity index       |
| variableBorrowIndex | uint256                      | The last stored variable borrow index |
| timestamp           | uint40                       |                                       |

## SupplyLogic

Implements the logic to supply feature

### Deposit

```solidity
event Deposit(address user, address reserve, uint256 amount, address onBehalfOf, uint16 referral)
```

_Emitted on deposit()_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| user       | address | The address initiating the deposit                    |
| reserve    | address | The address of the underlying asset of the reserve    |
| amount     | uint256 | The amount deposited                                  |
| onBehalfOf | address | The beneficiary of the deposit, receiving the uTokens |
| referral   | uint16  | The referral code used                                |

### Withdraw

```solidity
event Withdraw(address user, address reserve, uint256 amount, address to)
```

_Emitted on withdraw()_

| Name    | Type    | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| user    | address | The address initiating the withdrawal, owner of uTokens |
| reserve | address | The address of the underlyng asset being withdrawn      |
| amount  | uint256 | The amount to be withdrawn                              |
| to      | address | Address that will receive the underlying                |

### executeDeposit

```solidity
function executeDeposit(mapping(address => struct DataTypes.ReserveData) reservesData, struct DataTypes.ExecuteDepositParams params) external
```

Implements the supply feature. Through `deposit()`, users deposit assets to the protocol.

_Emits the `Deposit()` event._

| Name         | Type                                                     | Description                                                      |
| ------------ | -------------------------------------------------------- | ---------------------------------------------------------------- |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                    |
| params       | struct DataTypes.ExecuteDepositParams                    | The additional parameters needed to execute the deposit function |

### executeWithdraw

```solidity
function executeWithdraw(mapping(address => struct DataTypes.ReserveData) reservesData, struct DataTypes.ExecuteWithdrawParams params) external returns (uint256)
```

Implements the withdraw feature. Through `withdraw()`, users withdraw assets from the protocol.

_Emits the `Withdraw()` event._

| Name         | Type                                                     | Description                                                       |
| ------------ | -------------------------------------------------------- | ----------------------------------------------------------------- |
| reservesData | mapping(address &#x3D;&gt; struct DataTypes.ReserveData) | The state of all the reserves                                     |
| params       | struct DataTypes.ExecuteWithdrawParams                   | The additional parameters needed to execute the withdraw function |

## ValidationLogic

Implements functions to validate the different actions of the protocol

### validateDeposit

```solidity
function validateDeposit(struct DataTypes.ReserveData reserve, uint256 amount) external view
```

_Validates a deposit action_

| Name    | Type                         | Description                                        |
| ------- | ---------------------------- | -------------------------------------------------- |
| reserve | struct DataTypes.ReserveData | The reserve object on which the user is depositing |
| amount  | uint256                      | The amount to be deposited                         |

### validateWithdraw

```solidity
function validateWithdraw(struct DataTypes.ReserveData reserveData, uint256 amount, uint256 userBalance) external view
```

_Validates a withdraw action_

| Name        | Type                         | Description                |
| ----------- | ---------------------------- | -------------------------- |
| reserveData | struct DataTypes.ReserveData | The reserve state          |
| amount      | uint256                      | The amount to be withdrawn |
| userBalance | uint256                      | The balance of the user    |

### ValidateBorrowLocalVars

```solidity
struct ValidateBorrowLocalVars {
  uint256 currentLtv;
  uint256 currentLiquidationThreshold;
  uint256 amountOfCollateralNeeded;
  uint256 userCollateralBalance;
  uint256 userBorrowBalance;
  uint256 availableLiquidity;
  uint256 healthFactor;
  bool isActive;
  bool isFrozen;
  bool borrowingEnabled;
  bool stableRateBorrowingEnabled;
  bool nftIsActive;
  bool nftIsFrozen;
  address loanReserveAsset;
  address loanBorrower;
}

```

### validateBorrow

```solidity
function validateBorrow(address user, address reserveAsset, uint256 amount, struct DataTypes.ReserveData reserveData, address nftAsset, uint256 tokenId, struct DataTypes.NftData nftData, address loanAddress, uint256 loanId, address reserveOracle, address nftOracle) external view
```

_Validates a borrow action_

| Name          | Type                         | Description                                        |
| ------------- | ---------------------------- | -------------------------------------------------- |
| user          | address                      |                                                    |
| reserveAsset  | address                      | The address of the asset to borrow                 |
| amount        | uint256                      | The amount to be borrowed                          |
| reserveData   | struct DataTypes.ReserveData | The reserve state from which the user is borrowing |
| nftAsset      | address                      |                                                    |
| tokenId       | uint256                      |                                                    |
| nftData       | struct DataTypes.NftData     | The state of the user for the specific nft         |
| loanAddress   | address                      |                                                    |
| loanId        | uint256                      |                                                    |
| reserveOracle | address                      |                                                    |
| nftOracle     | address                      |                                                    |

### validateRepay

```solidity
function validateRepay(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, uint256 amountSent, uint256 borrowAmount) external view
```

_Validates a repay action_

| Name         | Type                         | Description                                                           |
| ------------ | ---------------------------- | --------------------------------------------------------------------- |
| reserveData  | struct DataTypes.ReserveData | The reserve state from which the user is repaying                     |
| nftData      | struct DataTypes.NftData     |                                                                       |
| loanData     | struct DataTypes.LoanData    |                                                                       |
| amountSent   | uint256                      | The amount sent for the repayment. Can be an actual value or uint(-1) |
| borrowAmount | uint256                      | The borrow balance of the user                                        |

### validateAuction

```solidity
function validateAuction(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData) internal view
```

_Validates the auction action_

| Name        | Type                         | Description                        |
| ----------- | ---------------------------- | ---------------------------------- |
| reserveData | struct DataTypes.ReserveData | The reserve data of the principal  |
| nftData     | struct DataTypes.NftData     | The nft data of the underlying nft |
| loanData    | struct DataTypes.LoanData    |                                    |

### validateRedeem

```solidity
function validateRedeem(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData, uint256 amount) external view
```

_Validates a redeem action_

| Name        | Type                         | Description       |
| ----------- | ---------------------------- | ----------------- |
| reserveData | struct DataTypes.ReserveData | The reserve state |
| nftData     | struct DataTypes.NftData     | The nft state     |
| loanData    | struct DataTypes.LoanData    |                   |
| amount      | uint256                      |                   |

### validateLiquidate

```solidity
function validateLiquidate(struct DataTypes.ReserveData reserveData, struct DataTypes.NftData nftData, struct DataTypes.LoanData loanData) internal view
```

_Validates the liquidation action_

| Name        | Type                         | Description                         |
| ----------- | ---------------------------- | ----------------------------------- |
| reserveData | struct DataTypes.ReserveData | The reserve data of the principal   |
| nftData     | struct DataTypes.NftData     | The data of the underlying NFT      |
| loanData    | struct DataTypes.LoanData    | The loan data of the underlying NFT |

### validateTransfer

```solidity
function validateTransfer(address from, struct DataTypes.ReserveData reserveData) internal pure
```

_Validates an uToken transfer_

| Name        | Type                         | Description                                           |
| ----------- | ---------------------------- | ----------------------------------------------------- |
| from        | address                      | The user from which the uTokens are being transferred |
| reserveData | struct DataTypes.ReserveData | The state of the reserve                              |

## **Helper Contracts**

## NFTXHelper

Implements NFTX selling logic

### sellNFTX

```solidity
function sellNFTX(contract ILendPoolAddressesProvider addressesProvider, address nftAsset, uint256 nftTokenId, address reserveAsset) internal returns (uint256)
```

_Sells an asset in an NFTX liquid market_

| Name              | Type                                | Description                               |
| ----------------- | ----------------------------------- | ----------------------------------------- |
| addressesProvider | contract ILendPoolAddressesProvider | The addresses provider                    |
| nftAsset          | address                             | The underlying NFT address                |
| nftTokenId        | uint256                             | The underlying NFT token Id               |
| reserveAsset      | address                             | The reserve asset to exchange for the NFT |

## SushiSwapHelper

### swapExactETHForTokens

```solidity
function swapExactETHForTokens(contract ILendPoolAddressesProvider addressesProvider, uint256 amountInEth, address reserveAsset) internal returns (uint256)
```

## **Interfaces**

## IDebtToken

Defines the basic interface for a debt token.

### Initialized

```solidity
event Initialized(address underlyingAsset, address pool, address incentivesController, uint8 debtTokenDecimals, string debtTokenName, string debtTokenSymbol)
```

_Emitted when a debt token is initialized_

| Name                 | Type    | Description                              |
| -------------------- | ------- | ---------------------------------------- |
| underlyingAsset      | address | The address of the underlying asset      |
| pool                 | address | The address of the associated lend pool  |
| incentivesController | address | The address of the incentives controller |
| debtTokenDecimals    | uint8   | the decimals of the debt token           |
| debtTokenName        | string  | the name of the debt token               |
| debtTokenSymbol      | string  | the symbol of the debt token             |

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address underlyingAsset, uint8 debtTokenDecimals, string debtTokenName, string debtTokenSymbol) external
```

_Initializes the debt token._

| Name              | Type                                | Description                                                   |
| ----------------- | ----------------------------------- | ------------------------------------------------------------- |
| addressProvider   | contract ILendPoolAddressesProvider | The address of the lend pool                                  |
| underlyingAsset   | address                             | The address of the underlying asset                           |
| debtTokenDecimals | uint8                               | The decimals of the debtToken, same as the underlying asset's |
| debtTokenName     | string                              | The name of the token                                         |
| debtTokenSymbol   | string                              | The symbol of the token                                       |

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

| Name  | Type    | Description                     |
| ----- | ------- | ------------------------------- |
| from  | address | The address performing the mint |
| value | uint256 | The amount to be minted         |
| index | uint256 | The last index of the reserve   |

### mint

```solidity
function mint(address user, address onBehalfOf, uint256 amount, uint256 index) external returns (bool)
```

_Mints debt token to the `user` address_

| Name       | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| user       | address | The address receiving the borrowed underlying |
| onBehalfOf | address | The beneficiary of the mint                   |
| amount     | uint256 | The amount of debt being minted               |
| index      | uint256 | The variable debt index of the reserve        |

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| [0]  | bool | `true` if the the previous balance of the user is 0 |

### Burn

```solidity
event Burn(address user, uint256 amount, uint256 index)
```

_Emitted when variable debt is burnt_

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| user   | address | The user which debt has been burned |
| amount | uint256 | The amount of debt being burned     |
| index  | uint256 | The index of the user               |

### burn

```solidity
function burn(address user, uint256 amount, uint256 index) external
```

_Burns user variable debt_

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| user   | address | The user which debt is burnt           |
| amount | uint256 | The amount to be burnt                 |
| index  | uint256 | The variable debt index of the reserve |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### approveDelegation

```solidity
function approveDelegation(address delegatee, uint256 amount) external
```

_delegates borrowing power to a user on the specific debt token_

| Name      | Type    | Description                                                                                                                                                              |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| delegatee | address | the address receiving the delegated borrowing power                                                                                                                      |
| amount    | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

```solidity
function borrowAllowance(address fromUser, address toUser) external view returns (uint256)
```

_returns the borrow allowance of the user_

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| fromUser | address | The user to giving allowance  |
| toUser   | address | The user to give allowance to |

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | uint256 | the current allowance of toUser |

## IERC20Detailed

_Interface for the optional metadata functions from the ERC20 standard._

## IERC721Detailed

_Interface for the optional metadata functions from the ERC721 standard._

## IIncentivesController

### handleAction

```solidity
function handleAction(address asset, uint256 totalSupply, uint256 userBalance) external
```

_Called by the corresponding asset on any update that affects the rewards distribution_

| Name        | Type    | Description                                              |
| ----------- | ------- | -------------------------------------------------------- |
| asset       | address | The address of the user                                  |
| totalSupply | uint256 | The total supply of the asset in the lending pool        |
| userBalance | uint256 | The balance of the user of the asset in the lending pool |

## IInterestRate

_Interface for the calculation of the interest rates_

### baseVariableBorrowRate

```solidity
function baseVariableBorrowRate() external view returns (uint256)
```

_Get the variable borrow rate_

| Name | Type    | Description                   |
| ---- | ------- | ----------------------------- |
| [0]  | uint256 | the base variable borrow rate |

### getMaxVariableBorrowRate

```solidity
function getMaxVariableBorrowRate() external view returns (uint256)
```

_Get the maximum variable borrow rate_

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | uint256 | the maximum variable borrow rate |

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, uint256 availableLiquidity, uint256 totalVariableDebt, uint256 reserveFactor) external view returns (uint256, uint256)
```

_Calculates the interest rates depending on the reserve's state and configurations_

| Name               | Type    | Description                                                                 |
| ------------------ | ------- | --------------------------------------------------------------------------- |
| reserve            | address | The address of the reserve                                                  |
| availableLiquidity | uint256 | The available liquidity for the reserve                                     |
| totalVariableDebt  | uint256 | The total borrowed from the reserve at a variable rate                      |
| reserveFactor      | uint256 | The reserve portion of the interest that goes to the treasury of the market |

### calculateInterestRates

```solidity
function calculateInterestRates(address reserve, address uToken, uint256 liquidityAdded, uint256 liquidityTaken, uint256 totalVariableDebt, uint256 reserveFactor) external view returns (uint256 liquidityRate, uint256 variableBorrowRate)
```

_Calculates the interest rates depending on the reserve's state and configurations_

| Name              | Type    | Description                                                                 |
| ----------------- | ------- | --------------------------------------------------------------------------- |
| reserve           | address | The address of the reserve                                                  |
| uToken            | address | The uToken address                                                          |
| liquidityAdded    | uint256 | The liquidity added during the operation                                    |
| liquidityTaken    | uint256 | The liquidity taken during the operation                                    |
| totalVariableDebt | uint256 | The total borrowed from the reserve at a variable rate                      |
| reserveFactor     | uint256 | The reserve portion of the interest that goes to the treasury of the market |

## ILendPool

### Deposit

```solidity
event Deposit(address user, address reserve, uint256 amount, address onBehalfOf, uint16 referral)
```

_Emitted on deposit()_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| user       | address | The address initiating the deposit                    |
| reserve    | address | The address of the underlying asset of the reserve    |
| amount     | uint256 | The amount deposited                                  |
| onBehalfOf | address | The beneficiary of the deposit, receiving the uTokens |
| referral   | uint16  | The referral code used                                |

### Withdraw

```solidity
event Withdraw(address user, address reserve, uint256 amount, address to)
```

_Emitted on withdraw()_

| Name    | Type    | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| user    | address | The address initiating the withdrawal, owner of uTokens |
| reserve | address | The address of the underlyng asset being withdrawn      |
| amount  | uint256 | The amount to be withdrawn                              |
| to      | address | Address that will receive the underlying                |

### Borrow

```solidity
event Borrow(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint256 borrowRate, uint256 loanId, uint16 referral)
```

_Emitted on borrow() when loan needs to be opened_

| Name       | Type    | Description                                                          |
| ---------- | ------- | -------------------------------------------------------------------- |
| user       | address | The address of the user initiating the borrow(), receiving the funds |
| reserve    | address | The address of the underlying asset being borrowed                   |
| amount     | uint256 | The amount borrowed out                                              |
| nftAsset   | address | The address of the underlying NFT used as collateral                 |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral                |
| onBehalfOf | address | The address that will be getting the loan                            |
| borrowRate | uint256 |                                                                      |
| loanId     | uint256 |                                                                      |
| referral   | uint16  | The referral code used                                               |

### Repay

```solidity
event Repay(address user, address reserve, uint256 amount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on repay()_

| Name       | Type    | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| user       | address | The address of the user initiating the repay(), providing the funds |
| reserve    | address | The address of the underlying asset of the reserve                  |
| amount     | uint256 | The amount repaid                                                   |
| nftAsset   | address | The address of the underlying NFT used as collateral                |
| nftTokenId | uint256 | The token id of the underlying NFT used as collateral               |
| borrower   | address | The beneficiary of the repayment, getting his debt reduced          |
| loanId     | uint256 | The loan ID of the NFT loans                                        |

### Auction

```solidity
event Auction(address reserve, uint256 bidPrice, uint256 auctionDuration, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is auctioned._

| Name            | Type    | Description                                           |
| --------------- | ------- | ----------------------------------------------------- |
| reserve         | address | The address of the underlying asset of the reserve    |
| bidPrice        | uint256 | The start bid price of the underlying reserve         |
| auctionDuration | uint256 | Auction duration of the underlying reserve            |
| nftAsset        | address | The address of the underlying NFT used as collateral  |
| nftTokenId      | uint256 | The token id of the underlying NFT used as collateral |
| borrower        | address |                                                       |
| loanId          | uint256 | The loan ID of the NFT loans                          |

### Redeem

```solidity
event Redeem(address user, address reserve, uint256 borrowAmount, uint256 fineAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted on redeem()_

| Name         | Type    | Description                                                          |
| ------------ | ------- | -------------------------------------------------------------------- |
| user         | address | The address of the user initiating the redeem(), providing the funds |
| reserve      | address | The address of the underlying asset of the reserve                   |
| borrowAmount | uint256 | The borrow amount repaid                                             |
| fineAmount   | uint256 |                                                                      |
| nftAsset     | address | The address of the underlying NFT used as collateral                 |
| nftTokenId   | uint256 | The token id of the underlying NFT used as collateral                |
| borrower     | address |                                                                      |
| loanId       | uint256 | The loan ID of the NFT loans                                         |

### Liquidate

```solidity
event Liquidate(address user, address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated._

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| user         | address | The address of the user initiating the auction     |
| reserve      | address | The address of the underlying asset of the reserve |
| repayAmount  | uint256 | The amount of reserve repaid by the liquidator     |
| remainAmount | uint256 | The amount of reserve received by the borrower     |
| nftAsset     | address |                                                    |
| nftTokenId   | uint256 |                                                    |
| borrower     | address |                                                    |
| loanId       | uint256 | The loan ID of the NFT loans                       |

### LiquidateNFTX

```solidity
event LiquidateNFTX(address reserve, uint256 repayAmount, uint256 remainAmount, address nftAsset, uint256 nftTokenId, address borrower, uint256 loanId)
```

_Emitted when a borrower's loan is liquidated on NFTX._

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| reserve      | address | The address of the underlying asset of the reserve |
| repayAmount  | uint256 | The amount of reserve repaid by the liquidator     |
| remainAmount | uint256 | The amount of reserve received by the borrower     |
| nftAsset     | address |                                                    |
| nftTokenId   | uint256 |                                                    |
| borrower     | address |                                                    |
| loanId       | uint256 | The loan ID of the NFT loans                       |

### Paused

```solidity
event Paused()
```

_Emitted when the pause is triggered._

### Unpaused

```solidity
event Unpaused()
```

_Emitted when the pause is lifted._

### ReserveDataUpdated

```solidity
event ReserveDataUpdated(address reserve, uint256 liquidityRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)
```

_Emitted when the state of a reserve is updated. NOTE: This event is actually declared
in the ReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
the event will actually be fired by the LendPool contract. The event is therefore replicated here so it
gets added to the LendPool ABI_

| Name                | Type    | Description                                        |
| ------------------- | ------- | -------------------------------------------------- |
| reserve             | address | The address of the underlying asset of the reserve |
| liquidityRate       | uint256 | The new liquidity rate                             |
| variableBorrowRate  | uint256 | The new variable borrow rate                       |
| liquidityIndex      | uint256 | The new liquidity index                            |
| variableBorrowIndex | uint256 | The new variable borrow index                      |

### deposit

```solidity
function deposit(address reserve, uint256 amount, address onBehalfOf, uint16 referralCode) external
```

\_Deposits an `amount` of underlying asset into the reserve, receiving in return overlying uTokens.

- E.g. User deposits 100 USDC and gets in return 100 uusdc\_

| Name         | Type    | Description                                                                                                                                                                                   |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserve      | address | The address of the underlying asset to deposit                                                                                                                                                |
| amount       | uint256 | The amount to be deposited                                                                                                                                                                    |
| onBehalfOf   | address | The address that will receive the uTokens, same as msg.sender if the user wants to receive them on his own wallet, or a different address if the beneficiary of uTokens is a different wallet |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                               |

### withdraw

```solidity
function withdraw(address reserve, uint256 amount, address to) external returns (uint256)
```

_Withdraws an `amount` of underlying asset from the reserve, burning the equivalent uTokens owned
E.g. User has 100 uusdc, calls withdraw() and receives 100 USDC, burning the 100 uusdc_

| Name    | Type    | Description                                                                                                                                                                     |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserve | address | The address of the underlying asset to withdraw                                                                                                                                 |
| amount  | uint256 | The underlying amount to be withdrawn - Send the value type(uint256).max in order to withdraw the whole uToken balance                                                          |
| to      | address | Address that will receive the underlying, same as msg.sender if the user wants to receive it on his own wallet, or a different address if the beneficiary is a different wallet |

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | uint256 | The final amount withdrawn |

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserveAsset | address | The address of the underlying asset to borrow                                                                                                                                                                                                              |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| nftAsset     | address | The address of the underlying NFT used as collateral                                                                                                                                                                                                       |
| nftTokenId   | uint256 | The token ID of the underlying NFT used as collateral                                                                                                                                                                                                      |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### repay

```solidity
function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific reserve, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay                                   |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId) external
```

\_Function to auction a non-healthy position collateral-wise

- The caller (liquidator) want to buy collateral asset of the user getting liquidated\_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### redeem

```solidity
function redeem(address nftAsset, uint256 nftTokenId, uint256 amount) external returns (uint256)
```

Redeem a NFT loan which state is in Auction

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay the debt                          |

### liquidateNFTX

```solidity
function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256)
```

\_Function to liquidate a non-healthy position collateral-wise

- The collateral asset is sold on NFTX & Sushiswap\_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### finalizeTransfer

```solidity
function finalizeTransfer(address asset, address from, address to, uint256 amount, uint256 balanceFromBefore, uint256 balanceToBefore) external view
```

\_Validates and finalizes an uToken transfer

- Only callable by the overlying uToken of the `asset`\_

| Name              | Type    | Description                                               |
| ----------------- | ------- | --------------------------------------------------------- |
| asset             | address | The address of the underlying asset of the uToken         |
| from              | address | The user from which the uTokens are transferred           |
| to                | address | The user receiving the uTokens                            |
| amount            | uint256 | The amount being transferred/withdrawn                    |
| balanceFromBefore | uint256 | The uToken balance of the `from` user before the transfer |
| balanceToBefore   | uint256 | The uToken balance of the `to` user before the transfer   |

### getReserveConfiguration

```solidity
function getReserveConfiguration(address asset) external view returns (struct DataTypes.ReserveConfigurationMap)
```

_Returns the configuration of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type                                     | Description                      |
| ---- | ---------------------------------------- | -------------------------------- |
| [0]  | struct DataTypes.ReserveConfigurationMap | The configuration of the reserve |

### getNftConfiguration

```solidity
function getNftConfiguration(address asset) external view returns (struct DataTypes.NftConfigurationMap)
```

_Returns the configuration of the NFT_

| Name  | Type    | Description                         |
| ----- | ------- | ----------------------------------- |
| asset | address | The address of the asset of the NFT |

| Name | Type                                 | Description                  |
| ---- | ------------------------------------ | ---------------------------- |
| [0]  | struct DataTypes.NftConfigurationMap | The configuration of the NFT |

### getReserveNormalizedIncome

```solidity
function getReserveNormalizedIncome(address asset) external view returns (uint256)
```

_Returns the normalized income normalized income of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | uint256 | The reserve's normalized income |

### getReserveNormalizedVariableDebt

```solidity
function getReserveNormalizedVariableDebt(address asset) external view returns (uint256)
```

_Returns the normalized variable debt per unit of asset_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| [0]  | uint256 | The reserve normalized variable debt |

### getReserveData

```solidity
function getReserveData(address asset) external view returns (struct DataTypes.ReserveData)
```

_Returns the state and configuration of the reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

| Name | Type                         | Description              |
| ---- | ---------------------------- | ------------------------ |
| [0]  | struct DataTypes.ReserveData | The state of the reserve |

### getReservesList

```solidity
function getReservesList() external view returns (address[])
```

_Returns the list of the initialized reserves_

| Name | Type      | Description                      |
| ---- | --------- | -------------------------------- |
| [0]  | address[] | the list of initialized reserves |

### getNftData

```solidity
function getNftData(address asset) external view returns (struct DataTypes.NftData)
```

_Returns the state and configuration of the nft_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the nft |

| Name | Type                     | Description           |
| ---- | ------------------------ | --------------------- |
| [0]  | struct DataTypes.NftData | The status of the nft |

### getNftCollateralData

```solidity
function getNftCollateralData(address nftAsset, uint256 nftTokenId, address reserveAsset) external view returns (uint256 totalCollateralInETH, uint256 totalCollateralInReserve, uint256 availableBorrowsInETH, uint256 availableBorrowsInReserve, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Returns the loan data of the NFT_

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| nftAsset     | address | The address of the NFT     |
| nftTokenId   | uint256 |                            |
| reserveAsset | address | The address of the Reserve |

| Name                      | Type    | Description                                |
| ------------------------- | ------- | ------------------------------------------ |
| totalCollateralInETH      | uint256 | the total collateral in ETH of the NFT     |
| totalCollateralInReserve  | uint256 | the total collateral in Reserve of the NFT |
| availableBorrowsInETH     | uint256 | the borrowing power in ETH of the NFT      |
| availableBorrowsInReserve | uint256 | the borrowing power in Reserve of the NFT  |
| ltv                       | uint256 | the loan to value of the user              |
| liquidationThreshold      | uint256 | the liquidation threshold of the NFT       |
| liquidationBonus          | uint256 | the liquidation bonus of the NFT           |

### getNftDebtData

```solidity
function getNftDebtData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, address reserveAsset, uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 healthFactor)
```

_Returns the debt data of the NFT_

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| nftAsset   | address | The address of the NFT  |
| nftTokenId | uint256 | The token id of the NFT |

| Name             | Type    | Description                          |
| ---------------- | ------- | ------------------------------------ |
| loanId           | uint256 | the loan id of the NFT               |
| reserveAsset     | address | the address of the Reserve           |
| totalCollateral  | uint256 | the total power of the NFT           |
| totalDebt        | uint256 | the total debt of the NFT            |
| availableBorrows | uint256 | the borrowing power left of the NFT  |
| healthFactor     | uint256 | the current health factor of the NFT |

### getNftAuctionData

```solidity
function getNftAuctionData(address nftAsset, uint256 nftTokenId) external view returns (uint256 loanId, uint256 auctionStartTimestamp, address reserveAsset, uint256 minBidPrice)
```

_Returns the auction data of the NFT_

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| nftAsset   | address | The address of the NFT  |
| nftTokenId | uint256 | The token id of the NFT |

| Name                  | Type    | Description                      |
| --------------------- | ------- | -------------------------------- |
| loanId                | uint256 | the loan id of the NFT           |
| auctionStartTimestamp | uint256 | the timestamp of auction start   |
| reserveAsset          | address | the reserve asset of buy offers  |
| minBidPrice           | uint256 | the min bid price of the auction |

### getNftLiquidatePrice

```solidity
function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId) external view returns (uint256 liquidatePrice, uint256 paybackAmount)
```

_Returns the state and configuration of the nft_

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| nftAsset   | address | The address of the underlying asset of the nft |
| nftTokenId | uint256 |                                                |

### getNftsList

```solidity
function getNftsList() external view returns (address[])
```

_Returns the list of nft addresses in the protocol_

### setPause

```solidity
function setPause(bool val) external
```

\_Set the \_pause state of a reserve

- Only callable by the LendPool contract\_

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| val  | bool | `true` to pause the reserve, `false` to un-pause it |

### paused

```solidity
function paused() external view returns (bool)
```

_Returns if the LendPool is paused_

### getAddressesProvider

```solidity
function getAddressesProvider() external view returns (contract ILendPoolAddressesProvider)
```

_Returns the cached LendPoolAddressesProvider connected to this contract_

### initReserve

```solidity
function initReserve(address asset, address uTokenAddress, address debtTokenAddress, address interestRateAddress) external
```

\_Initializes a reserve, activating it, assigning an uToken and nft loan and an
interest rate strategy

- Only callable by the LendPoolConfigurator contract\_

| Name                | Type    | Description                                                       |
| ------------------- | ------- | ----------------------------------------------------------------- |
| asset               | address | The address of the underlying asset of the reserve                |
| uTokenAddress       | address | The address of the uToken that will be assigned to the reserve    |
| debtTokenAddress    | address | The address of the debtToken that will be assigned to the reserve |
| interestRateAddress | address | The address of the interest rate strategy contract                |

### initNft

```solidity
function initNft(address asset, address uNftAddress) external
```

\_Initializes a nft, activating it, assigning nft loan and an
interest rate strategy

- Only callable by the LendPoolConfigurator contract\_

| Name        | Type    | Description                                    |
| ----------- | ------- | ---------------------------------------------- |
| asset       | address | The address of the underlying asset of the nft |
| uNftAddress | address |                                                |

### setReserveInterestRateAddress

```solidity
function setReserveInterestRateAddress(address asset, address rateAddress) external
```

\_Updates the address of the interest rate strategy contract

- Only callable by the LendPoolConfigurator contract\_

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| asset       | address | The address of the underlying asset of the reserve |
| rateAddress | address | The address of the interest rate strategy contract |

### setReserveConfiguration

```solidity
function setReserveConfiguration(address asset, uint256 configuration) external
```

\_Sets the configuration bitmap of the reserve as a whole

- Only callable by the LendPoolConfigurator contract\_

| Name          | Type    | Description                                        |
| ------------- | ------- | -------------------------------------------------- |
| asset         | address | The address of the underlying asset of the reserve |
| configuration | uint256 | The new configuration bitmap                       |

### setNftConfiguration

```solidity
function setNftConfiguration(address asset, uint256 configuration) external
```

\_Sets the configuration bitmap of the NFT as a whole

- Only callable by the LendPoolConfigurator contract\_

| Name          | Type    | Description                         |
| ------------- | ------- | ----------------------------------- |
| asset         | address | The address of the asset of the NFT |
| configuration | uint256 | The new configuration bitmap        |

### setNftMaxSupplyAndTokenId

```solidity
function setNftMaxSupplyAndTokenId(address asset, uint256 maxSupply, uint256 maxTokenId) external
```

_Sets the max supply and token ID for a given asset_

| Name       | Type    | Description                 |
| ---------- | ------- | --------------------------- |
| asset      | address | The address to set the data |
| maxSupply  | uint256 | The max supply value        |
| maxTokenId | uint256 | The max token ID value      |

### setMaxNumberOfReserves

```solidity
function setMaxNumberOfReserves(uint256 val) external
```

_Sets the max number of reserves in the protocol_

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| val  | uint256 | the value to set the max number of reserves |

### setMaxNumberOfNfts

```solidity
function setMaxNumberOfNfts(uint256 val) external
```

_Sets the max number of NFTs in the protocol_

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| val  | uint256 | the value to set the max number of NFTs |

### setLiquidateFeePercentage

```solidity
function setLiquidateFeePercentage(uint256 percentage) external
```

_Sets the fee percentage for liquidations_

| Name       | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| percentage | uint256 | the fee percentage to be set |

### getMaxNumberOfReserves

```solidity
function getMaxNumberOfReserves() external view returns (uint256)
```

_Returns the maximum number of reserves supported to be listed in this LendPool_

### getMaxNumberOfNfts

```solidity
function getMaxNumberOfNfts() external view returns (uint256)
```

_Returns the maximum number of nfts supported to be listed in this LendPool_

### getLiquidateFeePercentage

```solidity
function getLiquidateFeePercentage() external view returns (uint256)
```

_Returns the fee percentage for liquidations_

## ILendPoolAddressesProvider

\_Main registry of addresses part of or connected to the protocol, including permissioned roles

- Acting also as factory of proxies and admin of those, so with right to change its implementations
- Owned by the Unlockd Governance\_

### MarketIdSet

```solidity
event MarketIdSet(string newMarketId)
```

### LendPoolUpdated

```solidity
event LendPoolUpdated(address newAddress, bytes encodedCallData)
```

### ConfigurationAdminUpdated

```solidity
event ConfigurationAdminUpdated(address newAddress)
```

### EmergencyAdminUpdated

```solidity
event EmergencyAdminUpdated(address newAddress)
```

### LendPoolConfiguratorUpdated

```solidity
event LendPoolConfiguratorUpdated(address newAddress, bytes encodedCallData)
```

### ReserveOracleUpdated

```solidity
event ReserveOracleUpdated(address newAddress)
```

### NftOracleUpdated

```solidity
event NftOracleUpdated(address newAddress)
```

### LendPoolLoanUpdated

```solidity
event LendPoolLoanUpdated(address newAddress, bytes encodedCallData)
```

### ProxyCreated

```solidity
event ProxyCreated(bytes32 id, address newAddress)
```

### AddressSet

```solidity
event AddressSet(bytes32 id, address newAddress, bool hasProxy, bytes encodedCallData)
```

### UNFTRegistryUpdated

```solidity
event UNFTRegistryUpdated(address newAddress)
```

### IncentivesControllerUpdated

```solidity
event IncentivesControllerUpdated(address newAddress)
```

### UIDataProviderUpdated

```solidity
event UIDataProviderUpdated(address newAddress)
```

### UnlockdDataProviderUpdated

```solidity
event UnlockdDataProviderUpdated(address newAddress)
```

### WalletBalanceProviderUpdated

```solidity
event WalletBalanceProviderUpdated(address newAddress)
```

### NFTXVaultFactoryUpdated

```solidity
event NFTXVaultFactoryUpdated(address newAddress)
```

### SushiSwapRouterUpdated

```solidity
event SushiSwapRouterUpdated(address newAddress)
```

### LendPoolLiquidatorUpdated

```solidity
event LendPoolLiquidatorUpdated(address newAddress)
```

### getMarketId

```solidity
function getMarketId() external view returns (string)
```

_Returns the id of the Unlockd market to which this contracts points to_

| Name | Type   | Description   |
| ---- | ------ | ------------- |
| [0]  | string | The market id |

### setMarketId

```solidity
function setMarketId(string marketId) external
```

_Allows to set the market which this LendPoolAddressesProvider represents_

| Name     | Type   | Description   |
| -------- | ------ | ------------- |
| marketId | string | The market id |

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external
```

_Sets an address for an id replacing the address saved in the addresses map
IMPORTANT Use this function carefully, as it will do a hard replacement_

| Name       | Type    | Description        |
| ---------- | ------- | ------------------ |
| id         | bytes32 | The id             |
| newAddress | address | The address to set |

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address impl, bytes encodedCallData) external
```

_General function to update the implementation of a proxy registered with
certain `id`. If there is no proxy registered, it will instantiate one and
set as implementation the `implementationAddress`
IMPORTANT Use this function carefully, only for ids that don't have an explicit
setter function, in order to avoid unexpected consequences_

| Name            | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| id              | bytes32 | The id                                |
| impl            | address | The address of the new implementation |
| encodedCallData | bytes   |                                       |

### getAddress

```solidity
function getAddress(bytes32 id) external view returns (address)
```

_Returns an address by id_

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | address | The address |

### getLendPool

```solidity
function getLendPool() external view returns (address)
```

_Returns the address of the LendPool proxy_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | The LendPool proxy address |

### setLendPoolImpl

```solidity
function setLendPoolImpl(address pool, bytes encodedCallData) external
```

_Updates the implementation of the LendPool, or creates the proxy
setting the new `pool` implementation on the first time calling it_

| Name            | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| pool            | address | The new LendPool implementation |
| encodedCallData | bytes   | calldata to execute             |

### getLendPoolConfigurator

```solidity
function getLendPoolConfigurator() external view returns (address)
```

_Returns the address of the LendPoolConfigurator proxy_

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| [0]  | address | The LendPoolConfigurator proxy address |

### setLendPoolConfiguratorImpl

```solidity
function setLendPoolConfiguratorImpl(address configurator, bytes encodedCallData) external
```

_Updates the implementation of the LendPoolConfigurator, or creates the proxy
setting the new `configurator` implementation on the first time calling it_

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| configurator    | address | The new LendPoolConfigurator implementation |
| encodedCallData | bytes   | calldata to execute                         |

### getPoolAdmin

```solidity
function getPoolAdmin() external view returns (address)
```

_returns the address of the LendPool admin_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the LendPoolAdmin address |

### setPoolAdmin

```solidity
function setPoolAdmin(address admin) external
```

_sets the address of the LendPool admin_

| Name  | Type    | Description               |
| ----- | ------- | ------------------------- |
| admin | address | the LendPoolAdmin address |

### getEmergencyAdmin

```solidity
function getEmergencyAdmin() external view returns (address)
```

_returns the address of the emergency admin_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the EmergencyAdmin address |

### setEmergencyAdmin

```solidity
function setEmergencyAdmin(address admin) external
```

_sets the address of the emergency admin_

| Name  | Type    | Description                |
| ----- | ------- | -------------------------- |
| admin | address | the EmergencyAdmin address |

### getReserveOracle

```solidity
function getReserveOracle() external view returns (address)
```

_returns the address of the reserve oracle_

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | address | the ReserveOracle address |

### setReserveOracle

```solidity
function setReserveOracle(address reserveOracle) external
```

_sets the address of the reserve oracle_

| Name          | Type    | Description               |
| ------------- | ------- | ------------------------- |
| reserveOracle | address | the ReserveOracle address |

### getNFTOracle

```solidity
function getNFTOracle() external view returns (address)
```

_returns the address of the NFT oracle_

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | address | the NFTOracle address |

### setNFTOracle

```solidity
function setNFTOracle(address nftOracle) external
```

_sets the address of the NFT oracle_

| Name      | Type    | Description           |
| --------- | ------- | --------------------- |
| nftOracle | address | the NFTOracle address |

### getLendPoolLoan

```solidity
function getLendPoolLoan() external view returns (address)
```

_returns the address of the lendpool loan_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the LendPoolLoan address |

### setLendPoolLoanImpl

```solidity
function setLendPoolLoanImpl(address loan, bytes encodedCallData) external
```

_sets the address of the lendpool loan_

| Name            | Type    | Description              |
| --------------- | ------- | ------------------------ |
| loan            | address | the LendPoolLoan address |
| encodedCallData | bytes   | calldata to execute      |

### getUNFTRegistry

```solidity
function getUNFTRegistry() external view returns (address)
```

_returns the address of the UNFT Registry_

| Name | Type    | Description              |
| ---- | ------- | ------------------------ |
| [0]  | address | the UNFTRegistry address |

### setUNFTRegistry

```solidity
function setUNFTRegistry(address factory) external
```

_sets the address of the UNFT registry_

| Name    | Type    | Description              |
| ------- | ------- | ------------------------ |
| factory | address | the UNFTRegistry address |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (address)
```

_returns the address of the incentives controller_

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | address | the IncentivesController address |

### setIncentivesController

```solidity
function setIncentivesController(address controller) external
```

_sets the address of the incentives controller_

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| controller | address | the IncentivesController address |

### getUIDataProvider

```solidity
function getUIDataProvider() external view returns (address)
```

_returns the address of the UI data provider_

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| [0]  | address | the UIDataProvider address |

### setUIDataProvider

```solidity
function setUIDataProvider(address provider) external
```

_sets the address of the UI data provider_

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| provider | address | the UIDataProvider address |

### getUnlockdDataProvider

```solidity
function getUnlockdDataProvider() external view returns (address)
```

_returns the address of the Unlockd data provider_

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | address | the UnlockdDataProvider address |

### setUnlockdDataProvider

```solidity
function setUnlockdDataProvider(address provider) external
```

_sets the address of the Unlockd data provider_

| Name     | Type    | Description                     |
| -------- | ------- | ------------------------------- |
| provider | address | the UnlockdDataProvider address |

### getWalletBalanceProvider

```solidity
function getWalletBalanceProvider() external view returns (address)
```

_returns the address of the wallet balance provider_

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | address | the WalletBalanceProvider address |

### setWalletBalanceProvider

```solidity
function setWalletBalanceProvider(address provider) external
```

_sets the address of the wallet balance provider_

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| provider | address | the WalletBalanceProvider address |

### getNFTXVaultFactory

```solidity
function getNFTXVaultFactory() external view returns (address)
```

_returns the address of the NFTXVault Factory contract_

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address factory) external
```

_sets the address of the NFTXVault Factory contract_

| Name    | Type    | Description                   |
| ------- | ------- | ----------------------------- |
| factory | address | the NFTXVault Factory address |

### getSushiSwapRouter

```solidity
function getSushiSwapRouter() external view returns (address)
```

_returns the address of the SushiSwap router contract_

### setSushiSwapRouter

```solidity
function setSushiSwapRouter(address router) external
```

_sets the address of the SushiSwap router contract_

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| router | address | the SushiSwap router address |

### getLendPoolLiquidator

```solidity
function getLendPoolLiquidator() external view returns (address)
```

_returns the address of the LendPool liquidator contract_

### setLendPoolLiquidator

```solidity
function setLendPoolLiquidator(address liquidator) external
```

_sets the address of the LendPool liquidator contract_

| Name       | Type    | Description                     |
| ---------- | ------- | ------------------------------- |
| liquidator | address | the LendPool liquidator address |

## ILendPoolAddressesProviderRegistry

\_Main registry of LendPoolAddressesProvider of multiple Unlockd protocol's markets

- Used for indexing purposes of Unlockd protocol's markets
- The id assigned to a LendPoolAddressesProvider refers to the market it is connected with,
  for example with `1` for the Unlockd main market and `2` for the next created\_

### AddressesProviderRegistered

```solidity
event AddressesProviderRegistered(address newAddress)
```

### AddressesProviderUnregistered

```solidity
event AddressesProviderUnregistered(address newAddress)
```

### getAddressesProvidersList

```solidity
function getAddressesProvidersList() external view returns (address[])
```

### getAddressesProviderIdByAddress

```solidity
function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256)
```

### registerAddressesProvider

```solidity
function registerAddressesProvider(address provider, uint256 id) external
```

### unregisterAddressesProvider

```solidity
function unregisterAddressesProvider(address provider) external
```

## ILendPoolConfigurator

### ConfigReserveInput

```solidity
struct ConfigReserveInput {
  address asset;
  uint256 reserveFactor;
}

```

### ConfigNftInput

```solidity
struct ConfigNftInput {
  address asset;
  uint256 baseLTV;
  uint256 liquidationThreshold;
  uint256 liquidationBonus;
  uint256 redeemDuration;
  uint256 auctionDuration;
  uint256 redeemFine;
  uint256 redeemThreshold;
  uint256 minBidFine;
  uint256 maxSupply;
  uint256 maxTokenId;
}

```

### ReserveInitialized

```solidity
event ReserveInitialized(address asset, address uToken, address debtToken, address interestRateAddress)
```

_Emitted when a reserve is initialized._

| Name                | Type    | Description                                               |
| ------------------- | ------- | --------------------------------------------------------- |
| asset               | address | The address of the underlying asset of the reserve        |
| uToken              | address | The address of the associated uToken contract             |
| debtToken           | address | The address of the associated debtToken contract          |
| interestRateAddress | address | The address of the interest rate strategy for the reserve |

### BorrowingEnabledOnReserve

```solidity
event BorrowingEnabledOnReserve(address asset)
```

_Emitted when borrowing is enabled on a reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### BorrowingDisabledOnReserve

```solidity
event BorrowingDisabledOnReserve(address asset)
```

_Emitted when borrowing is disabled on a reserve_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveActivated

```solidity
event ReserveActivated(address asset)
```

_Emitted when a reserve is activated_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveDeactivated

```solidity
event ReserveDeactivated(address asset)
```

_Emitted when a reserve is deactivated_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveFrozen

```solidity
event ReserveFrozen(address asset)
```

_Emitted when a reserve is frozen_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveUnfrozen

```solidity
event ReserveUnfrozen(address asset)
```

_Emitted when a reserve is unfrozen_

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### ReserveFactorChanged

```solidity
event ReserveFactorChanged(address asset, uint256 factor)
```

_Emitted when a reserve factor is updated_

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| asset  | address | The address of the underlying asset of the reserve |
| factor | uint256 | The new reserve factor                             |

### ReserveDecimalsChanged

```solidity
event ReserveDecimalsChanged(address asset, uint256 decimals)
```

_Emitted when the reserve decimals are updated_

| Name     | Type    | Description                                        |
| -------- | ------- | -------------------------------------------------- |
| asset    | address | The address of the underlying asset of the reserve |
| decimals | uint256 | The new decimals                                   |

### ReserveInterestRateChanged

```solidity
event ReserveInterestRateChanged(address asset, address strategy)
```

_Emitted when a reserve interest strategy contract is updated_

| Name     | Type    | Description                                        |
| -------- | ------- | -------------------------------------------------- |
| asset    | address | The address of the underlying asset of the reserve |
| strategy | address | The new address of the interest strategy contract  |

### NftInitialized

```solidity
event NftInitialized(address asset, address uNft)
```

_Emitted when a nft is initialized._

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the nft |
| uNft  | address | The address of the associated uNFT contract    |

### NftConfigurationChanged

```solidity
event NftConfigurationChanged(address asset, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)
```

_Emitted when the collateralization risk parameters for the specified NFT are updated._

| Name                 | Type    | Description                                                                                 |
| -------------------- | ------- | ------------------------------------------------------------------------------------------- |
| asset                | address | The address of the underlying asset of the NFT                                              |
| ltv                  | uint256 | The loan to value of the asset when used as NFT                                             |
| liquidationThreshold | uint256 | The threshold at which loans using this asset as NFT will be considered undercollateralized |
| liquidationBonus     | uint256 | The bonus liquidators receive to liquidate this asset                                       |

### NftActivated

```solidity
event NftActivated(address asset)
```

_Emitted when a NFT is activated_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the NFT |

### NftDeactivated

```solidity
event NftDeactivated(address asset)
```

_Emitted when a NFT is deactivated_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the NFT |

### NftFrozen

```solidity
event NftFrozen(address asset)
```

_Emitted when a NFT is frozen_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the NFT |

### NftUnfrozen

```solidity
event NftUnfrozen(address asset)
```

_Emitted when a NFT is unfrozen_

| Name  | Type    | Description                                    |
| ----- | ------- | ---------------------------------------------- |
| asset | address | The address of the underlying asset of the NFT |

### NftAuctionChanged

```solidity
event NftAuctionChanged(address asset, uint256 redeemDuration, uint256 auctionDuration, uint256 redeemFine)
```

_Emitted when a redeem duration is updated_

| Name            | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| asset           | address | The address of the underlying asset of the NFT |
| redeemDuration  | uint256 | The new redeem duration                        |
| auctionDuration | uint256 | The new redeem duration                        |
| redeemFine      | uint256 | The new redeem fine                            |

### NftRedeemThresholdChanged

```solidity
event NftRedeemThresholdChanged(address asset, uint256 redeemThreshold)
```

_Emitted when a redeem threshold is modified_

| Name            | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| asset           | address | The address of the underlying asset of the NFT |
| redeemThreshold | uint256 | The new redeem threshold                       |

### NftMinBidFineChanged

```solidity
event NftMinBidFineChanged(address asset, uint256 minBidFine)
```

_Emitted when a min bid fine is modified_

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| asset      | address | The address of the underlying asset of the NFT |
| minBidFine | uint256 | The new min bid fine                           |

### NftMaxSupplyAndTokenIdChanged

```solidity
event NftMaxSupplyAndTokenIdChanged(address asset, uint256 maxSupply, uint256 maxTokenId)
```

_Emitted when an asset's max supply and max token Id is modified_

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| asset      | address | The address of the underlying asset of the NFT |
| maxSupply  | uint256 | The new max supply                             |
| maxTokenId | uint256 | The new max token Id                           |

### UTokenUpgraded

```solidity
event UTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when an uToken implementation is upgraded_

| Name           | Type    | Description                                        |
| -------------- | ------- | -------------------------------------------------- |
| asset          | address | The address of the underlying asset of the reserve |
| proxy          | address | The uToken proxy address                           |
| implementation | address | The new uToken implementation                      |

### DebtTokenUpgraded

```solidity
event DebtTokenUpgraded(address asset, address proxy, address implementation)
```

_Emitted when the implementation of a debt token is upgraded_

| Name           | Type    | Description                                        |
| -------------- | ------- | -------------------------------------------------- |
| asset          | address | The address of the underlying asset of the reserve |
| proxy          | address | The debt token proxy address                       |
| implementation | address | The new debtToken implementation                   |

## ILendPoolLoan

### Initialized

```solidity
event Initialized(address pool)
```

_Emitted on initialization to share location of dependent notes_

| Name | Type    | Description                             |
| ---- | ------- | --------------------------------------- |
| pool | address | The address of the associated lend pool |

### LoanCreated

```solidity
event LoanCreated(address user, address onBehalfOf, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex)
```

_Emitted when a loan is created_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| user         | address | The address initiating the action |
| onBehalfOf   | address |                                   |
| loanId       | uint256 |                                   |
| nftAsset     | address |                                   |
| nftTokenId   | uint256 |                                   |
| reserveAsset | address |                                   |
| amount       | uint256 |                                   |
| borrowIndex  | uint256 |                                   |

### LoanUpdated

```solidity
event LoanUpdated(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex)
```

_Emitted when a loan is updated_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| user         | address | The address initiating the action |
| loanId       | uint256 |                                   |
| nftAsset     | address |                                   |
| nftTokenId   | uint256 |                                   |
| reserveAsset | address |                                   |
| amountAdded  | uint256 |                                   |
| amountTaken  | uint256 |                                   |
| borrowIndex  | uint256 |                                   |

### LoanRepaid

```solidity
event LoanRepaid(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex)
```

_Emitted when a loan is repaid by the borrower_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| user         | address | The address initiating the action |
| loanId       | uint256 |                                   |
| nftAsset     | address |                                   |
| nftTokenId   | uint256 |                                   |
| reserveAsset | address |                                   |
| amount       | uint256 |                                   |
| borrowIndex  | uint256 |                                   |

### LoanAuctioned

```solidity
event LoanAuctioned(uint256 loanId, address nftAsset, uint256 nftTokenId, uint256 amount, uint256 borrowIndex, uint256 price)
```

_Emitted when a loan is auction by the liquidator_

### LoanRedeemed

```solidity
event LoanRedeemed(address user, uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amountTaken, uint256 borrowIndex)
```

_Emitted when a loan is redeemed_

| Name         | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| user         | address | The address initiating the action |
| loanId       | uint256 |                                   |
| nftAsset     | address |                                   |
| nftTokenId   | uint256 |                                   |
| reserveAsset | address |                                   |
| amountTaken  | uint256 |                                   |
| borrowIndex  | uint256 |                                   |

### LoanLiquidatedNFTX

```solidity
event LoanLiquidatedNFTX(uint256 loanId, address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 amount, uint256 borrowIndex, uint256 sellPrice)
```

_Emitted when a loan is liquidate on NFTX_

### initNft

```solidity
function initNft(address nftAsset, address uNftAddress) external
```

### createLoan

```solidity
function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)
```

_Create store a loan object with some params_

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| initiator    | address | The address of the user initiating the borrow |
| onBehalfOf   | address | The address receiving the loan                |
| nftAsset     | address | The address of the underlying NFT asset       |
| nftTokenId   | uint256 | The token Id of the underlying NFT asset      |
| uNftAddress  | address | The address of the uNFT token                 |
| reserveAsset | address | The address of the underlying reserve asset   |
| amount       | uint256 | The loan amount                               |
| borrowIndex  | uint256 | The index to get the scaled loan amount       |

### updateLoan

```solidity
function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external
```

\_Update the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Active\_

| Name        | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| initiator   | address | The address of the user updating the loan |
| loanId      | uint256 | The loan ID                               |
| amountAdded | uint256 | The amount added to the loan              |
| amountTaken | uint256 | The amount taken from the loan            |
| borrowIndex | uint256 | The index to get the scaled loan amount   |

### repayLoan

```solidity
function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external
```

\_Repay the given loan

Requirements:

- The caller must be a holder of the loan
- The caller must send in principal + interest
- The loan must be in state Active\_

| Name        | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| initiator   | address | The address of the user initiating the repay |
| loanId      | uint256 | The loan getting burned                      |
| uNftAddress | address | The address of uNFT                          |
| amount      | uint256 | The amount repaid                            |
| borrowIndex | uint256 | The index to get the scaled loan amount      |

### auctionLoan

```solidity
function auctionLoan(uint256 loanId, address uNftAddress, uint256 minBidPrice, uint256 borrowAmount, uint256 borrowIndex) external
```

\_Auction the given loan

Requirements:

- The loan must be in state Active\_

| Name         | Type    | Description                         |
| ------------ | ------- | ----------------------------------- |
| loanId       | uint256 | The loan getting auctioned          |
| uNftAddress  | address | The address of uNFT                 |
| minBidPrice  | uint256 | The start bid price of this auction |
| borrowAmount | uint256 |                                     |
| borrowIndex  | uint256 |                                     |

### redeemLoan

```solidity
function redeemLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amountTaken, uint256 borrowIndex) external
```

\_Redeem the given loan with some params

Requirements:

- The caller must be a holder of the loan
- The loan must be in state Auction\_

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| initiator   | address | The address of the user initiating the borrow |
| loanId      | uint256 | The loan getting redeemed                     |
| uNftAddress | address |                                               |
| amountTaken | uint256 | The taken amount                              |
| borrowIndex | uint256 | The index to get the scaled loan amount       |

### liquidateLoanNFTX

```solidity
function liquidateLoanNFTX(uint256 loanId, uint256 borrowAmount, uint256 borrowIndex) external returns (uint256 sellPrice)
```

\_Liquidate the given loan on NFTX

Requirements:

- The caller must send in principal + interest
- The loan must be in state Auction\_

| Name         | Type    | Description             |
| ------------ | ------- | ----------------------- |
| loanId       | uint256 | The loan getting burned |
| borrowAmount | uint256 |                         |
| borrowIndex  | uint256 |                         |

### borrowerOf

```solidity
function borrowerOf(uint256 loanId) external view returns (address)
```

@dev returns the borrower of a specific loan
param loanId the loan to get the borrower from

### getCollateralLoanId

```solidity
function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)
```

@dev returns the loan corresponding to a specific NFT
param nftAsset the underlying NFT asset
param tokenId the underlying token ID for the NFT

### getLoan

```solidity
function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)
```

@dev returns the loan corresponding to a specific loan Id
param loanId the loan Id

### getLoanCollateralAndReserve

```solidity
function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)
```

@dev returns the collateral and reserve corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowScaledAmount

```solidity
function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow **scaled** amount corresponding to a specific loan
param loanId the loan Id

### getLoanReserveBorrowAmount

```solidity
function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)
```

@dev returns the reserve and borrow amount corresponding to a specific loan
param loanId the loan Id

### getLoanMinBidPrice

```solidity
function getLoanMinBidPrice(uint256 loanId) external view returns (uint256)
```

@dev returns the minimum bid price for a loan
param loanId the loan Id

### getNftCollateralAmount

```solidity
function getNftCollateralAmount(address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT
param nftAsset the underlying NFT asset

### getUserNftCollateralAmount

```solidity
function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)
```

@dev returns the collateral amount for a given NFT and a specific user
param user the user
param nftAsset the underlying NFT asset

### getLoanIdTracker

```solidity
function getLoanIdTracker() external view returns (struct CountersUpgradeable.Counter)
```

@dev returns the counter tracker for all the loan ID's in the protocol

## INFTOracle

### getNFTPrice

```solidity
function getNFTPrice(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

### getMultipleNFTPrices

```solidity
function getMultipleNFTPrices(address[] _collections, uint256[] _tokenIds) external view returns (uint256[])
```

_returns the NFT price for a given array of NFTs
@param \_collections the array of NFT collections
@param \_tokenIds the array NFT token Id_

### setNFTPrice

```solidity
function setNFTPrice(address _collection, uint256 _tokenId, uint256 _price) external
```

_sets the price for a given NFT
@param \_collection the NFT collection
@param \_tokenId the NFT token Id
@param \_price the price to set to the token_

### setMultipleNFTPrices

```solidity
function setMultipleNFTPrices(address[] _collections, uint256[] _tokenIds, uint256[] _prices) external
```

_sets the price for a given NFT
@param \_collections the array of NFT collections
@param \_tokenIds the array of NFT token Ids
@param \_prices the array of prices to set to the given tokens_

### setPause

```solidity
function setPause(address _nftContract, bool val) external
```

_sets the pause status of the NFT oracle
@param \_nftContract the of NFT collection
@param val the value to set the pausing status (true for paused, false for unpaused)_

### getNFTPriceNFTX

```solidity
function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view returns (uint256)
```

_returns the NFT price for a given NFT valued by NFTX
@param \_collection the NFT collection
@param \_tokenId the NFT token Id_

## INFTOracleGetter

### getNFTPrice

```solidity
function getNFTPrice(address assetContract, uint256 tokenId) external view returns (uint256)
```

## INFTXVault

_https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/interface/INFTXVault.sol_

### mint

```solidity
function mint(uint256[] tokenIds, uint256[] amounts) external returns (uint256)
```

### allValidNFTs

```solidity
function allValidNFTs(uint256[] tokenIds) external view returns (bool)
```

## INFTXVaultFactoryV2

_https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/interface/INFTXVaultFactory.sol_

### feeDistributor

```solidity
function feeDistributor() external view returns (address)
```

### numVaults

```solidity
function numVaults() external view returns (uint256)
```

### vaultsForAsset

```solidity
function vaultsForAsset(address asset) external view returns (address[])
```

### vaultFees

```solidity
function vaultFees(uint256 vaultId) external view returns (uint256, uint256, uint256, uint256, uint256)
```

### createVault

```solidity
function createVault(string name, string symbol, address _assetAddress, bool is1155, bool allowAllItems) external returns (uint256)
```

## IPunkGateway

### borrow

```solidity
function borrow(address reserveAsset, uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 USDC, receiving the 100 USDC in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reserveAsset | address | The address of the underlying asset to borrow                                                                                                                                                                                                              |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk used as collateral                                                                                                                                                                                                             |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### repay

```solidity
function repay(uint256 punkIndex, uint256 amount) external returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk, burning the equivalent loan owned

- E.g. User repays 100 USDC, burning loan and receives collateral asset

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay                            |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### auction

```solidity
function auction(uint256 punkIndex) external
```

auction a unhealth punk loan with ERC20 reserve

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |

### redeem

```solidity
function redeem(uint256 punkIndex, uint256 amount) external returns (uint256)
```

redeem a unhealth punk loan with ERC20 reserve

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |
| amount    | uint256 | The amount to repay the debt                   |

### liquidateNFTX

```solidity
function liquidateNFTX(uint256 punkIndex) external returns (uint256)
```

liquidate a unhealth punk loan on NFTX

| Name      | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| punkIndex | uint256 | The index of the CryptoPunk used as collateral |

### borrowETH

```solidity
function borrowETH(uint256 amount, uint256 punkIndex, address onBehalfOf, uint16 referralCode) external
```

\_Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
already deposited enough collateral

- E.g. User borrows 100 ETH, receiving the 100 ETH in his wallet
  and lock collateral asset in contract\_

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | The amount to be borrowed                                                                                                                                                                                                                                  |
| punkIndex    | uint256 | The index of the CryptoPunk to deposit                                                                                                                                                                                                                     |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | Code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                            |

### repayETH

```solidity
function repayETH(uint256 punkIndex, uint256 amount) external payable returns (uint256, bool)
```

Repays a borrowed `amount` on a specific punk with native ETH

- E.g. User repays 100 ETH, burning loan and receives collateral asset

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay                  |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The final amount repaid, loan is burned or not |
| [1]  | bool    |                                                |

### redeemETH

```solidity
function redeemETH(uint256 punkIndex, uint256 amount) external payable returns (uint256)
```

liquidate a unhealth punk loan with native ETH

| Name      | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| punkIndex | uint256 | The index of the CryptoPunk to repay |
| amount    | uint256 | The amount to repay the debt         |

## IPunks

\_Interface for a permittable ERC721 contract
See https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC72 allowance (see {IERC721-allowance}) by
presenting a message signed by the account. By not relying on {IERC721-approve}, the token holder account doesn't
need to send a transaction, and thus is not required to hold Ether at all.\_

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_returns the balance of an account_

| Name    | Type    | Description       |
| ------- | ------- | ----------------- |
| account | address | the given account |

### punkIndexToAddress

```solidity
function punkIndexToAddress(uint256 punkIndex) external view returns (address owner)
```

_returns the address of a punk given its index_

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| punkIndex | uint256 | the index   |

### buyPunk

```solidity
function buyPunk(uint256 punkIndex) external
```

_buys a punk_

| Name      | Type    | Description                  |
| --------- | ------- | ---------------------------- |
| punkIndex | uint256 | the index of the punk to buy |

### transferPunk

```solidity
function transferPunk(address to, uint256 punkIndex) external
```

_transfers a punk_

| Name      | Type    | Description                       |
| --------- | ------- | --------------------------------- |
| to        | address | the recipient address             |
| punkIndex | uint256 | the index of the punk to transfer |

## IReserveOracleGetter

### getAssetPrice

```solidity
function getAssetPrice(address asset) external view returns (uint256)
```

### getTwapPrice

```solidity
function getTwapPrice(address _priceFeedKey, uint256 _interval) external view returns (uint256)
```

## IScaledBalanceToken

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| user | address | The user whose balance is calculated |

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| [0]  | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The scaled balance of the user                 |
| [1]  | uint256 | The scaled balance and the scaled total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() external view returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | The scaled total supply |

## IUNFT

### Initialized

```solidity
event Initialized(address underlyingAsset)
```

_Emitted when an uNFT is initialized_

| Name            | Type    | Description                         |
| --------------- | ------- | ----------------------------------- |
| underlyingAsset | address | The address of the underlying asset |

### Mint

```solidity
event Mint(address user, address nftAsset, uint256 nftTokenId, address owner)
```

_Emitted on mint_

| Name       | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| user       | address | The address initiating the burn          |
| nftAsset   | address | address of the underlying asset of NFT   |
| nftTokenId | uint256 | token id of the underlying asset of NFT  |
| owner      | address | The owner address receive the uNFT token |

### Burn

```solidity
event Burn(address user, address nftAsset, uint256 nftTokenId, address owner)
```

_Emitted on burn_

| Name       | Type    | Description                                |
| ---------- | ------- | ------------------------------------------ |
| user       | address | The address initiating the burn            |
| nftAsset   | address | address of the underlying asset of NFT     |
| nftTokenId | uint256 | token id of the underlying asset of NFT    |
| owner      | address | The owner address of the burned uNFT token |

### FlashLoan

```solidity
event FlashLoan(address target, address initiator, address nftAsset, uint256 tokenId)
```

_Emitted on flashLoan_

| Name      | Type    | Description                                     |
| --------- | ------- | ----------------------------------------------- |
| target    | address | The address of the flash loan receiver contract |
| initiator | address | The address initiating the flash loan           |
| nftAsset  | address | address of the underlying asset of NFT          |
| tokenId   | uint256 | The token id of the asset being flash borrowed  |

### initialize

```solidity
function initialize(address underlyingAsset, string uNftName, string uNftSymbol) external
```

_Initializes the uNFT_

| Name            | Type    | Description                                                            |
| --------------- | ------- | ---------------------------------------------------------------------- |
| underlyingAsset | address | The address of the underlying asset of this uNFT (E.g. PUNK for bPUNK) |
| uNftName        | string  |                                                                        |
| uNftSymbol      | string  |                                                                        |

### mint

```solidity
function mint(address to, uint256 tokenId) external
```

\_Mints uNFT token to the user address

Requirements:

- The caller must be contract address.
- `nftTokenId` must not exist.\_

| Name    | Type    | Description                              |
| ------- | ------- | ---------------------------------------- |
| to      | address | The owner address receive the uNFT token |
| tokenId | uint256 | token id of the underlying asset of NFT  |

### burn

```solidity
function burn(uint256 tokenId) external
```

\_Burns user uNFT token

Requirements:

- The caller must be contract address.
- `tokenId` must exist.\_

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

### flashLoan

```solidity
function flashLoan(address receiverAddress, uint256[] nftTokenIds, bytes params) external
```

\_Allows smartcontracts to access the tokens within one transaction, as long as the tokens taken is returned.

Requirements:

- `nftTokenIds` must exist.\_

| Name            | Type      | Description                                                                                     |
| --------------- | --------- | ----------------------------------------------------------------------------------------------- |
| receiverAddress | address   | The address of the contract receiving the tokens, implementing the IFlashLoanReceiver interface |
| nftTokenIds     | uint256[] | token ids of the underlying asset                                                               |
| params          | bytes     | Variadic packed params to pass to the receiver as extra information                             |

### minterOf

```solidity
function minterOf(uint256 tokenId) external view returns (address)
```

\_Returns the owner of the `nftTokenId` token.

Requirements:

- `tokenId` must exist.\_

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

## IUNFTRegistry

### Initialized

```solidity
event Initialized(address genericImpl, string namePrefix, string symbolPrefix)
```

### GenericImplementationUpdated

```solidity
event GenericImplementationUpdated(address genericImpl)
```

### UNFTCreated

```solidity
event UNFTCreated(address nftAsset, address uNftImpl, address uNftProxy, uint256 totals)
```

### UNFTUpgraded

```solidity
event UNFTUpgraded(address nftAsset, address uNftImpl, address uNftProxy, uint256 totals)
```

### getUNFTAddresses

```solidity
function getUNFTAddresses(address nftAsset) external view returns (address uNftProxy, address uNftImpl)
```

_gets the uNFT address_

| Name     | Type    | Description                             |
| -------- | ------- | --------------------------------------- |
| nftAsset | address | The address of the underlying NFT asset |

### getUNFTAddressesByIndex

```solidity
function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)
```

_gets the uNFT address by index_

| Name  | Type   | Description    |
| ----- | ------ | -------------- |
| index | uint16 | the uNFT index |

### getUNFTAssetList

```solidity
function getUNFTAssetList() external view returns (address[])
```

_gets the list of uNFTs_

### allUNFTAssetLength

```solidity
function allUNFTAssetLength() external view returns (uint256)
```

_gets the length of the list of uNFTs_

### initialize

```solidity
function initialize(address genericImpl, string namePrefix_, string symbolPrefix_) external
```

_initializes the contract_

### setUNFTGenericImpl

```solidity
function setUNFTGenericImpl(address genericImpl) external
```

_sets the uNFT generic implementation
genericImpl the implementation contract_

### createUNFT

```solidity
function createUNFT(address nftAsset) external returns (address uNftProxy)
```

_Create uNFT proxy and implement, then initialize it_

| Name     | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| nftAsset | address | The address of the underlying asset of the UNFT |

### createUNFTWithImpl

```solidity
function createUNFTWithImpl(address nftAsset, address uNftImpl) external returns (address uNftProxy)
```

_Create uNFT proxy with already deployed implement, then initialize it_

| Name     | Type    | Description                                       |
| -------- | ------- | ------------------------------------------------- |
| nftAsset | address | The address of the underlying asset of the UNFT   |
| uNftImpl | address | The address of the deployed implement of the UNFT |

### upgradeUNFTWithImpl

```solidity
function upgradeUNFTWithImpl(address nftAsset, address uNftImpl, bytes encodedCallData) external
```

_Update uNFT proxy to an new deployed implement, then initialize it_

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| nftAsset        | address | The address of the underlying asset of the UNFT   |
| uNftImpl        | address | The address of the deployed implement of the UNFT |
| encodedCallData | bytes   | The encoded function call.                        |

### addCustomeSymbols

```solidity
function addCustomeSymbols(address[] nftAssets_, string[] symbols_) external
```

_Adding custom symbol for some special NFTs like CryptoPunks_

| Name        | Type      | Description                    |
| ----------- | --------- | ------------------------------ |
| nftAssets\_ | address[] | The addresses of the NFTs      |
| symbols\_   | string[]  | The custom symbols of the NFTs |

## IUToken

### Initialized

```solidity
event Initialized(address underlyingAsset, address pool, address treasury, address incentivesController)
```

_Emitted when an uToken is initialized_

| Name                 | Type    | Description                                              |
| -------------------- | ------- | -------------------------------------------------------- |
| underlyingAsset      | address | The address of the underlying asset                      |
| pool                 | address | The address of the associated lending pool               |
| treasury             | address | The address of the treasury                              |
| incentivesController | address | The address of the incentives controller for this uToken |

### initialize

```solidity
function initialize(contract ILendPoolAddressesProvider addressProvider, address treasury, address underlyingAsset, uint8 uTokenDecimals, string uTokenName, string uTokenSymbol) external
```

_Initializes the bToken_

| Name            | Type                                | Description                                                            |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| addressProvider | contract ILendPoolAddressesProvider | The address of the address provider where this bToken will be used     |
| treasury        | address                             | The address of the Unlockd treasury, receiving the fees on this bToken |
| underlyingAsset | address                             | The address of the underlying asset of this bToken                     |
| uTokenDecimals  | uint8                               | The amount of token decimals                                           |
| uTokenName      | string                              | The name of the token                                                  |
| uTokenSymbol    | string                              | The token symbol                                                       |

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

| Name  | Type    | Description                            |
| ----- | ------- | -------------------------------------- |
| from  | address | The address performing the mint        |
| value | uint256 | The amount being                       |
| index | uint256 | The new liquidity index of the reserve |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

_Mints `amount` uTokens to `user`_

| Name   | Type    | Description                             |
| ------ | ------- | --------------------------------------- |
| user   | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted     |
| index  | uint256 | The new liquidity index of the reserve  |

| Name | Type | Description                                          |
| ---- | ---- | ---------------------------------------------------- |
| [0]  | bool | `true` if the the previous balance of the user was 0 |

### Burn

```solidity
event Burn(address from, address target, uint256 value, uint256 index)
```

_Emitted after uTokens are burned_

| Name   | Type    | Description                                   |
| ------ | ------- | --------------------------------------------- |
| from   | address | The owner of the uTokens, getting them burned |
| target | address | The address that will receive the underlying  |
| value  | uint256 | The amount being burned                       |
| index  | uint256 | The new liquidity index of the reserve        |

### BalanceTransfer

```solidity
event BalanceTransfer(address from, address to, uint256 value, uint256 index)
```

_Emitted during the transfer action_

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| from  | address | The user whose tokens are being transferred |
| to    | address | The recipient                               |
| value | uint256 | The amount being transferred                |
| index | uint256 | The new liquidity index of the reserve      |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

_Burns uTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`_

| Name                 | Type    | Description                                   |
| -------------------- | ------- | --------------------------------------------- |
| user                 | address | The owner of the uTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying  |
| amount               | uint256 | The amount being burned                       |
| index                | uint256 | The new liquidity index of the reserve        |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

_Mints uTokens to the reserve treasury_

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| amount | uint256 | The amount of tokens getting minted    |
| index  | uint256 | The new liquidity index of the reserve |

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address user, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendPool to transfer
assets in borrow(), withdraw() and flashLoan()_

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| user   | address | The recipient of the underlying |
| amount | uint256 | The amount getting transferred  |

| Name | Type    | Description            |
| ---- | ------- | ---------------------- |
| [0]  | uint256 | The amount transferred |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IIncentivesController)
```

_Returns the address of the incentives controller contract_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() external view returns (address)
```

_Returns the address of the underlying asset of this uToken_

## IUiPoolDataProvider

### AggregatedReserveData

```solidity
struct AggregatedReserveData {
  address underlyingAsset;
  string name;
  string symbol;
  uint256 decimals;
  uint256 reserveFactor;
  bool borrowingEnabled;
  bool isActive;
  bool isFrozen;
  uint128 liquidityIndex;
  uint128 variableBorrowIndex;
  uint128 liquidityRate;
  uint128 variableBorrowRate;
  uint40 lastUpdateTimestamp;
  address uTokenAddress;
  address debtTokenAddress;
  address interestRateAddress;
  uint256 availableLiquidity;
  uint256 totalVariableDebt;
  uint256 priceInEth;
  uint256 variableRateSlope1;
  uint256 variableRateSlope2;
}

```

### UserReserveData

```solidity
struct UserReserveData {
  address underlyingAsset;
  uint256 uTokenBalance;
  uint256 variableDebt;
}

```

### AggregatedNftData

```solidity
struct AggregatedNftData {
  address underlyingAsset;
  uint256 assetTokenId;
  string name;
  string symbol;
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
  address uNftAddress;
  uint256 priceInEth;
  uint256 totalCollateral;
}

```

### UserNftData

```solidity
struct UserNftData {
  address underlyingAsset;
  address uNftAddress;
  uint256 totalCollateral;
}

```

### AggregatedLoanData

```solidity
struct AggregatedLoanData {
  uint256 loanId;
  uint256 state;
  address reserveAsset;
  uint256 totalCollateralInReserve;
  uint256 totalDebtInReserve;
  uint256 availableBorrowsInReserve;
  uint256 healthFactor;
  uint256 liquidatePrice;
  uint256 minBidPrice;
}

```

### getReservesList

```solidity
function getReservesList(contract ILendPoolAddressesProvider provider) external view returns (address[])
```

_Gets the list of reserves from the protocol_

| Name     | Type                                | Description            |
| -------- | ----------------------------------- | ---------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider |

### getSimpleReservesData

```solidity
function getSimpleReservesData(contract ILendPoolAddressesProvider provider) external view returns (struct IUiPoolDataProvider.AggregatedReserveData[])
```

_Gets aggregated data from the reserves_

| Name     | Type                                | Description            |
| -------- | ----------------------------------- | ---------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider |

### getUserReservesData

```solidity
function getUserReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserReserveData[])
```

_Gets reserve data for a specific user_

| Name     | Type                                | Description                |
| -------- | ----------------------------------- | -------------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider     |
| user     | address                             | the user to fetch the data |

### getReservesData

```solidity
function getReservesData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedReserveData[], struct IUiPoolDataProvider.UserReserveData[])
```

_Gets full (aggregated and user) data from the reserves_

| Name     | Type                                | Description                |
| -------- | ----------------------------------- | -------------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider     |
| user     | address                             | the user to fetch the data |

### getNftsList

```solidity
function getNftsList(contract ILendPoolAddressesProvider provider) external view returns (address[])
```

_Gets the list of NFTs in the protocol_

| Name     | Type                                | Description            |
| -------- | ----------------------------------- | ---------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider |

### getSimpleNftsData

```solidity
function getSimpleNftsData(contract ILendPoolAddressesProvider provider) external view returns (struct IUiPoolDataProvider.AggregatedNftData[])
```

_Gets aggregated data from the NFTs_

| Name     | Type                                | Description            |
| -------- | ----------------------------------- | ---------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider |

### getUserNftsData

```solidity
function getUserNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.UserNftData[])
```

_Gets NFTs data for a specific user_

| Name     | Type                                | Description                |
| -------- | ----------------------------------- | -------------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider     |
| user     | address                             | the user to fetch the data |

### getNftsData

```solidity
function getNftsData(contract ILendPoolAddressesProvider provider, address user) external view returns (struct IUiPoolDataProvider.AggregatedNftData[], struct IUiPoolDataProvider.UserNftData[])
```

_Gets full (aggregated and user) data from the NFTs_

| Name     | Type                                | Description                |
| -------- | ----------------------------------- | -------------------------- |
| provider | contract ILendPoolAddressesProvider | the addresses provider     |
| user     | address                             | the user to fetch the data |

### getSimpleLoansData

```solidity
function getSimpleLoansData(contract ILendPoolAddressesProvider provider, address[] nftAssets, uint256[] nftTokenIds) external view returns (struct IUiPoolDataProvider.AggregatedLoanData[])
```

_Gets loans aggregated data_

| Name        | Type                                | Description                                     |
| ----------- | ----------------------------------- | ----------------------------------------------- |
| provider    | contract ILendPoolAddressesProvider |                                                 |
| nftAssets   | address[]                           | the array of NFT assets to check the loans from |
| nftTokenIds | uint256[]                           | the array of token Ids                          |

## IUniswapV2Router01

### factory

```solidity
function factory() external pure returns (address)
```

### WETH

```solidity
function WETH() external pure returns (address)
```

### addLiquidity

```solidity
function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

### addLiquidityETH

```solidity
function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```

### removeLiquidity

```solidity
function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETH

```solidity
function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountToken, uint256 amountETH)
```

### removeLiquidityWithPermit

```solidity
function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountA, uint256 amountB)
```

### removeLiquidityETHWithPermit

```solidity
function removeLiquidityETHWithPermit(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountToken, uint256 amountETH)
```

### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactETHForTokens

```solidity
function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### swapTokensForExactETH

```solidity
function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapExactTokensForETH

```solidity
function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)
```

### swapETHForExactTokens

```solidity
function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) external payable returns (uint256[] amounts)
```

### quote

```solidity
function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)
```

### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut)
```

### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountIn)
```

### getAmountsOut

```solidity
function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)
```

### getAmountsIn

```solidity
function getAmountsIn(uint256 amountOut, address[] path) external view returns (uint256[] amounts)
```

## IUniswapV2Router02

### removeLiquidityETHSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256 amountETH)
```

### removeLiquidityETHWithPermitSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256 amountETH)
```

### swapExactTokensForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

### swapExactETHForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable
```

### swapExactTokensForETHSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

## IWETH

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256) external
```

### approve

```solidity
function approve(address guy, uint256 wad) external returns (bool)
```

### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) external returns (bool)
```

## IWETHGateway

### depositETH

```solidity
function depositETH(address onBehalfOf, uint16 referralCode) external payable
```

_deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (uTokens)
is minted._

| Name         | Type    | Description                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------------- |
| onBehalfOf   | address | address of the user who will receive the uTokens representing the deposit     |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards. |

### withdrawETH

```solidity
function withdrawETH(uint256 amount, address to) external
```

_withdraws the WETH \_reserves of msg.sender._

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| amount | uint256 | amount of uWETH to withdraw and receive native ETH |
| to     | address | address of the user who will receive native ETH    |

### borrowETH

```solidity
function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external
```

_borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `LendPool.borrow`._

| Name         | Type    | Description                                                                                                                                                                                                                                                |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | the amount of ETH to borrow                                                                                                                                                                                                                                |
| nftAsset     | address | The address of the underlying NFT used as collateral                                                                                                                                                                                                       |
| nftTokenId   | uint256 | The token ID of the underlying NFT used as collateral                                                                                                                                                                                                      |
| onBehalfOf   | address | Address of the user who will receive the loan. Should be the address of the borrower itself calling the function if he wants to borrow against his own collateral, or the address of the credit delegator if he has been given credit delegation allowance |
| referralCode | uint16  | integrators are assigned a referral code and can potentially receive rewards                                                                                                                                                                               |

### repayETH

```solidity
function repayETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256, bool)
```

_repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified)._

| Name       | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral                      |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral                     |
| amount     | uint256 | the amount to repay, or uint256(-1) if the user wants to repay everything |

### auction

```solidity
function auction(address nftAsset, uint256 nftTokenId) external
```

_auction a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

### redeemETH

```solidity
function redeemETH(address nftAsset, uint256 nftTokenId, uint256 amount) external payable returns (uint256)
```

_redeems a borrow on the WETH reserve_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |
| amount     | uint256 | The amount to repay the debt                          |

### liquidateNFTX

```solidity
function liquidateNFTX(address nftAsset, uint256 nftTokenId) external returns (uint256)
```

_liquidates a borrow on the WETH reserve on NFTX_

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The address of the underlying NFT used as collateral  |
| nftTokenId | uint256 | The token ID of the underlying NFT used as collateral |

## IWrappedPunks

\_Interface for a permittable ERC721 contract
See https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].

Adds the {permit} method, which can be used to change an account's ERC72 allowance (see {IERC721-allowance}) by
presenting a message signed by the account. By not relying on {IERC721-approve}, the token holder account doesn't
need to send a transaction, and thus is not required to hold Ether at all.\_

### punkContract

```solidity
function punkContract() external view returns (address)
```

_Gets address of cryptopunk smart contract_

### mint

```solidity
function mint(uint256 punkIndex) external
```

_Mints a wrapped punk_

| Name      | Type    | Description                             |
| --------- | ------- | --------------------------------------- |
| punkIndex | uint256 | the punk index of the punk to be minted |

### burn

```solidity
function burn(uint256 punkIndex) external
```

_Burns a specific wrapped punk_

| Name      | Type    | Description                             |
| --------- | ------- | --------------------------------------- |
| punkIndex | uint256 | the punk index of the punk to be minted |

### registerProxy

```solidity
function registerProxy() external
```

_Registers proxy_

### proxyInfo

```solidity
function proxyInfo(address user) external returns (address proxy)
```

_Gets the proxy address_

| Name | Type    | Description      |
| ---- | ------- | ---------------- |
| user | address | the user address |

### cancel

```solidity
function cancel(struct OrderComponents[] orders) external returns (bool cancelled)
```

Cancel an arbitrary number of orders. Note that only the offerer
or the zone of a given order may cancel it. Callers should ensure
that the intended order was cancelled by calling `getOrderStatus`
and confirming that `isCancelled` returns `true`.

| Name   | Type                     | Description           |
| ------ | ------------------------ | --------------------- |
| orders | struct OrderComponents[] | The orders to cancel. |

| Name      | Type | Description                                                                        |
| --------- | ---- | ---------------------------------------------------------------------------------- |
| cancelled | bool | A boolean indicating whether the supplied orders have been successfully cancelled. |

## **Configuration Libraries**

## NftConfiguration

Implements the bitmap logic to handle the NFT configuration

### LTV_MASK

```solidity
uint256 LTV_MASK
```

### LIQUIDATION_THRESHOLD_MASK

```solidity
uint256 LIQUIDATION_THRESHOLD_MASK
```

### LIQUIDATION_BONUS_MASK

```solidity
uint256 LIQUIDATION_BONUS_MASK
```

### ACTIVE_MASK

```solidity
uint256 ACTIVE_MASK
```

### FROZEN_MASK

```solidity
uint256 FROZEN_MASK
```

### REDEEM_DURATION_MASK

```solidity
uint256 REDEEM_DURATION_MASK
```

### AUCTION_DURATION_MASK

```solidity
uint256 AUCTION_DURATION_MASK
```

### REDEEM_FINE_MASK

```solidity
uint256 REDEEM_FINE_MASK
```

### REDEEM_THRESHOLD_MASK

```solidity
uint256 REDEEM_THRESHOLD_MASK
```

### MIN_BIDFINE_MASK

```solidity
uint256 MIN_BIDFINE_MASK
```

### LIQUIDATION_THRESHOLD_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_THRESHOLD_START_BIT_POSITION
```

_For the LTV, the start bit is 0 (up to 15), hence no bitshifting is needed_

### LIQUIDATION_BONUS_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_BONUS_START_BIT_POSITION
```

### IS_ACTIVE_START_BIT_POSITION

```solidity
uint256 IS_ACTIVE_START_BIT_POSITION
```

### IS_FROZEN_START_BIT_POSITION

```solidity
uint256 IS_FROZEN_START_BIT_POSITION
```

### REDEEM_DURATION_START_BIT_POSITION

```solidity
uint256 REDEEM_DURATION_START_BIT_POSITION
```

### AUCTION_DURATION_START_BIT_POSITION

```solidity
uint256 AUCTION_DURATION_START_BIT_POSITION
```

### REDEEM_FINE_START_BIT_POSITION

```solidity
uint256 REDEEM_FINE_START_BIT_POSITION
```

### REDEEM_THRESHOLD_START_BIT_POSITION

```solidity
uint256 REDEEM_THRESHOLD_START_BIT_POSITION
```

### MIN_BIDFINE_START_BIT_POSITION

```solidity
uint256 MIN_BIDFINE_START_BIT_POSITION
```

### MAX_VALID_LTV

```solidity
uint256 MAX_VALID_LTV
```

### MAX_VALID_LIQUIDATION_THRESHOLD

```solidity
uint256 MAX_VALID_LIQUIDATION_THRESHOLD
```

### MAX_VALID_LIQUIDATION_BONUS

```solidity
uint256 MAX_VALID_LIQUIDATION_BONUS
```

### MAX_VALID_REDEEM_DURATION

```solidity
uint256 MAX_VALID_REDEEM_DURATION
```

### MAX_VALID_AUCTION_DURATION

```solidity
uint256 MAX_VALID_AUCTION_DURATION
```

### MAX_VALID_REDEEM_FINE

```solidity
uint256 MAX_VALID_REDEEM_FINE
```

### MAX_VALID_REDEEM_THRESHOLD

```solidity
uint256 MAX_VALID_REDEEM_THRESHOLD
```

### MAX_VALID_MIN_BIDFINE

```solidity
uint256 MAX_VALID_MIN_BIDFINE
```

### setLtv

```solidity
function setLtv(struct DataTypes.NftConfigurationMap self, uint256 ltv) internal pure
```

_Sets the Loan to Value of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |
| ltv  | uint256                              | the new ltv           |

### getLtv

```solidity
function getLtv(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the Loan to Value of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| [0]  | uint256 | The loan to value |

### setLiquidationThreshold

```solidity
function setLiquidationThreshold(struct DataTypes.NftConfigurationMap self, uint256 threshold) internal pure
```

_Sets the liquidation threshold of the NFT_

| Name      | Type                                 | Description                   |
| --------- | ------------------------------------ | ----------------------------- |
| self      | struct DataTypes.NftConfigurationMap | The NFT configuration         |
| threshold | uint256                              | The new liquidation threshold |

### getLiquidationThreshold

```solidity
function getLiquidationThreshold(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation threshold of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | uint256 | The liquidation threshold |

### setLiquidationBonus

```solidity
function setLiquidationBonus(struct DataTypes.NftConfigurationMap self, uint256 bonus) internal pure
```

_Sets the liquidation bonus of the NFT_

| Name  | Type                                 | Description               |
| ----- | ------------------------------------ | ------------------------- |
| self  | struct DataTypes.NftConfigurationMap | The NFT configuration     |
| bonus | uint256                              | The new liquidation bonus |

### getLiquidationBonus

```solidity
function getLiquidationBonus(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation bonus of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | uint256 | The liquidation bonus |

### setActive

```solidity
function setActive(struct DataTypes.NftConfigurationMap self, bool active) internal pure
```

_Sets the active state of the NFT_

| Name   | Type                                 | Description           |
| ------ | ------------------------------------ | --------------------- |
| self   | struct DataTypes.NftConfigurationMap | The NFT configuration |
| active | bool                                 | The active state      |

### getActive

```solidity
function getActive(struct DataTypes.NftConfigurationMap self) internal view returns (bool)
```

_Gets the active state of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description      |
| ---- | ---- | ---------------- |
| [0]  | bool | The active state |

### setFrozen

```solidity
function setFrozen(struct DataTypes.NftConfigurationMap self, bool frozen) internal pure
```

_Sets the frozen state of the NFT_

| Name   | Type                                 | Description           |
| ------ | ------------------------------------ | --------------------- |
| self   | struct DataTypes.NftConfigurationMap | The NFT configuration |
| frozen | bool                                 | The frozen state      |

### getFrozen

```solidity
function getFrozen(struct DataTypes.NftConfigurationMap self) internal view returns (bool)
```

_Gets the frozen state of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description      |
| ---- | ---- | ---------------- |
| [0]  | bool | The frozen state |

### setRedeemDuration

```solidity
function setRedeemDuration(struct DataTypes.NftConfigurationMap self, uint256 redeemDuration) internal pure
```

_Sets the redeem duration of the NFT_

| Name           | Type                                 | Description           |
| -------------- | ------------------------------------ | --------------------- |
| self           | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemDuration | uint256                              | The redeem duration   |

### getRedeemDuration

```solidity
function getRedeemDuration(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem duration of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description         |
| ---- | ------- | ------------------- |
| [0]  | uint256 | The redeem duration |

### setAuctionDuration

```solidity
function setAuctionDuration(struct DataTypes.NftConfigurationMap self, uint256 auctionDuration) internal pure
```

_Sets the auction duration of the NFT_

| Name            | Type                                 | Description           |
| --------------- | ------------------------------------ | --------------------- |
| self            | struct DataTypes.NftConfigurationMap | The NFT configuration |
| auctionDuration | uint256                              | The auction duration  |

### getAuctionDuration

```solidity
function getAuctionDuration(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the auction duration of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| [0]  | uint256 | The auction duration |

### setRedeemFine

```solidity
function setRedeemFine(struct DataTypes.NftConfigurationMap self, uint256 redeemFine) internal pure
```

_Sets the redeem fine of the NFT_

| Name       | Type                                 | Description           |
| ---------- | ------------------------------------ | --------------------- |
| self       | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemFine | uint256                              | The redeem duration   |

### getRedeemFine

```solidity
function getRedeemFine(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem fine of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description     |
| ---- | ------- | --------------- |
| [0]  | uint256 | The redeem fine |

### setRedeemThreshold

```solidity
function setRedeemThreshold(struct DataTypes.NftConfigurationMap self, uint256 redeemThreshold) internal pure
```

_Sets the redeem threshold of the NFT_

| Name            | Type                                 | Description           |
| --------------- | ------------------------------------ | --------------------- |
| self            | struct DataTypes.NftConfigurationMap | The NFT configuration |
| redeemThreshold | uint256                              | The redeem duration   |

### getRedeemThreshold

```solidity
function getRedeemThreshold(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the redeem threshold of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| [0]  | uint256 | The redeem threshold |

### setMinBidFine

```solidity
function setMinBidFine(struct DataTypes.NftConfigurationMap self, uint256 minBidFine) internal pure
```

_Sets the min & max threshold of the NFT_

| Name       | Type                                 | Description           |
| ---------- | ------------------------------------ | --------------------- |
| self       | struct DataTypes.NftConfigurationMap | The NFT configuration |
| minBidFine | uint256                              | The min bid fine      |

### getMinBidFine

```solidity
function getMinBidFine(struct DataTypes.NftConfigurationMap self) internal view returns (uint256)
```

_Gets the min bid fine of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description      |
| ---- | ------- | ---------------- |
| [0]  | uint256 | The min bid fine |

### getFlags

```solidity
function getFlags(struct DataTypes.NftConfigurationMap self) internal view returns (bool, bool)
```

_Gets the configuration flags of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | The state flags representing active, frozen |
| [1]  | bool |                                             |

### getFlagsMemory

```solidity
function getFlagsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (bool, bool)
```

_Gets the configuration flags of the NFT from a memory object_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | The state flags representing active, frozen |
| [1]  | bool |                                             |

### getCollateralParams

```solidity
function getCollateralParams(struct DataTypes.NftConfigurationMap self) internal view returns (uint256, uint256, uint256)
```

_Gets the collateral configuration paramters of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description                                                                 |
| ---- | ------- | --------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus |
| [1]  | uint256 |                                                                             |
| [2]  | uint256 |                                                                             |

### getAuctionParams

```solidity
function getAuctionParams(struct DataTypes.NftConfigurationMap self) internal view returns (uint256, uint256, uint256, uint256)
```

_Gets the auction configuration paramters of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description                                                                  |
| ---- | ------- | ---------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing redeem duration, auction duration, redeem fine |
| [1]  | uint256 |                                                                              |
| [2]  | uint256 |                                                                              |
| [3]  | uint256 |                                                                              |

### getCollateralParamsMemory

```solidity
function getCollateralParamsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256, uint256, uint256)
```

_Gets the collateral configuration paramters of the NFT from a memory object_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description                                                                 |
| ---- | ------- | --------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus |
| [1]  | uint256 |                                                                             |
| [2]  | uint256 |                                                                             |

### getAuctionParamsMemory

```solidity
function getAuctionParamsMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256, uint256, uint256, uint256)
```

_Gets the auction configuration paramters of the NFT from a memory object_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description                                                                  |
| ---- | ------- | ---------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing redeem duration, auction duration, redeem fine |
| [1]  | uint256 |                                                                              |
| [2]  | uint256 |                                                                              |
| [3]  | uint256 |                                                                              |

### getMinBidFineMemory

```solidity
function getMinBidFineMemory(struct DataTypes.NftConfigurationMap self) internal pure returns (uint256)
```

_Gets the min & max bid fine of the NFT_

| Name | Type                                 | Description           |
| ---- | ------------------------------------ | --------------------- |
| self | struct DataTypes.NftConfigurationMap | The NFT configuration |

| Name | Type    | Description            |
| ---- | ------- | ---------------------- |
| [0]  | uint256 | The min & max bid fine |

## ReserveConfiguration

Implements the bitmap logic to handle the reserve configuration

### LTV_MASK

```solidity
uint256 LTV_MASK
```

### LIQUIDATION_THRESHOLD_MASK

```solidity
uint256 LIQUIDATION_THRESHOLD_MASK
```

### LIQUIDATION_BONUS_MASK

```solidity
uint256 LIQUIDATION_BONUS_MASK
```

### DECIMALS_MASK

```solidity
uint256 DECIMALS_MASK
```

### ACTIVE_MASK

```solidity
uint256 ACTIVE_MASK
```

### FROZEN_MASK

```solidity
uint256 FROZEN_MASK
```

### BORROWING_MASK

```solidity
uint256 BORROWING_MASK
```

### STABLE_BORROWING_MASK

```solidity
uint256 STABLE_BORROWING_MASK
```

### RESERVE_FACTOR_MASK

```solidity
uint256 RESERVE_FACTOR_MASK
```

### LIQUIDATION_THRESHOLD_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_THRESHOLD_START_BIT_POSITION
```

_For the LTV, the start bit is 0 (up to 15), hence no bitshifting is needed_

### LIQUIDATION_BONUS_START_BIT_POSITION

```solidity
uint256 LIQUIDATION_BONUS_START_BIT_POSITION
```

### RESERVE_DECIMALS_START_BIT_POSITION

```solidity
uint256 RESERVE_DECIMALS_START_BIT_POSITION
```

### IS_ACTIVE_START_BIT_POSITION

```solidity
uint256 IS_ACTIVE_START_BIT_POSITION
```

### IS_FROZEN_START_BIT_POSITION

```solidity
uint256 IS_FROZEN_START_BIT_POSITION
```

### BORROWING_ENABLED_START_BIT_POSITION

```solidity
uint256 BORROWING_ENABLED_START_BIT_POSITION
```

### STABLE_BORROWING_ENABLED_START_BIT_POSITION

```solidity
uint256 STABLE_BORROWING_ENABLED_START_BIT_POSITION
```

### RESERVE_FACTOR_START_BIT_POSITION

```solidity
uint256 RESERVE_FACTOR_START_BIT_POSITION
```

### MAX_VALID_LTV

```solidity
uint256 MAX_VALID_LTV
```

### MAX_VALID_LIQUIDATION_THRESHOLD

```solidity
uint256 MAX_VALID_LIQUIDATION_THRESHOLD
```

### MAX_VALID_LIQUIDATION_BONUS

```solidity
uint256 MAX_VALID_LIQUIDATION_BONUS
```

### MAX_VALID_DECIMALS

```solidity
uint256 MAX_VALID_DECIMALS
```

### MAX_VALID_RESERVE_FACTOR

```solidity
uint256 MAX_VALID_RESERVE_FACTOR
```

### setLtv

```solidity
function setLtv(struct DataTypes.ReserveConfigurationMap self, uint256 ltv) internal pure
```

_Sets the Loan to Value of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| ltv  | uint256                                  | the new ltv               |

### getLtv

```solidity
function getLtv(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the Loan to Value of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| [0]  | uint256 | The loan to value |

### setLiquidationThreshold

```solidity
function setLiquidationThreshold(struct DataTypes.ReserveConfigurationMap self, uint256 threshold) internal pure
```

_Sets the liquidation threshold of the reserve_

| Name      | Type                                     | Description                   |
| --------- | ---------------------------------------- | ----------------------------- |
| self      | struct DataTypes.ReserveConfigurationMap | The reserve configuration     |
| threshold | uint256                                  | The new liquidation threshold |

### getLiquidationThreshold

```solidity
function getLiquidationThreshold(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation threshold of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | uint256 | The liquidation threshold |

### setLiquidationBonus

```solidity
function setLiquidationBonus(struct DataTypes.ReserveConfigurationMap self, uint256 bonus) internal pure
```

_Sets the liquidation bonus of the reserve_

| Name  | Type                                     | Description               |
| ----- | ---------------------------------------- | ------------------------- |
| self  | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| bonus | uint256                                  | The new liquidation bonus |

### getLiquidationBonus

```solidity
function getLiquidationBonus(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the liquidation bonus of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| [0]  | uint256 | The liquidation bonus |

### setDecimals

```solidity
function setDecimals(struct DataTypes.ReserveConfigurationMap self, uint256 decimals) internal pure
```

_Sets the decimals of the underlying asset of the reserve_

| Name     | Type                                     | Description               |
| -------- | ---------------------------------------- | ------------------------- |
| self     | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| decimals | uint256                                  | The decimals              |

### getDecimals

```solidity
function getDecimals(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the decimals of the underlying asset of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| [0]  | uint256 | The decimals of the asset |

### setActive

```solidity
function setActive(struct DataTypes.ReserveConfigurationMap self, bool active) internal pure
```

_Sets the active state of the reserve_

| Name   | Type                                     | Description               |
| ------ | ---------------------------------------- | ------------------------- |
| self   | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| active | bool                                     | The active state          |

### getActive

```solidity
function getActive(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the active state of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description      |
| ---- | ---- | ---------------- |
| [0]  | bool | The active state |

### setFrozen

```solidity
function setFrozen(struct DataTypes.ReserveConfigurationMap self, bool frozen) internal pure
```

_Sets the frozen state of the reserve_

| Name   | Type                                     | Description               |
| ------ | ---------------------------------------- | ------------------------- |
| self   | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| frozen | bool                                     | The frozen state          |

### getFrozen

```solidity
function getFrozen(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the frozen state of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description      |
| ---- | ---- | ---------------- |
| [0]  | bool | The frozen state |

### setBorrowingEnabled

```solidity
function setBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self, bool enabled) internal pure
```

_Enables or disables borrowing on the reserve_

| Name    | Type                                     | Description                                                |
| ------- | ---------------------------------------- | ---------------------------------------------------------- |
| self    | struct DataTypes.ReserveConfigurationMap | The reserve configuration                                  |
| enabled | bool                                     | True if the borrowing needs to be enabled, false otherwise |

### getBorrowingEnabled

```solidity
function getBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the borrowing state of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description         |
| ---- | ---- | ------------------- |
| [0]  | bool | The borrowing state |

### setStableRateBorrowingEnabled

```solidity
function setStableRateBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self, bool enabled) internal pure
```

_Enables or disables stable rate borrowing on the reserve_

| Name    | Type                                     | Description                                                            |
| ------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| self    | struct DataTypes.ReserveConfigurationMap | The reserve configuration                                              |
| enabled | bool                                     | True if the stable rate borrowing needs to be enabled, false otherwise |

### getStableRateBorrowingEnabled

```solidity
function getStableRateBorrowingEnabled(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool)
```

_Gets the stable rate borrowing state of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description                     |
| ---- | ---- | ------------------------------- |
| [0]  | bool | The stable rate borrowing state |

### setReserveFactor

```solidity
function setReserveFactor(struct DataTypes.ReserveConfigurationMap self, uint256 reserveFactor) internal pure
```

_Sets the reserve factor of the reserve_

| Name          | Type                                     | Description               |
| ------------- | ---------------------------------------- | ------------------------- |
| self          | struct DataTypes.ReserveConfigurationMap | The reserve configuration |
| reserveFactor | uint256                                  | The reserve factor        |

### getReserveFactor

```solidity
function getReserveFactor(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256)
```

_Gets the reserve factor of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description        |
| ---- | ------- | ------------------ |
| [0]  | uint256 | The reserve factor |

### getFlags

```solidity
function getFlags(struct DataTypes.ReserveConfigurationMap self) internal view returns (bool, bool, bool, bool)
```

_Gets the configuration flags of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description                                                                                 |
| ---- | ---- | ------------------------------------------------------------------------------------------- |
| [0]  | bool | The state flags representing active, frozen, borrowing enabled, stableRateBorrowing enabled |
| [1]  | bool |                                                                                             |
| [2]  | bool |                                                                                             |
| [3]  | bool |                                                                                             |

### getParams

```solidity
function getParams(struct DataTypes.ReserveConfigurationMap self) internal view returns (uint256, uint256, uint256, uint256, uint256)
```

_Gets the configuration paramters of the reserve_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description                                                                                       |
| ---- | ------- | ------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus, the reserve decimals |
| [1]  | uint256 |                                                                                                   |
| [2]  | uint256 |                                                                                                   |
| [3]  | uint256 |                                                                                                   |
| [4]  | uint256 |                                                                                                   |

### getParamsMemory

```solidity
function getParamsMemory(struct DataTypes.ReserveConfigurationMap self) internal pure returns (uint256, uint256, uint256, uint256, uint256)
```

_Gets the configuration paramters of the reserve from a memory object_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type    | Description                                                                                       |
| ---- | ------- | ------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | The state params representing ltv, liquidation threshold, liquidation bonus, the reserve decimals |
| [1]  | uint256 |                                                                                                   |
| [2]  | uint256 |                                                                                                   |
| [3]  | uint256 |                                                                                                   |
| [4]  | uint256 |                                                                                                   |

### getFlagsMemory

```solidity
function getFlagsMemory(struct DataTypes.ReserveConfigurationMap self) internal pure returns (bool, bool, bool, bool)
```

_Gets the configuration flags of the reserve from a memory object_

| Name | Type                                     | Description               |
| ---- | ---------------------------------------- | ------------------------- |
| self | struct DataTypes.ReserveConfigurationMap | The reserve configuration |

| Name | Type | Description                                                                                 |
| ---- | ---- | ------------------------------------------------------------------------------------------- |
| [0]  | bool | The state flags representing active, frozen, borrowing enabled, stableRateBorrowing enabled |
| [1]  | bool |                                                                                             |
| [2]  | bool |                                                                                             |
| [3]  | bool |                                                                                             |

## **Types**

## OrderTypes

### MakerOrder

```solidity
struct MakerOrder {
  bool isOrderAsk;
  address signer;
  address collection;
  uint256 price;
  uint256 tokenId;
  uint256 amount;
  address strategy;
  address currency;
  uint256 nonce;
  uint256 startTime;
  uint256 endTime;
  uint256 minPercentageToAsk;
  bytes params;
  uint8 v;
  bytes32 r;
  bytes32 s;
}

```

### TakerOrder

```solidity
struct TakerOrder {
  bool isOrderAsk;
  address taker;
  uint256 price;
  uint256 tokenId;
  uint256 minPercentageToAsk;
  bytes params;
}

```

## ConfigTypes

### InitReserveInput

```solidity
struct InitReserveInput {
  address uTokenImpl;
  address debtTokenImpl;
  uint8 underlyingAssetDecimals;
  address interestRateAddress;
  address underlyingAsset;
  address treasury;
  string underlyingAssetName;
  string uTokenName;
  string uTokenSymbol;
  string debtTokenName;
  string debtTokenSymbol;
}

```

### InitNftInput

```solidity
struct InitNftInput {
  address underlyingAsset;
}

```

### UpdateUTokenInput

```solidity
struct UpdateUTokenInput {
  address asset;
  address implementation;
  bytes encodedCallData;
}

```

### UpdateDebtTokenInput

```solidity
struct UpdateDebtTokenInput {
  address asset;
  address implementation;
  bytes encodedCallData;
}

```

## DataTypes

### ReserveData

```solidity
struct ReserveData {
  struct DataTypes.ReserveConfigurationMap configuration;
  uint128 liquidityIndex;
  uint128 variableBorrowIndex;
  uint128 currentLiquidityRate;
  uint128 currentVariableBorrowRate;
  uint40 lastUpdateTimestamp;
  address uTokenAddress;
  address debtTokenAddress;
  address interestRateAddress;
  uint8 id;
}
```

### NftData

```solidity
struct NftData {
  struct DataTypes.NftConfigurationMap configuration;
  address uNftAddress;
  uint8 id;
  uint256 maxSupply;
  uint256 maxTokenId;
}
```

### ReserveConfigurationMap

```solidity
struct ReserveConfigurationMap {
  uint256 data;
}

```

### NftConfigurationMap

```solidity
struct NftConfigurationMap {
  uint256 data;
}

```

### LoanState

```solidity
enum LoanState {
  None,
  Created,
  Active,
  Auction,
  Repaid,
  Defaulted
}

```

### LoanData

```solidity
struct LoanData {
  uint256 loanId;
  enum DataTypes.LoanState state;
  address borrower;
  address nftAsset;
  uint256 nftTokenId;
  address reserveAsset;
  uint256 scaledAmount;
  uint256 auctionStartTimestamp;
  uint256 minBidPrice;
}
```

### ExecuteDepositParams

```solidity
struct ExecuteDepositParams {
  address initiator;
  address asset;
  uint256 amount;
  address onBehalfOf;
  uint16 referralCode;
}

```

### ExecuteWithdrawParams

```solidity
struct ExecuteWithdrawParams {
  address initiator;
  address asset;
  uint256 amount;
  address to;
}

```

### ExecuteBorrowParams

```solidity
struct ExecuteBorrowParams {
  address initiator;
  address asset;
  uint256 amount;
  address nftAsset;
  uint256 nftTokenId;
  address onBehalfOf;
  uint16 referralCode;
}

```

### ExecuteRepayParams

```solidity
struct ExecuteRepayParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
}

```

### ExecuteAuctionParams

```solidity
struct ExecuteAuctionParams {
  address nftAsset;
  uint256 nftTokenId;
}

```

### ExecuteRedeemParams

```solidity
struct ExecuteRedeemParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
}

```

### ExecuteLiquidateParams

```solidity
struct ExecuteLiquidateParams {
  address initiator;
  address nftAsset;
  uint256 nftTokenId;
  uint256 amount;
}

```

### ExecuteLiquidateNFTXParams

```solidity
struct ExecuteLiquidateNFTXParams {
  address nftAsset;
  uint256 nftTokenId;
  uint256 liquidateFeePercentage;
}

```
