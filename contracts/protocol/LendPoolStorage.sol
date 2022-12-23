// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {DataTypes} from "../libraries/types/DataTypes.sol";
import {ReserveLogic} from "../libraries/logic/ReserveLogic.sol";
import {NftLogic} from "../libraries/logic/NftLogic.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

contract LendPoolStorage {
    using ReserveLogic for DataTypes.ReserveData;
    using NftLogic for DataTypes.NftData;

    ILendPoolAddressesProvider internal _addressesProvider;

    uint256 internal _reservesCount;
    uint256 internal _maxNumberOfReserves;
    uint256 internal _nftsCount;
    uint256 internal _maxNumberOfNfts;
    uint256 internal constant _NOT_ENTERED = 0;
    uint256 internal constant _ENTERED = 1;
    uint256 internal _status;
    uint256 internal _pauseStartTime;
    uint256 internal _pauseDurationTime;
    uint256 internal _liquidateFeePercentage;
    uint256 internal _timeframe;
    uint256 internal _configFee;
    bool internal _paused;

    mapping(address => DataTypes.ReserveData) internal _reserves;
    mapping(uint256 => address) internal _reservesList;
    mapping(address => DataTypes.NftData) internal _nfts;
    mapping(address => mapping(uint256 => DataTypes.NftConfigurationMap))
        internal _nftConfig;
    mapping(uint256 => address) internal _nftsList;
    /*
     * @dev Markets supported for each NFT
     * @param address -> the collection address
     * @param uint8 -> market id (0 for NFTX, 1 for SudoSwap)
     * @param bool -> whether it is supported in the corresponding market or not
     */
    mapping(address => mapping(uint8 => bool)) public _isMarketSupported;

    mapping(address => address[2]) internal _sudoswapPairs;

    // For upgradable, add one new variable above, minus 1 at here
    uint256[50] private __gap;
}
