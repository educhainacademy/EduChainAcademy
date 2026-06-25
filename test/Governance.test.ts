import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.create();

describe("Governance", function () {
  let token: any;
  let governance: any;
  let owner: any;
  let voter1: any;
  let voter2: any;
  let voter3: any;

  const VOTING_PERIOD = 10; // blocks
  const QUORUM = ethers.parseUnits("5000", "ether");
  const PROPOSAL_THRESHOLD = ethers.parseUnits("100", "ether");
  const TOTAL_SUPPLY = ethers.parseUnits("100000", "ether");

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    token = await ethers.deployContract("ERC20Mock", ["EduToken", "EDU", TOTAL_SUPPLY]);
    await token.waitForDeployment();

    governance = await ethers.deployContract("Governance", [
      token.target,
      VOTING_PERIOD,
      QUORUM,
      PROPOSAL_THRESHOLD,
    ]);
    await governance.waitForDeployment();

    // Distribute tokens to voters
    await token.mint(voter1.address, ethers.parseUnits("5000", "ether"));
    await token.mint(voter2.address, ethers.parseUnits("3000", "ether"));
    await token.mint(voter3.address, ethers.parseUnits("2000", "ether"));
  });

  it("should create a proposal", async function () {
    await expect(governance.connect(voter1).createProposal("Add new course on DeFi"))
      .to.emit(governance, "ProposalCreated");

    const proposal = await governance.proposals(1);
    expect(proposal.proposer).to.equal(voter1.address);
    expect(proposal.description).to.equal("Add new course on DeFi");
    expect(proposal.forVotes).to.equal(0);
    expect(proposal.againstVotes).to.equal(0);
  });

  it("should reject proposal from address below threshold", async function () {
    // voter3 has 2000 EDU, which is above 100 threshold
    // But let's test with a fresh address that has no tokens
    const [, , , , noTokens] = await ethers.getSigners();
    await expect(
      governance.connect(noTokens).createProposal("Test")
    ).to.be.revertedWith("Below proposal threshold");
  });

  it("should allow voting and track votes correctly", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");

    await expect(governance.connect(voter1).vote(1, true))
      .to.emit(governance, "Voted")
      .withArgs(1, voter1.address, true, ethers.parseUnits("5000", "ether"));

    const proposal = await governance.proposals(1);
    expect(proposal.forVotes).to.equal(ethers.parseUnits("5000", "ether"));
  });

  it("should track against votes", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    await governance.connect(voter2).vote(1, false);

    const proposal = await governance.proposals(1);
    expect(proposal.againstVotes).to.equal(ethers.parseUnits("3000", "ether"));
  });

  it("should not allow double voting", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    await governance.connect(voter1).vote(1, true);

    await expect(
      governance.connect(voter1).vote(1, true)
    ).to.be.revertedWith("Already voted");
  });

  it("should not allow voting after period ends", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");

    // Mine blocks to end voting period
    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await networkHelpers.mine();
    }

    await expect(
      governance.connect(voter1).vote(1, true)
    ).to.be.revertedWith("Voting closed");
  });

  it("should execute a successful proposal", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");

    // Vote: voter1 (5000) + voter2 (3000) for = 8000 for, 0 against
    await governance.connect(voter1).vote(1, true);
    await governance.connect(voter2).vote(1, true);

    // Mine past voting period
    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await networkHelpers.mine();
    }

    await expect(governance.executeProposal(1))
      .to.emit(governance, "ProposalExecuted");

    const proposal = await governance.proposals(1);
    expect(proposal.executed).to.be.true;
  });

  it("should not execute proposal that didn't reach quorum", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    // Only voter3 votes (2000 EDU), which is below quorum of 10000
    await governance.connect(voter3).vote(1, true);

    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await networkHelpers.mine();
    }

    await expect(
      governance.executeProposal(1)
    ).to.be.revertedWith("Quorum not reached");
  });

  it("should not execute rejected proposal", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");

    // voter2 and voter3 vote against (3000 + 2000 = 5000 against)
    await governance.connect(voter2).vote(1, false);
    await governance.connect(voter3).vote(1, false);

    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await networkHelpers.mine();
    }

    await expect(
      governance.executeProposal(1)
    ).to.be.revertedWith("Proposal rejected");
  });

  it("should allow proposer to cancel proposal", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    await expect(governance.connect(voter1).cancelProposal(1))
      .to.emit(governance, "ProposalCanceled");

    const proposal = await governance.proposals(1);
    expect(proposal.canceled).to.be.true;
  });

  it("should allow owner to cancel proposal", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    await expect(governance.connect(owner).cancelProposal(1))
      .to.emit(governance, "ProposalCanceled");
  });

  it("should not allow non-authorized user to cancel", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");
    await expect(
      governance.connect(voter2).cancelProposal(1)
    ).to.be.revertedWith("Not authorized");
  });

  it("should return correct proposal state", async function () {
    await governance.connect(voter1).createProposal("Proposal 1");

    let state = await governance.getProposalState(1);
    expect(state).to.equal("Active");

    // Mine past voting period
    for (let i = 0; i < VOTING_PERIOD + 1; i++) {
      await networkHelpers.mine();
    }

    state = await governance.getProposalState(1);
    expect(state).to.equal("Defeated"); // no votes = quorum not reached
  });

  it("owner can update governance parameters", async function () {
    await expect(governance.setVotingPeriod(20))
      .to.emit(governance, "VotingPeriodUpdated")
      .withArgs(20);
    expect(await governance.votingPeriod()).to.equal(20);

    await expect(governance.setQuorumThreshold(ethers.parseUnits("5000", "ether")))
      .to.emit(governance, "QuorumUpdated");

    await expect(governance.setProposalThreshold(ethers.parseUnits("50", "ether")))
      .to.emit(governance, "ProposalThresholdUpdated");
  });
});
