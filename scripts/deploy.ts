import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StateForge contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy StorageController
  console.log("\nDeploying StorageController...");
  const StorageController = await ethers.getContractFactory("StorageController");
  const storageController = await StorageController.deploy();
  await storageController.waitForDeployment();
  const storageControllerAddress = await storageController.getAddress();
  console.log("StorageController deployed to:", storageControllerAddress);
  
  // Initialize StorageController
  await storageController.initialize();
  console.log("StorageController initialized");

  // Deploy TransitionRules
  console.log("\nDeploying TransitionRules...");
  const TransitionRules = await ethers.getContractFactory("TransitionRules");
  const transitionRules = await TransitionRules.deploy();
  await transitionRules.waitForDeployment();
  const transitionRulesAddress = await transitionRules.getAddress();
  console.log("TransitionRules deployed to:", transitionRulesAddress);

  // Deploy AccessRegistry
  console.log("\nDeploying AccessRegistry...");
  const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
  const accessRegistry = await AccessRegistry.deploy();
  await accessRegistry.waitForDeployment();
  const accessRegistryAddress = await accessRegistry.getAddress();
  console.log("AccessRegistry deployed to:", accessRegistryAddress);

  // Deploy HookManager
  console.log("\nDeploying HookManager...");
  const HookManager = await ethers.getContractFactory("HookManager");
  const hookManager = await HookManager.deploy();
  await hookManager.waitForDeployment();
  const hookManagerAddress = await hookManager.getAddress();
  console.log("HookManager deployed to:", hookManagerAddress);

  // Deploy StateMachine
  console.log("\nDeploying StateMachine...");
  const StateMachine = await ethers.getContractFactory("StateMachine");
  const stateMachine = await StateMachine.deploy(
    storageControllerAddress,
    transitionRulesAddress,
    accessRegistryAddress,
    hookManagerAddress
  );
  await stateMachine.waitForDeployment();
  const stateMachineAddress = await stateMachine.getAddress();
  console.log("StateMachine deployed to:", stateMachineAddress);

  // Transfer ownership of sub-contracts to StateMachine
  console.log("\nTransferring ownership to StateMachine...");
  await storageController.transferOwnership(stateMachineAddress);
  await hookManager.transferOwnership(stateMachineAddress);
  console.log("Ownership transferred");

  // Deploy ForgeRegistry
  console.log("\nDeploying ForgeRegistry...");
  const ForgeRegistry = await ethers.getContractFactory("ForgeRegistry");
  const forgeRegistry = await ForgeRegistry.deploy();
  await forgeRegistry.waitForDeployment();
  const forgeRegistryAddress = await forgeRegistry.getAddress();
  console.log("ForgeRegistry deployed to:", forgeRegistryAddress);

  // Deploy PauseControl
  console.log("\nDeploying PauseControl...");
  const PauseControl = await ethers.getContractFactory("PauseControl");
  const pauseControl = await PauseControl.deploy();
  await pauseControl.waitForDeployment();
  const pauseControlAddress = await pauseControl.getAddress();
  console.log("PauseControl deployed to:", pauseControlAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("StorageController:", storageControllerAddress);
  console.log("TransitionRules:", transitionRulesAddress);
  console.log("AccessRegistry:", accessRegistryAddress);
  console.log("HookManager:", hookManagerAddress);
  console.log("StateMachine:", stateMachineAddress);
  console.log("ForgeRegistry:", forgeRegistryAddress);
  console.log("PauseControl:", pauseControlAddress);

  // Save addresses to file
  const addresses = {
    storageController: storageControllerAddress,
    transitionRules: transitionRulesAddress,
    accessRegistry: accessRegistryAddress,
    hookManager: hookManagerAddress,
    stateMachine: stateMachineAddress,
    forgeRegistry: forgeRegistryAddress,
    pauseControl: pauseControlAddress
  };

  console.log("\nDeployment complete!");
  return addresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

