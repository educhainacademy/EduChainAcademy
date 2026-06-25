import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("SimplePaymaster", function () {
  let paymaster: any;
  let owner: any;
  let user: any;

  const MOCK_ENTRY_POINT = "0x0000000000000000000000000000000000000001";

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    paymaster = await ethers.deployContract("SimplePaymaster", [MOCK_ENTRY_POINT]);
    await paymaster.waitForDeployment();
  });

  it("should store the entry point address", async function () {
    expect(await paymaster.entryPoint()).to.equal(MOCK_ENTRY_POINT);
  });

  it("should accept ETH via receive", async function () {
    await owner.sendTransaction({
      to: paymaster.target,
      value: ethers.parseEther("1.0"),
    });

    const balance = await ethers.provider.getBalance(paymaster.target);
    expect(balance).to.equal(ethers.parseEther("1.0"));
  });

  it("validatePaymasterUserOp returns empty context and zero validation data", async function () {
    const mockUserOp = {
      sender: user.address,
      nonce: 0,
      initCode: "0x",
      callData: "0x",
      callGasLimit: 0,
      verificationGasLimit: 0,
      preVerificationGas: 0,
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      paymasterAndData: "0x",
      signature: "0x",
    };

    const userOpHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const [context, validationData] = await paymaster.validatePaymasterUserOp(
      mockUserOp,
      userOpHash,
      0
    );

    expect(context).to.equal("0x");
    expect(validationData).to.equal(0);
  });

  it("postOp does not revert", async function () {
    const tx = await paymaster.postOp(0, "0x", 0);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it("owner can withdraw ETH", async function () {
    await owner.sendTransaction({
      to: paymaster.target,
      value: ethers.parseEther("1.0"),
    });

    const balanceBefore = await ethers.provider.getBalance(user.address);
    await paymaster.withdraw(user.address);
    const balanceAfter = await ethers.provider.getBalance(user.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1.0"));
  });

  it("non-owner cannot withdraw ETH", async function () {
    await owner.sendTransaction({
      to: paymaster.target,
      value: ethers.parseEther("1.0"),
    });

    await expect(
      paymaster.connect(user).withdraw(user.address)
    ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
  });
});
