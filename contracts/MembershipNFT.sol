// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MembershipNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 public maxSupply;
    uint256 public mintPrice;
    string private _baseTokenURI;

    enum MembershipTier { BASIC, STANDARD, PREMIUM }

    struct MembershipInfo {
        MembershipTier tier;
        uint256 mintedAt;
        uint256 expiresAt;
        bool active;
    }

    mapping(uint256 => MembershipInfo) public memberships;
    mapping(address => uint256[]) public ownerTokens;

    event MembershipMinted(address indexed to, uint256 indexed tokenId, MembershipTier tier, uint256 expiresAt);
    event MembershipRevoked(uint256 indexed tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721(name_, symbol_) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
    }

    function mint(
        address to,
        MembershipTier tier,
        uint256 expiresAt,
        string memory uri
    ) external onlyOwner returns (uint256) {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        memberships[tokenId] = MembershipInfo({
            tier: tier,
            mintedAt: block.timestamp,
            expiresAt: expiresAt,
            active: true
        });

        ownerTokens[to].push(tokenId);
        emit MembershipMinted(to, tokenId, tier, expiresAt);
        return tokenId;
    }

    function revokeMembership(uint256 tokenId) external onlyOwner {
        require(memberships[tokenId].active, "Already revoked");
        memberships[tokenId].active = false;
        emit MembershipRevoked(tokenId);
    }

    function isActiveMember(address account) external view returns (bool) {
        uint256[] memory tokens = ownerTokens[account];
        for (uint256 i = 0; i < tokens.length; i++) {
            MembershipInfo memory info = memberships[tokens[i]];
            if (info.active && (info.expiresAt == 0 || block.timestamp <= info.expiresAt)) {
                return true;
            }
        }
        return false;
    }

    function getMembershipTier(address account) external view returns (MembershipTier) {
        uint256[] memory tokens = ownerTokens[account];
        MembershipTier highestTier = MembershipTier.BASIC;
        for (uint256 i = 0; i < tokens.length; i++) {
            MembershipInfo memory info = memberships[tokens[i]];
            if (info.active && (info.expiresAt == 0 || block.timestamp <= info.expiresAt)) {
                if (uint256(info.tier) > uint256(highestTier)) {
                    highestTier = info.tier;
                }
            }
        }
        return highestTier;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
