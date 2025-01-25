/**
 * Utility functions for StateForge compiler
 */

import crypto from 'crypto';

/**
 * Calculate keccak256 hash (compatible with Solidity)
 */
export function keccak256(data: string): string {
  const hash = crypto.createHash('sha3-256');
  hash.update(data);
  return '0x' + hash.digest('hex');
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Format state name to bytes32 identifier
 */
export function stateToBytes32(stateName: string): string {
  return keccak256(stateName);
}

/**
 * Format role name to bytes32 identifier
 */
export function roleToBytes32(roleName: string): string {
  return keccak256(roleName);
}

/**
 * Validate transition graph for cycles
 */
export function detectCycles(
  states: string[],
  transitions: Array<{ from: string; to: string }>
): boolean {
  const graph: Map<string, string[]> = new Map();
  
  // Build adjacency list
  states.forEach(state => graph.set(state, []));
  transitions.forEach(({ from, to }) => {
    graph.get(from)?.push(to);
  });
  
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }
    
    recStack.delete(node);
    return false;
  }
  
  for (const state of states) {
    if (hasCycle(state)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get terminal states (no outgoing transitions)
 */
export function getTerminalStates(
  states: string[],
  transitions: Array<{ from: string; to: string }>
): string[] {
  const statesWithOutgoing = new Set(transitions.map(t => t.from));
  return states.filter(state => !statesWithOutgoing.has(state));
}

/**
 * Validate state reachability from initial state
 */
export function getUnreachableStates(
  initialState: string,
  states: string[],
  transitions: Array<{ from: string; to: string }>
): string[] {
  const reachable = new Set<string>([initialState]);
  let changed = true;
  
  while (changed) {
    changed = false;
    for (const { from, to } of transitions) {
      if (reachable.has(from) && !reachable.has(to)) {
        reachable.add(to);
        changed = true;
      }
    }
  }
  
  return states.filter(state => !reachable.has(state));
}

/**
 * Generate random hex string
 */
export function randomHex(bytes: number = 32): string {
  return '0x' + crypto.randomBytes(bytes).toString('hex');
}

/**
 * Estimate gas for workflow deployment
 */
export function estimateDeploymentGas(
  stateCount: number,
  transitionCount: number,
  hookCount: number
): number {
  // Rough estimation based on contract complexity
  const baseGas = 3000000;
  const perState = 50000;
  const perTransition = 100000;
  const perHook = 50000;
  
  return baseGas + (stateCount * perState) + (transitionCount * perTransition) + (hookCount * perHook);
}

