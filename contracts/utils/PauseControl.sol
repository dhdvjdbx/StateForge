// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PauseControl
 * @notice Circuit breaker for emergency stop
 */
contract PauseControl is Ownable, Pausable {
    /**
     * @notice Mapping of contract address to pause status
     */
    mapping(address => bool) private pausedContracts;

    /**
     * @notice Addresses with pause authority
     */
    mapping(address => bool) private pauseGuardians;

    /**
     * @notice Emitted when a contract is paused
     */
    event ContractPaused(address indexed contractAddress, address indexed by);

    /**
     * @notice Emitted when a contract is unpaused
     */
    event ContractUnpaused(address indexed contractAddress, address indexed by);

    /**
     * @notice Emitted when a pause guardian is added
     */
    event GuardianAdded(address indexed guardian);

    /**
     * @notice Emitted when a pause guardian is removed
     */
    event GuardianRemoved(address indexed guardian);

    modifier onlyGuardianOrOwner() {
        require(
            pauseGuardians[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {
        pauseGuardians[msg.sender] = true;
    }

    /**
     * @notice Pause the system
     */
    function pause() external onlyGuardianOrOwner {
        _pause();
    }

    /**
     * @notice Unpause the system
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Pause a specific contract
     * @param contractAddress Address of contract to pause
     */
    function pauseContract(address contractAddress) external onlyGuardianOrOwner {
        require(contractAddress != address(0), "Invalid address");
        pausedContracts[contractAddress] = true;
        emit ContractPaused(contractAddress, msg.sender);
    }

    /**
     * @notice Unpause a specific contract
     * @param contractAddress Address of contract to unpause
     */
    function unpauseContract(address contractAddress) external onlyOwner {
        pausedContracts[contractAddress] = false;
        emit ContractUnpaused(contractAddress, msg.sender);
    }

    /**
     * @notice Check if a contract is paused
     * @param contractAddress Address to check
     * @return Whether the contract is paused
     */
    function isContractPaused(address contractAddress) external view returns (bool) {
        return pausedContracts[contractAddress] || paused();
    }

    /**
     * @notice Add a pause guardian
     * @param guardian Address to add as guardian
     */
    function addGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "Invalid address");
        require(!pauseGuardians[guardian], "Already a guardian");
        pauseGuardians[guardian] = true;
        emit GuardianAdded(guardian);
    }

    /**
     * @notice Remove a pause guardian
     * @param guardian Address to remove as guardian
     */
    function removeGuardian(address guardian) external onlyOwner {
        require(pauseGuardians[guardian], "Not a guardian");
        pauseGuardians[guardian] = false;
        emit GuardianRemoved(guardian);
    }

    /**
     * @notice Check if an address is a guardian
     * @param account Address to check
     * @return Whether the address is a guardian
     */
    function isGuardian(address account) external view returns (bool) {
        return pauseGuardians[account];
    }

    /**
     * @notice Emergency pause with reason
     * @param reason Reason for emergency pause
     */
    function emergencyPause(string calldata reason) external onlyGuardianOrOwner {
        _pause();
        emit EmergencyPauseTriggered(msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Emitted on emergency pause
     */
    event EmergencyPauseTriggered(
        address indexed by,
        string reason,
        uint256 timestamp
    );
}

