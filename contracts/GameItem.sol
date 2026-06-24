// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameItem
 * @dev Simple ERC721 token representing in‑game collectible items.
 *      The contract owner (the game) can mint new items to player addresses.
 */
contract GameItem is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("GameItem", "GTI") {}

    /**
     * @dev Mint a new item to `to` with metadata URI `uri`.
     * Only the contract owner can call this (the game backend).
     */
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
