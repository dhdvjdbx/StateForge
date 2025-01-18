import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("HookManager", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const HookManager = await ethers.getContractFactory("HookManager");
    const hookManager = await HookManager.deploy();

    return { hookManager, owner, addr1, addr2 };
  }

  describe("Hook Registration", function () {
    it("Should register a hook", async function () {
      const { hookManager, addr1 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address); // PRE_TRANSITION
      
      const hooks = await hookManager.getHooks(1, 0);
      expect(hooks.length).to.equal(1);
      expect(hooks[0]).to.equal(addr1.address);
    });

    it("Should emit HookRegistered event", async function () {
      const { hookManager, addr1 } = await loadFixture(deployFixture);
      
      await expect(hookManager.registerHook(1, 0, addr1.address))
        .to.emit(hookManager, "HookRegistered")
        .withArgs(1, 0, addr1.address);
    });

    it("Should reject zero address", async function () {
      const { hookManager } = await loadFixture(deployFixture);
      
      await expect(
        hookManager.registerHook(1, 0, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid hook address");
    });

    it("Should register multiple hooks", async function () {
      const { hookManager, addr1, addr2 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address);
      await hookManager.registerHook(1, 0, addr2.address);
      
      const hooks = await hookManager.getHooks(1, 0);
      expect(hooks.length).to.equal(2);
    });

    it("Should reject more than max hooks", async function () {
      const { hookManager } = await loadFixture(deployFixture);
      
      for (let i = 0; i < 10; i++) {
        const wallet = ethers.Wallet.createRandom();
        await hookManager.registerHook(1, 0, wallet.address);
      }
      
      const wallet = ethers.Wallet.createRandom();
      await expect(
        hookManager.registerHook(1, 0, wallet.address)
      ).to.be.revertedWith("Max hooks reached");
    });

    it("Should only allow owner to register hooks", async function () {
      const { hookManager, addr1, addr2 } = await loadFixture(deployFixture);
      
      await expect(
        hookManager.connect(addr1).registerHook(1, 0, addr2.address)
      ).to.be.reverted;
    });
  });

  describe("Hook Removal", function () {
    it("Should remove a hook", async function () {
      const { hookManager, addr1 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address);
      await hookManager.removeHook(1, 0, addr1.address);
      
      const hooks = await hookManager.getHooks(1, 0);
      expect(hooks.length).to.equal(0);
    });

    it("Should clear all hooks", async function () {
      const { hookManager, addr1, addr2 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address);
      await hookManager.registerHook(1, 0, addr2.address);
      await hookManager.clearHooks(1, 0);
      
      const hooks = await hookManager.getHooks(1, 0);
      expect(hooks.length).to.equal(0);
    });
  });

  describe("Gas Limit Management", function () {
    it("Should update hook gas limit", async function () {
      const { hookManager } = await loadFixture(deployFixture);
      
      await hookManager.updateHookGasLimit(200000);
      expect(await hookManager.hookGasLimit()).to.equal(200000);
    });

    it("Should reject zero gas limit", async function () {
      const { hookManager } = await loadFixture(deployFixture);
      
      await expect(
        hookManager.updateHookGasLimit(0)
      ).to.be.revertedWith("Gas limit must be positive");
    });
  });

  describe("Hook Counts", function () {
    it("Should return correct hook count", async function () {
      const { hookManager, addr1, addr2 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address);
      await hookManager.registerHook(1, 0, addr2.address);
      
      expect(await hookManager.getHookCount(1, 0)).to.equal(2);
    });

    it("Should return zero for no hooks", async function () {
      const { hookManager } = await loadFixture(deployFixture);
      
      expect(await hookManager.getHookCount(1, 0)).to.equal(0);
    });
  });

  describe("Hook Types", function () {
    it("Should distinguish between pre and post hooks", async function () {
      const { hookManager, addr1, addr2 } = await loadFixture(deployFixture);
      
      await hookManager.registerHook(1, 0, addr1.address); // PRE
      await hookManager.registerHook(1, 1, addr2.address); // POST
      
      const preHooks = await hookManager.getHooks(1, 0);
      const postHooks = await hookManager.getHooks(1, 1);
      
      expect(preHooks.length).to.equal(1);
      expect(postHooks.length).to.equal(1);
      expect(preHooks[0]).to.equal(addr1.address);
      expect(postHooks[0]).to.equal(addr2.address);
    });
  });
});

