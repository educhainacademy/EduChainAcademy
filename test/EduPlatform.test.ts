import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("EduPlatform", function () {
  let token: any;
  let platform: any;
  let owner: any;
  let learner: any;
  let learner2: any;

  const TOTAL_SUPPLY = ethers.parseUnits("100000000", "ether");
  const COURSE_ID = 1;
  const COURSE_REWARD = ethers.parseUnits("100", "ether");
  const CREDENTIAL_PRICE = ethers.parseUnits("50", "ether");

  beforeEach(async function () {
    [owner, learner, learner2] = await ethers.getSigners();

    token = await ethers.deployContract("EduToken");
    await token.waitForDeployment();

    platform = await ethers.deployContract("EduPlatform", [token.target]);
    await platform.waitForDeployment();

    // Grant minter role to platform so it can mint EDU rewards
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await token.grantRole(MINTER_ROLE, platform.target);
  });

  describe("Course Management", function () {
    it("owner can create a course", async function () {
      await expect(platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1"))
        .to.emit(platform, "CourseCreated")
        .withArgs(COURSE_ID, COURSE_REWARD, "ipfs://course1");

      const course = await platform.courses(COURSE_ID);
      expect(course.eduReward).to.equal(COURSE_REWARD);
      expect(course.active).to.be.true;
    });

    it("non-owner cannot create course", async function () {
      await expect(
        platform.connect(learner).createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("cannot create duplicate course", async function () {
      await platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1");
      await expect(
        platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1")
      ).to.be.revertedWith("Course exists");
    });

    it("owner can deactivate course", async function () {
      await platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1");
      await expect(platform.deactivateCourse(COURSE_ID))
        .to.emit(platform, "CourseDeactivated")
        .withArgs(COURSE_ID);

      const course = await platform.courses(COURSE_ID);
      expect(course.active).to.be.false;
    });
  });

  describe("Learner Registration", function () {
    it("learner can register", async function () {
      await expect(platform.connect(learner).registerLearner())
        .to.emit(platform, "ProfileCreated")
        .withArgs(learner.address);

      const profile = await platform.profiles(learner.address);
      expect(profile.exists).to.be.true;
      expect(profile.kycTier).to.equal(0);
    });

    it("cannot register twice", async function () {
      await platform.connect(learner).registerLearner();
      await expect(
        platform.connect(learner).registerLearner()
      ).to.be.revertedWith("Already registered");
    });

    it("owner can set KYC tier", async function () {
      await platform.connect(learner).registerLearner();
      await expect(platform.setKYCTier(learner.address, 2))
        .to.emit(platform, "KYCUpdated")
        .withArgs(learner.address, 2);

      const profile = await platform.profiles(learner.address);
      expect(profile.kycTier).to.equal(2);
    });
  });

  describe("Course Completion", function () {
    beforeEach(async function () {
      await platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1");
      await platform.connect(learner).registerLearner();
      await platform.setKYCTier(learner.address, 1); // basic KYC
    });

    it("learner can complete course and receive EDU reward", async function () {
      await expect(platform.connect(learner).completeCourse(COURSE_ID))
        .to.emit(platform, "CourseCompleted")
        .withArgs(learner.address, COURSE_ID);

      expect(await token.balanceOf(learner.address)).to.equal(COURSE_REWARD);

      const profile = await platform.profiles(learner.address);
      expect(profile.coursesCompleted).to.equal(1);
      expect(profile.totalXp).to.equal(COURSE_REWARD);
    });

    it("cannot complete course without KYC", async function () {
      await platform.connect(learner2).registerLearner();
      await expect(
        platform.connect(learner2).completeCourse(COURSE_ID)
      ).to.be.revertedWith("KYC required");
    });

    it("cannot complete same course twice", async function () {
      await platform.connect(learner).completeCourse(COURSE_ID);
      await expect(
        platform.connect(learner).completeCourse(COURSE_ID)
      ).to.be.revertedWith("Already completed");
    });

    it("cannot complete inactive course", async function () {
      await platform.deactivateCourse(COURSE_ID);
      await expect(
        platform.connect(learner).completeCourse(COURSE_ID)
      ).to.be.revertedWith("Course inactive");
    });

    it("cannot complete course without registration", async function () {
      await expect(
        platform.connect(learner2).completeCourse(COURSE_ID)
      ).to.be.revertedWith("Not registered");
    });
  });

  describe("Credential Minting", function () {
    beforeEach(async function () {
      await platform.createCourse(COURSE_ID, COURSE_REWARD, CREDENTIAL_PRICE, "ipfs://course1");
      await platform.connect(learner).registerLearner();
      await platform.setKYCTier(learner.address, 1);

      // Mint EDU to learner for payment
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      await token.grantRole(MINTER_ROLE, owner.address);
      await token.mint(learner.address, CREDENTIAL_PRICE);
    });

    it("learner can mint credential after completing course", async function () {
      await platform.connect(learner).completeCourse(COURSE_ID);
      await token.connect(learner).approve(platform.target, CREDENTIAL_PRICE);

      await expect(platform.connect(learner).mintCredential(COURSE_ID))
        .to.emit(platform, "CredentialMinted");

      // Check burn happened (30% of 50 = 15 burned)
      expect(await platform.totalBurned()).to.equal(ethers.parseUnits("15", "ether"));
    });

    it("cannot mint credential without completing course", async function () {
      await token.connect(learner).approve(platform.target, CREDENTIAL_PRICE);
      await expect(
        platform.connect(learner).mintCredential(COURSE_ID)
      ).to.be.revertedWith("Course not completed");
    });

    it("cannot mint credential twice", async function () {
      await platform.connect(learner).completeCourse(COURSE_ID);
      await token.connect(learner).approve(platform.target, CREDENTIAL_PRICE * 2n);
      await platform.connect(learner).mintCredential(COURSE_ID);

      await expect(
        platform.connect(learner).mintCredential(COURSE_ID)
      ).to.be.revertedWith("Already credentialed");
    });
  });

  describe("Revenue & Burns", function () {
    it("receivePayment burns 30% and keeps 70%", async function () {
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      await token.grantRole(MINTER_ROLE, owner.address);

      const payment = ethers.parseUnits("1000", "ether");
      await token.mint(learner.address, payment);
      await token.connect(learner).approve(platform.target, payment);

      await expect(platform.connect(learner).receivePayment(payment))
        .to.emit(platform, "TokensBurned")
        .withArgs(ethers.parseUnits("300", "ether"), ethers.parseUnits("300", "ether"));

      expect(await platform.totalBurned()).to.equal(ethers.parseUnits("300", "ether"));
    });
  });

  describe("Learner Stats", function () {
    it("returns correct stats", async function () {
      await platform.createCourse(COURSE_ID, COURSE_REWARD, 0, "ipfs://course1");
      await platform.connect(learner).registerLearner();
      await platform.setKYCTier(learner.address, 2);
      await platform.connect(learner).completeCourse(COURSE_ID);

      const [kycTier, totalXp, coursesCompleted, dailyRemaining] =
        await platform.getLearnerStats(learner.address);

      expect(kycTier).to.equal(2);
      expect(totalXp).to.equal(COURSE_REWARD);
      expect(coursesCompleted).to.equal(1);
      expect(dailyRemaining).to.be.gt(0);
    });
  });
});
