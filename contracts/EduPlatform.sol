// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EduToken.sol";

/**
 * @title EduPlatform
 * @dev Main platform contract for EduChain Academy.
 *      Integrates EDU token distribution, course enrollment, credential NFTs,
 *      revenue collection with deflationary burn (30%), and compliance controls.
 */
contract EduPlatform is Ownable {
    EduToken public immutable eduToken;

    uint256 public constant REVENUE_BURN_BPS = 3000; // 30% burn rate (basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant DAILY_REWARD_CAP = 50_000 * 1e18; // max 50k EDU rewards/day
    uint256 public constant KYC_MINIMUM = 1; // minimum KYC tier for rewards

    struct Course {
        uint256 id;
        uint256 eduReward; // EDU reward for completion
        uint256 credentialPrice; // EDU cost for credential NFT (0 = free)
        bool active;
        string metadataUri;
    }

    struct LearnerProfile {
        uint256 kycTier; // 0=none, 1=basic, 2=enhanced
        uint256 totalXp;
        uint256 coursesCompleted;
        uint256 dailyRewardsClaimed;
        uint256 lastRewardDay;
        bool exists;
    }

    uint256 public courseCount;
    uint256 public totalBurned;

    mapping(uint256 => Course) public courses;
    mapping(address => LearnerProfile) public profiles;
    mapping(address => mapping(uint256 => bool)) public courseCompleted;
    mapping(address => uint256) public credentialTokenId;
    uint256 private _nextCredentialId;

    address[] public rewardRecipients;

    event CourseCreated(uint256 indexed id, uint256 eduReward, string metadataUri);
    event CourseCompleted(address indexed learner, uint256 indexed courseId);
    event CredentialMinted(address indexed learner, uint256 indexed courseId, uint256 tokenId);
    event RevenueReceived(address indexed payer, uint256 amount);
    event TokensBurned(uint256 amount, uint256 totalBurned);
    event ProfileCreated(address indexed learner);
    event KYCUpdated(address indexed learner, uint256 tier);
    event CourseDeactivated(uint256 indexed courseId);

    constructor(address _eduToken) {
        require(_eduToken != address(0), "Token address zero");
        eduToken = EduToken(_eduToken);
    }

    /**
     * @dev Create a new course. Only owner (platform admin).
     */
    function createCourse(
        uint256 id,
        uint256 eduReward,
        uint256 credentialPrice,
        string calldata metadataUri
    ) external onlyOwner {
        require(courses[id].id == 0, "Course exists");
        require(eduReward <= 10_000 * 1e18, "Reward too high"); // compliance cap

        courses[id] = Course({
            id: id,
            eduReward: eduReward,
            credentialPrice: credentialPrice,
            active: true,
            metadataUri: metadataUri
        });

        courseCount++;
        emit CourseCreated(id, eduReward, metadataUri);
    }

    function deactivateCourse(uint256 courseId) external onlyOwner {
        require(courses[courseId].active, "Already inactive");
        courses[courseId].active = false;
        emit CourseDeactivated(courseId);
    }

    /**
     * @dev Register a learner profile. First interaction creates the profile.
     */
    function registerLearner() external {
        require(!profiles[msg.sender].exists, "Already registered");
        profiles[msg.sender] = LearnerProfile({
            kycTier: 0,
            totalXp: 0,
            coursesCompleted: 0,
            dailyRewardsClaimed: 0,
            lastRewardDay: 0,
            exists: true
        });
        emit ProfileCreated(msg.sender);
    }

    /**
     * @dev Admin sets KYC tier for a learner (called after off-chain KYC verification).
     */
    function setKYCTier(address learner, uint256 tier) external onlyOwner {
        require(profiles[learner].exists, "Learner not registered");
        profiles[learner].kycTier = tier;
        emit KYCUpdated(learner, tier);
    }

    /**
     * @dev Complete a course and claim EDU reward.
     *      Requires KYC tier >= 1 (basic) for reward eligibility.
     *      Enforces daily reward cap for anti-sybil.
     *      30% of any payment is burned.
     */
    function completeCourse(uint256 courseId) external {
        Course storage course = courses[courseId];
        require(course.active, "Course inactive");
        require(!courseCompleted[msg.sender][courseId], "Already completed");
        require(profiles[msg.sender].exists, "Not registered");
        require(profiles[msg.sender].kycTier >= KYC_MINIMUM, "KYC required");

        // Daily reward cap check
        uint256 today = block.timestamp / 1 days;
        if (today > profiles[msg.sender].lastRewardDay) {
            profiles[msg.sender].dailyRewardsClaimed = 0;
            profiles[msg.sender].lastRewardDay = today;
        }
        require(
            profiles[msg.sender].dailyRewardsClaimed + course.eduReward <= DAILY_REWARD_CAP,
            "Daily reward cap reached"
        );

        courseCompleted[msg.sender][courseId] = true;
        profiles[msg.sender].coursesCompleted++;
        profiles[msg.sender].dailyRewardsClaimed += course.eduReward;
        profiles[msg.sender].totalXp += course.eduReward;

        // Mint EDU reward
        if (course.eduReward > 0) {
            eduToken.mint(msg.sender, course.eduReward);
        }

        emit CourseCompleted(msg.sender, courseId);
    }

    /**
     * @dev Pay for and mint a credential NFT. Burns 30% of payment.
     */
    function mintCredential(uint256 courseId) external {
        Course storage course = courses[courseId];
        require(course.active, "Course inactive");
        require(courseCompleted[msg.sender][courseId], "Course not completed");
        require(credentialTokenId[msg.sender] == 0, "Already credentialed");
        require(course.credentialPrice > 0, "No price set");

        // Burn 30% of payment
        uint256 burnAmount = (course.credentialPrice * REVENUE_BURN_BPS) / BPS_DENOMINATOR;
        uint256 platformAmount = course.credentialPrice - burnAmount;

        eduToken.transferFrom(msg.sender, address(this), course.credentialPrice);
        if (burnAmount > 0) {
            eduToken.burn(burnAmount);
            totalBurned += burnAmount;
            emit TokensBurned(burnAmount, totalBurned);
        }

        _nextCredentialId++;
        credentialTokenId[msg.sender] = _nextCredentialId;

        emit CredentialMinted(msg.sender, courseId, _nextCredentialId);
    }

    /**
     * @dev Accept EDU payments and burn 30% (for course fees, partner integrations, etc.)
     */
    function receivePayment(uint256 amount) external {
        require(amount > 0, "Amount zero");
        eduToken.transferFrom(msg.sender, address(this), amount);

        uint256 burnAmount = (amount * REVENUE_BURN_BPS) / BPS_DENOMINATOR;
        if (burnAmount > 0) {
            eduToken.burn(burnAmount);
            totalBurned += burnAmount;
            emit TokensBurned(burnAmount, totalBurned);
        }

        emit RevenueReceived(msg.sender, amount);
    }

    function getLearnerStats(address learner) external view returns (
        uint256 kycTier,
        uint256 totalXp,
        uint256 coursesCompleted,
        uint256 dailyRemaining
    ) {
        LearnerProfile storage p = profiles[learner];
        uint256 today = block.timestamp / 1 days;
        uint256 dailyClaimed = (today > p.lastRewardDay) ? 0 : p.dailyRewardsClaimed;

        return (p.kycTier, p.totalXp, p.coursesCompleted, DAILY_REWARD_CAP - dailyClaimed);
    }

    receive() external payable {}
}
