import { WorkflowDefinition, TransitionDefinition, StateDefinition } from './types';

/**
 * Code generator for Solidity contracts from DSL
 */
export class CodeGenerator {
  /**
   * Generate deployment configuration
   */
  static generateDeploymentConfig(workflow: WorkflowDefinition): string {
    const states = workflow.states.map(s => `"${s.name}"`).join(', ');
    const transitions = workflow.transitions.map(t => ({
      id: t.id,
      from: t.from,
      to: t.to,
      name: t.name
    }));

    return JSON.stringify({
      name: workflow.name,
      version: workflow.version,
      initialState: workflow.initialState,
      states: workflow.states.map(s => s.name),
      transitions: transitions,
      roles: workflow.roles || []
    }, null, 2);
  }

  /**
   * Generate initialization script
   */
  static generateInitScript(workflow: WorkflowDefinition): string {
    let script = `import { ethers } from "hardhat";\n\n`;
    script += `async function main() {\n`;
    script += `  console.log("Initializing ${workflow.name} workflow...");\n\n`;
    
    script += `  // Get deployed contracts\n`;
    script += `  const stateMachine = await ethers.getContractAt("StateMachine", process.env.STATE_MACHINE_ADDRESS!);\n`;
    script += `  const storageController = await ethers.getContractAt("StorageController", process.env.STORAGE_CONTROLLER_ADDRESS!);\n`;
    script += `  const transitionRules = await ethers.getContractAt("TransitionRules", process.env.TRANSITION_RULES_ADDRESS!);\n`;
    script += `  const accessRegistry = await ethers.getContractAt("AccessRegistry", process.env.ACCESS_REGISTRY_ADDRESS!);\n\n`;

    // Register states
    script += `  // Register states\n`;
    workflow.states.forEach(state => {
      script += `  await storageController.registerState(ethers.id("${state.name}"));\n`;
    });
    script += `\n`;

    // Register transitions
    script += `  // Register transitions\n`;
    workflow.transitions.forEach(transition => {
      script += `  await storageController.addTransition(ethers.id("${transition.from}"), ethers.id("${transition.to}"));\n`;
      script += `  await stateMachine.registerStateTransition(ethers.id("${transition.from}"), ${transition.id});\n`;
    });
    script += `\n`;

    // Set up roles
    if (workflow.roles && workflow.roles.length > 0) {
      script += `  // Set up roles\n`;
      workflow.transitions.forEach(transition => {
        if (transition.requiredRole) {
          script += `  await accessRegistry.setTransitionRole(${transition.id}, ethers.id("${transition.requiredRole}"));\n`;
        }
      });
      script += `\n`;
    }

    // Initialize state machine
    script += `  // Initialize state machine\n`;
    script += `  await stateMachine.initialize(ethers.id("${workflow.initialState}"));\n\n`;
    
    script += `  console.log("Workflow initialized successfully!");\n`;
    script += `}\n\n`;
    script += `main().catch((error) => {\n`;
    script += `  console.error(error);\n`;
    script += `  process.exitCode = 1;\n`;
    script += `});\n`;

    return script;
  }

  /**
   * Generate TypeScript types for the workflow
   */
  static generateTypes(workflow: WorkflowDefinition): string {
    let types = `/**\n * Generated types for ${workflow.name} workflow\n */\n\n`;
    
    // State enum
    types += `export enum State {\n`;
    workflow.states.forEach(state => {
      types += `  ${state.name.toUpperCase()} = "${state.name}",\n`;
    });
    types += `}\n\n`;

    // Transition enum
    types += `export enum TransitionId {\n`;
    workflow.transitions.forEach(transition => {
      const enumName = transition.name.toUpperCase().replace(/\s+/g, '_');
      types += `  ${enumName} = ${transition.id},\n`;
    });
    types += `}\n\n`;

    // Workflow interface
    types += `export interface WorkflowInfo {\n`;
    types += `  name: string;\n`;
    types += `  version: string;\n`;
    types += `  currentState: State;\n`;
    types += `  availableTransitions: TransitionId[];\n`;
    types += `}\n\n`;

    return types;
  }

  /**
   * Generate README for the workflow
   */
  static generateWorkflowReadme(workflow: WorkflowDefinition): string {
    let readme = `# ${workflow.name} Workflow\n\n`;
    readme += `Version: ${workflow.version}\n\n`;
    
    if (workflow.metadata?.description) {
      readme += `## Description\n\n${workflow.metadata.description}\n\n`;
    }

    readme += `## States\n\n`;
    readme += `| State | Description |\n`;
    readme += `|-------|-------------|\n`;
    workflow.states.forEach(state => {
      readme += `| ${state.name} | ${state.description || '-'} |\n`;
    });
    readme += `\n`;

    readme += `## Transitions\n\n`;
    readme += `| ID | Name | From | To | Required Role |\n`;
    readme += `|----|------|------|----|--------------|\n`;
    workflow.transitions.forEach(transition => {
      readme += `| ${transition.id} | ${transition.name} | ${transition.from} | ${transition.to} | ${transition.requiredRole || 'None'} |\n`;
    });
    readme += `\n`;

    readme += `## State Flow\n\n`;
    readme += `\`\`\`\n`;
    readme += `Initial State: ${workflow.initialState}\n`;
    readme += `\`\`\`\n\n`;

    if (workflow.roles && workflow.roles.length > 0) {
      readme += `## Roles\n\n`;
      workflow.roles.forEach(role => {
        readme += `- **${role.name}**: ${role.description}\n`;
      });
      readme += `\n`;
    }

    return readme;
  }

  /**
   * Generate test template
   */
  static generateTestTemplate(workflow: WorkflowDefinition): string {
    let test = `import { expect } from "chai";\n`;
    test += `import { ethers } from "hardhat";\n`;
    test += `import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";\n\n`;
    
    test += `describe("${workflow.name} Workflow", function () {\n`;
    test += `  async function deployFixture() {\n`;
    test += `    const [owner, addr1, addr2] = await ethers.getSigners();\n\n`;
    
    test += `    // Deploy contracts\n`;
    test += `    const StorageController = await ethers.getContractFactory("StorageController");\n`;
    test += `    const storageController = await StorageController.deploy();\n`;
    test += `    await storageController.initialize();\n\n`;
    
    test += `    const TransitionRules = await ethers.getContractFactory("TransitionRules");\n`;
    test += `    const transitionRules = await TransitionRules.deploy();\n\n`;
    
    test += `    const AccessRegistry = await ethers.getContractFactory("AccessRegistry");\n`;
    test += `    const accessRegistry = await AccessRegistry.deploy();\n\n`;
    
    test += `    const HookManager = await ethers.getContractFactory("HookManager");\n`;
    test += `    const hookManager = await HookManager.deploy();\n\n`;
    
    test += `    const StateMachine = await ethers.getContractFactory("StateMachine");\n`;
    test += `    const stateMachine = await StateMachine.deploy(\n`;
    test += `      await storageController.getAddress(),\n`;
    test += `      await transitionRules.getAddress(),\n`;
    test += `      await accessRegistry.getAddress(),\n`;
    test += `      await hookManager.getAddress()\n`;
    test += `    );\n\n`;
    
    test += `    // Setup workflow\n`;
    workflow.states.forEach(state => {
      test += `    await storageController.registerState(ethers.id("${state.name}"));\n`;
    });
    test += `\n`;
    
    workflow.transitions.forEach(transition => {
      test += `    await storageController.addTransition(ethers.id("${transition.from}"), ethers.id("${transition.to}"));\n`;
      test += `    await stateMachine.registerStateTransition(ethers.id("${transition.from}"), ${transition.id});\n`;
    });
    test += `\n`;
    
    test += `    await stateMachine.initialize(ethers.id("${workflow.initialState}"));\n\n`;
    
    test += `    return { stateMachine, storageController, transitionRules, accessRegistry, hookManager, owner, addr1, addr2 };\n`;
    test += `  }\n\n`;
    
    test += `  it("Should initialize with correct state", async function () {\n`;
    test += `    const { stateMachine } = await loadFixture(deployFixture);\n`;
    test += `    expect(await stateMachine.getCurrentState()).to.equal(ethers.id("${workflow.initialState}"));\n`;
    test += `  });\n\n`;
    
    // Generate test for first transition
    if (workflow.transitions.length > 0) {
      const firstTransition = workflow.transitions[0];
      test += `  it("Should execute transition: ${firstTransition.name}", async function () {\n`;
      test += `    const { stateMachine } = await loadFixture(deployFixture);\n`;
      test += `    await stateMachine.transitionTo(ethers.id("${firstTransition.to}"), ${firstTransition.id}, "0x");\n`;
      test += `    expect(await stateMachine.getCurrentState()).to.equal(ethers.id("${firstTransition.to}"));\n`;
      test += `  });\n`;
    }
    
    test += `});\n`;
    
    return test;
  }
}

