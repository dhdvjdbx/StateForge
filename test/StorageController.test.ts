import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StorageController", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const StorageController = await ethers.getContractFactory("StorageController");
    const storageController = await StorageController.deploy();
    await storageController.initialize();

    const STATE_A = ethers.id("STATE_A");
    const STATE_B = ethers.id("STATE_B");
    const STATE_C = ethers.id("STATE_C");

    return { storageController, owner, addr1, addr2, STATE_A, STATE_B, STATE_C };
  }

  describe("Deployment", function () {
    it("Should deploy and initialize successfully", async function () {
      const { storageController, owner } = await loadFixture(deployFixture);
      expect(await storageController.owner()).to.equal(owner.address);
    });
  });

  describe("State Registration", function () {
    it("Should register a new state", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      expect(await storageController.stateExists(STATE_A)).to.equal(true);
    });

    it("Should emit StateRegistered event", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await expect(storageController.registerState(STATE_A))
        .to.emit(storageController, "StateRegistered")
        .withArgs(STATE_A);
    });

    it("Should reject duplicate state registration", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await expect(storageController.registerState(STATE_A))
        .to.be.revertedWith("State already exists");
    });

    it("Should only allow owner to register states", async function () {
      const { storageController, addr1, STATE_A } = await loadFixture(deployFixture);
      
      await expect(
        storageController.connect(addr1).registerState(STATE_A)
      ).to.be.reverted;
    });
  });

  describe("Transition Management", function () {
    it("Should add transition between states", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      await storageController.addTransition(STATE_A, STATE_B);
      
      expect(await storageController.isTransitionAllowed(STATE_A, STATE_B)).to.equal(true);
    });

    it("Should emit TransitionMappingAdded event", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      
      await expect(storageController.addTransition(STATE_A, STATE_B))
        .to.emit(storageController, "TransitionMappingAdded")
        .withArgs(STATE_A, STATE_B);
    });

    it("Should reject transition with non-existent from state", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_B);
      
      await expect(storageController.addTransition(STATE_A, STATE_B))
        .to.be.revertedWith("From state does not exist");
    });

    it("Should reject transition with non-existent to state", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      
      await expect(storageController.addTransition(STATE_A, STATE_B))
        .to.be.revertedWith("To state does not exist");
    });

    it("Should return false for disallowed transition", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      
      expect(await storageController.isTransitionAllowed(STATE_A, STATE_B)).to.equal(false);
    });

    it("Should get all allowed transitions from a state", async function () {
      const { storageController, STATE_A, STATE_B, STATE_C } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      await storageController.registerState(STATE_C);
      
      await storageController.addTransition(STATE_A, STATE_B);
      await storageController.addTransition(STATE_A, STATE_C);
      
      const transitions = await storageController.getAllowedTransitions(STATE_A);
      expect(transitions.length).to.equal(2);
      expect(transitions[0]).to.equal(STATE_B);
      expect(transitions[1]).to.equal(STATE_C);
    });
  });

  describe("State Management", function () {
    it("Should set current state", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.setCurrentState(STATE_A);
      
      expect(await storageController.getCurrentState()).to.equal(STATE_A);
    });

    it("Should increment nonce on state change", async function () {
      const { storageController, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      
      const nonceBefore = await storageController.getNonce();
      await storageController.setCurrentState(STATE_A);
      const nonceAfter = await storageController.getNonce();
      
      expect(nonceAfter).to.equal(nonceBefore + 1n);
    });

    it("Should update last transition time", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.setCurrentState(STATE_A);
      
      const lastTime = await storageController.getLastTransitionTime();
      expect(lastTime).to.be.gt(0);
    });

    it("Should reject setting non-existent state", async function () {
      const { storageController, STATE_A } = await loadFixture(deployFixture);
      
      await expect(storageController.setCurrentState(STATE_A))
        .to.be.revertedWith("State does not exist");
    });
  });

  describe("History Recording", function () {
    it("Should record transition history", async function () {
      const { storageController, owner, STATE_A, STATE_B } = await loadFixture(deployFixture);
      
      await storageController.registerState(STATE_A);
      await storageController.registerState(STATE_B);
      
      await storageController.recordTransition(STATE_A, STATE_B, owner.address, 1);
      
      const history = await storageController.getHistory(0);
      expect(history.fromState).to.equal(STATE_A);
      expect(history.toState).to.equal(STATE_B);
      expect(history.actor).to.equal(owner.address);
      expect(history.transitionId).to.equal(1);
    });
  });
});

