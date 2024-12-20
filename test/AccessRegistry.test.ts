import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AccessRegistry", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
    const accessRegistry = await AccessRegistry.deploy();

    const ROLE_A = ethers.id("ROLE_A");
    const ROLE_B = ethers.id("ROLE_B");

    return { accessRegistry, owner, addr1, addr2, ROLE_A, ROLE_B };
  }

  describe("Role Management", function () {
    it("Should assign role to account", async function () {
      const { accessRegistry, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.assignRole(addr1.address, ROLE_A);
      expect(await accessRegistry.hasRole(addr1.address, ROLE_A)).to.equal(true);
    });

    it("Should emit RoleAssigned event", async function () {
      const { accessRegistry, owner, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await expect(accessRegistry.assignRole(addr1.address, ROLE_A))
        .to.emit(accessRegistry, "RoleAssigned")
        .withArgs(addr1.address, ROLE_A, owner.address);
    });

    it("Should revoke role from account", async function () {
      const { accessRegistry, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.assignRole(addr1.address, ROLE_A);
      await accessRegistry.revokeRole(addr1.address, ROLE_A);
      
      expect(await accessRegistry.hasRole(addr1.address, ROLE_A)).to.equal(false);
    });

    it("Should emit RoleRevoked event", async function () {
      const { accessRegistry, owner, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.assignRole(addr1.address, ROLE_A);
      
      await expect(accessRegistry.revokeRole(addr1.address, ROLE_A))
        .to.emit(accessRegistry, "RoleRevoked")
        .withArgs(addr1.address, ROLE_A, owner.address);
    });

    it("Should reject unauthorized role assignment", async function () {
      const { accessRegistry, addr1, addr2, ROLE_A } = await loadFixture(deployFixture);
      
      await expect(
        accessRegistry.connect(addr1).assignRole(addr2.address, ROLE_A)
      ).to.be.reverted;
    });
  });

  describe("Transition Authorization", function () {
    it("Should set transition role", async function () {
      const { accessRegistry, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.setTransitionRole(1, ROLE_A);
      expect(await accessRegistry.getTransitionRole(1)).to.equal(ROLE_A);
    });

    it("Should allow execution if role is assigned", async function () {
      const { accessRegistry, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.setTransitionRole(1, ROLE_A);
      await accessRegistry.assignRole(addr1.address, ROLE_A);
      
      expect(await accessRegistry.canExecuteTransition(addr1.address, 1)).to.equal(true);
    });

    it("Should deny execution if role is not assigned", async function () {
      const { accessRegistry, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.setTransitionRole(1, ROLE_A);
      
      expect(await accessRegistry.canExecuteTransition(addr1.address, 1)).to.equal(false);
    });

    it("Should allow execution if no role is required", async function () {
      const { accessRegistry, addr1 } = await loadFixture(deployFixture);
      
      expect(await accessRegistry.canExecuteTransition(addr1.address, 1)).to.equal(true);
    });
  });

  describe("Batch Operations", function () {
    it("Should batch assign roles", async function () {
      const { accessRegistry, addr1, addr2, ROLE_A, ROLE_B } = await loadFixture(deployFixture);
      
      await accessRegistry.batchAssignRoles(
        [addr1.address, addr2.address],
        [ROLE_A, ROLE_B]
      );
      
      expect(await accessRegistry.hasRole(addr1.address, ROLE_A)).to.equal(true);
      expect(await accessRegistry.hasRole(addr2.address, ROLE_B)).to.equal(true);
    });

    it("Should reject batch with mismatched arrays", async function () {
      const { accessRegistry, addr1, ROLE_A } = await loadFixture(deployFixture);
      
      await expect(
        accessRegistry.batchAssignRoles([addr1.address], [ROLE_A, ROLE_A])
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Role Descriptions", function () {
    it("Should set and get role description", async function () {
      const { accessRegistry, ROLE_A } = await loadFixture(deployFixture);
      
      await accessRegistry.setRoleDescription(ROLE_A, "Test Role");
      expect(await accessRegistry.getRoleDescription(ROLE_A)).to.equal("Test Role");
    });
  });

  describe("HasAnyRole", function () {
    it("Should return true if account has any of the roles", async function () {
      const { accessRegistry, addr1, ROLE_A, ROLE_B } = await loadFixture(deployFixture);
      
      await accessRegistry.assignRole(addr1.address, ROLE_A);
      
      expect(await accessRegistry.hasAnyRole(addr1.address, [ROLE_A, ROLE_B])).to.equal(true);
    });

    it("Should return false if account has none of the roles", async function () {
      const { accessRegistry, addr1, ROLE_A, ROLE_B } = await loadFixture(deployFixture);
      
      expect(await accessRegistry.hasAnyRole(addr1.address, [ROLE_A, ROLE_B])).to.equal(false);
    });
  });
});

