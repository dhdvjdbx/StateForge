import { ethers } from "hardhat";

async function main() {
  console.log("Setting up local development environment...\n");

  const [owner] = await ethers.getSigners();
  console.log("Account:", owner.address);

  // Deploy core contracts
  console.log("\n1. Deploying contracts...");
  
  const StorageController = await ethers.getContractFactory("StorageController");
  const storageController = await StorageController.deploy();
  await storageController.waitForDeployment();
  await storageController.initialize();
  console.log("✓ StorageController deployed");

  const TransitionRules = await ethers.getContractFactory("TransitionRules");
  const transitionRules = await TransitionRules.deploy();
  await transitionRules.waitForDeployment();
  console.log("✓ TransitionRules deployed");

  const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
  const accessRegistry = await AccessRegistry.deploy();
  await accessRegistry.waitForDeployment();
  console.log("✓ AccessRegistry deployed");

  const HookManager = await ethers.getContractFactory("HookManager");
  const hookManager = await HookManager.deploy();
  await hookManager.waitForDeployment();
  console.log("✓ HookManager deployed");

  const StateMachine = await ethers.getContractFactory("StateMachine");
  const stateMachine = await StateMachine.deploy(
    await storageController.getAddress(),
    await transitionRules.getAddress(),
    await accessRegistry.getAddress(),
    await hookManager.getAddress()
  );
  await stateMachine.waitForDeployment();
  console.log("✓ StateMachine deployed");

  // Setup example states
  console.log("\n2. Setting up example states...");
  const STATE_A = ethers.id("INITIAL");
  const STATE_B = ethers.id("ACTIVE");
  const STATE_C = ethers.id("COMPLETED");

  await storageController.registerState(STATE_A);
  await storageController.registerState(STATE_B);
  await storageController.registerState(STATE_C);
  console.log("✓ States registered");

  await storageController.addTransition(STATE_A, STATE_B);
  await storageController.addTransition(STATE_B, STATE_C);
  console.log("✓ Transitions configured");

  await storageController.transferOwnership(await stateMachine.getAddress());
  await hookManager.transferOwnership(await stateMachine.getAddress());
  console.log("✓ Ownership transferred");

  await stateMachine.registerStateTransition(STATE_A, 1);
  await stateMachine.registerStateTransition(STATE_B, 2);
  console.log("✓ State transitions registered");

  await stateMachine.initialize(STATE_A);
  console.log("✓ State machine initialized");

  console.log("\n3. Environment ready!");
  console.log("\nContract Addresses:");
  console.log("StateMachine:", await stateMachine.getAddress());
  console.log("StorageController:", await storageController.getAddress());
  console.log("TransitionRules:", await transitionRules.getAddress());
  console.log("AccessRegistry:", await accessRegistry.getAddress());
  console.log("HookManager:", await hookManager.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

