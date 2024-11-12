// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccessRegistry
 * @notice Interface for role-based access control
 */
interface IAccessRegistry {
    /**
     * @notice Emitted when a role is assigned
     */
    event RoleAssigned(
        address indexed account,
        bytes32 indexed role,
        address indexed admin
    );

    /**
     * @notice Emitted when a role is revoked
     */
    event RoleRevoked(
        address indexed account,
        bytes32 indexed role,
        address indexed admin
    );

    /**
     * @notice Assign a role to an account
     * @param account Address to assign role to
     * @param role Role identifier
     */
    function assignRole(address account, bytes32 role) external;

    /**
     * @notice Revoke a role from an account
     * @param account Address to revoke role from
     * @param role Role identifier
     */
    function revokeRole(address account, bytes32 role) external;

    /**
     * @notice Check if an account has a role
     * @param account Address to check
     * @param role Role identifier
     * @return Whether the account has the role
     */
    function hasRole(address account, bytes32 role) external view returns (bool);

    /**
     * @notice Check if an account can execute a transition
     * @param account Address to check
     * @param transitionId Transition identifier
     * @return Whether the account can execute the transition
     */
    function canExecuteTransition(
        address account,
        uint256 transitionId
    ) external view returns (bool);
}

