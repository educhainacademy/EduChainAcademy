// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Staking
 * @dev Simple ERC20 staking contract that rewards XP (via GameLogic) based on stake duration.
 * The contract owner sets the reward rate (XP per token per second).
 */
contract Staking is Ownable {
    // The ERC20 token that can be staked
    IERC20 public immutable stakingToken;
    // The GameLogic contract that receives XP rewards
    address public immutable gameLogic;

    // Reward rate in XP per token per second
    uint256 public rewardRate;

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastUpdate;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 xp);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _stakingToken, address _gameLogic) {
        require(_stakingToken != address(0), "Staking token zero");
        require(_gameLogic != address(0), "GameLogic zero");
        stakingToken = IERC20(_stakingToken);
        gameLogic = _gameLogic;
    }

    function setRewardRate(uint256 _rate) external onlyOwner {
        rewardRate = _rate;
        emit RewardRateUpdated(_rate);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount zero");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lastUpdate = block.timestamp;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount zero");
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        stakes[msg.sender].amount -= amount;
        stakes[msg.sender].rewardDebt = 0; // reset on withdraw
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function earned(address user) public view returns (uint256) {
        StakeInfo memory s = stakes[user];
        return s.rewardDebt + (s.amount * rewardRate * (block.timestamp - s.lastUpdate)) / 1e18;
    }

    function claimRewards() external {
        uint256 xp = earned(msg.sender);
        require(xp > 0, "No rewards");
        stakes[msg.sender].rewardDebt = 0;
        stakes[msg.sender].lastUpdate = block.timestamp;
        IGameLogic(gameLogic).grantXP(msg.sender, xp);
        emit RewardsClaimed(msg.sender, xp);
    }
}

interface IGameLogic {
    function grantXP(address player, uint256 amount) external;
}
