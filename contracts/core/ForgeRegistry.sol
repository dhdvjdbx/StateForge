// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ForgeRegistry
 * @notice Workflow registration and compiler metadata management
 */
contract ForgeRegistry is Ownable {
    /**
     * @notice Workflow structure
     */
    struct Workflow {
        bytes32 dslHash;
        address stateMachine;
        address transitionRules;
        address storageController;
        address accessRegistry;
        address hookManager;
        uint256 version;
        uint256 createdAt;
        address creator;
        bool active;
        string metadata;
    }

    /**
     * @notice Mapping of workflow ID to Workflow
     */
    mapping(uint256 => Workflow) private workflows;

    /**
     * @notice Mapping of DSL hash to workflow IDs
     */
    mapping(bytes32 => uint256[]) private dslHashToWorkflows;

    /**
     * @notice Counter for workflow IDs
     */
    uint256 private workflowCounter;

    /**
     * @notice Mapping of creator to workflow IDs
     */
    mapping(address => uint256[]) private creatorWorkflows;

    /**
     * @notice Emitted when a workflow is registered
     */
    event WorkflowRegistered(
        uint256 indexed workflowId,
        bytes32 indexed dslHash,
        address indexed creator,
        address stateMachine
    );

    /**
     * @notice Emitted when a workflow is deactivated
     */
    event WorkflowDeactivated(uint256 indexed workflowId);

    /**
     * @notice Emitted when workflow metadata is updated
     */
    event WorkflowMetadataUpdated(uint256 indexed workflowId, string metadata);

    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {
        workflowCounter = 1; // Start from 1
    }

    /**
     * @notice Register a new workflow
     * @param dslHash Hash of the DSL configuration
     * @param stateMachine Address of state machine contract
     * @param transitionRules Address of transition rules contract
     * @param storageController Address of storage controller
     * @param accessRegistry Address of access registry
     * @param hookManager Address of hook manager
     * @param version Version number
     * @param metadata Additional metadata (JSON string)
     * @return workflowId ID of registered workflow
     */
    function registerWorkflow(
        bytes32 dslHash,
        address stateMachine,
        address transitionRules,
        address storageController,
        address accessRegistry,
        address hookManager,
        uint256 version,
        string calldata metadata
    ) external returns (uint256 workflowId) {
        require(stateMachine != address(0), "Invalid state machine address");
        require(dslHash != bytes32(0), "Invalid DSL hash");

        workflowId = workflowCounter++;

        workflows[workflowId] = Workflow({
            dslHash: dslHash,
            stateMachine: stateMachine,
            transitionRules: transitionRules,
            storageController: storageController,
            accessRegistry: accessRegistry,
            hookManager: hookManager,
            version: version,
            createdAt: block.timestamp,
            creator: msg.sender,
            active: true,
            metadata: metadata
        });

        dslHashToWorkflows[dslHash].push(workflowId);
        creatorWorkflows[msg.sender].push(workflowId);

        emit WorkflowRegistered(workflowId, dslHash, msg.sender, stateMachine);
    }

    /**
     * @notice Get workflow by ID
     * @param workflowId Workflow identifier
     * @return Workflow structure
     */
    function getWorkflow(uint256 workflowId) external view returns (Workflow memory) {
        require(workflowId > 0 && workflowId < workflowCounter, "Invalid workflow ID");
        return workflows[workflowId];
    }

    /**
     * @notice Get workflows by DSL hash
     * @param dslHash DSL configuration hash
     * @return Array of workflow IDs
     */
    function getWorkflowsByDslHash(
        bytes32 dslHash
    ) external view returns (uint256[] memory) {
        return dslHashToWorkflows[dslHash];
    }

    /**
     * @notice Get workflows by creator
     * @param creator Creator address
     * @return Array of workflow IDs
     */
    function getWorkflowsByCreator(
        address creator
    ) external view returns (uint256[] memory) {
        return creatorWorkflows[creator];
    }

    /**
     * @notice Deactivate a workflow
     * @param workflowId Workflow identifier
     */
    function deactivateWorkflow(uint256 workflowId) external {
        require(workflowId > 0 && workflowId < workflowCounter, "Invalid workflow ID");
        Workflow storage workflow = workflows[workflowId];
        require(
            msg.sender == workflow.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(workflow.active, "Already deactivated");

        workflow.active = false;
        emit WorkflowDeactivated(workflowId);
    }

    /**
     * @notice Update workflow metadata
     * @param workflowId Workflow identifier
     * @param metadata New metadata
     */
    function updateWorkflowMetadata(
        uint256 workflowId,
        string calldata metadata
    ) external {
        require(workflowId > 0 && workflowId < workflowCounter, "Invalid workflow ID");
        Workflow storage workflow = workflows[workflowId];
        require(
            msg.sender == workflow.creator || msg.sender == owner(),
            "Not authorized"
        );

        workflow.metadata = metadata;
        emit WorkflowMetadataUpdated(workflowId, metadata);
    }

    /**
     * @notice Get total number of workflows
     * @return Total count
     */
    function getTotalWorkflows() external view returns (uint256) {
        return workflowCounter - 1;
    }

    /**
     * @notice Check if a workflow is active
     * @param workflowId Workflow identifier
     * @return Whether workflow is active
     */
    function isWorkflowActive(uint256 workflowId) external view returns (bool) {
        require(workflowId > 0 && workflowId < workflowCounter, "Invalid workflow ID");
        return workflows[workflowId].active;
    }

    /**
     * @notice Get workflow contracts
     * @param workflowId Workflow identifier
     * @return stateMachine State machine address
     * @return transitionRules Transition rules address
     * @return storageController Storage controller address
     * @return accessRegistry Access registry address
     * @return hookManager Hook manager address
     */
    function getWorkflowContracts(
        uint256 workflowId
    )
        external
        view
        returns (
            address stateMachine,
            address transitionRules,
            address storageController,
            address accessRegistry,
            address hookManager
        )
    {
        require(workflowId > 0 && workflowId < workflowCounter, "Invalid workflow ID");
        Workflow memory workflow = workflows[workflowId];
        return (
            workflow.stateMachine,
            workflow.transitionRules,
            workflow.storageController,
            workflow.accessRegistry,
            workflow.hookManager
        );
    }
}

