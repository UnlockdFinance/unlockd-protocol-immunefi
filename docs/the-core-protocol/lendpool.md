---
description: lendpool.sol
---

# LendPool

The `LendPool` contract is the main contract of the protocol. It exposes all the user-oriented actions that can be invoked using either Solidity or web3 libraries.

The source code can be found on [GitHub](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/master/contracts/protocol/LendPool.sol) here\*\*.\*\*

{% hint style="info" %}
LendPool methods deposit, withdraw, triggerUserCollateral, borrow, repay, auction, redeem, liquidate, and liquidateNFTX are only for ERC20 and ERC721.\
If you want to deposit, withdraw, triggerUserCollateral, borrow, repay, auction, or redeem using native ETH, use WETHGateway instead.\
If you want to borrow or repay using CryptoPunks as collateral, use PunkGateway.
{% endhint %}

## View Methods

### getReserveConfiguration

`function getReserveConfiguration(address asset) external view override returns (DataTypes.ReserveConfigurationMap memory)`

Returns the configuration of the reserve.

#### Call Params

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| asset | address | the address of the underlying asset (ERC20) |

#### Return Values

| Type                              | Description                                                                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DataTypes.ReserveConfigurationMap | <p>The reserve configuration values are stored on-chain: <br>LTV, </p><p>Liq. threshold,</p><p>Liq. bonus,</p><p>Decimals,</p><p>Reserve is active,</p><p>Reserve is frozen,</p><p>Borrowing is enabled, </p><p>Stable rate borrowing enabled, </p><p>Reserved, </p><p>Reserve factor uint256 data;</p> |

### getNftConfigByTokenId

`function getNftConfigByTokenId(address asset, uint256 nftTokenId) external view override returns (DataTypes.NftConfigurationMap memory)`

Returns the configuration of the NFT collection as a default config.&#x20;

{% hint style="info" %}
Each NFT has its own configuration by `tokenId`, not by collection.
{% endhint %}

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| asset      | address | the address of the underlying asset (ERC721) |
| nftTokenId | uint256 | the tokenId of the underlying asset (ERC721) |

#### Return Values

| Type                          | Description                                                                                                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DataTypes.NftConfigurationMap | <p>The reserve configuration values are stored on-chain: <br>LTV, </p><p>Liq. threshold,</p><p>Liq. bonus,</p><p>NFT is active,</p><p>NFT is frozen,</p><p>Redeem duration,</p><p>Auction duration,</p><p>Redeem fine,</p><p>Redeem threshold</p><p>Min bid fine,</p><p>timestamp config;</p> |

### getReserveNormalizedIncome

`function getReserveNormalizedIncome(address asset) external view override returns (uint256)`

Returns the normalized income of the reserve.

#### Call Params

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| asset | address | the address of the underlying asset (ERC20) |

#### Return Values

| Type    | Description               |
| ------- | ------------------------- |
| uint256 | normalized income amount. |

### getReserveNormalizedVariableDebt

`function getReserveNormalizedVariableDebt(address asset) external view override returns (uint256)`

Returns the normalized variable debt per unit of asset.

#### Call Params

|       |         |                                             |
| ----- | ------- | ------------------------------------------- |
| asset | address | the address of the underlying asset (ERC20) |

#### Return Params

| Type    | Description                     |
| ------- | ------------------------------- |
| uint256 | normalized variable debt amount |

### getReserveData

`function getReserveData(address asset) external view override returns (DataTypes.ReserveData memory)`

Returns the state and configuration of the reserve.

#### Call Params

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| asset | address | the address of the underlying asset (ERC20) |

#### Return Values

| Type                    | Description                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DataTypes.ReserveData` | <p>The reserve data struct</p><p>ReserveConfigurationMap configuration, </p><p>liquidityIndex, </p><p>variableBorrowIndex, </p><p>currentLiquidityRate, </p><p>currentVariableBorrowRate, </p><p>lastUpdateTimestamp,</p><p>uTokenAddress,</p><p>debtTokenAddress, </p><p>interestRateAddress,</p><p>id;</p> |

### getNftData

`function getNftData(address asset) external view override returns (DataTypes.NftData memory)`

Returns the state and configuration of the NFT.

#### Call Params

| Name  | Type    | Description                                  |
| ----- | ------- | -------------------------------------------- |
| asset | address | the address of the underlying asset (ERC721) |

#### Return Values

| Type                | Description                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTypes.NftData` | <p>Returns the NFT data Struct:</p><p>NftConfigurationMap configuration,</p><p>uNftAddress,</p><p>id,</p><p>maxSupply,</p><p>maxTokenId;</p> |

### getNftCollateralData

`function getNftCollateralData(address nftAsset, uint256 nftTokenId, address reserveAsset) external view override returns (uint256 totalCollateralInETH, uint256 totalCollateralInReserve, uint256 availableBorrowsInETH,  uint256 availableBorrowsInReserve, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus)`

Returns the loan data of the NFT by TokenId.

#### Call Params

| Name         | Type    | Description                                         |
| ------------ | ------- | --------------------------------------------------- |
| nftAsset     | address | the address of the underlying asset (ERC721)        |
| nftTokenId   | uint256 | the tokenId of the underlying asset                 |
| reserveAsset | address | the address of the underlying reserve asset (ERC20) |

#### Return Values

| Name                      | Type    | Description                                |
| ------------------------- | ------- | ------------------------------------------ |
| totalCollateralInETH      | uint256 | the total collateral in ETH of the NFT     |
| totalCollateralInReserve  | uint256 | the total collateral in Reserve of the NFT |
| availableBorrowsInETH     | uint256 | the borrowing power in ETH of the NFT      |
| availableBorrowsInReserve | uint256 | the borrowing power in Reserve of the NFT  |
| ltv                       | uint256 | loan to value for the NFT/User             |
| liquidationThreshold      | uint256 | the liquidation threshold of the NFT       |
| liquidationBonus          | uint256 | the liquidation bonus of the NFT           |

### getNftDebtData

`function getNftDebtData(address nftAsset, uint256 nftTokenId) external view override returns (uint256 loanId, address reserveAsset, uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 healthFactor)`

Returns the debt data of the NFT.

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| nftAsset   | address | the address of the underlying asset (ERC721) |
| nftTokenId | uint256 | the tokenId of the underlying asset          |

#### Return Values

| Name             | Type    | Description                          |
| ---------------- | ------- | ------------------------------------ |
| loanId           | uint256 | the loan id of the NFT               |
| reserveAsset     | address | the address of the Reserve           |
| totalCollateral  | uint256 | the total power of the NFT           |
| totalDebt        | uint256 | the total debt of the NFT            |
| availableBorrows | uint256 | the borrowing power left of the NFT  |
| healthFactor     | uint256 | the current health factor of the NFT |

### getNftAuctionDatagetNftAuctionData

`function getNftAuctionData(address nftAsset, uint256 nftTokenId) external view override returns (uint256 loanId, address bidderAddress, uint256 bidPrice, uint256 bidBorrowAmount, uint256 bidFine)`

Returns the auction data of the NFT.

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| nftAsset   | address | the address of the underlying asset (ERC721) |
| nftTokenId | uint256 | the tokenId of the underlying asset          |

#### Return Values

| Name            | Type    | Description                                         |
| --------------- | ------- | --------------------------------------------------- |
| loanId          | uint256 | the loan id of the NFT                              |
| bidderAddress   | address | the highest bidder address of the loan              |
| bidPrice        | uint256 | the highest bid price in Reserve of the loan        |
| bidBorrowAmount | uint256 | the borrow amount in Reserve of the loan            |
| bidFine         | uint256 | the penalty fine of the loan paid to the 1st bidder |

### getNftLiquidatePrice

`function getNftLiquidatePrice(address nftAsset, uint256 nftTokenId) external view override returns (uint256 liquidatePrice, uint256 paybackAmount)`

Returns the liquidation price and the payback amount.

#### Call Params

| Name       | Type    | Description                                  |
| ---------- | ------- | -------------------------------------------- |
| nftAsset   | address | the address of the underlying asset (ERC721) |
| nftTokenId | uint256 | the tokenId of the underlying asset          |

#### Return Values

| Name           | Type    | Description                                                                          |
| -------------- | ------- | ------------------------------------------------------------------------------------ |
| liquidatePrice | uint256 | the liquidation price of the NFT is less than the payback amount it becomes the same |
| paybackAmount  | uint256 | the payback amount for the NFT                                                       |

### getReservesList

`function getReservesList() external view override returns (address[] memory)`

Returns the list of the initialized reserves.

#### Return Values

| Type                          | Description                                 |
| ----------------------------- | ------------------------------------------- |
| array of address (address\[]) | A list of address, the initialized reserves |

### getNftsList

`function getNftsList() external view override returns (address[] memory)`

Returns the list of the initialized NFTs.

#### Return Values

| Type                          | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| array of address (address\[]) | A list of address, the initialized NFT reserves |

## Write Methods

### deposit

`function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override nonReentrant whenNotPaused`

Deposit the user-chosen amount of a certain `asset` into the protocol, minting the same `amount` of corresponding uTokens, and transferring them to the `onBehalfOf` address.

Example: Bob deposits 100 WETH and will get 100 uWETH in return as proof of the deposited amount.

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
When depositing, the `LendPool` contract must have`allowance()`**to spend funds on behalf of**`msg.sender` for at least the`amount of` the **`asset`** being deposited.\
This can be done via the standard ERC20 `approve()` method.
{% endhint %}

#### Call Params

| Name         | Type    | Description                                                                                                                 |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | the address of the underlying asset (ERC20)                                                                                 |
| amount       | uint256 | the amount to deposit expressed in wei units                                                                                |
| onBehalfOf   | address | <p>address whom will receive the uTokens.<br>Use <code>msg.sender</code> when the uTokens should be sent to the caller.</p> |
| referralCode | uint16  | the referral program is not working at the moment use 0                                                                     |

### withdraw

`function withdraw(address asset, uint256 amount, address to) external override nonReentrant whenNotPaused returns (uint256)`

Withdraws the amount of the underlying `asset` based on the `amount` of uTokens being held and burns the same amount of uTokens.

Example: Bob withdraws 10 ETH. Bob will get 10 ETH and will burn the same amount in uTokens.

{% hint style="warning" %}
When withdrawing `to` another address, the `msg.sender`should hold enough uTokens that the lendPool will burn.
{% endhint %}

#### Call Params

| Name   | Type    | Description                                      |
| ------ | ------- | ------------------------------------------------ |
| asset  | address | address of the underlying asset (ERC20)          |
| amount | uint256 | the amount to be withdraw expressed in wei units |
| to     | address | the address that will receive the asset.         |

#### Return Params

| Type    | Description                   |
| ------- | ----------------------------- |
| uint256 | the amount that was withdrawn |

### triggerUserCollateral

`function triggerUserCollateral(address nftAsset, uint256 nftTokenId) external payable override onlyHolder(nftAsset, nftTokenId) whenNotPaused`

This will ensure that the user holds the `nftAsset` or the uNFT version of it (ERC721). It will charge a small fee to the user to configure his NFT on the protocol.

{% hint style="info" %}
This function needs to be done before borrowing. Otherwise, it will revert.
{% endhint %}

#### Call Params

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| nftAsset   | address | the adress of the underlying NFT asset used as collateral  |
| nftTokenId | uint256 | the TokenId of the underlying NFT asset used as collateral |

### borrow

`function borrow(address asset, uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external override nonReentrant whenNotPaused`

The user will be able to borrow an `amount` of `asset` using his `nftAsset` as collateral to a wallet `onBehalfOf` and will also receive the same `amount` in debt tokens as proof of debt.

Example: Alice borrows 10 ETH using her Lockey NFT with tokenid 1.\
Alice will lock her NFT and get a uNFT (wrapped version of the collateral), debt tokens representing her debt to the protocol and the 10 ETH.

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
The borrowing can only be done if your NFT is configured on the protocol.

To do this, the triggerUserCollateral needs to be called first.\
Also, there's a `_timeFrame` variable configured that will validate the time between configuring the NFT and the borrow. If the time is exceeded, it will revert.\\

The `_timeFrame` can be checked with `getTimeframe()`
{% endhint %}

#### Call Params

| Name         | Type    | Description                                                                                                                                                 |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asset        | address | The address of the underlying asset to borrow                                                                                                               |
| amount       | uint256 | the amount to be borrowed expressed in wei units                                                                                                            |
| nftAsset     | address | the address of the underlying NFT used as collateral                                                                                                        |
| nftTokenId   | uint256 | the tokenId of the underlying NFT used as collateral                                                                                                        |
| onBehalfOf   | address | <p>address whom will receive the borrowed amount.<br>Use <code>msg.sender</code> when the debt tokens and borrowed amount should be sent to the caller.</p> |
| referralCode | uint16  | the referral program is not working at the moment use 0                                                                                                     |

### repay

`function repay(address nftAsset, uint256 nftTokenId, uint256 amount) external override nonReentrant whenNotPaused returns (uint256, bool)`

Repays a borrowed `amount` equal to or less than the amount owed from the specified collateral, `nftAsset`. It will burn the same `amount` of `debt tokens`.

Example: Alice decides to pay 2 ETH from the borrowed amount. Alice will use her uNFT to identify the loan, will give 2 ETH and will burn the same amount in debt tokens.

#### Call Params

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| nftAsset   | address | the underlying NFT address used as collateral  |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral |
| amount     | uint256 | the amount that the user wants to repay        |

#### Return Values

| Type    | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| uint256 | the repayed amount                                                         |
| bool    | will return true if the total amount is repaid or false if partially paid. |

### auction

`function auction(address nftAsset, uint256 nftTokenId, uint256 bidPrice, address onBehalfOf) external override nonReentrant whenNotPaused`

When the health factor is below one, the users can trigger an auction if they want to buy the collateral asset, the NFT used in the loan. The `bidPrice` needs to be higher than

When a user bids, the money gets locked on the contract till someone outbids or the liquidation happens.

Example: Alice's NFT price went down, and the health factor (HF) went below 1. Bob, that loves the Lockeys decide to bid.\
If there's a second bid, the first bidder will get a 2.5% bidFine for being the first. The bidFine will also be paid if Alice decides to redeem part of the debt and make the HF go above one.

| Name       | Type    | Description                                                                                            |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------ |
| nftAsset   | address | the underlying NFT address used as collateral with HF < 1                                              |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral with HF < 1                                             |
| bidPrice   | uint256 | the amount that the msg.sender decides to bid needs to be higher than previous or the debt amount + 1% |
| onBehalfOf | address | address whom will receive the NFT in case the auction is successful                                    |

### redeem

`function redeem(address nftAsset, uint256 nftTokenId, uint256 amount, uint256 bidFine) external override nonReentrant whenNotPaused returns (uint256)`

Redeem should be used by the NFT Owner in case the NFT goes into auction and he wants to keep his NFT.

{% hint style="info" %}
If the auction starts and the redeem duration are still available, the user can pay an amount to increase the Health Factor.

The amount needs to be higher than the `(borrowAmount * redeemThreshold)/100`
{% endhint %}

Example: Alice's NFT was bid by Bob, but since Alice can still redeem, she decides to pay 70% of her debt to get the Health Factor > 1.

#### Call Params

| Name       | Type    | Description                                                                                              |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------- |
| nftAsset   | address | the underlying NFT address used as collateral with HF < 1 and `redeemDuration` available                 |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral with HF < 1 and `redeemDuration` available                |
| amount     | uint256 | the amount that NFT Owner decides to pay                                                                 |
| bidFine    | uint256 | the 2.5 fee the user needs to pay to the first bidder in case someone bidded during the `redeemDuration` |

#### Return Values

| Type    | Description           |
| ------- | --------------------- |
| uint256 | paid amount + bidFine |

### Liquidate

`function liquidate(address nftAsset, uint256 nftTokenId, uint256 amount) external override nonReentrant whenNotPaused returns (uint256)`

After the auction period ends. The liquidator should trigger this so he can receive his collateral asset.

Example: Bob wins the auction. He can call this function to get his collateral (NFT) into his wallet.

#### Call Params

| Name       | Type    | Description                                                             |
| ---------- | ------- | ----------------------------------------------------------------------- |
| nftAsset   | address | the underlying NFT address used as collateral and bought on an auction  |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral and bought on an auction |
| amount     | uint256 | the auction amount used to buy the NFT.                                 |

#### Return Values

| Type    | Description               |
| ------- | ------------------------- |
| uint256 | `borrowAmount - bidPrice` |

### liquidateNFTX

`function liquidateNFTX(address nftAsset, uint256 nftTokenId)`

If there are no bids in an auction, and to provide liquidity, we liquidate the NFT on the NFTX marketplace.

{% hint style="warning" %}
The price NFT needs to have liquidity available on NFTX Protocol.

In case of a loss, the protocol treasury will pay for the money lost.
{% endhint %}

Example: Alices NFT didn't receive any bids and the `borrowAmount` + 1% = 10ETH;\
Case 1: we sell the NFT on NFTX for 12 ETH, pay the protocol, and the remainder goes to the user.

Case 2: we sell the NFT on NFTX for 9.5 ETH. The missing ETH for the debt to get paid will come from the protocol's treasury.&#x20;

{% hint style="warning" %}
If the protocol treasury has less than the missing amount, it reverts.
{% endhint %}

#### Call Params

| Name       | Type    | Description                                                           |
| ---------- | ------- | --------------------------------------------------------------------- |
| nftAsset   | address | the underlying NFT address used as collateral and to be sold on NFTX  |
| nftTokenId | uint256 | the underlying NFT token Id used as collateral and to be sold on NFTX |

#### Return values

| Type    | Description                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| uint256 | The remainder amount, in case the price obtained from selling on the NFTX market is higher than the borrowed amount |
