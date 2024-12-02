// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITransitionHook
 * @notice Interface for transition hook contracts
 */
interface ITransitionHook {
    /**
     * @notice Called when a transition occurs
     * @param actor Address executing the transition
     * @param data Additional data
     */
    function onTransition(address actor, bytes calldata data) external;
}

