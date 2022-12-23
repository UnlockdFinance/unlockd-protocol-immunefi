---
description: UNFT.sol
---

# uNFTs

The uNFTs are the collateral receipt and the proof of borrow.\
The NFTs will be stored in this contract.

## View Methods

`function tokenURI(uint256 tokenId) public view virtual returns (string)`

Will return the tokenURI, for a specific tokenId. This is a copy of the real NFT.

#### Call Params

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | Nft Id      |

#### Return Values

| Type   | Description    |
| ------ | -------------- |
| string | Uri of the NFT |

### minterOf

`function minterOf(uint256 tokenId) external view returns (address)`

Returns the owner of the tokenId token.

#### Call Params

| Name    | Type    | Description                                        |
| ------- | ------- | -------------------------------------------------- |
| tokenId | uint256 | the tokenId that we want to know hows the ower of. |

#### Return Values

| Type    | Description              |
| ------- | ------------------------ |
| address | the address of the owner |

## Write Methods

### mint

`function mint(address to, uint256 tokenId) external`

Mints the uNFT token to the user that added his allowed NFT as collateral.

{% hint style="info" %}
the minted NFT will be a copy, a wrapped version of the real NFT.
{% endhint %}

#### Call Params

| Name    | Type    | Description                               |
| ------- | ------- | ----------------------------------------- |
| to      | address | The owner address receive the uNFT token; |
| tokenId | uint256 | token id of the underlying asset of NFT   |

### burn

`function burn(uint256 tokenId) external`

Will burn the uNFT held by the user. This will happen when the user repays or is liquidated.

#### Call Params

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| tokenId | uint256 | token id of the underlying asset of NFT |

### approve

```
function approve(address to, uint256 tokenId) public virtual
```

{% hint style="danger" %}
This method is not supported. It will revert the transaction
{% endhint %}

### setApprovalForAll

```
function setApprovalForAll(address operator, bool approved) public virtual
```

{% hint style="danger" %}
This method is not supported. It will revert the transaction
{% endhint %}

### safeTransferFrom

```
function safeTransferFrom(address from, address to, uint256 tokenId) public virtual
```

{% hint style="danger" %}
This method is not supported. It will revert the transaction
{% endhint %}

### safeTransferFrom

```
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) public virtual
```

{% hint style="danger" %}
This method is not supported. It will revert the transaction
{% endhint %}

### flashLoan

```
function flashLoan(address receiverAddress, uint256[] nftTokenIds, bytes params) external
```
