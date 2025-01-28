import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ForgeRegistry", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const ForgeRegistry = await ethers.getContractFactory("ForgeRegistry");
    const forgeRegistry = await ForgeRegistry.deploy();
    return { forgeRegistry, owner, addr1, addr2 };
  }

  describe("Workflow Registration", function () {
    it("Should register a workflow", async function () {
      const { forgeRegistry } = await loadFixture(deployFixture);
      const dslHash = ethers.id("test-workflow");
      
      await forgeRegistry.registerWorkflow(
        dslHash,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        1,
        '{"name": "test"}'
      );
      
      expect(await forgeRegistry.getTotalWorkflows()).to.equal(1);
    });

    it("Should emit WorkflowRegistered event", async function () {
      const { forgeRegistry, owner } = await loadFixture(deployFixture);
      const dslHash = ethers.id("test-workflow");
      const stateMachine = ethers.Wallet.createRandom().address;
      
      await expect(
        forgeRegistry.registerWorkflow(
          dslHash,
          stateMachine,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address,
          1,
          "{}"
        )
      ).to.emit(forgeRegistry, "WorkflowRegistered")
        .withArgs(1, dslHash, owner.address, stateMachine);
    });
  });

  describe("Workflow Retrieval", function () {
    it("Should retrieve workflow by ID", async function () {
      const { forgeRegistry } = await loadFixture(deployFixture);
      const dslHash = ethers.id("test-workflow");
      
      await forgeRegistry.registerWorkflow(
        dslHash,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        1,
        '{"name": "test"}'
      );
      
      const workflow = await forgeRegistry.getWorkflow(1);
      expect(workflow.dslHash).to.equal(dslHash);
      expect(workflow.version).to.equal(1);
    });
  });

  describe("Workflow Deactivation", function () {
    it("Should deactivate workflow", async function () {
      const { forgeRegistry } = await loadFixture(deployFixture);
      const dslHash = ethers.id("test-workflow");
      
      await forgeRegistry.registerWorkflow(
        dslHash,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        1,
        "{}"
      );
      
      await forgeRegistry.deactivateWorkflow(1);
      expect(await forgeRegistry.isWorkflowActive(1)).to.equal(false);
    });
  });
});

