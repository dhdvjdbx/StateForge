# StateForge Architecture

## System Overview

StateForge provides a complete framework for building finite state machine-based workflows on EVM-compatible blockchains. The system is divided into two main components:

1. **Off-chain Compiler** - Parses DSL and generates deployment configurations
2. **On-chain Contracts** - Execute state machines with validation and access control

## Component Architecture

### Core Smart Contracts

```
┌─────────────────────────────────────────────────────────┐
│                    StateMachine                         │
│  - Transition routing                                   │
│  - State validation                                     │
│  - Event emission                                       │
└────────┬────────────────────────────────────┬──────────┘
         │                                    │
    ┌────▼────────┐                     ┌────▼────────┐
    │ AccessRegistry│                   │ HookManager │
    │ - RBAC        │                   │ - Pre hooks │
    │ - Roles       │                   │ - Post hooks│
    └───────────────┘                   └─────────────┘
         │                                    │
    ┌────▼────────────┐              ┌───────▼─────────┐
    │TransitionRules  │              │StorageController│
    │- Signatures     │              │- State storage  │
    │- Timelocks      │              │- History        │
    │- Oracles        │              │- Transitions    │
    └─────────────────┘              └─────────────────┘
```

### Data Flow

1. **Transition Request** → StateMachine receives request
2. **Permission Check** → AccessRegistry validates caller role
3. **Rule Validation** → TransitionRules validates conditions
4. **Pre Hooks** → HookManager executes pre-transition hooks
5. **State Update** → StorageController updates state
6. **Post Hooks** → HookManager executes post-transition hooks
7. **Event Emission** → StateChanged event emitted

### Storage Pattern

StateForge uses EIP-1967 storage slots for upgrade safety:

```solidity
bytes32 STORAGE_SLOT = keccak256("stateforge.storage.statedata");
```

This enables:
- Upgrade-safe storage layout
- No storage collision
- Clean separation of concerns

## Security Model

### Access Control

- **Role-Based** - Each transition can require specific roles
- **Hierarchical** - Roles can have admin roles
- **Flexible** - Batch operations for efficiency

### Validation Layers

1. **Structural** - Is transition registered?
2. **Permission** - Does caller have required role?
3. **Rule** - Does transition satisfy guard conditions?
4. **Hooks** - Do all hooks execute successfully?

### Emergency Controls

- **Pause** - Circuit breaker for emergency stop
- **Guardians** - Multiple addresses can pause
- **Owner** - Only owner can unpause

## Compiler Architecture

### Parser

- Supports YAML and JSON DSL formats
- Validates state graph structure
- Detects unreachable states
- Checks transition consistency

### Code Generator

Generates:
- Deployment configuration JSON
- Initialization scripts
- TypeScript types
- Test templates
- Workflow documentation
- State graph (GraphViz format)

### Validation

- **Syntax** - DSL structure validation
- **Semantics** - State reachability analysis
- **Consistency** - Transition target validation

## Extensibility

### Custom Guards

Implement custom validation logic:

```solidity
interface ICustomValidator {
    function validateTransition(
        address actor,
        bytes calldata data
    ) external view returns (bool);
}
```

### Hooks

Implement custom actions:

```solidity
interface ITransitionHook {
    function onTransition(
        address actor,
        bytes calldata data
    ) external;
}
```

### Oracle Integration

Connect to external data sources:

```solidity
interface IOracle {
    function validate(bytes calldata data) 
        external view returns (bool);
}
```

## Gas Optimization

- Struct packing for storage efficiency
- Minimal SLOAD operations
- Batch operations where possible
- Hook gas limits to prevent griefing

## Upgrade Strategy

### UUPS Pattern

- Storage in separate controller
- Logic upgradeable via proxy
- Governed by multisig + timelock
- Backward compatible state layout

### Diamond Pattern Support

- Facets for modular functionality
- Shared storage
- Selective upgrades

## Testing Strategy

- Unit tests for each contract
- Integration tests for workflows
- Simulation tests for complex FSMs
- Gas usage benchmarking
- Security audit preparation

## Deployment Process

1. Deploy core contracts
2. Configure initial roles
3. Register workflow in ForgeRegistry
4. Initialize state machine
5. Verify on block explorer
6. Monitor via events/subgraph

