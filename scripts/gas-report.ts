import { ethers } from "hardhat";

async function main() {
  console.log("Generating gas usage report...\n");

  const contracts = [
    "StateMachine",
    "TransitionRules",
    "StorageController",
    "AccessRegistry",
    "HookManager",
    "ForgeRegistry",
    "PauseControl",
  ];

  console.log("Contract Deployment Costs:\n");
  console.log("| Contract | Gas Used |");
  console.log("|----------|----------|");

  for (const contractName of contracts) {
    const Factory = await ethers.getContractFactory(contractName);
    const deployTx = Factory.getDeployTransaction();
    const estimatedGas = await ethers.provider.estimateGas(deployTx);
    console.log(`| ${contractName} | ${estimatedGas.toString()} |`);
  }

  console.log("\nReport generation complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

