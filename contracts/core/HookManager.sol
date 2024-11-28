// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHookManager.sol";

/**
 * @title HookManager
 * @notice Manages pre/post transition hooks
 */
contract HookManager is IHookManager, Ownable {
    /**
     * @notice Mapping of transition ID and hook type to hook addresses
     */
    mapping(uint256 => mapping(HookType => address[])) private hooks;

    /**
     * @notice Maximum number of hooks per transition
     */
    uint256 public constant MAX_HOOKS_PER_TRANSITION = 10;

    /**
     * @notice Gas limit for hook execution
     */
    uint256 public hookGasLimit;

    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {
        hookGasLimit = 100000; // Default gas limit
    }

    /**
     * @inheritdoc IHookManager
     */
    function registerHook(
        uint256 transitionId,
        HookType hookType,
        address hookAddress
    ) external override onlyOwner {
        require(hookAddress != address(0), "Invalid hook address");
        require(
            hooks[transitionId][hookType].length < MAX_HOOKS_PER_TRANSITION,
            "Max hooks reached"
        );

        hooks[transitionId][hookType].push(hookAddress);
        emit HookRegistered(transitionId, hookType, hookAddress);
    }

    /**
     * @inheritdoc IHookManager
     */
    function executePreHooks(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external override {
        _executeHooks(transitionId, HookType.PRE_TRANSITION, actor, data);
    }

    /**
     * @inheritdoc IHookManager
     */
    function executePostHooks(
        uint256 transitionId,
        address actor,
        bytes calldata data
    ) external override {
        _executeHooks(transitionId, HookType.POST_TRANSITION, actor, data);
    }

    /**
     * @inheritdoc IHookManager
     */
    function getHooks(
        uint256 transitionId,
        HookType hookType
    ) external view override returns (address[] memory) {
        return hooks[transitionId][hookType];
    }

    /**
     * @notice Remove a hook
     * @param transitionId Transition identifier
     * @param hookType Type of hook
     * @param hookAddress Address of hook to remove
     */
    function removeHook(
        uint256 transitionId,
        HookType hookType,
        address hookAddress
    ) external onlyOwner {
        address[] storage hookList = hooks[transitionId][hookType];
        
        for (uint256 i = 0; i < hookList.length; i++) {
            if (hookList[i] == hookAddress) {
                hookList[i] = hookList[hookList.length - 1];
                hookList.pop();
                break;
            }
        }
    }

    /**
     * @notice Update hook gas limit
     * @param newGasLimit New gas limit
     */
    function updateHookGasLimit(uint256 newGasLimit) external onlyOwner {
        require(newGasLimit > 0, "Gas limit must be positive");
        hookGasLimit = newGasLimit;
    }

    /**
     * @notice Clear all hooks for a transition
     * @param transitionId Transition identifier
     * @param hookType Type of hook
     */
    function clearHooks(
        uint256 transitionId,
        HookType hookType
    ) external onlyOwner {
        delete hooks[transitionId][hookType];
    }

    /**
     * @notice Execute hooks for a transition
     * @param transitionId Transition identifier
     * @param hookType Type of hook
     * @param actor Address executing transition
     * @param data Additional data
     */
    function _executeHooks(
        uint256 transitionId,
        HookType hookType,
        address actor,
        bytes calldata data
    ) private {
        address[] memory hookList = hooks[transitionId][hookType];
        
        for (uint256 i = 0; i < hookList.length; i++) {
            address hookAddress = hookList[i];
            
            // Execute hook with gas limit
            try this._callHook{gas: hookGasLimit}(hookAddress, actor, data) {
                // Hook executed successfully
            } catch {
                // Hook failed, continue with next hook
                // In production, might want to emit an event here
            }
        }
    }

    /**
     * @notice Internal function to call hook
     * @param hookAddress Address of hook contract
     * @param actor Address executing transition
     * @param data Additional data
     */
    function _callHook(
        address hookAddress,
        address actor,
        bytes calldata data
    ) external {
        require(msg.sender == address(this), "Only self-callable");
        
        (bool success, ) = hookAddress.call(
            abi.encodeWithSignature("onTransition(address,bytes)", actor, data)
        );
        
        require(success, "Hook execution failed");
    }

    /**
     * @notice Get hook count for a transition
     * @param transitionId Transition identifier
     * @param hookType Type of hook
     * @return Number of hooks
     */
    function getHookCount(
        uint256 transitionId,
        HookType hookType
    ) external view returns (uint256) {
        return hooks[transitionId][hookType].length;
    }
}

