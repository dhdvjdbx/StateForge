// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StateConstants
 * @notice Common constants for state machine contracts
 */
library StateConstants {
    bytes32 public constant INITIAL_STATE = keccak256("INITIAL");
    bytes32 public constant PENDING_STATE = keccak256("PENDING");
    bytes32 public constant ACTIVE_STATE = keccak256("ACTIVE");
    bytes32 public constant PAUSED_STATE = keccak256("PAUSED");
    bytes32 public constant COMPLETED_STATE = keccak256("COMPLETED");
    bytes32 public constant CANCELLED_STATE = keccak256("CANCELLED");
    
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
}

// Optimization 1
// Optimization 2
// Optimization 3
