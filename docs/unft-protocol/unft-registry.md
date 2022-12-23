---
description: UNFTRegistry.sol
---

# uNFT Registry

This contract is where we store the information regarding the uNFTs. \
The proxies and the implementations are created and stored.

## View Methods

### getUNFTAddresses

`function getUNFTAddresses(address nftAsset) external view returns (address uNftProxy, address uNftImpl)`

Returns the uNFT address

#### Call Params

| Name     | Type    | Description                             |
| -------- | ------- | --------------------------------------- |
| nftAsset | address | The address of the underlying NFT asset |

#### Return Values

| Name      | Type    | Description                                                        |
| --------- | ------- | ------------------------------------------------------------------ |
| uNftProxy | address | the address of the proxy created for the underlying asset          |
| uNftImpl  | address | the address of the implementation created for the underlying asset |

### getUNFTAddressesByIndex

`function getUNFTAddressesByIndex(uint16 index) external view returns (address uNftProxy, address uNftImpl)`

Returns the uNFT proxy and implementation address by index

#### Call Param

| Name  | Type   | Description    |
| ----- | ------ | -------------- |
| index | uint16 | the uNFT index |

#### Return Values

| Name      | Type    | Description                                                        |
| --------- | ------- | ------------------------------------------------------------------ |
| uNftProxy | address | the address of the proxy created for the underlying asset          |
| uNftImpl  | address | the address of the implementation created for the underlying asset |

### getUNFTAssetList

`function getUNFTAssetList() external view returns (address[])`

Returns the list of uNFTs addresses.&#x20;

#### Return Values

| Type                            | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| array of addresses (address\[]) | the addresses stored in the contract when created. |

### allUNFTAssetLength

`function allUNFTAssetLength() external view returns (uint256)`

Returns the length of the list of uNFTs addresses.

#### Return Values

| Type      | Description                         |
| --------- | ----------------------------------- |
| `uint256` | the length of addresses in the list |

## Write Methods

### createUNFT

`function createUNFT(address nftAsset) external returns (address uNftProxy)`

Create uNFT proxy and implement it, then initialize it.

#### Call Param

| Name     | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| nftAsset | address | The address of the underlying asset of the UNFT |

#### Return Values

| Name      | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| uNftProxy | address | the address of the proxy created for the underlying asset |
