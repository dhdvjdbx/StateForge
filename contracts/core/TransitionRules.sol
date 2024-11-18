// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/ITransitionRules.sol";

/**
 * @title TransitionRules
 * @notice Validates transition rules including signatures, timelocks, and custom validators
 */
contract TransitionRules is ITransitionRules, Ownable {
    using ECDSA for bytes32;

    /**
     * @notice Mapping of transition ID to rule
     */
    mapping(uint256 => Rule) private rules;

    /**
     * @notice Mapping of transition ID to timelock expiry
     */
    mapping(uint256 => mapping(address => uint256)) private timelocks;

    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @inheritdoc ITransitionRules
     */
    function validateTransition(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external view override returns (bool) {
        Rule memory rule = rules[transitionId];
        
        if (!rule.active) {
            return true; // No rule means allowed by default
        }

        if (rule.ruleType == RuleType.SIGNATURE) {
            return _validateSignature(actor, data, rule.validator);
        } else if (rule.ruleType == RuleType.TIMELOCK) {
            return _validateTimelock(transitionId, actor, rule.parameter);
        } else if (rule.ruleType == RuleType.ORACLE) {
            return _validateOracle(rule.validator, data);
        } else if (rule.ruleType == RuleType.CUSTOM) {
            return _validateCustom(rule.validator, actor, data);
        }

        return false;
    }

    /**
     * @inheritdoc ITransitionRules
     */
    function setRule(
        uint256 transitionId,
        RuleType ruleType,
        address validator,
        uint256 parameter
    ) external override onlyOwner {
        rules[transitionId] = Rule({
            ruleType: ruleType,
            validator: validator,
            parameter: parameter,
            active: true
        });

        emit RuleUpdated(transitionId, ruleType, validator);
    }

    /**
     * @inheritdoc ITransitionRules
     */
    function getRule(
        uint256 transitionId
    ) external view override returns (Rule memory) {
        return rules[transitionId];
    }

    /**
     * @notice Deactivate a rule
     * @param transitionId Transition identifier
     */
    function deactivateRule(uint256 transitionId) external onlyOwner {
        rules[transitionId].active = false;
    }

    /**
     * @notice Set timelock for a transition
     * @param transitionId Transition identifier
     * @param actor Address to set timelock for
     * @param unlockTime Timestamp when lock expires
     */
    function setTimelock(
        uint256 transitionId,
        address actor,
        uint256 unlockTime
    ) external onlyOwner {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        timelocks[transitionId][actor] = unlockTime;
    }

    /**
     * @notice Validate signature-based rule
     * @param actor Address to validate
     * @param data Signature data
     * @param validator Expected signer address
     * @return Whether signature is valid
     */
    function _validateSignature(
        address actor,
        bytes calldata data,
        address validator
    ) private pure returns (bool) {
        if (data.length < 65) {
            return false;
        }

        bytes32 messageHash = keccak256(abi.encodePacked(actor));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address recovered = ethSignedMessageHash.recover(data);
        return recovered == validator;
    }

    /**
     * @notice Validate timelock-based rule
     * @param transitionId Transition identifier
     * @param actor Address to validate
     * @param minDelay Minimum delay in seconds
     * @return Whether timelock requirement is met
     */
    function _validateTimelock(
        uint256 transitionId,
        address actor,
        uint256 minDelay
    ) private view returns (bool) {
        uint256 unlockTime = timelocks[transitionId][actor];
        
        if (unlockTime == 0) {
            // No timelock set, check if enough time has passed since setup
            return block.timestamp >= minDelay;
        }
        
        return block.timestamp >= unlockTime;
    }

    /**
     * @notice Validate oracle-based rule
     * @param oracleAddress Address of oracle contract
     * @param data Data to pass to oracle
     * @return Whether oracle validation passed
     */
    function _validateOracle(
        address oracleAddress,
        bytes calldata data
    ) private view returns (bool) {
        if (oracleAddress == address(0)) {
            return false;
        }

        // Call oracle's validate function
        (bool success, bytes memory result) = oracleAddress.staticcall(
            abi.encodeWithSignature("validate(bytes)", data)
        );

        if (!success || result.length == 0) {
            return false;
        }

        return abi.decode(result, (bool));
    }

    /**
     * @notice Validate custom rule
     * @param validatorAddress Address of custom validator
     * @param actor Address to validate
     * @param data Additional data
     * @return Whether custom validation passed
     */
    function _validateCustom(
        address validatorAddress,
        address actor,
        bytes calldata data
    ) private view returns (bool) {
        if (validatorAddress == address(0)) {
            return false;
        }

        (bool success, bytes memory result) = validatorAddress.staticcall(
            abi.encodeWithSignature("validateTransition(address,bytes)", actor, data)
        );

        if (!success || result.length == 0) {
            return false;
        }

        return abi.decode(result, (bool));
    }
}

