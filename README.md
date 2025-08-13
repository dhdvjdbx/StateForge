# StateForge

On-Chain Finite State Machine (FSM) Compiler Protocol

## Overview

StateForge is a smart contract framework that compiles finite state machines (FSM) into modular, upgradeable Solidity contracts. It provides a DSL to define workflows and a compiler that transforms state definitions into executable on-chain logic.

## Features

- **FSM DSL** → Auto-generated Solidity smart contracts
- **State Lifecycle** with on-chain validation
- **Role-Based Access Control (RBAC)** for transitions
- **Pluggable Transition Guards** (ZK proof / oracle conditions / signature checks)
- **Event-Driven State Hooks** (preTransition/postTransition)
- **Upgradeable Workflows** without breaking state history

## Use Cases

- DAO lifecycles
- NFT evolution
- Multi-step DeFi strategies
- Programmable governance flows

## Architecture

```
[Developer / DSL Config]
         │
         ▼
[ForgeCompiler (off-chain)]
         │
         ▼
[StateMachine.sol + TransitionRules.sol + Storage.sol]
         │
         ▼
[Application / DAO / NFT / Strategy]
```

## Smart Contract Modules

### Core Contracts

- **StateMachine.sol** - Core FSM execution and transition routing
- **TransitionRules.sol** - Validates transition rules (signatures, timelocks, oracles)
- **StorageController.sol** - Persistent state storage with upgrade-safe layout
- **AccessRegistry.sol** - Role-based access control for transitions
- **HookManager.sol** - Pre/post transition hook management
- **ForgeRegistry.sol** - Workflow registration and metadata
- **PauseControl.sol** - Emergency circuit breaker

## Installation

```bash
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
npm test
```

## Deploy

```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

## DSL Example

See `examples/dao-workflow.yaml` for a complete workflow definition:

```yaml
name: SimpleDAO
version: "1.0.0"
initialState: INITIAL

states:
  - name: INITIAL
  - name: PROPOSAL
  - name: VOTING
  - name: EXECUTION
  - name: COMPLETED

transitions:
  - id: 1
    name: "Submit Proposal"
    from: INITIAL
    to: PROPOSAL
    requiredRole: PROPOSER_ROLE
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [DSL Reference](docs/DSL_REFERENCE.md)
- [API Documentation](docs/API.md)
- [Security Considerations](docs/SECURITY.md)

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License

# Update 1
