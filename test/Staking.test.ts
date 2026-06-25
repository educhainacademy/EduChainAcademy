import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.create();

describe("Staking", function () {
  let token: any;
  let staking: any;
  let gameItem: any;
  let gameLogic: any;
  let owner: any;
  const REWARD_RATE = 10;
  const TOTAL_SUPPLY = ethers.parseUnits("10000", "ether");

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    gameItem = await ethers.deployContract("GameItem");
    await gameItem.waitForDeployment();

    gameLogic = await ethers.deployContract("GameLogic", [gameItem.target]);
    await gameLogic.waitForDeployment();

    token = await ethers.deployContract("ERC20Mock", [
      "GameToken",
      "GTK",
      TOTAL_SUPPLY,
    ]);
    await token.waitForDeployment();

    staking = await ethers.deployContract("Staking", [
      token.target,
      gameLogic.target,
    ]);
    await staking.waitForDeployment();

    // Transfer GameLogic ownership to Staking so claimRewards can call grantXP
    await gameLogic.transferOwnership(staking.target);

    await staking.setRewardRate(REWARD_RATE);
  });

  it("Should stake tokens and update stake info", async function () {
    const stakeAmount = ethers.parseUnits("100", "ether");

    await token.mint(owner.address, stakeAmount);
    await token.approve(staking.target, stakeAmount);

    await expect(staking.stake(stakeAmount))
      .to.emit(staking, "Staked")
      .withArgs(owner.address, stakeAmount);

    const stakeInfo = await staking.stakes(owner.address);
    expect(stakeInfo.amount).to.equal(stakeAmount);
  });

  it("Should allow withdrawal of staked tokens", async function () {
    const stakeAmount = ethers.parseUnits("100", "ether");

    await token.mint(owner.address, stakeAmount);
    await token.approve(staking.target, stakeAmount);
    await staking.stake(stakeAmount);

    await expect(staking.withdraw(stakeAmount))
      .to.emit(staking, "Withdrawn")
      .withArgs(owner.address, stakeAmount);

    const stakeInfo = await staking.stakes(owner.address);
    expect(stakeInfo.amount).to.equal(0);
  });

  it("Should track earned rewards over time", async function () {
    const stakeAmount = ethers.parseUnits("100", "ether");

    await token.mint(owner.address, stakeAmount);
    await token.approve(staking.target, stakeAmount);
    await staking.stake(stakeAmount);

    await networkHelpers.time.increase(100);

    const earned = await staking.earned(owner.address);
    expect(earned).to.be.gt(0);
  });

  it("Should claim rewards and grant XP", async function () {
    const stakeAmount = ethers.parseUnits("100", "ether");

    await token.mint(owner.address, stakeAmount);
    await token.approve(staking.target, stakeAmount);
    await staking.stake(stakeAmount);

    await networkHelpers.time.increase(50);

    await expect(staking.claimRewards())
      .to.emit(staking, "RewardsClaimed");

    const xp = await gameLogic.xpBalance(owner.address);
    expect(xp).to.be.gt(0);
  });

  it("Should revert claim when no rewards", async function () {
    await expect(staking.claimRewards()).to.be.revertedWith("No rewards");
  });
});
