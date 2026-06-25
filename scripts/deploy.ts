import hre from "hardhat";

const { ethers } = await hre.network.create();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy GameItem (ERC-721)
  const gameItem = await ethers.deployContract("GameItem");
  await gameItem.waitForDeployment();
  const gameItemAddr = await gameItem.getAddress();
  console.log("GameItem:", gameItemAddr);

  // 2. Deploy GameLogic
  const gameLogic = await ethers.deployContract("GameLogic", [gameItemAddr]);
  await gameLogic.waitForDeployment();
  const gameLogicAddr = await gameLogic.getAddress();
  console.log("GameLogic:", gameLogicAddr);

  // Transfer GameItem ownership to GameLogic
  await gameItem.transferOwnership(gameLogicAddr);
  console.log("GameItem ownership -> GameLogic");

  // 3. Deploy QuestManager (deployer is initial verifier)
  const questManager = await ethers.deployContract("QuestManager", [
    deployer.address,
    gameLogicAddr,
    gameItemAddr,
  ]);
  await questManager.waitForDeployment();
  const questManagerAddr = await questManager.getAddress();
  console.log("QuestManager:", questManagerAddr);

  // Transfer GameLogic ownership to QuestManager so it can grantXP
  await gameLogic.transferOwnership(questManagerAddr);
  console.log("GameLogic ownership -> QuestManager");

  // 4. Deploy EduToken (ERC-20)
  const eduToken = await ethers.deployContract("EduToken");
  await eduToken.waitForDeployment();
  const eduTokenAddr = await eduToken.getAddress();
  console.log("EduToken:", eduTokenAddr);

  // 5. Deploy Staking
  const staking = await ethers.deployContract("Staking", [eduTokenAddr, gameLogicAddr]);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("Staking:", stakingAddr);

  // 6. Deploy Governance
  const governance = await ethers.deployContract("Governance", [
    eduTokenAddr,
    100, // voting period (blocks)
    ethers.parseUnits("1000", "ether"), // quorum
    ethers.parseUnits("100", "ether"), // proposal threshold
  ]);
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  console.log("Governance:", governanceAddr);

  // 7. Deploy EduPlatform
  const eduPlatform = await ethers.deployContract("EduPlatform", [eduTokenAddr]);
  await eduPlatform.waitForDeployment();
  const eduPlatformAddr = await eduPlatform.getAddress();
  console.log("EduPlatform:", eduPlatformAddr);

  // 8. Deploy SimplePaymaster (use zero address as placeholder for EntryPoint)
  const simplePaymaster = await ethers.deployContract("SimplePaymaster", [
    "0x0000000000000000000000000000000000000001",
  ]);
  await simplePaymaster.waitForDeployment();
  const simplePaymasterAddr = await simplePaymaster.getAddress();
  console.log("SimplePaymaster:", simplePaymasterAddr);

  // Grant MINTER_ROLE to QuestManager, Staking, and EduPlatform
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await eduToken.grantRole(MINTER_ROLE, questManagerAddr);
  await eduToken.grantRole(MINTER_ROLE, stakingAddr);
  await eduToken.grantRole(MINTER_ROLE, eduPlatformAddr);
  console.log("MINTER_ROLE granted to QuestManager, Staking, EduPlatform");

  // Set up quests
  const quests = [
    { id: 1, xp: ethers.parseUnits("100", "ether"), nftUri: "ipfs://quest-1-intro-blockchain" },
    { id: 2, xp: ethers.parseUnits("150", "ether"), nftUri: "ipfs://quest-2-smart-contracts" },
    { id: 3, xp: ethers.parseUnits("200", "ether"), nftUri: "ipfs://quest-3-defi" },
    { id: 4, xp: ethers.parseUnits("250", "ether"), nftUri: "" },
    { id: 5, xp: ethers.parseUnits("300", "ether"), nftUri: "ipfs://quest-5-security" },
  ];

  for (const q of quests) {
    // QuestManager needs owner to add quests
    // Transfer QuestManager ownership back temporarily or use a separate admin
    // For now, add quests from deployer (who should be owner)
    await questManager.addQuest(q.id, q.xp, q.nftUri);
    console.log(`Quest ${q.id}: ${q.xp} XP`);
  }

  // Set staking reward rate (0.001 XP per token per second)
  await staking.setRewardRate(ethers.parseUnits("0.001", "ether"));
  console.log("Staking reward rate: 0.001 XP/token/s");

  // Set up courses on EduPlatform
  const courses = [
    { id: 1, reward: ethers.parseUnits("50", "ether"), credPrice: ethers.parseUnits("10", "ether"), uri: "ipfs://course-1-intro-blockchain" },
    { id: 2, reward: ethers.parseUnits("75", "ether"), credPrice: ethers.parseUnits("15", "ether"), uri: "ipfs://course-2-smart-contracts" },
    { id: 3, reward: ethers.parseUnits("100", "ether"), credPrice: ethers.parseUnits("20", "ether"), uri: "ipfs://course-3-defi" },
    { id: 4, reward: ethers.parseUnits("125", "ether"), credPrice: ethers.parseUnits("25", "ether"), uri: "ipfs://course-4-real-estate" },
    { id: 5, reward: ethers.parseUnits("150", "ether"), credPrice: ethers.parseUnits("30", "ether"), uri: "ipfs://course-5-security" },
  ];

  for (const c of courses) {
    await eduPlatform.createCourse(c.id, c.reward, c.credPrice, c.uri);
    console.log(`Course ${c.id}: ${c.reward} EDU reward`);
  }

  // Print summary
  console.log("\n=== DEPLOYED ADDRESSES ===");
  console.log(JSON.stringify({
    gameItem: gameItemAddr,
    gameLogic: gameLogicAddr,
    questManager: questManagerAddr,
    eduToken: eduTokenAddr,
    staking: stakingAddr,
    governance: governanceAddr,
    eduPlatform: eduPlatformAddr,
    simplePaymaster: simplePaymasterAddr,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
