import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Integration Tests", function () {
  async function deployFullSystemFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy all contracts
    const StorageController = await ethers.getContractFactory("StorageController");
    const storageController = await StorageController.deploy();
    await storageController.initialize();

    const TransitionRules = await ethers.getContractFactory("TransitionRules");
    const transitionRules = await TransitionRules.deploy();

    const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
    const accessRegistry = await AccessRegistry.deploy();

    const HookManager = await ethers.getContractFactory("HookManager");
    const hookManager = await HookManager.deploy();

    const StateMachine = await ethers.getContractFactory("StateMachine");
    const stateMachine = await StateMachine.deploy(
      await storageController.getAddress(),
      await transitionRules.getAddress(),
      await accessRegistry.getAddress(),
      await hookManager.getAddress()
    );

    // Setup workflow
    const STATE_A = ethers.id("STATE_A");
    const STATE_B = ethers.id("STATE_B");

    await storageController.registerState(STATE_A);
    await storageController.registerState(STATE_B);
    await storageController.addTransition(STATE_A, STATE_B);
    await storageController.transferOwnership(await stateMachine.getAddress());
    await hookManager.transferOwnership(await stateMachine.getAddress());
    await stateMachine.registerStateTransition(STATE_A, 1);
    await stateMachine.initialize(STATE_A);

    return {
      stateMachine,
      storageController,
      transitionRules,
      accessRegistry,
      hookManager,
      owner,
      user1,
      user2,
      STATE_A,
      STATE_B
    };
  }

  it("Should execute complete workflow", async function () {
    const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFullSystemFixture);
    
    expect(await stateMachine.getCurrentState()).to.equal(STATE_A);
    await stateMachine.transitionTo(STATE_B, 1, "0x");
    expect(await stateMachine.getCurrentState()).to.equal(STATE_B);
  });

  it("Should respect access control", async function () {
    const { stateMachine, accessRegistry, user1, STATE_B } = await loadFixture(deployFullSystemFixture);
    
    const ROLE = ethers.id("OPERATOR");
    await accessRegistry.setTransitionRole(1, ROLE);
    
    await expect(
      stateMachine.connect(user1).transitionTo(STATE_B, 1, "0x")
    ).to.be.revertedWith("Caller not authorized for this transition");
    
    await accessRegistry.assignRole(user1.address, ROLE);
    await expect(
      stateMachine.connect(user1).transitionTo(STATE_B, 1, "0x")
    ).to.not.be.reverted;
  });
});

