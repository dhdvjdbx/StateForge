import { run } from "hardhat";

async function main() {
  const contracts = [
    {
      name: "StorageController",
      address: process.env.STORAGE_CONTROLLER_ADDRESS,
      args: [],
    },
    {
      name: "TransitionRules",
      address: process.env.TRANSITION_RULES_ADDRESS,
      args: [],
    },
    {
      name: "AccessRegistry",
      address: process.env.ACCESS_REGISTRY_ADDRESS,
      args: [],
    },
    {
      name: "HookManager",
      address: process.env.HOOK_MANAGER_ADDRESS,
      args: [],
    },
    {
      name: "ForgeRegistry",
      address: process.env.FORGE_REGISTRY_ADDRESS,
      args: [],
    },
    {
      name: "PauseControl",
      address: process.env.PAUSE_CONTROL_ADDRESS,
      args: [],
    },
  ];

  console.log("Starting contract verification...\n");

  for (const contract of contracts) {
    if (!contract.address) {
      console.log(`Skipping ${contract.name} - no address provided`);
      continue;
    }

    try {
      console.log(`Verifying ${contract.name} at ${contract.address}...`);
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      });
      console.log(`✓ ${contract.name} verified\n`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`✓ ${contract.name} already verified\n`);
      } else {
        console.error(`✗ ${contract.name} verification failed:`);
        console.error(error.message + "\n");
      }
    }
  }

  console.log("Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

