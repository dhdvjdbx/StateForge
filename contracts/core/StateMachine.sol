// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IStateMachine.sol";
import "../interfaces/ITransitionRules.sol";
import "../interfaces/IAccessRegistry.sol";
import "../interfaces/IHookManager.sol";
import "./StorageController.sol";

/**
 * @title StateMachine
 * @notice Core FSM execution and transition routing
 */
contract StateMachine is IStateMachine, Ownable, ReentrancyGuard {
    StorageController public storageController;
    ITransitionRules public transitionRules;
    IAccessRegistry public accessRegistry;
    IHookManager public hookManager;

    bool private initialized;
    bool private paused;

    /**
     * @notice Mapping of state to allowed transition IDs
     */
    mapping(bytes32 => mapping(uint256 => bool)) private stateTransitions;

    modifier whenNotPaused() {
        require(!paused, "State machine is paused");
        _;
    }

    modifier onlyInitialized() {
        require(initialized, "State machine not initialized");
        _;
    }

    /**
     * @notice Constructor
     * @param _storageController Address of storage controller
     * @param _transitionRules Address of transition rules
     * @param _accessRegistry Address of access registry
     * @param _hookManager Address of hook manager
     */
    constructor(
        address _storageController,
        address _transitionRules,
        address _accessRegistry,
        address _hookManager
    ) Ownable(msg.sender) {
        require(_storageController != address(0), "Invalid storage controller");
        require(_transitionRules != address(0), "Invalid transition rules");
        require(_accessRegistry != address(0), "Invalid access registry");
        require(_hookManager != address(0), "Invalid hook manager");

        storageController = StorageController(_storageController);
        transitionRules = ITransitionRules(_transitionRules);
        accessRegistry = IAccessRegistry(_accessRegistry);
        hookManager = IHookManager(_hookManager);
    }

    /**
     * @inheritdoc IStateMachine
     */
    function initialize(bytes32 initialState) external override onlyOwner {
        require(!initialized, "Already initialized");
        require(storageController.stateExists(initialState), "Initial state does not exist");
        
        storageController.setCurrentState(initialState);
        initialized = true;
    }

    /**
     * @inheritdoc IStateMachine
     */
    function transitionTo(
        bytes32 targetState,
        uint256 transitionId,
        bytes calldata data
    ) external override nonReentrant whenNotPaused onlyInitialized {
        bytes32 currentState = storageController.getCurrentState();
        
        // Check if transition is allowed from current state
        require(
            isTransitionAllowed(targetState, transitionId),
            "Transition not allowed from current state"
        );

        // Check access control
        require(
            accessRegistry.canExecuteTransition(msg.sender, transitionId),
            "Caller not authorized for this transition"
        );

        // Validate transition rules
        require(
            transitionRules.validateTransition(transitionId, msg.sender, data),
            "Transition validation failed"
        );

        // Execute pre-transition hooks
        hookManager.executePreHooks(transitionId, msg.sender, data);

        // Execute the transition
        storageController.setCurrentState(targetState);
        storageController.recordTransition(
            currentState,
            targetState,
            msg.sender,
            transitionId
        );

        // Execute post-transition hooks
        hookManager.executePostHooks(transitionId, msg.sender, data);

        // Emit event
        emit StateChanged(
            currentState,
            targetState,
            msg.sender,
            transitionId,
            block.timestamp
        );
    }

    /**
     * @inheritdoc IStateMachine
     */
    function getCurrentState() external view override returns (bytes32) {
        return storageController.getCurrentState();
    }

    /**
     * @inheritdoc IStateMachine
     */
    function isTransitionAllowed(
        bytes32 targetState,
        uint256 transitionId
    ) public view override returns (bool) {
        if (!initialized) {
            return false;
        }

        bytes32 currentState = storageController.getCurrentState();
        
        // Check if this transition is registered for current state
        if (!stateTransitions[currentState][transitionId]) {
            return false;
        }

        // Check if target state is in allowed transitions
        return storageController.isTransitionAllowed(currentState, targetState);
    }

    /**
     * @notice Register a transition for a state
     * @param state Source state
     * @param transitionId Transition identifier
     */
    function registerStateTransition(
        bytes32 state,
        uint256 transitionId
    ) external onlyOwner {
        stateTransitions[state][transitionId] = true;
    }

    /**
     * @notice Pause the state machine
     */
    function pause() external onlyOwner {
        paused = true;
    }

    /**
     * @notice Unpause the state machine
     */
    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @notice Check if state machine is paused
     * @return Whether the state machine is paused
     */
    function isPaused() external view returns (bool) {
        return paused;
    }

    /**
     * @notice Check if state machine is initialized
     * @return Whether the state machine is initialized
     */
    function isInitialized() external view returns (bool) {
        return initialized;
    }

    /**
     * @notice Get transition nonce
     * @return Current nonce
     */
    function getNonce() external view returns (uint256) {
        return storageController.getNonce();
    }

    /**
     * @notice Update storage controller
     * @param _storageController New storage controller address
     */
    function updateStorageController(address _storageController) external onlyOwner {
        require(_storageController != address(0), "Invalid address");
        storageController = StorageController(_storageController);
    }

    /**
     * @notice Update transition rules
     * @param _transitionRules New transition rules address
     */
    function updateTransitionRules(address _transitionRules) external onlyOwner {
        require(_transitionRules != address(0), "Invalid address");
        transitionRules = ITransitionRules(_transitionRules);
    }

    /**
     * @notice Update access registry
     * @param _accessRegistry New access registry address
     */
    function updateAccessRegistry(address _accessRegistry) external onlyOwner {
        require(_accessRegistry != address(0), "Invalid address");
        accessRegistry = IAccessRegistry(_accessRegistry);
    }

    /**
     * @notice Update hook manager
     * @param _hookManager New hook manager address
     */
    function updateHookManager(address _hookManager) external onlyOwner {
        require(_hookManager != address(0), "Invalid address");
        hookManager = IHookManager(_hookManager);
    }
}

