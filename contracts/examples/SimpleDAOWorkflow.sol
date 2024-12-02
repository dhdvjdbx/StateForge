// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../core/StateMachine.sol";
import "../utils/StateConstants.sol";

/**
 * @title SimpleDAOWorkflow
 * @notice Example of a DAO lifecycle using StateForge
 * @dev States: INITIAL -> PROPOSAL -> VOTING -> EXECUTION -> COMPLETED
 */
contract SimpleDAOWorkflow {
    StateMachine public stateMachine;
    
    bytes32 public constant PROPOSAL_STATE = keccak256("PROPOSAL");
    bytes32 public constant VOTING_STATE = keccak256("VOTING");
    bytes32 public constant EXECUTION_STATE = keccak256("EXECUTION");
    
    uint256 public constant TRANSITION_SUBMIT_PROPOSAL = 1;
    uint256 public constant TRANSITION_START_VOTING = 2;
    uint256 public constant TRANSITION_END_VOTING = 3;
    uint256 public constant TRANSITION_EXECUTE = 4;

    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    /**
     * @notice Constructor
     * @param _stateMachine Address of state machine
     */
    constructor(address _stateMachine) {
        stateMachine = StateMachine(_stateMachine);
    }

    /**
     * @notice Submit a new proposal
     * @param description Proposal description
     */
    function submitProposal(string calldata description) external {
        stateMachine.transitionTo(
            PROPOSAL_STATE,
            TRANSITION_SUBMIT_PROPOSAL,
            abi.encode(description)
        );
        
        proposals[++proposalCount] = Proposal({
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + 7 days,
            executed: false
        });
    }

    /**
     * @notice Start voting period
     */
    function startVoting() external {
        stateMachine.transitionTo(
            VOTING_STATE,
            TRANSITION_START_VOTING,
            ""
        );
    }

    /**
     * @notice End voting and move to execution
     */
    function endVoting() external {
        stateMachine.transitionTo(
            EXECUTION_STATE,
            TRANSITION_END_VOTING,
            ""
        );
    }

    /**
     * @notice Execute the proposal
     */
    function executeProposal() external {
        require(proposalCount > 0, "No proposals");
        Proposal storage proposal = proposals[proposalCount];
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        
        stateMachine.transitionTo(
            StateConstants.COMPLETED_STATE,
            TRANSITION_EXECUTE,
            ""
        );
        
        proposal.executed = true;
    }
}

