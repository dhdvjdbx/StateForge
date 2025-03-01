// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Events
 * @notice Common event definitions
 */
library Events {
    event Initialized(address indexed by, uint256 timestamp);
    event ConfigurationUpdated(bytes32 indexed key, bytes32 value);
    event EmergencyAction(address indexed by, string reason);
}

