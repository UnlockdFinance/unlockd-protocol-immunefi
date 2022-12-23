// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {INFTXVault} from "../../interfaces/nftx/INFTXVault.sol";
import {INFTXVaultFactoryV2} from "../../interfaces/nftx/INFTXVaultFactoryV2.sol";

/**
 * @dev https://github.com/NFTX-project/nftx-protocol-v2/blob/master/contracts/solidity/NFTXVaultUpgradeable.sol
 * This is minimal mock implementation of NFTXVault for the test
 */
contract NFTXVault is INFTXVault, ERC20, IERC721Receiver {
    uint256 constant base = 10 ** 18;

    uint256 public override vaultId;
    address public assetAddress;
    INFTXVaultFactoryV2 public vaultFactory;
    bool public is1155;
    bool public allowAllItems;

    constructor(
        string memory _name,
        string memory _symbol,
        address _assetAddress,
        bool _is1155,
        bool _allowAllItems
    ) ERC20(_name, _symbol) {
        require(_assetAddress != address(0), "Asset != address(0)");
        assetAddress = _assetAddress;
        vaultFactory = INFTXVaultFactoryV2(msg.sender);
        vaultId = vaultFactory.numVaults();
        is1155 = _is1155;
        allowAllItems = _allowAllItems;
    }

    function mint(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts /* ignored for ERC721 vaults */
    ) external virtual override returns (uint256) {
        return mintTo(tokenIds, amounts, msg.sender);
    }

    function mintTo(
        uint256[] memory tokenIds,
        uint256[] memory amounts /* ignored for ERC721 vaults */,
        address to
    ) public virtual returns (uint256) {
        // Take the NFTs.
        uint256 count = receiveNFTs(tokenIds, amounts);

        // Mint to the user.
        _mint(to, base * count);
        uint256 totalFee = mintFee() * count;
        _chargeAndDistributeFees(to, totalFee);

        return count;
    }

    function mintFee() public view virtual returns (uint256) {
        (uint256 _mintFee, , , , ) = vaultFactory.vaultFees(vaultId);
        return _mintFee;
    }

    function allValidNFTs(
        uint256[] memory
    ) public view virtual override returns (bool) {
        return true;
    }

    function receiveNFTs(
        uint256[] memory tokenIds,
        uint256[] memory
    ) internal virtual returns (uint256) {
        uint256 length = tokenIds.length;

        address _assetAddress = assetAddress;
        for (uint256 i; i < length; ++i) {
            uint256 tokenId = tokenIds[i];
            transferFromERC721(_assetAddress, tokenId);
        }
        return length;
    }

    function _chargeAndDistributeFees(
        address user,
        uint256 amount
    ) internal virtual {
        // Mint fees directly to the distributor and distribute.
        if (amount > 0) {
            address feeDistributor = vaultFactory.feeDistributor();
            // Changed to a _transfer() in v1.0.3.
            _transfer(user, feeDistributor, amount);
        }
    }

    function transferFromERC721(
        address assetAddr,
        uint256 tokenId
    ) internal virtual {
        address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
        address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
        bytes memory data;
        if (assetAddr == kitties) {
            // Cryptokitties.
            data = abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                tokenId
            );
        } else if (assetAddr == punks) {
            // CryptoPunks.
            // Fix here for frontrun attack. Added in v1.0.2.
            bytes memory punkIndexToAddress = abi.encodeWithSignature(
                "punkIndexToAddress(uint256)",
                tokenId
            );
            (bool checkSuccess, bytes memory result) = address(assetAddr)
                .staticcall(punkIndexToAddress);
            address nftOwner = abi.decode(result, (address));
            require(
                checkSuccess && nftOwner == msg.sender,
                "Not the NFT owner"
            );
            data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
        } else {
            // Default.
            // Allow other contracts to "push" into the vault, safely.
            // If we already have the token requested, make sure we don't have it in the list to prevent duplicate minting.
            if (
                IERC721Upgradeable(assetAddress).ownerOf(tokenId) ==
                address(this)
            ) {
                return;
            } else {
                data = abi.encodeWithSignature(
                    "safeTransferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    tokenId
                );
            }
        }
        (bool success, bytes memory resultData) = address(assetAddr).call(data);
        require(success, string(resultData));
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
