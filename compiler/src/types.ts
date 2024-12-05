/**
 * Type definitions for StateForge DSL
 */

export interface StateDefinition {
  name: string;
  description?: string;
  onEnter?: string;
  onExit?: string;
}

export interface TransitionDefinition {
  id: number;
  from: string;
  to: string;
  name: string;
  guard?: GuardDefinition;
  hooks?: HookDefinition[];
  requiredRole?: string;
}

export interface GuardDefinition {
  type: 'signature' | 'oracle' | 'timelock' | 'zkproof' | 'custom';
  validator?: string;
  parameter?: number;
}

export interface HookDefinition {
  type: 'pre' | 'post';
  contract: string;
}

export interface WorkflowDefinition {
  name: string;
  version: string;
  initialState: string;
  states: StateDefinition[];
  transitions: TransitionDefinition[];
  roles?: RoleDefinition[];
  metadata?: Record<string, any>;
}

export interface RoleDefinition {
  name: string;
  description: string;
}

export interface CompilerOptions {
  outputDir: string;
  optimize?: boolean;
  solcVersion?: string;
}

export interface CompilationResult {
  success: boolean;
  contracts?: {
    stateMachine: string;
    transitionRules: string;
    storageController: string;
    accessRegistry: string;
    hookManager: string;
  };
  errors?: string[];
  warnings?: string[];
  dslHash?: string;
}

