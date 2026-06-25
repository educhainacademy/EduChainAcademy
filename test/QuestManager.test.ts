import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

// Hardhat default account #0 private key (matches first signer)
const VERIFIER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const verifierWallet = new ethers.Wallet(VERIFIER_PRIVATE_KEY);

function signDigest(digest: string): string {
  const sig = verifierWallet.signingKey.sign(digest);
  return ethers.concat([sig.r, sig.s, ethers.toBeHex(sig.v, 1)]);
}

describe("QuestManager", function () {
  let gameLogic: any;
  let gameItem: any;
  let questManager: any;
  let owner: any;
  let player: any;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    gameItem = await ethers.deployContract("GameItem");
    await gameItem.waitForDeployment();

    gameLogic = await ethers.deployContract("GameLogic", [gameItem.target]);
    await gameLogic.waitForDeployment();

    questManager = await ethers.deployContract("QuestManager", [
      owner.address,
      gameLogic.target,
      gameItem.target,
    ]);
    await questManager.waitForDeployment();

    // Transfer ownership of GameItem to QuestManager so it can mint NFTs directly
    await gameItem.transferOwnership(questManager.target);

    // Transfer ownership of GameLogic to QuestManager so it can grantXP
    await gameLogic.transferOwnership(questManager.target);
  });

  it("Should allow owner to add a quest", async function () {
    const xpReward = 100;
    const nftUri = "ipfs://some-nft-metadata";

    await expect(questManager.addQuest(1, xpReward, nftUri))
      .to.emit(questManager, "QuestAdded")
      .withArgs(1, xpReward, nftUri);

    const [xp, uri, exists] = await questManager.getQuest(1);
    expect(xp).to.equal(BigInt(xpReward));
    expect(uri).to.equal(nftUri);
    expect(exists).to.be.true;
  });

  it("Should reject non-owner when adding quest", async function () {
    const xpReward = 100;
    const nftUri = "ipfs://some-nft-metadata";
    await expect(
      questManager.connect(player).addQuest(1, xpReward, nftUri)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should complete quest and award XP", async function () {
    const xpReward = 50;
    await questManager.addQuest(1, xpReward, "");

    const deadline = Math.floor(Date.now() / 1000) + 100000;
    const digest = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256"],
      [player.address, 1, deadline]
    );
    const signature = signDigest(digest);

    await expect(questManager.completeQuest(1, signature, player.address, deadline))
      .to.emit(questManager, "QuestCompleted")
      .withArgs(player.address, 1, xpReward);

    const completed = await questManager.completed(player.address, 1);
    expect(completed).to.be.true;

    const xpBalance = await gameLogic.xpBalance(player.address);
    expect(xpBalance).to.equal(BigInt(xpReward));
  });

  it("Should mint NFT on quest completion when URI is provided", async function () {
    const xpReward = 50;
    const nftUri = "ipfs://quest-reward-nft";
    await questManager.addQuest(2, xpReward, nftUri);

    const deadline = Math.floor(Date.now() / 1000) + 100000;
    const digest = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256"],
      [player.address, 2, deadline]
    );
    const signature = signDigest(digest);

    await questManager.completeQuest(2, signature, player.address, deadline);

    const balance = await gameItem.balanceOf(player.address);
    expect(balance).to.equal(1);
  });

  it("Should not allow completing quest twice", async function () {
    await questManager.addQuest(3, 10, "");

    const deadline = Math.floor(Date.now() / 1000) + 100000;
    const digest = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256"],
      [player.address, 3, deadline]
    );
    const signature = signDigest(digest);

    await questManager.completeQuest(3, signature, player.address, deadline);

    await expect(
      questManager.completeQuest(3, signature, player.address, deadline)
    ).to.be.revertedWith("Already completed");
  });
});
