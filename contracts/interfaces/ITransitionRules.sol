// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITransitionRules
 * @notice Interface for transition validation rules
 */
interface ITransitionRules {
    /**
     * @notice Rule types for transition validation
     */
    enum RuleType {
        SIGNATURE,
        ORACLE,
        TIMELOCK,
        ZK_PROOF,
        CUSTOM
    }

    /**
     * @notice Transition rule structure
     */
    struct Rule {
        RuleType ruleType;
        address validator;
        uint256 parameter;
        bool active;
    }

    /**
     * @notice Emitted when a rule is added or updated
     */
    event RuleUpdated(
        uint256 indexed transitionId,
        RuleType ruleType,
        address validator
    );

    /**
     * @notice Validate a transition
     * @param transitionId Identifier of the transition
     * @param actor Address attempting the transition
     * @param data Additional validation data
     * @return Whether the transition is valid
     */
    function validateTransition(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external view returns (bool);

    /**
     * @notice Add or update a transition rule
     * @param transitionId Identifier of the transition
     * @param ruleType Type of validation rule
     * @param validator Address of validator contract
     * @param parameter Additional parameter for the rule
     */
    function setRule(
        uint256 transitionId,
        RuleType ruleType,
        address validator,
        uint256 parameter
    ) external;

    /**
     * @notice Get rule for a transition
     * @param transitionId Identifier of the transition
     * @return Rule structure
     */
    function getRule(uint256 transitionId) external view returns (Rule memory);
}

