pragma solidity ^0.4.25;

import "./RoleManager.sol";

contract AuditManager {
    struct AuditRecord {
        bytes32 batchId;
        string exceptionType; // 如 "温度超标", "质检不合格仍推进"
        string evidenceHash;  // 证据上链
        address regulator;
        uint256 timestamp;
    }

    RoleManager private roleManager;
    mapping(bytes32 => AuditRecord) public auditRecords;

    event BatchFlagged(bytes32 indexed batchId, string exceptionType, address indexed regulator);

    constructor(address _roleManagerAddress) public {
        roleManager = RoleManager(_roleManagerAddress);
    }

    // 监管员标记异常批次
    function flagBatchException(
        bytes32 _batchId,
        string memory _exceptionType,
        string memory _evidenceHash
    ) public {
        require(roleManager.checkRole(msg.sender, 5), "Only Regulator can flag exception"); // 5 代表 Regulator
        
        auditRecords[_batchId] = AuditRecord(_batchId, _exceptionType, _evidenceHash, msg.sender, now);
        emit BatchFlagged(_batchId, _exceptionType, msg.sender);
    }
}
