/**
 * Validation functions for DSL
 */

import { WorkflowDefinition } from './types';
import { getUnreachableStates, detectCycles } from './utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for cycles
  const transitions = workflow.transitions.map(t => ({ from: t.from, to: t.to }));
  const states = workflow.states.map(s => s.name);
  
  if (detectCycles(states, transitions)) {
    warnings.push("Workflow contains cycles - ensure this is intentional");
  }

  // Check for unreachable states
  const unreachable = getUnreachableStates(workflow.initialState, states, transitions);
  unreachable.forEach(state => {
    warnings.push(`State "${state}" is unreachable from initial state`);
  });

  // Validate transition IDs are unique
  const ids = new Set<number>();
  workflow.transitions.forEach(t => {
    if (ids.has(t.id)) {
      errors.push(`Duplicate transition ID: ${t.id}`);
    }
    ids.add(t.id);
  });

  // Validate roles exist
  const roleNames = new Set(workflow.roles?.map(r => r.name) || []);
  workflow.transitions.forEach(t => {
    if (t.requiredRole && !roleNames.has(t.requiredRole)) {
      errors.push(`Transition ${t.id} references undefined role: ${t.requiredRole}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

