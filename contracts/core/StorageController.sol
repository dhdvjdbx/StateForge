// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title StorageController
 * @notice Manages persistent state storage with upgrade-safe layout
 * @dev Uses EIP-1967 storage pattern for upgradeability
 */
contract StorageController is Initializable, OwnableUpgradeable {
    /**
     * @notice Storage structure for state machine data
     */
    struct StateData {
        bytes32 currentState;
        uint256 nonce;
        uint256 lastTransitionTime;
        mapping(bytes32 => bool) stateExists;
        mapping(bytes32 => bytes32[]) allowedTransitions;
        mapping(uint256 => TransitionHistory) history;
    }

    /**
     * @notice History of a single transition
     */
    struct TransitionHistory {
        bytes32 fromState;
        bytes32 toState;
        address actor;
        uint256 timestamp;
        uint256 transitionId;
    }

    /**
     * @dev Storage slot for StateData
     */
    bytes32 private constant STORAGE_SLOT = keccak256("stateforge.storage.statedata");

    /**
     * @notice Emitted when a state is registered
     */
    event StateRegistered(bytes32 indexed state);

    /**
     * @notice Emitted when a transition mapping is added
     */
    event TransitionMappingAdded(
        bytes32 indexed fromState,
        bytes32 indexed toState
    );

    /**
     * @notice Initialize the storage controller
     */
    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    /**
     * @notice Get storage reference
     * @return data Reference to StateData storage
     */
    function _getStorage() private pure returns (StateData storage data) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            data.slot := slot
        }
    }

    /**
     * @notice Set the current state
     * @param newState New state identifier
     */
    function setCurrentState(bytes32 newState) external onlyOwner {
        StateData storage data = _getStorage();
        require(data.stateExists[newState], "State does not exist");
        data.currentState = newState;
        data.lastTransitionTime = block.timestamp;
        data.nonce++;
    }

    /**
     * @notice Get the current state
     * @return Current state identifier
     */
    function getCurrentState() external view returns (bytes32) {
        return _getStorage().currentState;
    }

    /**
     * @notice Get transition nonce
     * @return Current nonce value
     */
    function getNonce() external view returns (uint256) {
        return _getStorage().nonce;
    }

    /**
     * @notice Register a new state
     * @param state State identifier to register
     */
    function registerState(bytes32 state) external onlyOwner {
        StateData storage data = _getStorage();
        require(!data.stateExists[state], "State already exists");
        data.stateExists[state] = true;
        emit StateRegistered(state);
    }

    /**
     * @notice Add allowed transition between states
     * @param fromState Source state
     * @param toState Target state
     */
    function addTransition(bytes32 fromState, bytes32 toState) external onlyOwner {
        StateData storage data = _getStorage();
        require(data.stateExists[fromState], "From state does not exist");
        require(data.stateExists[toState], "To state does not exist");
        
        data.allowedTransitions[fromState].push(toState);
        emit TransitionMappingAdded(fromState, toState);
    }

    /**
     * @notice Check if a transition is allowed
     * @param fromState Source state
     * @param toState Target state
     * @return Whether transition is allowed
     */
    function isTransitionAllowed(
        bytes32 fromState,
        bytes32 toState
    ) external view returns (bool) {
        StateData storage data = _getStorage();
        bytes32[] memory allowed = data.allowedTransitions[fromState];
        
        for (uint256 i = 0; i < allowed.length; i++) {
            if (allowed[i] == toState) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Record transition in history
     * @param fromState Source state
     * @param toState Target state
     * @param actor Address that executed transition
     * @param transitionId Transition identifier
     */
    function recordTransition(
        bytes32 fromState,
        bytes32 toState,
        address actor,
        uint256 transitionId
    ) external onlyOwner {
        StateData storage data = _getStorage();
        uint256 historyId = data.nonce;
        
        data.history[historyId] = TransitionHistory({
            fromState: fromState,
            toState: toState,
            actor: actor,
            timestamp: block.timestamp,
            transitionId: transitionId
        });
    }

    /**
     * @notice Get transition history
     * @param historyId History entry identifier
     * @return Transition history record
     */
    function getHistory(
        uint256 historyId
    ) external view returns (TransitionHistory memory) {
        return _getStorage().history[historyId];
    }

    /**
     * @notice Get last transition time
     * @return Timestamp of last transition
     */
    function getLastTransitionTime() external view returns (uint256) {
        return _getStorage().lastTransitionTime;
    }

    /**
     * @notice Check if a state exists
     * @param state State identifier
     * @return Whether state exists
     */
    function stateExists(bytes32 state) external view returns (bool) {
        return _getStorage().stateExists[state];
    }

    /**
     * @notice Get allowed transitions from a state
     * @param fromState Source state
     * @return Array of allowed target states
     */
    function getAllowedTransitions(
        bytes32 fromState
    ) external view returns (bytes32[] memory) {
        return _getStorage().allowedTransitions[fromState];
    }
}

