// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStateMachine
 * @notice Interface for the core state machine contract
 */
interface IStateMachine {
    /**
     * @notice Emitted when a state transition occurs
     * @param previousState The state before transition
     * @param newState The state after transition
     * @param actor Address that triggered the transition
     * @param transitionId Identifier of the transition
     * @param timestamp Block timestamp when transition occurred
     */
    event StateChanged(
        bytes32 indexed previousState,
        bytes32 indexed newState,
        address indexed actor,
        uint256 transitionId,
        uint256 timestamp
    );

    /**
     * @notice Initialize the state machine with an initial state
     * @param initialState The starting state identifier
     */
    function initialize(bytes32 initialState) external;

    /**
     * @notice Execute a state transition
     * @param targetState The desired end state
     * @param transitionId Identifier of the transition rule
     * @param data Additional data for the transition
     */
    function transitionTo(
        bytes32 targetState,
        uint256 transitionId,
        bytes calldata data
    ) external;

    /**
     * @notice Get the current state
     * @return Current state identifier
     */
    function getCurrentState() external view returns (bytes32);

    /**
     * @notice Check if a transition is allowed from current state
     * @param targetState The target state to check
     * @param transitionId The transition identifier
     * @return Whether the transition is allowed
     */
    function isTransitionAllowed(
        bytes32 targetState,
        uint256 transitionId
    ) external view returns (bool);
}

