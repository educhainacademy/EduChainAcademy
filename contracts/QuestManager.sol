// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameItem.sol";
import "./GameLogic.sol";

/**
 * @title QuestManager
 * @dev Simple quest system that awards XP (and optionally NFTs) on completion.
 * The contract owner registers quests; off-chain server signs completion proofs.
 */
contract QuestManager is Ownable {
    struct Quest {
        uint256 xpReward;
        string nftUri; // empty if no NFT reward
        bool exists;
    }

    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => bool)) public completed;

    address public questVerifier; // EIP-712 signer that authorizes completions
    address public immutable gameLogic;
    address public immutable gameItem;

    event QuestAdded(uint256 indexed id, uint256 xpReward, string nftUri);
    event QuestCompleted(address indexed player, uint256 indexed questId, uint256 xp);

    constructor(address _questVerifier, address _gameLogic, address _gameItem) {
        questVerifier = _questVerifier;
        gameLogic = _gameLogic;
        gameItem = _gameItem;
    }

    function setQuestVerifier(address _verifier) external onlyOwner {
        questVerifier = _verifier;
    }

    function addQuest(uint256 id, uint256 xpReward, string memory nftUri) external onlyOwner {
        quests[id] = Quest({ xpReward: xpReward, nftUri: nftUri, exists: true });
        emit QuestAdded(id, xpReward, nftUri);
    }

    function completeQuest(
        uint256 questId,
        bytes memory signature,
        address player,
        uint256 deadline
    ) external {
        require(msg.sender == player, "Caller must be player");
        require(quests[questId].exists, "Quest not found");
        require(block.timestamp <= deadline, "Expired");
        require(!completed[player][questId], "Already completed");

        // Verify EIP-712 signature (simplified)
        bytes32 digest = keccak256(abi.encodePacked(player, questId, deadline));
        (bool valid,) = this.tryRecoverSignature(digest, signature);
        require(valid, "Invalid signature");

        completed[player][questId] = true;

        // Grant XP via GameLogic
        IGameLogic(gameLogic).grantXP(player, quests[questId].xpReward);

        // Mint NFT via GameLogic (which owns GameItem) if URI provided
        if (bytes(quests[questId].nftUri).length > 0) {
            IGameLogic(gameLogic).mintItem(player, quests[questId].nftUri, 0);
        }

        emit QuestCompleted(player, questId, quests[questId].xpReward);
    }

    function tryRecoverSignature(
        bytes32 digest,
        bytes memory signature
    ) public view returns (bool, address) {
        if (signature.length != 65) return (false, address(0));
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return (false, address(0));
        address recovered = ecrecover(digest, v, r, s);
        return (recovered == questVerifier, recovered);
    }

    // Admin: clean up completed records for a player (optional)
    function purgeCompleted(address player, uint256[] memory questIds) external onlyOwner {
        for (uint i = 0; i < questIds.length; i++) {
            completed[player][questIds[i]] = false;
        }
    }

    function getQuest(uint256 id) external view returns (uint256 xpReward, string memory nftUri, bool exists) {
        Quest storage q = quests[id];
        return (q.xpReward, q.nftUri, q.exists);
    }
}

interface IGameLogic {
    function grantXP(address player, uint256 amount) external;
    function mintItem(address to, string memory uri, uint256 initialXP) external returns (uint256);
}

interface IGameItem {
    function mint(address to, string memory uri) external returns (uint256);
}
