import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("TransitionRules", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const TransitionRules = await ethers.getContractFactory("TransitionRules");
    const transitionRules = await TransitionRules.deploy();

    return { transitionRules, owner, addr1, addr2 };
  }

  describe("Rule Management", function () {
    it("Should set a rule", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      await transitionRules.setRule(1, 0, addr1.address, 100);
      
      const rule = await transitionRules.getRule(1);
      expect(rule.ruleType).to.equal(0); // SIGNATURE
      expect(rule.validator).to.equal(addr1.address);
      expect(rule.parameter).to.equal(100);
      expect(rule.active).to.equal(true);
    });

    it("Should emit RuleUpdated event", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      await expect(transitionRules.setRule(1, 0, addr1.address, 100))
        .to.emit(transitionRules, "RuleUpdated")
        .withArgs(1, 0, addr1.address);
    });

    it("Should deactivate a rule", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      await transitionRules.setRule(1, 0, addr1.address, 100);
      await transitionRules.deactivateRule(1);
      
      const rule = await transitionRules.getRule(1);
      expect(rule.active).to.equal(false);
    });

    it("Should only allow owner to set rules", async function () {
      const { transitionRules, addr1, addr2 } = await loadFixture(deployFixture);
      
      await expect(
        transitionRules.connect(addr1).setRule(1, 0, addr2.address, 100)
      ).to.be.reverted;
    });
  });

  describe("Validation", function () {
    it("Should validate when no rule is set", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      const result = await transitionRules.validateTransition(1, addr1.address, "0x");
      expect(result).to.equal(true);
    });

    it("Should validate when rule is inactive", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      await transitionRules.setRule(1, 0, addr1.address, 100);
      await transitionRules.deactivateRule(1);
      
      const result = await transitionRules.validateTransition(1, addr1.address, "0x");
      expect(result).to.equal(true);
    });
  });

  describe("Timelock Rules", function () {
    it("Should set timelock for transition", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      const unlockTime = (await time.latest()) + 3600;
      await transitionRules.setTimelock(1, addr1.address, unlockTime);
      
      // Timelock is set, validation should work
      await transitionRules.setRule(1, 2, ethers.ZeroAddress, 0); // TIMELOCK type
    });

    it("Should reject timelock in the past", async function () {
      const { transitionRules, addr1 } = await loadFixture(deployFixture);
      
      const unlockTime = (await time.latest()) - 3600;
      await expect(
        transitionRules.setTimelock(1, addr1.address, unlockTime)
      ).to.be.revertedWith("Unlock time must be in future");
    });
  });

  describe("Get Rule", function () {
    it("Should return default rule for unset transition", async function () {
      const { transitionRules } = await loadFixture(deployFixture);
      
      const rule = await transitionRules.getRule(999);
      expect(rule.active).to.equal(false);
      expect(rule.validator).to.equal(ethers.ZeroAddress);
    });
  });
});

