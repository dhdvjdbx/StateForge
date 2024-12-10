import { DSLParser } from './parser';
import { CodeGenerator } from './generator';
import { WorkflowDefinition, CompilerOptions, CompilationResult } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main compiler class for StateForge
 */
export class StateForgeCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions) {
    this.options = {
      optimize: true,
      solcVersion: '0.8.20',
      ...options
    };
  }

  /**
   * Compile a workflow from DSL file
   */
  async compileFromFile(filePath: string): Promise<CompilationResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(filePath);

      let workflow: WorkflowDefinition;
      if (ext === '.yaml' || ext === '.yml') {
        workflow = DSLParser.parseYAML(content);
      } else if (ext === '.json') {
        workflow = DSLParser.parseJSON(content);
      } else {
        throw new Error('Unsupported file format. Use .yaml, .yml, or .json');
      }

      return await this.compile(workflow);
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Compile a workflow definition
   */
  async compile(workflow: WorkflowDefinition): Promise<CompilationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Calculate DSL hash
      const dslHash = DSLParser.calculateHash(workflow);

      // Create output directory
      const workflowDir = path.join(this.options.outputDir, workflow.name);
      if (!fs.existsSync(workflowDir)) {
        fs.mkdirSync(workflowDir, { recursive: true });
      }

      // Generate deployment configuration
      const deployConfig = CodeGenerator.generateDeploymentConfig(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'config.json'),
        deployConfig
      );

      // Generate initialization script
      const initScript = CodeGenerator.generateInitScript(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'initialize.ts'),
        initScript
      );

      // Generate TypeScript types
      const types = CodeGenerator.generateTypes(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'types.ts'),
        types
      );

      // Generate workflow README
      const readme = CodeGenerator.generateWorkflowReadme(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'README.md'),
        readme
      );

      // Generate test template
      const test = CodeGenerator.generateTestTemplate(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'test.ts'),
        test
      );

      // Generate state graph
      const graph = DSLParser.generateGraph(workflow);
      fs.writeFileSync(
        path.join(workflowDir, 'graph.dot'),
        graph
      );

      return {
        success: true,
        dslHash,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Validate a workflow without generating code
   */
  validate(workflow: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check for unreachable states
      const reachableStates = new Set<string>([workflow.initialState]);
      let changed = true;

      while (changed) {
        changed = false;
        workflow.transitions.forEach(transition => {
          if (reachableStates.has(transition.from) && !reachableStates.has(transition.to)) {
            reachableStates.add(transition.to);
            changed = true;
          }
        });
      }

      workflow.states.forEach(state => {
        if (!reachableStates.has(state.name)) {
          errors.push(`Unreachable state: ${state.name}`);
        }
      });

      // Check for states with no outgoing transitions (except final states)
      const statesWithOutgoing = new Set<string>();
      workflow.transitions.forEach(t => statesWithOutgoing.add(t.from));
      
      workflow.states.forEach(state => {
        if (!statesWithOutgoing.has(state.name) && state.name !== workflow.initialState) {
          // This might be intentional for final states, so it's just a warning
          // errors.push(`State "${state.name}" has no outgoing transitions`);
        }
      });

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        valid: false,
        errors
      };
    }
  }
}

export { DSLParser, CodeGenerator };
export * from './types';

