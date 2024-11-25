// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IAccessRegistry.sol";

/**
 * @title AccessRegistry
 * @notice Role-based access control for state transitions
 */
contract AccessRegistry is IAccessRegistry, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TRANSITION_MANAGER_ROLE = keccak256("TRANSITION_MANAGER_ROLE");

    /**
     * @notice Mapping of transition ID to required role
     */
    mapping(uint256 => bytes32) private transitionRoles;

    /**
     * @notice Mapping of role to description
     */
    mapping(bytes32 => string) private roleDescriptions;

    /**
     * @notice Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TRANSITION_MANAGER_ROLE, msg.sender);
    }

    /**
     * @inheritdoc IAccessRegistry
     */
    function assignRole(
        address account,
        bytes32 role
    ) external override onlyRole(ADMIN_ROLE) {
        _grantRole(role, account);
        emit RoleAssigned(account, role, msg.sender);
    }

    /**
     * @inheritdoc IAccessRegistry
     */
    function revokeRole(
        address account,
        bytes32 role
    ) external override onlyRole(ADMIN_ROLE) {
        _revokeRole(role, account);
        emit RoleRevoked(account, role, msg.sender);
    }

    /**
     * @inheritdoc IAccessRegistry
     */
    function hasRole(
        address account,
        bytes32 role
    ) public view override(IAccessRegistry, AccessControl) returns (bool) {
        return super.hasRole(role, account);
    }

    /**
     * @inheritdoc IAccessRegistry
     */
    function canExecuteTransition(
        address account,
        uint256 transitionId
    ) external view override returns (bool) {
        bytes32 requiredRole = transitionRoles[transitionId];
        
        // If no role is required, anyone can execute
        if (requiredRole == bytes32(0)) {
            return true;
        }
        
        return hasRole(account, requiredRole);
    }

    /**
     * @notice Set required role for a transition
     * @param transitionId Transition identifier
     * @param role Required role
     */
    function setTransitionRole(
        uint256 transitionId,
        bytes32 role
    ) external onlyRole(TRANSITION_MANAGER_ROLE) {
        transitionRoles[transitionId] = role;
    }

    /**
     * @notice Get required role for a transition
     * @param transitionId Transition identifier
     * @return Required role
     */
    function getTransitionRole(uint256 transitionId) external view returns (bytes32) {
        return transitionRoles[transitionId];
    }

    /**
     * @notice Set description for a role
     * @param role Role identifier
     * @param description Role description
     */
    function setRoleDescription(
        bytes32 role,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) {
        roleDescriptions[role] = description;
    }

    /**
     * @notice Get description for a role
     * @param role Role identifier
     * @return Role description
     */
    function getRoleDescription(bytes32 role) external view returns (string memory) {
        return roleDescriptions[role];
    }

    /**
     * @notice Create a new role
     * @param role Role identifier
     * @param description Role description
     * @param admin Admin role for this role
     */
    function createRole(
        bytes32 role,
        string calldata description,
        bytes32 admin
    ) external onlyRole(ADMIN_ROLE) {
        _setRoleAdmin(role, admin);
        roleDescriptions[role] = description;
    }

    /**
     * @notice Batch assign roles
     * @param accounts Array of accounts
     * @param roles Array of roles
     */
    function batchAssignRoles(
        address[] calldata accounts,
        bytes32[] calldata roles
    ) external onlyRole(ADMIN_ROLE) {
        require(accounts.length == roles.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            _grantRole(roles[i], accounts[i]);
            emit RoleAssigned(accounts[i], roles[i], msg.sender);
        }
    }

    /**
     * @notice Check if account has any of the roles
     * @param account Address to check
     * @param roles Array of roles to check
     * @return Whether account has any of the roles
     */
    function hasAnyRole(
        address account,
        bytes32[] calldata roles
    ) external view returns (bool) {
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(account, roles[i])) {
                return true;
            }
        }
        return false;
    }
}

