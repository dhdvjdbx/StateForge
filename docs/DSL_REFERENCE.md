# StateForge DSL Reference

## Overview

StateForge uses a declarative DSL (Domain-Specific Language) to define finite state machine workflows. The DSL supports both YAML and JSON formats.

## Basic Structure

```yaml
name: string          # Workflow name (required)
version: string       # Version number (required)
initialState: string  # Starting state (required)
metadata: object      # Optional metadata
states: array         # Array of state definitions (required)
transitions: array    # Array of transition definitions (required)
roles: array          # Array of role definitions (optional)
```

## States

### State Definition

```yaml
states:
  - name: string           # State identifier (required)
    description: string    # Human-readable description (optional)
    onEnter: string        # Action on state entry (optional, not yet implemented)
    onExit: string         # Action on state exit (optional, not yet implemented)
```

### Example

```yaml
states:
  - name: INITIAL
    description: "Starting state before any actions"
  - name: PENDING
    description: "Awaiting approval"
  - name: APPROVED
    description: "Request has been approved"
  - name: REJECTED
    description: "Request was rejected"
  - name: COMPLETED
    description: "Process completed successfully"
```

### Best Practices

- Use UPPERCASE for state names
- Keep names concise but descriptive
- Document the meaning of each state
- Plan for terminal states (no outgoing transitions)
- Consider error and cancellation states

## Transitions

### Transition Definition

```yaml
transitions:
  - id: number              # Unique transition ID (required)
    name: string            # Descriptive name (required)
    from: string            # Source state (required)
    to: string              # Target state (required)
    requiredRole: string    # Required role to execute (optional)
    guard: object           # Validation guard (optional)
    hooks: array            # Pre/post hooks (optional)
```

### Example

```yaml
transitions:
  - id: 1
    name: "Submit Request"
    from: INITIAL
    to: PENDING
    requiredRole: USER_ROLE
    guard:
      type: signature
      validator: "0x..."
  
  - id: 2
    name: "Approve Request"
    from: PENDING
    to: APPROVED
    requiredRole: ADMIN_ROLE
    guard:
      type: timelock
      parameter: 86400  # 24 hours
    hooks:
      - type: pre
        contract: "0x..."
      - type: post
        contract: "0x..."
```

### Transition IDs

- Must be unique within the workflow
- Should be sequential for clarity
- Cannot be 0
- Used in contract calls

## Guards

Guards add validation requirements to transitions.

### Guard Types

#### 1. Signature Guard

Requires a valid signature from a specific address.

```yaml
guard:
  type: signature
  validator: "0x1234..."  # Signer address
```

#### 2. Oracle Guard

Validates against an external oracle contract.

```yaml
guard:
  type: oracle
  validator: "0x1234..."  # Oracle contract address
```

The oracle contract must implement:
```solidity
function validate(bytes calldata data) external view returns (bool);
```

#### 3. Timelock Guard

Requires a minimum time delay or specific unlock time.

```yaml
guard:
  type: timelock
  parameter: 86400  # Delay in seconds
```

#### 4. ZK Proof Guard

Validates a zero-knowledge proof (future implementation).

```yaml
guard:
  type: zkproof
  validator: "0x1234..."  # Verifier contract
  parameter: 1           # Proof type
```

#### 5. Custom Guard

Custom validation logic.

```yaml
guard:
  type: custom
  validator: "0x1234..."  # Custom validator contract
```

The validator must implement:
```solidity
function validateTransition(
    address actor,
    bytes calldata data
) external view returns (bool);
```

## Hooks

Hooks execute custom logic before or after transitions.

### Hook Definition

```yaml
hooks:
  - type: pre         # or 'post'
    contract: "0x..."  # Hook contract address
```

### Hook Contract Interface

```solidity
interface ITransitionHook {
    function onTransition(
        address actor,
        bytes calldata data
    ) external;
}
```

### Use Cases

- Update related contracts
- Mint/burn tokens
- Emit custom events
- Record analytics
- Trigger external actions

### Limits

- Maximum 10 hooks per transition
- Gas limit per hook (default: 100,000)
- Failed hooks are skipped, not reverted

## Roles

Define roles for access control.

### Role Definition

```yaml
roles:
  - name: string        # Role identifier (required)
    description: string # Role description (required)
```

### Example

```yaml
roles:
  - name: PROPOSER_ROLE
    description: "Can submit new proposals"
  - name: VOTER_ROLE
    description: "Can vote on proposals"
  - name: EXECUTOR_ROLE
    description: "Can execute approved proposals"
  - name: ADMIN_ROLE
    description: "System administrator"
```

### Using Roles

Assign roles to transitions:

```yaml
transitions:
  - id: 1
    name: "Submit Proposal"
    from: INITIAL
    to: PROPOSAL
    requiredRole: PROPOSER_ROLE
```

If no role is specified, any address can execute the transition (subject to other guards).

## Metadata

Optional metadata for documentation and tooling.

```yaml
metadata:
  description: "Full workflow description"
  author: "Author name"
  version: "1.0.0"
  tags: ["dao", "governance"]
  repository: "https://github.com/..."
  documentation: "https://docs.example.com"
```

## Complete Example

```yaml
name: NFTEvolution
version: "1.0.0"
initialState: EGG

metadata:
  description: "NFT evolution state machine"
  author: "StateForge Team"
  tags: ["nft", "gaming"]

states:
  - name: EGG
    description: "Initial egg state"
  - name: HATCHING
    description: "Egg is hatching"
  - name: BABY
    description: "Baby creature"
  - name: ADULT
    description: "Fully grown adult"
  - name: LEGENDARY
    description: "Legendary evolution"

roles:
  - name: OWNER_ROLE
    description: "NFT owner"
  - name: BREEDER_ROLE
    description: "Can breed NFTs"

transitions:
  - id: 1
    name: "Start Hatching"
    from: EGG
    to: HATCHING
    requiredRole: OWNER_ROLE
    guard:
      type: timelock
      parameter: 259200  # 3 days
  
  - id: 2
    name: "Hatch"
    from: HATCHING
    to: BABY
    requiredRole: OWNER_ROLE
    hooks:
      - type: post
        contract: "0x..."  # Update metadata
  
  - id: 3
    name: "Grow Up"
    from: BABY
    to: ADULT
    requiredRole: OWNER_ROLE
    guard:
      type: timelock
      parameter: 604800  # 7 days
  
  - id: 4
    name: "Evolve to Legendary"
    from: ADULT
    to: LEGENDARY
    requiredRole: BREEDER_ROLE
    guard:
      type: custom
      validator: "0x..."  # Check special conditions
    hooks:
      - type: pre
        contract: "0x..."  # Burn evolution token
      - type: post
        contract: "0x..."  # Update rarity
```

## Validation Rules

The compiler validates:

1. **State Existence**: All referenced states must be defined
2. **Unique IDs**: Transition IDs must be unique
3. **Initial State**: Must exist in states array
4. **Reachability**: Warns about unreachable states
5. **Syntax**: Valid YAML/JSON structure
6. **Types**: Correct data types for all fields

## Best Practices

### State Design
- Keep state count manageable (5-15 states)
- Include error/cancel states
- Document state meanings clearly
- Consider terminal states

### Transition Design
- Use sequential IDs for clarity
- Name transitions with verb phrases
- Add descriptions for complex transitions
- Plan bidirectional transitions if needed

### Security
- Always use roles for sensitive transitions
- Add timelocks for critical operations
- Validate with guards when possible
- Test all transition paths

### Performance
- Minimize hook count
- Keep validation simple
- Avoid complex state graphs
- Consider gas costs

## File Format

### YAML (Recommended)

```yaml
# workflow.yaml
name: MyWorkflow
version: "1.0.0"
# ...
```

### JSON

```json
{
  "name": "MyWorkflow",
  "version": "1.0.0"
}
```

## Using the Compiler

```typescript
import { StateForgeCompiler } from 'stateforge';

const compiler = new StateForgeCompiler({
  outputDir: './output'
});

const result = await compiler.compileFromFile('./workflow.yaml');

if (result.success) {
  console.log('DSL Hash:', result.dslHash);
} else {
  console.error('Errors:', result.errors);
}
```

## Generated Files

The compiler generates:

- `config.json` - Deployment configuration
- `initialize.ts` - Initialization script
- `types.ts` - TypeScript types
- `test.ts` - Test template
- `README.md` - Workflow documentation
- `graph.dot` - State diagram (GraphViz)

## Further Reading

- [Architecture Guide](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Security Considerations](SECURITY.md)
- [Example Workflows](../examples/)

