import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("GameLogic", function () {
  let gameItem: any;
  let gameLogic: any;
  let owner: any;
  let player: any;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    gameItem = await ethers.deployContract("GameItem");
    await gameItem.waitForDeployment();

    gameLogic = await ethers.deployContract("GameLogic", [gameItem.target]);
    await gameLogic.waitForDeployment();

    // Transfer ownership of GameItem to GameLogic so it can mint
    await gameItem.transferOwnership(gameLogic.target);
  });

  it("owner can grant XP to player", async function () {
    await expect(gameLogic.grantXP(player.address, 100))
      .to.emit(gameLogic, "XPGained")
      .withArgs(player.address, 100, 100);
    expect(await gameLogic.xpBalance(player.address)).to.equal(100);
  });

  it("non-owner cannot grant XP", async function () {
    await expect(
      gameLogic.connect(player).grantXP(player.address, 100)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("owner can mint item and award initial XP", async function () {
    const uri = "ipfs://item-meta";
    await gameLogic.grantXP(player.address, 50);
    const tx = await gameLogic.mintItem(player.address, uri, 25);
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (e: any) => e.fragment && e.fragment.name === "ItemMinted"
    );
    const tokenId = event.args.tokenId;
    expect(await gameItem.ownerOf(tokenId)).to.equal(player.address);
    expect(await gameLogic.xpBalance(player.address)).to.equal(75);
  });

  it("player can upgrade item by spending XP", async function () {
    const uri = "ipfs://item";
    const tx = await gameLogic.mintItem(player.address, uri, 0);
    const receipt = await tx.wait();
    const mintEvent = receipt.logs.find(
      (e: any) => e.fragment && e.fragment.name === "ItemMinted"
    );
    const tokenId = mintEvent.args.tokenId;

    await gameLogic.grantXP(player.address, 10);
    await expect(gameLogic.connect(player).upgradeItem(tokenId, 10))
      .to.emit(gameLogic, "ItemUpgraded")
      .withArgs(player.address, tokenId, 1);

    expect(await gameLogic.xpBalance(player.address)).to.equal(0);
    expect(await gameLogic.itemLevel(tokenId)).to.equal(1);
  });

  it("upgrade fails with insufficient XP", async function () {
    const uri = "ipfs://item";
    const tx = await gameLogic.mintItem(player.address, uri, 0);
    const receipt = await tx.wait();
    const mintEvent = receipt.logs.find(
      (e: any) => e.fragment && e.fragment.name === "ItemMinted"
    );
    const tokenId = mintEvent.args.tokenId;

    await expect(
      gameLogic.connect(player).upgradeItem(tokenId, 5)
    ).to.be.revertedWith("Insufficient XP");
  });
});
