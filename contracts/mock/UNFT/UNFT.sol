// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IUNFT} from "../../interfaces/IUNFT.sol";
import {IFlashLoanReceiver} from "../../interfaces/IFlashLoanReceiver.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";
import {IERC721ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

/**
 * @title UNFT contract
 * @dev Implements the methods for the uNFT protocol
 **/
contract UNFT is ERC721EnumerableUpgradeable, IUNFT {
    address private _underlyingAsset;

    // Mapping from token ID to minter address
    mapping(uint256 => address) private _minters;

    /**
     * @dev Initializes the uNFT
     * @param underlyingAsset The address of the underlying asset of this uNFT (E.g. PUNK for bPUNK)
     */
    function initialize(
        address underlyingAsset,
        string calldata uNftName,
        string calldata uNftSymbol
    ) external override initializer {
        __ERC721_init(uNftName, uNftSymbol);

        _underlyingAsset = underlyingAsset;

        emit Initialized(underlyingAsset);
    }

    /**
     * @dev Mints uNFT token to the user address
     *
     * Requirements:
     *  - The caller must be contract address
     *
     * @param to The owner address receive the uNFT token
     * @param tokenId token id of the underlying asset of NFT
     **/
    function mint(address to, uint256 tokenId) external override {
        require(
            AddressUpgradeable.isContract(_msgSender()),
            "UNFT: caller is not contract"
        );
        require(!_exists(tokenId), "UNFT: exist token");
        require(
            IERC721Upgradeable(_underlyingAsset).ownerOf(tokenId) ==
                _msgSender(),
            "UNFT: caller is not owner"
        );

        // Receive NFT Tokens
        IERC721Upgradeable(_underlyingAsset).safeTransferFrom(
            _msgSender(),
            address(this),
            tokenId
        );

        // mint uNFT to user
        _mint(to, tokenId);

        _minters[tokenId] = _msgSender();

        emit Mint(_msgSender(), _underlyingAsset, tokenId, to);
    }

    /**
     * @dev Burns user uNFT token
     *
     * Requirements:
     *  - The caller must be contract address
     *
     * @param tokenId token id of the underlying asset of NFT
     **/
    function burn(uint256 tokenId) external override {
        require(
            AddressUpgradeable.isContract(_msgSender()),
            "UNFT: caller is not contract"
        );
        require(_exists(tokenId), "UNFT: nonexist token");
        require(
            _minters[tokenId] == _msgSender(),
            "UNFT: caller is not minter"
        );

        address owner = ERC721Upgradeable.ownerOf(tokenId);

        IERC721Upgradeable(_underlyingAsset).safeTransferFrom(
            address(this),
            _msgSender(),
            tokenId
        );

        _burn(tokenId);

        delete _minters[tokenId];

        emit Burn(_msgSender(), _underlyingAsset, tokenId, owner);
    }

    /**
     * @dev See {IUNFT-flashLoan}.
     */
    function flashLoan(
        address receiverAddress,
        uint256[] calldata nftTokenIds,
        bytes calldata params
    ) external override {
        uint256 i;
        IFlashLoanReceiver receiver = IFlashLoanReceiver(receiverAddress);

        // !!!CAUTION: receiver contract may reentry mint, burn, flashloan again
        uint256 idsLength = nftTokenIds.length;
        // only token owner can do flashloan
        for (i = 0; i < idsLength; ) {
            require(
                ownerOf(nftTokenIds[i]) == _msgSender(),
                "UNFT: caller is not owner"
            );

            unchecked {
                ++i;
            }
        }

        // step 1: moving underlying asset forward to receiver contract
        for (i = 0; i < idsLength; ) {
            IERC721Upgradeable(_underlyingAsset).safeTransferFrom(
                address(this),
                receiverAddress,
                nftTokenIds[i]
            );

            unchecked {
                ++i;
            }
        }

        // setup 2: execute receiver contract, doing something like aidrop
        require(
            receiver.executeOperation(
                _underlyingAsset,
                nftTokenIds,
                _msgSender(),
                address(this),
                params
            ),
            "UNFT: invalid flashloan executor return"
        );

        // setup 3: moving underlying asset backword from receiver contract
        for (i = 0; i < idsLength; ) {
            IERC721Upgradeable(_underlyingAsset).safeTransferFrom(
                receiverAddress,
                address(this),
                nftTokenIds[i]
            );

            emit FlashLoan(
                receiverAddress,
                _msgSender(),
                _underlyingAsset,
                nftTokenIds[i]
            );
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC721Upgradeable, IERC721MetadataUpgradeable)
        returns (string memory)
    {
        return IERC721MetadataUpgradeable(_underlyingAsset).tokenURI(tokenId);
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        operator;
        from;
        tokenId;
        data;
        return IERC721ReceiverUpgradeable.onERC721Received.selector;
    }

    /**
     * @dev See {IUNFT-minterOf}.
     */
    function minterOf(
        uint256 tokenId
    ) external view override returns (address) {
        address minter = _minters[tokenId];
        require(
            minter != address(0),
            "UNFT: minter query for nonexistent token"
        );
        return minter;
    }

    /**
     * @dev Being non transferrable, the uNFT token does not implement any of the
     * standard ERC721 functions for transfer and allowance.
     **/
    function approve(
        address to,
        uint256 tokenId
    ) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        to;
        tokenId;
        revert("APPROVAL_NOT_SUPPORTED");
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        operator;
        approved;
        revert("APPROVAL_NOT_SUPPORTED");
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        from;
        to;
        tokenId;
        revert("TRANSFER_NOT_SUPPORTED");
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        from;
        to;
        tokenId;
        revert("TRANSFER_NOT_SUPPORTED");
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        from;
        to;
        tokenId;
        _data;
        revert("TRANSFER_NOT_SUPPORTED");
    }

    /**
     * @dev See {ERC721EnumerableUpgradeable}.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Upgradeable) {
        from;
        to;
        tokenId;
        revert("TRANSFER_NOT_SUPPORTED");
    }
}
