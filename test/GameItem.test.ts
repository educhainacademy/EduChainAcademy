import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("GameItem", function () {
  let gameItem: any;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    gameItem = await ethers.deployContract("GameItem");
    await gameItem.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await gameItem.name()).to.equal("GameItem");
    expect(await gameItem.symbol()).to.equal("GTI");
  });

  it("owner can mint tokens with URI", async function () {
    const uri = "ipfs://example-token-metadata";
    await expect(gameItem.mint(player1.address, uri))
      .to.emit(gameItem, "Transfer")
      .withArgs(ethers.ZeroAddress, player1.address, 0);

    expect(await gameItem.ownerOf(0)).to.equal(player1.address);
    expect(await gameItem.tokenURI(0)).to.equal(uri);
  });

  it("non-owner cannot mint", async function () {
    await expect(
      gameItem.connect(player1).mint(player2.address, "uri")
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
