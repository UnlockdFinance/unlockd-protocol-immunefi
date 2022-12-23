# Reserve Oracle

The Reserve Oracle contract accounts price data for the reserves in the Unlockd protocol and  manages price sources. The protocol’s LendPool contract uses it as a source of truth for reserves prices, which are updated by Chainlink Price Feeds and Aggregators. Aggregators are added to the Oracle and tracked by a mapping, which maps each unique key  (`_priceFeedKeys)` to a single aggregator address. Each aggregator then provides price data for a specific reserve.

The source code of the proxy reserve price provider can be found on [Github](https://github.com/UnlockdFinance/unlockd-protocol-v1/blob/development/contracts/protocol/ReserveOracle.sol).

{% hint style="warning" %}
Always get the latest reserve price oracle address by calling `getReserveOracle()` on the `LendPoolAddressesProvider` contract.
{% endhint %}

## View methods

### getAssetPrice

`function getAssetPrice(address _priceFeedKey) external view override returns (uint256)`

Returns the price for a specific reserve

#### Call Params

| Name            | Type    | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `_priceFeedKey` | address | Unique key of the chainlink aggregator to fetch the price data from |

#### Return values

| Type    | Description                                        |
| ------- | -------------------------------------------------- |
| uint256 | The reserve price in ETH (WEI format, 18 decimals) |

### getAggregator

`function getAggregator(address _priceFeedKey) public view returns (AggregatorV3Interface)`

Returns the aggregator address for a given price feed key

#### Call Params

| Name            | Type    | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `_priceFeedKey` | address | Unique key of the chainlink aggregator to fetch the price data from |

#### Return values

| Type                  | Description             |
| --------------------- | ----------------------- |
| AggregatorV3Interface | The aggregator address  |

### getLatestTimestamp

`function getLatestTimestamp(address _priceFeedKey) public view returns (uint256)`

Returns the aggregator's latest timestamp

#### Call params

| Name            | Type    | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `_priceFeedKey` | address | Unique key of the chainlink aggregator to fetch the price data from |

#### Return values

| Type    | Description                       |
| ------- | --------------------------------- |
| uint256 | The aggregator's latest timestamp |

### getTwapPrice

`function getTwapPrice(address _priceFeedKey, uint256 _interval) external view override returns (uint256)`

Returns the TWAP price for a reserve, depending on `_interval`

#### Call params

| Name            | Type    | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `_priceFeedKey` | address | Unique key of the chainlink aggregator to fetch the price data from |
| `_interval`     | uint256 | The requested interval to query the TWAP from                       |

#### Return values

| Type    | Description                                             |
| ------- | ------------------------------------------------------- |
| uint256 | The reserve TWAP price in ETH (WEI format, 18 decimals) |

### isExistedKey

`function isExistedKey(address _priceFeedKey) private view returns (bool)`

Checks if the pricefeed key exists in the pricefeeds currently tracked by the oracle.

#### Call params

| Name            | Type    | Description                                                         |
| --------------- | ------- | ------------------------------------------------------------------- |
| `_priceFeedKey` | address | Unique key of the chainlink aggregator to fetch the price data from |

#### Return values

| Type | Description                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------- |
| bool | Boolean representing if the param's pricefeed key exists (`true`) or not (`false`) in the protocol |

### getPriceFeedLength

`function getPriceFeedLength() public view returns (uint256 length)`

Returns the amount of pricefeeds tracked by the oracle.

#### Return values

| Type    | Description                                    |
| ------- | ---------------------------------------------- |
| uint256 | The amount of pricefeeds tracked by the oracle |

## Write methods

### setAggregators

`function setAggregators(address[] calldata _priceFeedKeys, address[] calldata _aggregators) external onlyOwner`

Sets a list of pricefeed aggregators to be tracked by the oracle.

#### Call params

| Name            | Type    | Description                                                            |
| --------------- | ------- | ---------------------------------------------------------------------- |
| \_priceFeedKeys | address | Array of unique keys of the chainlink aggregators to be added          |
| \_aggregators   | address | The addresses of the pricefeed aggregators to be tracked by the oracle |

### addAggregator

`function addAggregator(address _priceFeedKey, address _aggregator) external onlyOwner`

Adds a single  pricefeed aggregator to be tracked by the oracle.

#### Call params

| Name           | Type    | Description                                                         |
| -------------- | ------- | ------------------------------------------------------------------- |
| \_priceFeedKey | address | Unique key of the chainlink aggregator to be added                  |
| \_aggregator   | address | The address of the pricefeed aggregator to be tracked by the oracle |

### removeAggregator

`function removeAggregator(address _priceFeedKey) external onlyOwner`

Removes a single pricefeed aggregator  from the tracked pricefeeds currently tracked by the oracle.

#### Call params

| Name           | Type    | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| \_priceFeedKey | address | Unique key of the chainlink aggregator to be removed |

## ABI

<details>

<summary>ReserveOracle ABI</summary>

```json
[
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "currencyKey",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "aggregator",
          "type": "address"
        }
      ],
      "name": "AggregatorAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "currencyKey",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "aggregator",
          "type": "address"
        }
      ],
      "name": "AggregatorRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_aggregator",
          "type": "address"
        }
      ],
      "name": "addAggregator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        }
      ],
      "name": "getAggregator",
      "outputs": [
        {
          "internalType": "contract AggregatorV3Interface",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        }
      ],
      "name": "getAssetPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        }
      ],
      "name": "getLatestTimestamp",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPriceFeedLength",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "length",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_interval",
          "type": "uint256"
        }
      ],
      "name": "getTwapPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_weth",
          "type": "address"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "priceFeedKeys",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "priceFeedMap",
      "outputs": [
        {
          "internalType": "contract AggregatorV3Interface",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceFeedKey",
          "type": "address"
        }
      ],
      "name": "removeAggregator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_priceFeedKeys",
          "type": "address[]"
        },
        {
          "internalType": "address[]",
          "name": "_aggregators",
          "type": "address[]"
        }
      ],
      "name": "setAggregators",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "weth",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
```

</details>
