import * as yaml from 'yaml';
import { WorkflowDefinition, StateDefinition, TransitionDefinition } from './types';

/**
 * Parser for StateForge DSL
 */
export class DSLParser {
  /**
   * Parse YAML DSL into WorkflowDefinition
   */
  static parseYAML(content: string): WorkflowDefinition {
    try {
      const parsed = yaml.parse(content);
      return this.validate(parsed);
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error}`);
    }
  }

  /**
   * Parse JSON DSL into WorkflowDefinition
   */
  static parseJSON(content: string): WorkflowDefinition {
    try {
      const parsed = JSON.parse(content);
      return this.validate(parsed);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Validate workflow definition
   */
  private static validate(workflow: any): WorkflowDefinition {
    if (!workflow.name || typeof workflow.name !== 'string') {
      throw new Error('Workflow must have a name');
    }

    if (!workflow.initialState || typeof workflow.initialState !== 'string') {
      throw new Error('Workflow must have an initialState');
    }

    if (!Array.isArray(workflow.states) || workflow.states.length === 0) {
      throw new Error('Workflow must have at least one state');
    }

    if (!Array.isArray(workflow.transitions)) {
      throw new Error('Workflow must have transitions array');
    }

    // Validate states
    const stateNames = new Set<string>();
    workflow.states.forEach((state: StateDefinition) => {
      if (!state.name) {
        throw new Error('Each state must have a name');
      }
      if (stateNames.has(state.name)) {
        throw new Error(`Duplicate state name: ${state.name}`);
      }
      stateNames.add(state.name);
    });

    // Check initial state exists
    if (!stateNames.has(workflow.initialState)) {
      throw new Error(`Initial state "${workflow.initialState}" not found in states`);
    }

    // Validate transitions
    const transitionIds = new Set<number>();
    workflow.transitions.forEach((transition: TransitionDefinition) => {
      if (typeof transition.id !== 'number') {
        throw new Error('Each transition must have a numeric id');
      }
      if (transitionIds.has(transition.id)) {
        throw new Error(`Duplicate transition id: ${transition.id}`);
      }
      transitionIds.add(transition.id);

      if (!transition.from || !stateNames.has(transition.from)) {
        throw new Error(`Transition ${transition.id}: invalid from state "${transition.from}"`);
      }
      if (!transition.to || !stateNames.has(transition.to)) {
        throw new Error(`Transition ${transition.id}: invalid to state "${transition.to}"`);
      }
      if (!transition.name) {
        throw new Error(`Transition ${transition.id}: must have a name`);
      }
    });

    return workflow as WorkflowDefinition;
  }

  /**
   * Generate state graph for visualization
   */
  static generateGraph(workflow: WorkflowDefinition): string {
    let graph = 'digraph StateMachine {\n';
    graph += '  rankdir=LR;\n';
    graph += '  node [shape=circle];\n\n';

    // Add states
    workflow.states.forEach(state => {
      const label = state.description ? `${state.name}\\n${state.description}` : state.name;
      const style = state.name === workflow.initialState ? 'filled' : '';
      graph += `  "${state.name}" [label="${label}" style="${style}"];\n`;
    });

    graph += '\n';

    // Add transitions
    workflow.transitions.forEach(transition => {
      graph += `  "${transition.from}" -> "${transition.to}" [label="${transition.name}"];\n`;
    });

    graph += '}\n';
    return graph;
  }

  /**
   * Calculate hash of DSL definition
   */
  static calculateHash(workflow: WorkflowDefinition): string {
    const normalized = JSON.stringify(workflow, Object.keys(workflow).sort());
    // Simple hash function - in production, use crypto library
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

