// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../core/StateMachine.sol";

/**
 * @title NFTWorkflow
 * @notice Example NFT evolution workflow
 */
contract NFTWorkflow {
    StateMachine public stateMachine;
    
    mapping(uint256 => uint256) public tokenStates;
    mapping(uint256 => uint256) public evolutionTime;
    
    bytes32 public constant EGG = keccak256("EGG");
    bytes32 public constant HATCHING = keccak256("HATCHING");
    bytes32 public constant BABY = keccak256("BABY");
    bytes32 public constant ADULT = keccak256("ADULT");
    
    event NFTEvolved(uint256 indexed tokenId, bytes32 newState);
    
    constructor(address _stateMachine) {
        stateMachine = StateMachine(_stateMachine);
    }
    
    function evolve(uint256 tokenId, uint256 transitionId) external {
        stateMachine.transitionTo(BABY, transitionId, abi.encode(tokenId));
        evolutionTime[tokenId] = block.timestamp;
        emit NFTEvolved(tokenId, BABY);
    }
}

