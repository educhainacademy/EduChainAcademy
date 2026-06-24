// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameItem.sol";

/**
 * @title GameLogic
 * @dev Core on‑chain game mechanics: player XP, item minting, and simple upgrades.
 * The contract is owned by the game backend (via `Ownable`). Only the owner can
 * grant XP or mint items, preventing arbitrary players from inflating their own state.
 */
contract GameLogic is Ownable {
    // Reference to the ERC‑721 GameItem contract
    GameItem public immutable gameItem;

    // Mapping of player address => experience points
    mapping(address => uint256) public xpBalance;

    // Simple mapping to track which items have been upgraded (tokenId => level)
    mapping(uint256 => uint8) public itemLevel;

    // Events emitted for UI/reactive front‑end handling
    event XPGained(address indexed player, uint256 amount, uint256 total);
    event XPSpent(address indexed player, uint256 amount, uint256 remaining);
    event ItemMinted(address indexed player, uint256 tokenId, string uri);
    event ItemUpgraded(address indexed player, uint256 tokenId, uint8 newLevel);

    /**
     * @dev Deploy with the address of the already‑deployed GameItem contract.
     * @param _gameItem Address of the ERC721 GameItem contract.
     */
    constructor(address _gameItem) {
        require(_gameItem != address(0), "GameItem address zero");
        gameItem = GameItem(_gameItem);
    }

    /**
     * @dev Grant XP to a player. Only callable by the contract owner (game server).
     * @param player Address of the player.
     * @param amount Amount of XP to add.
     */
    function grantXP(address player, uint256 amount) external onlyOwner {
        require(player != address(0), "Zero address");
        xpBalance[player] += amount;
        emit XPGained(player, amount, xpBalance[player]);
    }

    /**
     * @dev Spend XP from a player’s balance. Reverts if insufficient XP.
     * @param player Address of the player.
     * @param amount Amount of XP to spend.
     */
    function spendXP(address player, uint256 amount) public onlyOwner {
        uint256 current = xpBalance[player];
        require(current >= amount, "Insufficient XP");
        xpBalance[player] = current - amount;
        emit XPSpent(player, amount, xpBalance[player]);
    }

    /**
     * @dev Mint a new GameItem for a player and optionally grant initial XP.
     * @param to Player address to receive the NFT.
     * @param uri Metadata URI for the minted token.
     * @param initialXP XP to award after minting (optional, can be 0).
     * @return tokenId The newly minted token ID.
     */
    function mintItem(address to, string memory uri, uint256 initialXP) external onlyOwner returns (uint256 tokenId) {
        tokenId = gameItem.mint(to, uri);
        emit ItemMinted(to, tokenId, uri);
        if (initialXP > 0) {
            grantXP(to, initialXP);
        }
    }

    /**
     * @dev Upgrade an owned item by consuming XP. Each upgrade costs a fixed amount.
     * @param tokenId ID of the token to upgrade. Must be owned by `msg.sender`.
     * @param xpCost XP cost for a single level upgrade.
     */
    function upgradeItem(uint256 tokenId, uint256 xpCost) external {
        // Ensure caller owns the NFT
        require(gameItem.ownerOf(tokenId) == msg.sender, "Not item owner");
        // Spend XP from caller
        spendXP(msg.sender, xpCost);
        // Increment level (capped at 255 which is practically unreachable)
        uint8 newLevel = ++itemLevel[tokenId];
        emit ItemUpgraded(msg.sender, tokenId, newLevel);
    }
}
