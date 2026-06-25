import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("EduToken", function () {
  let token: any;
  let owner: any;
  let minter: any;
  let user: any;
  let blockedUser: any;

  beforeEach(async function () {
    [owner, minter, user, blockedUser] = await ethers.getSigners();
    token = await ethers.deployContract("EduToken");
    await token.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("EduChain Academy");
    expect(await token.symbol()).to.equal("EDU");
  });

  it("should have correct max supply", async function () {
    expect(await token.MAX_SUPPLY()).to.equal(ethers.parseUnits("1000000000", "ether"));
  });

  it("should have correct daily mint cap", async function () {
    expect(await token.DAILY_MINT_CAP()).to.equal(ethers.parseUnits("5000000", "ether"));
  });

  it("owner has default admin, minter, and pauser roles", async function () {
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

    expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
  });

  it("minter can mint tokens within daily cap", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    const amount = ethers.parseUnits("1000", "ether");
    await token.connect(minter).mint(user.address, amount);
    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("minter cannot mint to zero address", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    await expect(
      token.connect(minter).mint(ethers.ZeroAddress, 100)
    ).to.be.revertedWith("Mint to zero address");
  });

  it("minter cannot mint to blocked address", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    await token.blockAddress(blockedUser.address);
    await expect(
      token.connect(minter).mint(blockedUser.address, 100)
    ).to.be.revertedWith("Address blocked");
  });

  it("non-minter cannot mint", async function () {
    let reverted = false;
    try {
      await token.connect(user).mint(user.address, 100);
    } catch {
      reverted = true;
    }
    expect(reverted).to.be.true;
  });

  it("daily mint cap is enforced", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    const dailyCap = await token.DAILY_MINT_CAP();
    await token.connect(minter).mint(user.address, dailyCap);

    await expect(
      token.connect(minter).mint(user.address, 1)
    ).to.be.revertedWith("Daily mint cap exceeded");
  });

  it("batch mint works correctly", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    const recipients = [user.address, minter.address];
    const amounts = [ethers.parseUnits("100", "ether"), ethers.parseUnits("200", "ether")];

    await token.connect(minter).batchMint(recipients, amounts);
    expect(await token.balanceOf(user.address)).to.equal(amounts[0]);
    expect(await token.balanceOf(minter.address)).to.equal(amounts[1]);
  });

  it("blocked address cannot send tokens", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    await token.connect(minter).mint(user.address, ethers.parseUnits("1000", "ether"));
    await token.blockAddress(user.address);

    await expect(
      token.connect(user).transfer(minter.address, 100)
    ).to.be.revertedWith("Sender blocked");
  });

  it("cannot transfer to blocked address", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    await token.connect(minter).mint(user.address, ethers.parseUnits("1000", "ether"));
    await token.blockAddress(blockedUser.address);

    await expect(
      token.connect(user).transfer(blockedUser.address, 100)
    ).to.be.revertedWith("Recipient blocked");
  });

  it("admin can block and unblock addresses", async function () {
    await token.blockAddress(user.address);
    expect(await token.blocked(user.address)).to.be.true;

    await token.unblockAddress(user.address);
    expect(await token.blocked(user.address)).to.be.false;
  });

  it("pause and unpause work correctly", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    await token.pause();
    expect(await token.paused()).to.be.true;

    await expect(
      token.connect(minter).mint(user.address, 100)
    ).to.be.revertedWith("Pausable: paused");

    await token.unpause();
    expect(await token.paused()).to.be.false;
  });

  it("remaining daily mint capacity updates correctly", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    const dailyCap = await token.DAILY_MINT_CAP();
    expect(await token.remainingDailyMintCapacity()).to.equal(dailyCap);

    await token.connect(minter).mint(user.address, ethers.parseUnits("1000", "ether"));
    expect(await token.remainingDailyMintCapacity()).to.equal(dailyCap - ethers.parseUnits("1000", "ether"));
  });

  it("burn works correctly", async function () {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, minter.address);

    const amount = ethers.parseUnits("1000", "ether");
    await token.connect(minter).mint(user.address, amount);

    const burnAmount = ethers.parseUnits("500", "ether");
    await token.connect(user).burn(burnAmount);

    expect(await token.balanceOf(user.address)).to.equal(amount - burnAmount);
  });
});
