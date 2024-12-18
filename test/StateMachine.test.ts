import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StateMachine", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy StorageController
    const StorageController = await ethers.getContractFactory("StorageController");
    const storageController = await StorageController.deploy();
    await storageController.initialize();

    // Deploy TransitionRules
    const TransitionRules = await ethers.getContractFactory("TransitionRules");
    const transitionRules = await TransitionRules.deploy();

    // Deploy AccessRegistry
    const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
    const accessRegistry = await AccessRegistry.deploy();

    // Deploy HookManager
    const HookManager = await ethers.getContractFactory("HookManager");
    const hookManager = await HookManager.deploy();

    // Deploy StateMachine
    const StateMachine = await ethers.getContractFactory("StateMachine");
    const stateMachine = await StateMachine.deploy(
      await storageController.getAddress(),
      await transitionRules.getAddress(),
      await accessRegistry.getAddress(),
      await hookManager.getAddress()
    );

    // Transfer ownership
    await storageController.transferOwnership(await stateMachine.getAddress());
    await hookManager.transferOwnership(await stateMachine.getAddress());

    // Setup test states
    const STATE_A = ethers.id("STATE_A");
    const STATE_B = ethers.id("STATE_B");
    const STATE_C = ethers.id("STATE_C");

    await storageController.connect(owner).registerState(STATE_A);
    await storageController.connect(owner).registerState(STATE_B);
    await storageController.connect(owner).registerState(STATE_C);

    await storageController.connect(owner).addTransition(STATE_A, STATE_B);
    await storageController.connect(owner).addTransition(STATE_B, STATE_C);

    return {
      stateMachine,
      storageController,
      transitionRules,
      accessRegistry,
      hookManager,
      owner,
      addr1,
      addr2,
      STATE_A,
      STATE_B,
      STATE_C
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct addresses", async function () {
      const { stateMachine, storageController } = await loadFixture(deployFixture);
      expect(await stateMachine.storageController()).to.equal(
        await storageController.getAddress()
      );
    });

    it("Should not be initialized on deployment", async function () {
      const { stateMachine } = await loadFixture(deployFixture);
      expect(await stateMachine.isInitialized()).to.equal(false);
    });
  });

  describe("Initialization", function () {
    it("Should initialize with valid state", async function () {
      const { stateMachine, STATE_A } = await loadFixture(deployFixture);
      await stateMachine.initialize(STATE_A);
      expect(await stateMachine.isInitialized()).to.equal(true);
      expect(await stateMachine.getCurrentState()).to.equal(STATE_A);
    });

    it("Should reject double initialization", async function () {
      const { stateMachine, STATE_A } = await loadFixture(deployFixture);
      await stateMachine.initialize(STATE_A);
      await expect(stateMachine.initialize(STATE_A)).to.be.revertedWith(
        "Already initialized"
      );
    });

    it("Should reject initialization with non-existent state", async function () {
      const { stateMachine } = await loadFixture(deployFixture);
      const INVALID_STATE = ethers.id("INVALID");
      await expect(stateMachine.initialize(INVALID_STATE)).to.be.revertedWith(
        "Initial state does not exist"
      );
    });
  });

  describe("Transitions", function () {
    it("Should execute valid transition", async function () {
      const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await stateMachine.registerStateTransition(STATE_A, 1);
      await stateMachine.initialize(STATE_A);

      await expect(stateMachine.transitionTo(STATE_B, 1, "0x"))
        .to.emit(stateMachine, "StateChanged")
        .withArgs(STATE_A, STATE_B, await stateMachine.owner(), 1, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      expect(await stateMachine.getCurrentState()).to.equal(STATE_B);
    });

    it("Should reject transition before initialization", async function () {
      const { stateMachine, STATE_B } = await loadFixture(deployFixture);
      await expect(stateMachine.transitionTo(STATE_B, 1, "0x")).to.be.revertedWith(
        "State machine not initialized"
      );
    });

    it("Should reject unauthorized transition", async function () {
      const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFixture);
      await stateMachine.initialize(STATE_A);

      // Don't register the transition
      await expect(stateMachine.transitionTo(STATE_B, 1, "0x")).to.be.revertedWith(
        "Transition not allowed from current state"
      );
    });

    it("Should increment nonce on transition", async function () {
      const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await stateMachine.registerStateTransition(STATE_A, 1);
      await stateMachine.initialize(STATE_A);

      const nonceBefore = await stateMachine.getNonce();
      await stateMachine.transitionTo(STATE_B, 1, "0x");
      const nonceAfter = await stateMachine.getNonce();

      expect(nonceAfter).to.equal(nonceBefore + 1n);
    });
  });

  describe("Pause Control", function () {
    it("Should allow owner to pause", async function () {
      const { stateMachine } = await loadFixture(deployFixture);
      await stateMachine.pause();
      expect(await stateMachine.isPaused()).to.equal(true);
    });

    it("Should reject transitions when paused", async function () {
      const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await stateMachine.registerStateTransition(STATE_A, 1);
      await stateMachine.initialize(STATE_A);
      await stateMachine.pause();

      await expect(stateMachine.transitionTo(STATE_B, 1, "0x")).to.be.revertedWith(
        "State machine is paused"
      );
    });

    it("Should allow transitions after unpause", async function () {
      const { stateMachine, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await stateMachine.registerStateTransition(STATE_A, 1);
      await stateMachine.initialize(STATE_A);
      
      await stateMachine.pause();
      await stateMachine.unpause();

      await expect(stateMachine.transitionTo(STATE_B, 1, "0x"))
        .to.not.be.reverted;
    });
  });
});

