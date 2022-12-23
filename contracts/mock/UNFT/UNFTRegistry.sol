// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IUNFTRegistry} from "../../interfaces/IUNFTRegistry.sol";
import {IUNFT} from "../../interfaces/IUNFT.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract UNFTRegistry is IUNFTRegistry, Initializable, OwnableUpgradeable {
    mapping(address => address) public uNftProxys;
    mapping(address => address) public uNftImpls;
    address[] public uNftAssetLists;
    string public namePrefix;
    string public symbolPrefix;
    address public uNftGenericImpl;
    mapping(address => string) public customSymbols;

    /**
     * @inheritdoc IUNFTRegistry
     */
    function getUNFTAddresses(
        address nftAsset
    ) external view override returns (address uNftProxy, address uNftImpl) {
        uNftProxy = uNftProxys[nftAsset];
        uNftImpl = uNftImpls[nftAsset];
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function getUNFTAddressesByIndex(
        uint16 index
    ) external view override returns (address uNftProxy, address uNftImpl) {
        require(index < uNftAssetLists.length, "UNFTR: invalid index");
        uNftProxy = uNftProxys[uNftAssetLists[index]];
        uNftImpl = uNftImpls[uNftAssetLists[index]];
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function getUNFTAssetList()
        external
        view
        override
        returns (address[] memory)
    {
        return uNftAssetLists;
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function allUNFTAssetLength() external view override returns (uint256) {
        return uNftAssetLists.length;
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function initialize(
        address genericImpl,
        string memory namePrefix_,
        string memory symbolPrefix_
    ) external override initializer {
        require(genericImpl != address(0), "UNFTR: impl is zero address");

        __Ownable_init();

        uNftGenericImpl = genericImpl;

        namePrefix = namePrefix_;
        symbolPrefix = symbolPrefix_;

        emit Initialized(genericImpl, namePrefix, symbolPrefix);
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function createUNFT(
        address nftAsset
    ) external override returns (address uNftProxy) {
        _requireAddressIsERC721(nftAsset);
        require(uNftProxys[nftAsset] == address(0), "UNFTR: asset exist");
        require(uNftGenericImpl != address(0), "UNFTR: impl is zero address");

        uNftProxy = _createProxyAndInitWithImpl(nftAsset, uNftGenericImpl);

        emit UNFTCreated(
            nftAsset,
            uNftImpls[nftAsset],
            uNftProxy,
            uNftAssetLists.length
        );
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function setUNFTGenericImpl(
        address genericImpl
    ) external override onlyOwner {
        require(genericImpl != address(0), "UNFTR: impl is zero address");
        uNftGenericImpl = genericImpl;

        emit GenericImplementationUpdated(genericImpl);
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function createUNFTWithImpl(
        address nftAsset,
        address uNftImpl
    ) external override onlyOwner returns (address uNftProxy) {
        _requireAddressIsERC721(nftAsset);
        require(uNftImpl != address(0), "UNFTR: implement is zero address");
        require(uNftProxys[nftAsset] == address(0), "UNFTR: asset exist");

        uNftProxy = _createProxyAndInitWithImpl(nftAsset, uNftImpl);

        emit UNFTCreated(
            nftAsset,
            uNftImpls[nftAsset],
            uNftProxy,
            uNftAssetLists.length
        );
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function upgradeUNFTWithImpl(
        address nftAsset,
        address uNftImpl,
        bytes memory encodedCallData
    ) external override onlyOwner {
        address uNftProxy = uNftProxys[nftAsset];
        require(uNftProxy != address(0), "UNFTR: asset nonexist");

        TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(
            payable(uNftProxy)
        );

        if (encodedCallData.length > 0) {
            proxy.upgradeToAndCall(uNftImpl, encodedCallData);
        } else {
            proxy.upgradeTo(uNftImpl);
        }

        uNftImpls[nftAsset] = uNftImpl;

        emit UNFTUpgraded(nftAsset, uNftImpl, uNftProxy, uNftAssetLists.length);
    }

    /**
     * @inheritdoc IUNFTRegistry
     */
    function addCustomeSymbols(
        address[] memory nftAssets_,
        string[] memory symbols_
    ) external override onlyOwner {
        require(
            nftAssets_.length == symbols_.length,
            "UNFTR: inconsistent parameters"
        );

        for (uint256 i = 0; i < nftAssets_.length; ) {
            customSymbols[nftAssets_[i]] = symbols_[i];

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev creates the proxy and inits it with an implementation contract
     * @param nftAsset the underlying NFT asset
     * @param uNftImpl the uNFT implementation contract address
     */
    function _createProxyAndInitWithImpl(
        address nftAsset,
        address uNftImpl
    ) internal returns (address uNftProxy) {
        bytes memory initParams = _buildInitParams(nftAsset);

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            uNftImpl,
            address(this),
            initParams
        );

        uNftProxy = address(proxy);

        uNftImpls[nftAsset] = uNftImpl;
        uNftProxys[nftAsset] = uNftProxy;
        uNftAssetLists.push(nftAsset);
    }

    /**
     * @dev builds the initial params for the uNFT contract
     * @param nftAsset the underlying NFT asset to build the params to
     */
    function _buildInitParams(
        address nftAsset
    ) internal view returns (bytes memory initParams) {
        string memory nftSymbol = customSymbols[nftAsset];
        if (bytes(nftSymbol).length == 0) {
            nftSymbol = IERC721MetadataUpgradeable(nftAsset).symbol();
        }
        string memory uNftName = string(
            abi.encodePacked(namePrefix, " ", nftSymbol)
        );
        string memory uNftSymbol = string(
            abi.encodePacked(symbolPrefix, nftSymbol)
        );

        initParams = abi.encodeWithSelector(
            IUNFT.initialize.selector,
            nftAsset,
            uNftName,
            uNftSymbol
        );
    }

    /**
     * @dev checks if the address is an ERC721 token
     * @param nftAsset the asset to be checked
     */
    function _requireAddressIsERC721(address nftAsset) internal view {
        require(nftAsset != address(0), "UNFTR: asset is zero address");
        require(
            AddressUpgradeable.isContract(nftAsset),
            "UNFTR: asset is not contract"
        );
    }
}
