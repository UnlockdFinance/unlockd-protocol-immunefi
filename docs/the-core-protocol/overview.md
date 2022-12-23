# Overview

<figure><img src="../.gitbook/assets/Captura de Pantalla 2022-11-22 a las 18.39.44.png" alt=""><figcaption></figcaption></figure>

## Main contracts

{% hint style="info" %}
Both `LendPoolAddressesProvider` and `LendPoolAddressesProviderRegistry` control the upgradeability of the protocol, including asset listings and changes to protocol parameters. Unlockd holders will be in control of both, via Unlockd Protocol Governance.
{% endhint %}

The main contracts in Unlockd and their purposes are:

### LendPool

The main entry point into the Unlockd Protocol. Most interactions with Unlockd will happen via the LendPool, including:

* [deposit() ](lendpool.md#deposit)
* [withdraw()](lendpool.md#withdraw)
* [borrow()](lendpool.md#borrow)
* [repay()](lendpool.md#repay)
* [auction()](https://app.gitbook.com/o/FA1cGMnhdUOLFudN1l6H/s/I7CtufywvWjm7Lk0Eaes/)
* [redeem()](lendpool.md#redeem)
* [liquidate()](https://app.gitbook.com/o/FA1cGMnhdUOLFudN1l6H/s/I7CtufywvWjm7Lk0Eaes/)
* [liquidateNFTX()](lendpool.md#liquidatenftx)

### LendPoolAddressesProvider

The main addresses register of the protocol. The latest contract addresses should be retrieved from this contract by making the appropriate calls.

### LendPoolAddressesProviderRegistry

Contains a list of active `LendingPoolAddressProvider` addresses.

### uTokens

The yield-generating, tokenised deposits used throughout the Unlockd protocol. They implement most of the standard EIP-20/ERC20 token methods with slight modifications, as well as Unlockd specific methods including:

* scaledBalanceOf()
* getScaledUserBalanceAndSupply()
* scaledTotalSupply()
* mintToTreasury()
* transferUnderlyingTo()

### Debt Tokens

The tokenised borrow positions used throughout the Unlockd protocol. Most of the standard EIP-20/ERC20 methods are disabled, since debt tokens are non-transferrable.

For more information, see the Debt Tokens section.

## Supporting contracts

The following contracts should generally not be interacted with directly, but are used throughout the Unlockd Protocol via contract calls.

### LendPool Configurator

Provides configuration functions for the `LendPool` contracts. It also has a number of important functions:

* Activates / Deactivates reserves
* Enables / Disables borrowing for an NFT
* Enables / Disables using an NFT as collateral
* Freezes / Unfreezes reserves
* Updates a reserve's decimals
* Updates an NFT's Loan to Value
* Updates an NFT's liquidation threshold
* Updates an NFT's liquidation bonus
* Updates an NFT's redeem duration
* Updates an NFT's auction duration
* Updates an NFT's min bid fine
* Updates a reserve's interest rate strategy address
* Activates / Deactivates all functions of a LendPool in emergencies.

For all of the above functions, relevant events are emitted to the blockchain. Anyone can monitor these changes to know when values have been modified or added/removed.

### Interest Rate Strategy

Holds the information needed to calculate and update the interest rates of specific reserves.

Each contract stores the optimised base curves using the corresponding parameters of each currency. This means that there is a mathematical function which determines the interest rate of each asset pool, with the interest rate changing based on the amount of borrowed funds and the total liquidity (i.e. utilisation) of the asset pool.

The parameters for the optimised base curves are:

* `baseVariableBorrowRate`
* `variableRateSlope1`
* `variableRateSlope2`
* `stableRateSlope1`
* `stableRateSlope2`

The interest rates are calculated depending on the available liquidity and the total borrowed amount.

### Reserve Price Oracle Provider

Provides reserve price data required throughout the Unlockd protocol, using Chainlink. More details on the [Reserve Oracle](reserve-oracle.md) page.

### NFT Price Oracle Provider

Provides NFT price data required throughout the Unlockd protocol, using Upshot. Prices are monitored externally by the Unlockd team. More details on the [NFT Oracle](nft-oracle.md) page.
