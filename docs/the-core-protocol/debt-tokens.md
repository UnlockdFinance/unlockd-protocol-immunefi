---
description: DebtToken.sol
---

# debtTokens

Implements a debt token to track the borrowing positions of users.

## View Methods

### balanceOf

`function balanceOf(address user) public view virtual returns (uint256)`

Calculates the accumulated debt balance of the user.

#### Call Params

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| user | address | the users address we want to query the balance |

#### Return Values

| Type    | Description                  |
| ------- | ---------------------------- |
| uint256 | The debt balance of the user |

### scaledBalanceOf

`function scaledBalanceOf(address user) public view virtual returns (uint256)`

Returns the principal debt balance of the user.

#### Call Params

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| user | address | the scalled debt amount of the specified address |

#### Return Values

| Type    | Description                                                  |
| ------- | ------------------------------------------------------------ |
| uint256 | The debt balance of the user since the last burn/mint action |

### totalSupply

`function totalSupply() public view virtual returns (uint256)`

Returns the total supply of the variable debt token. Represents the total debt accrued by the users

#### Return Values

| Type    | Description      |
| ------- | ---------------- |
| uint256 | The total supply |

### scaledTotalSupply

`function scaledTotalSupply() public view virtual returns (uint256)`

Returns the scaled total supply of the variable debt token. Represents sum(debt/index).

#### Return Values

| Type    | Description             |
| ------- | ----------------------- |
| uint256 | the scaled total supply |

### getScaledUserBalanceAndSupply

`function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)`

Returns the principal balance of the user and principal total supply.

#### Parameters

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

#### Return Values

| Type    | Description                       |
| ------- | --------------------------------- |
| uint256 | The principal balance of the user |
| uint256 | The principal total supply        |

### UNDERLYING\_ASSET\_ADDRESS

`function UNDERLYING_ASSET_ADDRESS() public view returns (address)`

Returns the address of the underlying asset of this uToken.

Return Values

| Type    | Description                              |
| ------- | ---------------------------------------- |
| address | the address of the the underlying asset. |

## Write Methods

`function mint(address initiator, address onBehalfOf, uint256 amount, uint256 index) external returns (bool)`

Mints debt tokens when the user borrows, representing the user's debt.

#### Call Params

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| initiator  | address | The address calling borrow                               |
| onBehalfOf | address | The address of the user that will receive the debtTokens |
| amount     | uint256 | The amount of debt being minted                          |
| index      | uint256 | The variable debt index of the reserve                   |

#### Return Values

| Type | Description                                         |
| ---- | --------------------------------------------------- |
| bool | `true` if the the previous balance of the user is 0 |

### burn

`function burn(address user, uint256 amount, uint256 index) external`

It will burn the user's variable debt after redeeming, repaying or getting liquidated.

#### Call Params

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| user   | address | The user whose debt is getting burned  |
| amount | uint256 | The amount getting burned              |
| index  | uint256 | The variable debt index of the reserve |

### transfer

`function transfer(address recipient, uint256 amount) public virtual returns (bool)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### allowance

`function allowance(address owner, address spender) public view virtual returns (uint256)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### approve

`function approve(address spender, uint256 amount) public virtual returns (bool)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### transferFrom

`function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### increaseAllowance

`function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### decreaseAllowance

`function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)`

{% hint style="danger" %}
This method is not supported. It will revert the transaction.
{% endhint %}

### approveDelegation

`function approveDelegation(address delegatee, uint256 amount) external`

Delegates borrowing power to a user on the specific debt token.

#### Call Params

| Name      | Type    | Description                                                                                                                                                              |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| delegatee | address | the address receiving the delegated borrowing power                                                                                                                      |
| amount    | uint256 | the maximum amount being delegated. Delegation will still respect the liquidation constraints (even if delegated, a delegatee cannot force a delegator HF to go below 1) |

### borrowAllowance

`function borrowAllowance(address fromUser, address toUser) external view returns (uint256)`

returns the borrow allowance of the user

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| fromUser | address | The user to giving allowance  |
| toUser   | address | The user to give allowance to |

#### Return Values

| Type    | Description                     |
| ------- | ------------------------------- |
| uint256 | the current allowance of toUser |
