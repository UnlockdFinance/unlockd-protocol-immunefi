# WETH Gateway

If you need to use native ETH in the protocol, it must first be wrapped into WETH. The WETH Gateway contract is a helper contract to easily wrap and unwrap ETH as necessary when interacting with the protocol, since only ERC20 is used within protocol interactions. This allows users to interact with the LendPool seamlessly without previously wrapping ETH themselves.

The source code of the WETH Gateway can be found on [Github](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development/contracts/protocol/WETHGateway.sol).

## View methods

### isCallerInWhitelist

`function isCallerInWhitelist(address caller) external view returns (bool)`

Checks if the caller is whitelisted.

#### Call params

| Name   | Type    | Description               |
| ------ | ------- | ------------------------- |
| caller | address | The address to be checked |

#### Return values

| Type | Description                                                    |
| ---- | -------------------------------------------------------------- |
| bool | Returns `true` if the caller is whitelisted, `false` otherwise |

### getWETHAddress

`function getWETHAddress() external view returns (address)`

Returns the WETH address currently set in the WETH Gateway.

#### Return values

| Type    | Description      |
| ------- | ---------------- |
| address | The WETH address |

## Write methods

### depositETH

`function depositETH(address onBehalfOf, uint16 referralCode) external payable override nonReentrant`

Deposits the user-chosen amount of ETH into the protocol, minting the same amount passed as `msg.value` of corresponding uTokens, and transferring them to the `onBehalfOf` address.

Example: Bob deposits 100 ETH into Unlockd, and gets 100 uWETH in return as proof of the deposited amount.

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
Ensure that the `depositETH()` transaction also includes the amount of ETH you are depositing in the `msg.value`.
{% endhint %}

#### Call params

| Name         | Type    | Description                                                                                                               |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| onBehalfOf   | address | <p>address whom will receive the uWETH.<br>Use <code>msg.sender</code> when the uTokens should be sent to the caller.</p> |
| referralCode | uint16  | Referral code. The referral program is currently in development. Therefore, `referralCode` must be set to 0.              |
|              |         |                                                                                                                           |

### withdrawETH

`function withdrawETH(uint256 amount, address to) external override nonReentrant`

Withdraws `amount` of the WETH, unwraps it to ETH, and transfers the ETH to the `to` address.

Example: Bob withdraws 10 ETH. Bob will get 10 ETH and will burn the same amount in uTokens.

{% hint style="warning" %}
Ensure you set the relevant ERC20 allowance of uWETH, before calling this function, so the `WETHGateway` contract can burn the associated uWETH.
{% endhint %}

#### Call params

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| amount | uint256 | The amount to be withdrawn                  |
| to     | address | address that will receive the unwrapped ETH |

### borrowETH

`function borrowETH(uint256 amount, address nftAsset, uint256 nftTokenId, address onBehalfOf, uint16 referralCode) external override nonReentrant`

Borrows `amount` of ETH, sending the `amount` of unwrapped WETH to `msg.sender`.

Example: Alice borrows 10 ETH using her Lockey NFT with tokenid 1 as collateral.&#x20;

{% hint style="danger" %}
The referral program is coded but inactive. You can pass a 0 as `referralCode.`
{% endhint %}

{% hint style="warning" %}
The borrowing can only be done if your NFT is configured on the protocol.

To do this, the triggerUserCollateral needs to be called first. \
Also, there's a `_timeFrame` variable configured that will validate the time between configuring the NFT and the borrow. If the time is exceeded, it will revert.\


The `_timeFrame` can be checked with the `getTimeframe()` function in the LendPool contract
{% endhint %}

#### Call params

| Amount       | Type    | Description                                                                                                                       |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| amount       | uint256 | Amount to be borrowed, expressed in wei units                                                                                     |
| nftAsset     | address | The NFT contract address                                                                                                          |
| nftTokenId   | uint256 | The NFT token Id                                                                                                                  |
| onBehalfOf   | address | <p>address of user who will incur the debt.</p><p>Use <code>msg.sender</code> when not calling on behalf of a different user.</p> |
| referralCode | uint16  | Referral code. The referral program is currently in development. Therefore, `referralCode` must be set to 0.                      |

### repayETH

`function _repayETH( address nftAsset, uint256 nftTokenId, uint256 amount, uint256 accAmount ) internal returns (uint256, bool)`

Repays a borrowed `amount` equal to or less than the amount owed from the specified collateral, `nftAsset`. It will burn the same `amount` of `debt tokens`.

Example: Alice decides to pay 2 ETH from the borrowed amount. Alice will use her uNFT to identify the loan, will give 2 ETH and will burn the same amount in debt tokens.

{% hint style="warning" %}
Ensure that the `repayETH()` transaction also includes the amount of ETH you are repaying in the `msg.value`.
{% endhint %}

#### Call params

| Name       | Type    | Description                                 |
| ---------- | ------- | ------------------------------------------- |
| nftAsset   | address | The NFT contract address                    |
| nftTokenId | uint256 | The NFT token Id                            |
| amount     | uint256 | Amount to be repaid, expressed in wei units |
| accAmount  | uint256 | The accumulated amount                      |

#### Return values

| Type    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| uint256 | The paid amount                                                    |
| bool    | `true` if the total amount is repaid or `false` if partially paid. |

### auctionETH

`function auctionETH(address nftAsset, uint256 nftTokenId, address onBehalfOf ) external payable override nonReentrant`

Places a bid for an NFT whose current health factor is below one. The users can trigger an auction if they want to buy the collateral asset, placing a bid for the `msg.value`amount. New bids should always be higher than the loan borrowed amount, and 1% higher than the previous bid (in case there is one). The first user to bid will always receive a 2.5% bid incentive for being the first bidder.

Example: Alice's NFT price went down,  together with her loan's health factor (HF),  which is now below 1. Bob decides to bid for that NFT. \
If there's a second bid, Bob's bid will be cancelled and the new bid will the the current winning bid. Bob will still receive a 2.5% reward fee for being the first bidder. The bidFine will also be paid if Alice decides to redeem part of the debt and make the HF go above one.

{% hint style="warning" %}
Ensure that the `auctionETH()` transaction also includes the amount of ETH you are bidding for in the `msg.value`.
{% endhint %}

#### Call params

| Name       | Type    | Description                                                                                                                          |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| nftAsset   | address | The NFT contract address                                                                                                             |
| nftTokenId | uint256 | The NFT token Id                                                                                                                     |
| onBehalfOf | address | <p>address of user who will incur the auction.</p><p>Use <code>msg.sender</code> when not calling on behalf of a different user.</p> |

### redeemETH

`function redeemETH( address nftAsset, uint256 nftTokenId, uint256 amount, uint256 bidFine ) external payable override nonReentrant returns (uint256)`

Allows a borrower to increase his loan's Health Factor in case it is below 1. In order to redeem, a `bidFine`  should be paid by the borrower to the current loan bidder (in case there is one).

Example: Alice's NFT price went down,  together with her loan's health factor (HF),  which is now below 1. Bob decides to bid for that NFT. \
After Bob's bid, Alice decides to redeem her NFT in order to increase her loan's HF and avoid getting liquidated. Bob will receive his bidding amount back, plus a `bidFine` reward fee for being the first bidder.&#x20;

{% hint style="info" %}
The redeem `amount` needs to be higher than the `(borrowAmount * redeemThreshold)/100`
{% endhint %}

{% hint style="warning" %}
Ensure that the`redeemETH()` transaction also includes the amount of ETH you are redeeming, as well as the bid fine you are transferring in the `msg.value`.
{% endhint %}

#### Call params

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| nftAsset   | address | The NFT contract address                              |
| nftTokenId | uint256 | The NFT token Id                                      |
| amount     | uint256 | Amount to be redeemed, expressed in wei units         |
| bidFine    | uint256 | Amount to be paid as bid fine, expressed in wei units |

#### Return values

| Type    | Description                                           |
| ------- | ----------------------------------------------------- |
| uint256 | The total payback (amount redeemed plus the bid fine) |

### liquidateETH

`function liquidateETH(address nftAsset, uint256 nftTokenId) external payable override nonReentrant returns (uint256)`

Allows an auction winner to liquidate the position and get the NFT.

Example: Bob wins the auction. He can call this function to get his collateral (NFT) into his wallet.

{% hint style="info" %}
The `msg.value` amount is the amount to be sent in case the bid price can't cover the borrow amount (for example, if a user takes a long time to redeem and the borrow amount needed to be paid has increased substantially due to interest rates)
{% endhint %}

{% hint style="warning" %}
Ensure that the`redeemETH()` transaction also includes the amount of ETH you want to add as amount to `liquidate` as `msg.value`.
{% endhint %}

#### Call params

| Name       | Type    | Amount                   |
| ---------- | ------- | ------------------------ |
| nftAsset   | address | The NFT contract address |
| nftTokenId | uint256 | The NFT token Id         |

#### Return values

| Type    | Amount                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------- |
| uint256 | The extra debt amount (in case there is one) paid due to last bid price can not cover the borrow amount |

### liquidateNFTX

`function liquidateNFTX(address nftAsset, uint256 nftTokenId) external override nonReentrant returns (uint256)`

If there are no bids in an auction, and to provide liquidity, the NFT will get liquidated on the NFTX marketplace.

{% hint style="warning" %}
The price NFT needs to have liquidity available on NFTX Protocol.

In case of a loss, the protocol treasury will pay for the money lost.
{% endhint %}

Example: Alice's NFT didn't receive any bids and the `borrowAmount` + 1% = 10ETH.\
Case 1: we sell the NFT on NFTX for 12 ETH, pay the protocol, and the remainder goes to the user.

Case 2: we sell the NFT on NFTX for 9.5 ETH. The missing ETH for the debt to get paid will come from the protocol's treasury.&#x20;

{% hint style="warning" %}
If the protocol treasury has less than the missing amount, the transaction will revert.
{% endhint %}

#### Call params

| Name       | Type    | Description              |
| ---------- | ------- | ------------------------ |
| nftAsset   | address | The NFT contract address |
| nftTokenId | uint256 | The NFT tokenId          |

#### Return values

| Type    | Description                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| uint256 | The remainder amount, in case the price obtained from selling on the NFTX market is higher than the borrowed amount |

### authorizeLendPoolNFT

`function authorizeLendPoolNFT(address[] calldata nftAssets) external nonReentrant onlyOwner`

Approves the LendPool for the given NFT assets

#### Call params

| Name      | Type       | Description             |
| --------- | ---------- | ----------------------- |
| nftAssets | address\[] | The array of NFT assets |

### authorizeCallerWhitelist

`function authorizeCallerWhitelist(address[] calldata callers, bool flag) external nonReentrant onlyOwner`

Authorizes/unauthorizes a list of callers for the whitelist

#### Call params

| Name    | Type       | Description                           |
| ------- | ---------- | ------------------------------------- |
| callers | address\[] | The array of callers to be authorized |
| flag    | bool       | The flag to authorize/unauthorize     |
