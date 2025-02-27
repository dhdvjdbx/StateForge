// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Errors
 * @notice Custom error definitions for gas optimization
 */
library Errors {
    error AlreadyInitialized();
    error NotInitialized();
    error InvalidState();
    error TransitionNotAllowed();
    error UnauthorizedAccess();
    error ValidationFailed();
    error ContractPaused();
    error InvalidAddress();
    error StateNotFound();
    error DuplicateState();
}

