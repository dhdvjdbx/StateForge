import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PauseControl", function () {
  async function deployFixture() {
    const [owner, guardian, addr1] = await ethers.getSigners();
    const PauseControl = await ethers.getContractFactory("PauseControl");
    const pauseControl = await PauseControl.deploy();
    return { pauseControl, owner, guardian, addr1 };
  }

  describe("Pause/Unpause", function () {
    it("Should pause when called by owner", async function () {
      const { pauseControl } = await loadFixture(deployFixture);
      await pauseControl.pause();
      expect(await pauseControl.paused()).to.equal(true);
    });

    it("Should unpause when called by owner", async function () {
      const { pauseControl } = await loadFixture(deployFixture);
      await pauseControl.pause();
      await pauseControl.unpause();
      expect(await pauseControl.paused()).to.equal(false);
    });

    it("Should allow guardian to pause", async function () {
      const { pauseControl, guardian } = await loadFixture(deployFixture);
      await pauseControl.addGuardian(guardian.address);
      await pauseControl.connect(guardian).pause();
      expect(await pauseControl.paused()).to.equal(true);
    });
  });

  describe("Guardian Management", function () {
    it("Should add guardian", async function () {
      const { pauseControl, guardian } = await loadFixture(deployFixture);
      await pauseControl.addGuardian(guardian.address);
      expect(await pauseControl.isGuardian(guardian.address)).to.equal(true);
    });

    it("Should remove guardian", async function () {
      const { pauseControl, guardian } = await loadFixture(deployFixture);
      await pauseControl.addGuardian(guardian.address);
      await pauseControl.removeGuardian(guardian.address);
      expect(await pauseControl.isGuardian(guardian.address)).to.equal(false);
    });
  });
});

