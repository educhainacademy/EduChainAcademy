// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Governance
 * @dev Token-weighted governance for EduChain Academy.
 *      EDU holders create proposals and vote. Voting power = token balance at proposal block.
 *      Follows a 3-phase roadmap: platform-led → token-gated → decentralized DAO.
 */
contract Governance is Ownable {
    IERC20 public immutable eduToken;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool canceled;
    }

    uint256 public proposalCount;
    uint256 public votingPeriod; // blocks
    uint256 public quorumThreshold; // minimum EDU votes needed
    uint256 public proposalThreshold; // minimum EDU to create proposal

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteChoice; // true = for

    event ProposalCreated(uint256 indexed id, address proposer, string description, uint256 startBlock, uint256 endBlock);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);
    event VotingPeriodUpdated(uint256 newPeriod);
    event QuorumUpdated(uint256 newQuorum);
    event ProposalThresholdUpdated(uint256 newThreshold);

    constructor(
        address _eduToken,
        uint256 _votingPeriod,
        uint256 _quorumThreshold,
        uint256 _proposalThreshold
    ) {
        require(_eduToken != address(0), "Token address zero");
        eduToken = IERC20(_eduToken);
        votingPeriod = _votingPeriod;
        quorumThreshold = _quorumThreshold;
        proposalThreshold = _proposalThreshold;
    }

    function createProposal(string calldata description) external returns (uint256) {
        require(eduToken.balanceOf(msg.sender) >= proposalThreshold, "Below proposal threshold");

        proposalCount++;
        uint256 startBlock = block.number;
        uint256 endBlock = block.number + votingPeriod;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startBlock: startBlock,
            endBlock: endBlock,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalCount, msg.sender, description, startBlock, endBlock);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal not found");
        require(block.number >= p.startBlock && block.number <= p.endBlock, "Voting closed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(!p.canceled, "Proposal canceled");

        uint256 weight = eduToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        voteChoice[proposalId][msg.sender] = support;

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal not found");
        require(block.number > p.endBlock, "Voting not ended");
        require(!p.executed, "Already executed");
        require(!p.canceled, "Proposal canceled");
        require(p.forVotes + p.againstVotes >= quorumThreshold, "Quorum not reached");
        require(p.forVotes > p.againstVotes, "Proposal rejected");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal not found");
        require(msg.sender == p.proposer || msg.sender == owner(), "Not authorized");
        require(!p.executed, "Already executed");
        require(!p.canceled, "Already canceled");

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function setVotingPeriod(uint256 _period) external onlyOwner {
        votingPeriod = _period;
        emit VotingPeriodUpdated(_period);
    }

    function setQuorumThreshold(uint256 _quorum) external onlyOwner {
        quorumThreshold = _quorum;
        emit QuorumUpdated(_quorum);
    }

    function setProposalThreshold(uint256 _threshold) external onlyOwner {
        proposalThreshold = _threshold;
        emit ProposalThresholdUpdated(_threshold);
    }

    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal not found");
        if (p.canceled) return "Canceled";
        if (p.executed) return "Executed";
        if (block.number < p.startBlock) return "Pending";
        if (block.number <= p.endBlock) return "Active";
        if (p.forVotes + p.againstVotes < quorumThreshold) return "Defeated";
        if (p.forVotes > p.againstVotes) return "Succeeded";
        return "Defeated";
    }
}
