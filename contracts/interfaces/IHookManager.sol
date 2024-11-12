// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IHookManager
 * @notice Interface for managing pre/post transition hooks
 */
interface IHookManager {
    /**
     * @notice Hook types
     */
    enum HookType {
        PRE_TRANSITION,
        POST_TRANSITION
    }

    /**
     * @notice Emitted when a hook is registered
     */
    event HookRegistered(
        uint256 indexed transitionId,
        HookType hookType,
        address indexed hookAddress
    );

    /**
     * @notice Register a hook for a transition
     * @param transitionId Transition identifier
     * @param hookType Type of hook (pre or post)
     * @param hookAddress Address of hook contract
     */
    function registerHook(
        uint256 transitionId,
        HookType hookType,
        address hookAddress
    ) external;

    /**
     * @notice Execute pre-transition hooks
     * @param transitionId Transition identifier
     * @param actor Address executing transition
     * @param data Additional data
     */
    function executePreHooks(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external;

    /**
     * @notice Execute post-transition hooks
     * @param transitionId Transition identifier
     * @param actor Address executing transition
     * @param data Additional data
     */
    function executePostHooks(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external;

    /**
     * @notice Get hooks for a transition
     * @param transitionId Transition identifier
     * @param hookType Type of hook
     * @return Array of hook addresses
     */
    function getHooks(
        uint256 transitionId,
        HookType hookType
    ) external view returns (address[] memory);
}

