# NFT Oracle

The NFT Oracle contract accounts price data for the NFTs held in the Unlockd protocol. The protocol’s LendPool contract uses it as a source of truth for NFT prices, which are updated externally by the Unlockd team. We leverage powerful price appraisers, such as [Upshot](https://upshot.xyz/), [NFTBank](https://nftbank.ai/) and [Ginoa](https://ginoa.io/) in order to provide Unlockd users with the most competitive LTV in the industry.

The source code of the proxy NFT price provider can be found on [Github](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development/contracts/protocol/NFTOracle.sol).

{% hint style="warning" %}
Always get the latest NFT price oracle address by calling `getNFTOracle()` on the `LendPoolAddressesProvider` contract.
{% endhint %}

## View methods

### getNFTPrice

`function getNFTPrice(address _collection, uint256 _tokenId) external view override onlyExistingCollection(_collection) returns (uint256)`

Returns the price for a specific NFT

#### Call params

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| \_collection | address | The NFT collection address |
| \_tokenId    | uint256 | The NFT token Id           |

#### Return values

| Type    | Description                                    |
| ------- | ---------------------------------------------- |
| uint256 | The NFT price in ETH (WEI format, 18 decimals) |

### getMultipleNFTPrices

`function getMultipleNFTPrices(address[] calldata _collections, uint256[] calldata _tokenIds) external view override returns (uint256[] memory)`

Returns the price for multiple NFTs.

#### Call params

| Name          | Type    | Description                  |
| ------------- | ------- | ---------------------------- |
| \_collections | address | The NFT collection addresses |
| \_tokenIds    | uint256 | The NFT token Ids            |

#### Return values

| Type       | Description                                              |
| ---------- | -------------------------------------------------------- |
| uint256\[] | The array of NFT prices in ETH (WEI format, 18 decimals) |

### getNFTPriceNFTX

`function getNFTPriceNFTX(address _collection, uint256 _tokenId) external view override onlyExistingCollection(_collection) returns (uint256)`

Returns the spot price for a given NFT in the NFTX market.

#### Call params

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| \_collection | address | The NFT collection address |
| \_tokenId    | uint256 | The NFT token Id           |

#### Return values

| Type    | Description                       |
| ------- | --------------------------------- |
| uint256 | The spot price in the NFTX market |

## Write methods

### setNFTPrice

`function setNFTPrice( address _collection, uint256 _tokenId, uint256 _price ) external override onlyPriceManager`

Sets the price for a given NFT.

#### Call params

| Name         | Type    | Description                                                  |
| ------------ | ------- | ------------------------------------------------------------ |
| \_collection | address | The NFT collection address                                   |
| \_tokenId    | uint256 | The NFT token Id                                             |
| \_price      | uint256 | The price to set to the NFT in ETH (WEI format, 18 decimals) |

### setMultipleNFTPrices

`function setMultipleNFTPrices( address[] calldata _collections, uint256[] calldata _tokenIds, uint256[] calldata _prices ) external override onlyPriceManager`

Sets the price for multiple NFTs.

#### Call params

| Name          | Type       | Description                                                   |
| ------------- | ---------- | ------------------------------------------------------------- |
| \_collections | address\[] | The NFT collection addresses                                  |
| \_tokenIds    | uint256\[] | The NFT token Ids                                             |
| \_prices      | uint256\[] | The price to set to the NFTs in ETH (WEI format, 18 decimals) |

### addCollection

`function addCollection(address _collection) external onlyOwner`

Adds a collection to the be supported by NFT oracle.

#### Call params

| Name         | Type    | Description                                     |
| ------------ | ------- | ----------------------------------------------- |
| \_collection | address | The NFT collection address to add to the oracle |

### setCollections

`function setCollections(address[] calldata _collections) external onlyOwner`

Adds multiple collections to the be supported by NFT oracle.

#### Call params

| Name          | Type    | Description                                       |
| ------------- | ------- | ------------------------------------------------- |
| \_collections | address | The NFT collection addresses to add to the oracle |

### removeCollection

`function removeCollection(address _collection) external onlyOwner`

Removes a collection that is currently supported by NFT oracle.

#### Call params

| Name          | Type    | Description                                          |
| ------------- | ------- | ---------------------------------------------------- |
| \_collections | address | The NFT collection address to remove from the oracle |

### setPause

`function setPause(address _collection, bool paused) external override onlyOwner onlyExistingCollection(_collection)`

Pauses a specific collection in the NFT oracle.

#### Call params

| Name         | Type    | Description                                                |
| ------------ | ------- | ---------------------------------------------------------- |
| \_collection | address | The NFT collection address to be paused                    |
| paused       | bool    | The pause status (`true` for paused, `false` for unpaused) |

### setPriceManagerStatus

`function setPriceManagerStatus(address newPriceManager, bool val) external onlyOwner`

Adds or removes an address to be allowed to act as the price manager.

{% hint style="warning" %}
The price manager addresses are the only ones allowed to set prices in the Unlockd protocol. Currently, they are addresses managed by the Unlockd team.
{% endhint %}

#### Call params

| Name            | Type    | Description                                                                                                                          |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| newPriceManager | address | The address of the price manager to set the status to                                                                                |
| val             | bool    | The price manger status (`true` to allow the address to act as a price manger, `false` to deny the address to act as a price manger) |

