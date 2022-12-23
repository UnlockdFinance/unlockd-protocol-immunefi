---
description: LendPoolLoan.sol
---

# LendPoolLoan

The LendPoolLoan is called by the LendPool and does everything related to loans and collaterals.

__

## View Methods

`function borrowerOf(uint256 loanId) external view returns (address)`

Returns the address of the borrower.

#### Call Params

| Name   | Type    | Description        |
| ------ | ------- | ------------------ |
| loanId | uint256 | the id of the loan |

#### Return Values

| Type    | Description                                         |
| ------- | --------------------------------------------------- |
| address | the `borrower` address associated with the `loanId` |

### getCollateralLoanId

`function getCollateralLoanId(address nftAsset, uint256 nftTokenId) external view returns (uint256)`

&#x20;Returns the loan id corresponding to a specific `nftAsset` and `nftTokenId`

#### Call Params

| Name       | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| nftAsset   | address | The address of the underlying asset. |
| nftTokenId | uint256 | the tokenId of the underlying asset  |

#### Return Values

| Name    | Description                       |
| ------- | --------------------------------- |
| uint256 | the loan Id for the specified NFT |

### getLoanIdTracker

`function getLoanIdTracker() external view returns (struct CountersUpgradeable.Counter)`

Returns the counter tracker for all the loan IDs in the protocol

#### Return Values

| Type                          | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `CountersUpgradeable.Counter` | the number that will be used in the next loan |

### getUserNftCollateralAmount

`function getUserNftCollateralAmount(address user, address nftAsset) external view returns (uint256)`

Returns the collateral amount for a given user and a specific NFT collection.

#### Call Params

| Name     | Type    | Description                                                    |
| -------- | ------- | -------------------------------------------------------------- |
| user     | address | the address of the user we want to chech the collateral amount |
| nftAsset | address | the address of the underlying asset                            |

#### Return Values

| Type    | Description                                                     |
| ------- | --------------------------------------------------------------- |
| uint256 | the amount the user has as collateral for a specific collection |

### getNftCollateralAmount

`function getNftCollateralAmount(address nftAsset) external view returns (uint256)`

Returns the collateral amount for a specific collection.

#### Call Params

| Name     | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| nftAsset | address | the address of the underlying asset, collection |

#### Return Values

| Type    | Description                                     |
| ------- | ----------------------------------------------- |
| uint256 | the collateral amount for a specific collection |

### getLoanHighestBid

`function getLoanHighestBid(uint256 loanId) external view returns (address, uint256)`

Returns the address and the bid price of the highest bid during an auction.

#### Call Params

| Name   | Type    | Description        |
| ------ | ------- | ------------------ |
| loanId | uint256 | the id of the loan |

#### Return Values

| Type    | Description        |
| ------- | ------------------ |
| address | the bidder address |
| uint256 | the bid price      |

### getLoanReserveBorrowScaledAmount

`function getLoanReserveBorrowScaledAmount(uint256 loanId) external view returns (address, uint256)`

Returns the scaled amount and the reserve asset for a specific loan.

#### Call Params

| Name    | Type   | Description                                                 |
| ------- | ------ | ----------------------------------------------------------- |
| uint256 | loanId | the loan id to retrive the scalled amount and reserve asset |

#### Return Values

| Type    | Description               |
| ------- | ------------------------- |
| address | the reserve asset (ERC20) |
| uint256 | the scaled amount         |

### getLoanReserveBorrowAmount

`function getLoanReserveBorrowAmount(uint256 loanId) external view returns (address, uint256)`

Returns the amount borrowed and the reserve address for a specific loan.

#### Call Params

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| loanId | uint256 | the loan id to retrive the data |

#### Return Values

| Type    | Description         |
| ------- | ------------------- |
| address | the reserve address |
| uint256 | the amount borrowed |

### getLoanCollateralAndReserve

`function getLoanCollateralAndReserve(uint256 loanId) external view returns (address nftAsset, uint256 nftTokenId, address reserveAsset, uint256 scaledAmount)`

Returns the NFT address, tokenId, reserve address and scaled amount for a specific loan.&#x20;

#### Call Params

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| loanId | uint256 | the id of the loan we want  to retrive data |

#### Return Values

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| nftAsset     | address | the address of the underlying asset (ERC721)  |
| nftTokenId   | uint256 | the token id of the underlying asset (ERC721) |
| reserveAsset | address | the address of the reserve asset (ERC20)      |
| scaledAmount | uint256 | the scaled amount                             |

### getLoan

`function getLoan(uint256 loanId) external view returns (struct DataTypes.LoanData loanData)`

Returns the struct containing all the info regarding a specific loan.

#### Call Params

| Name   | Type    | Description                      |
| ------ | ------- | -------------------------------- |
| loanId | uint256 | the loan id to retrive data from |

#### Return Values

| Name     | Type               | Description                                                                                                                                                                                                                                  |
| -------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loanData | DataTypes.LoanData | <p>LoanData struct:<br>loanId, </p><p>state,</p><p>borrower, </p><p>nftAsset, </p><p>nftTokenId, </p><p>reserveAsset, </p><p>scaledAmount,  bidStartTimestamp, bidderAddress,</p><p>bidPrice,</p><p>bidBorrowAmount, firstBidderAddress;</p> |

## Write Methods

### createLoan

`function createLoan(address initiator, address onBehalfOf, address nftAsset, uint256 nftTokenId, address uNftAddress, address reserveAsset, uint256 amount, uint256 borrowIndex) external returns (uint256)`

Create and store the loan, and mint the uNFT to the user as proof of deposit.

#### Call Params

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

#### Return Values

| Type    | Description |
| ------- | ----------- |
| uint256 | the loan id |

### updateLoan

`function updateLoan(address initiator, uint256 loanId, uint256 amountAdded, uint256 amountTaken, uint256 borrowIndex) external`

It updates an existing loan.

{% hint style="info" %}
The caller must be a holder of the loan.

The loan must be in an active state
{% endhint %}

#### Call Params

| Name        | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| initiator   | address | The address of the user updating the loan |
| loanId      | uint256 | The loan ID                               |
| amountAdded | uint256 | The amount added to the loan              |
| amountTaken | uint256 | The amount taken from the loan            |
| borrowIndex | uint256 | The index to get the scaled loan amount   |

### repayLoan

`function repayLoan(address initiator, uint256 loanId, address uNftAddress, uint256 amount, uint256 borrowIndex) external`

It will repay the given loan, partially or in whole.

{% hint style="info" %}
The caller must be a holder of the loan.

The caller must send in principal + interest.

The loan must be in an active state.
{% endhint %}

#### Call Params

| Name        | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| initiator   | address | The address of the user initiating the repay |
| loanId      | uint256 | The loan getting burned                      |
| uNftAddress | address | The address of uNFT                          |
| amount      | uint256 | The amount repaid                            |
| borrowIndex | uint256 | The index to get the scaled loan amount      |

### auctionLoan

`function auctionLoan(address initiator, uint256 loanId, address onBehalfOf, uint256 bidPrice, uint256 borrowAmount, uint256 borrowIndex) external`

It will start and run an auction at a given loan.

{% hint style="info" %}
The price must be greater than the current highest price.

The loan must be in an active or auction state.
{% endhint %}

#### Call Params

| Name         | Type    | Description                                    |
| ------------ | ------- | ---------------------------------------------- |
| initiator    | address | The address of the user initiating the auction |
| loanId       | uint256 | The loan getting auctioned                     |
| onBehalfOf   | address | The user address regarding the auction         |
| bidPrice     | uint256 | The bid price of this auction                  |
| borrowAmount | uint256 | The amount that was borrowed                   |
| borrowIndex  | uint256 | the borrow index                               |

### redeemLoan

`function redeemLoan(address initiator, uint256 loanId, uint256 amountTaken, uint256 borrowIndex) external`

If the loan is in an auction state, and the owner wants to pay it back, making the health factor go above 1.

{% hint style="info" %}
The caller must be a holder of the loan.

The loan must be in an auction state.
{% endhint %}

{% hint style="danger" %}
redeemLoan = auction state.

repayLoan = active state.
{% endhint %}

#### Call Params

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| initiator   | address | The address of the user initiating the borrow |
| loanId      | uint256 | The loan getting redeemed                     |
| amountTaken | uint256 | The taken amount                              |
| borrowIndex | uint256 | The index to get the scaled loan amount       |

### liquidateLoan

`function liquidateLoan(address initiator, uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external`

Liquidate the given loan, sending the NFT to its new owner.

{% hint style="info" %}
The caller must send in principal + interest.

The loan must be in an active state.
{% endhint %}

#### Call Params

| Name         | Type    | Description                                    |
| ------------ | ------- | ---------------------------------------------- |
| initiator    | address | The address of the user initiating the auction |
| loanId       | uint256 | The loan getting burned                        |
| uNftAddress  | address | The address of uNFT                            |
| borrowAmount | uint256 | The borrow amount                              |
| borrowIndex  | uint256 | The index to get the scaled loan amount        |

### liquidateLoanNFTX

`function liquidateLoanNFTX(uint256 loanId, address uNftAddress, uint256 borrowAmount, uint256 borrowIndex) external returns (uint256 sellPrice)`

Liquidates a specific loan on NFTX if the auction has no bids.&#x20;

#### Call Params

| Name         | Type    | Description              |
| ------------ | ------- | ------------------------ |
| loanId       | uint256 | The loan getting burned  |
| uNftAddress  | address | the address of the uNFT  |
| borrowAmount | uint256 | the borrowed amount      |
| borrowIndex  | uint256 | the borrowed index       |

#### Return Values

|           |         |                                          |
| --------- | ------- | ---------------------------------------- |
| sellPrice | uint256 | the price which the NFT was sold on NFTX |
