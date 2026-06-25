import hre from "hardhat";

const { ethers } = await hre.network.create();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MembershipNFT with:", deployer.address);

  // Deploy MembershipNFT
  // Max supply: 10,000 | Mint price: 0.01 ETH
  const membershipNFT = await ethers.deployContract("MembershipNFT", [
    "EduChain Academy Membership", // name
    "ECHAIN-MEMBER",               // symbol
    10_000,                        // max supply
    ethers.parseEther("0.01"),     // mint price
  ]);
  await membershipNFT.waitForDeployment();
  const addr = await membershipNFT.getAddress();
  console.log("MembershipNFT:", addr);

  // Mint a founder membership to deployer (BASIC tier, no expiry)
  const tx = await membershipNFT.mint(
    deployer.address,
    0, // MembershipTier.BASIC
    0, // no expiry
    "ipfs://founder-metadata"
  );
  await tx.wait();
  console.log("Founder membership minted to:", deployer.address);

  console.log("\n--- Summary ---");
  console.log("MembershipNFT:", addr);
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
