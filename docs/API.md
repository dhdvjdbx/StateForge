# StateForge API Documentation

## StateMachine Contract

### initialize

```solidity
function initialize(bytes32 initialState) external
```

Initialize the state machine with an initial state.

**Parameters:**
- `initialState`: The starting state identifier (keccak256 hash)

**Requirements:**
- Can only be called once
- Initial state must exist in StorageController
- Caller must be contract owner

**Events:**
- None (initialization doesn't emit StateChanged)

### transitionTo

```solidity
function transitionTo(
    bytes32 targetState,
    uint256 transitionId,
    bytes calldata data
) external
```

Execute a state transition.

**Parameters:**
- `targetState`: The desired end state
- `transitionId`: Identifier of the transition rule
- `data`: Additional data for validation and hooks

**Requirements:**
- State machine must be initialized
- Not paused
- Transition must be allowed from current state
- Caller must have required role
- Must pass validation rules
- Reentrancy protection

**Events:**
- `StateChanged(previousState, newState, actor, transitionId, timestamp)`

### getCurrentState

```solidity
function getCurrentState() external view returns (bytes32)
```

Get the current state of the state machine.

**Returns:**
- Current state identifier

### isTransitionAllowed

```solidity
function isTransitionAllowed(
    bytes32 targetState,
    uint256 transitionId
) external view returns (bool)
```

Check if a transition is allowed from the current state.

**Parameters:**
- `targetState`: Target state to check
- `transitionId`: Transition identifier

**Returns:**
- Whether the transition is allowed

### pause / unpause

```solidity
function pause() external
function unpause() external
```

Pause or unpause the state machine.

**Requirements:**
- Caller must be owner

## StorageController Contract

### registerState

```solidity
function registerState(bytes32 state) external
```

Register a new state in the system.

**Parameters:**
- `state`: State identifier

**Requirements:**
- State must not already exist
- Caller must be owner

**Events:**
- `StateRegistered(state)`

### addTransition

```solidity
function addTransition(bytes32 fromState, bytes32 toState) external
```

Add an allowed transition between states.

**Parameters:**
- `fromState`: Source state
- `toState`: Target state

**Requirements:**
- Both states must exist
- Caller must be owner

**Events:**
- `TransitionMappingAdded(fromState, toState)`

### isTransitionAllowed

```solidity
function isTransitionAllowed(
    bytes32 fromState,
    bytes32 toState
) external view returns (bool)
```

Check if a transition is allowed.

## TransitionRules Contract

### setRule

```solidity
function setRule(
    uint256 transitionId,
    RuleType ruleType,
    address validator,
    uint256 parameter
) external
```

Set a validation rule for a transition.

**Parameters:**
- `transitionId`: Transition identifier
- `ruleType`: Type of rule (SIGNATURE, ORACLE, TIMELOCK, ZK_PROOF, CUSTOM)
- `validator`: Address of validator contract (or signer for SIGNATURE)
- `parameter`: Additional parameter (e.g., delay for TIMELOCK)

**Requirements:**
- Caller must be owner

**Events:**
- `RuleUpdated(transitionId, ruleType, validator)`

### validateTransition

```solidity
function validateTransition(
    uint256 transitionId,
    address actor,
    bytes calldata data
) external view returns (bool)
```

Validate if a transition meets its rule requirements.

**Returns:**
- Whether the transition is valid

## AccessRegistry Contract

### assignRole

```solidity
function assignRole(address account, bytes32 role) external
```

Assign a role to an account.

**Parameters:**
- `account`: Address to assign role to
- `role`: Role identifier

**Requirements:**
- Caller must have ADMIN_ROLE

**Events:**
- `RoleAssigned(account, role, admin)`

### revokeRole

```solidity
function revokeRole(address account, bytes32 role) external
```

Revoke a role from an account.

**Parameters:**
- `account`: Address to revoke role from
- `role`: Role identifier

**Requirements:**
- Caller must have ADMIN_ROLE

**Events:**
- `RoleRevoked(account, role, admin)`

### hasRole

```solidity
function hasRole(address account, bytes32 role) external view returns (bool)
```

Check if an account has a role.

### canExecuteTransition

```solidity
function canExecuteTransition(
    address account,
    uint256 transitionId
) external view returns (bool)
```

Check if an account can execute a specific transition.

**Returns:**
- Whether the account has the required role

### setTransitionRole

```solidity
function setTransitionRole(
    uint256 transitionId,
    bytes32 role
) external
```

Set the required role for a transition.

**Parameters:**
- `transitionId`: Transition identifier
- `role`: Required role (bytes32(0) for no role required)

**Requirements:**
- Caller must have TRANSITION_MANAGER_ROLE

## HookManager Contract

### registerHook

```solidity
function registerHook(
    uint256 transitionId,
    HookType hookType,
    address hookAddress
) external
```

Register a hook for a transition.

**Parameters:**
- `transitionId`: Transition identifier
- `hookType`: PRE_TRANSITION or POST_TRANSITION
- `hookAddress`: Address of hook contract

**Requirements:**
- Hook address must be non-zero
- Maximum 10 hooks per transition
- Caller must be owner

**Events:**
- `HookRegistered(transitionId, hookType, hookAddress)`

### executePreHooks / executePostHooks

```solidity
function executePreHooks(
    uint256 transitionId,
    address actor,
    bytes calldata data
) external

function executePostHooks(
    uint256 transitionId,
    address actor,
    bytes calldata data
) external
```

Execute pre or post transition hooks.

**Note:** Hooks that fail are skipped, not reverted.

### getHooks

```solidity
function getHooks(
    uint256 transitionId,
    HookType hookType
) external view returns (address[] memory)
```

Get all hooks for a transition.

## ForgeRegistry Contract

### registerWorkflow

```solidity
function registerWorkflow(
    bytes32 dslHash,
    address stateMachine,
    address transitionRules,
    address storageController,
    address accessRegistry,
    address hookManager,
    uint256 version,
    string calldata metadata
) external returns (uint256 workflowId)
```

Register a new workflow in the registry.

**Returns:**
- Workflow ID

**Events:**
- `WorkflowRegistered(workflowId, dslHash, creator, stateMachine)`

### getWorkflow

```solidity
function getWorkflow(uint256 workflowId) 
    external view returns (Workflow memory)
```

Get workflow details by ID.

## PauseControl Contract

### pause / unpause

```solidity
function pause() external
function unpause() external
```

Pause or unpause the system.

**Requirements:**
- pause: Guardian or owner
- unpause: Owner only

### pauseContract / unpauseContract

```solidity
function pauseContract(address contractAddress) external
function unpauseContract(address contractAddress) external
```

Pause or unpause a specific contract.

### addGuardian / removeGuardian

```solidity
function addGuardian(address guardian) external
function removeGuardian(address guardian) external
```

Manage pause guardians.

**Requirements:**
- Caller must be owner

## Events

### StateChanged

```solidity
event StateChanged(
    bytes32 indexed previousState,
    bytes32 indexed newState,
    address indexed actor,
    uint256 transitionId,
    uint256 timestamp
)
```

Emitted when a state transition occurs.

### RoleAssigned / RoleRevoked

```solidity
event RoleAssigned(
    address indexed account,
    bytes32 indexed role,
    address indexed admin
)

event RoleRevoked(
    address indexed account,
    bytes32 indexed role,
    address indexed admin
)
```

Emitted when roles are assigned or revoked.

### RuleUpdated

```solidity
event RuleUpdated(
    uint256 indexed transitionId,
    RuleType ruleType,
    address validator
)
```

Emitted when transition rules are updated.

## Error Handling

Common error messages:
- `"Already initialized"` - State machine already initialized
- `"State machine not initialized"` - Attempting operation before initialization
- `"State machine is paused"` - Operation blocked due to pause
- `"Transition not allowed from current state"` - Invalid transition
- `"Caller not authorized for this transition"` - Missing required role
- `"Transition validation failed"` - Rule validation failed
- `"State does not exist"` - Referencing non-existent state
- `"Invalid address"` - Zero address provided

