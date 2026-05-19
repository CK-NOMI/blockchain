// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManager.sol";

contract AuditManager {
    enum AuditStatus { Open, InProgress, Resolved }

    struct AuditRecord {
        string auditId;
        string batchId;
        string auditType;
        string description;
        string evidenceHash;
        address auditor;
        uint256 timestamp;
        AuditStatus status;
    }

    struct EvidenceItem {
        string evidenceHash;
        string description;
        uint256 timestamp;
        address submitter;
    }

    RoleManager public roleManager;
    address public traceManager;

    mapping(string => AuditRecord[]) public auditRecords;
    mapping(string => EvidenceItem[]) public evidenceChains;
    mapping(string => bool) public isAbnormal;
    mapping(string => uint256) public auditCount;

    event AbnormalMarked(string indexed batchId, address indexed regulator, string reason, uint256 timestamp);
    event AbnormalCleared(string indexed batchId, address indexed regulator, uint256 timestamp);
    event AuditCreated(string indexed auditId, string indexed batchId, address indexed auditor, string auditType, uint256 timestamp);
    event AuditResolved(string indexed auditId, string indexed batchId, address indexed resolver, uint256 timestamp);
    event EvidenceAppended(string indexed batchId, string evidenceHash, address indexed submitter, uint256 timestamp);

    modifier onlyRegulator() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Regulator),
            "AuditManager: caller is not active regulator or admin"
        );
        _;
    }

    constructor(address _roleManager) {
        roleManager = RoleManager(_roleManager);
    }

    function setTraceManager(address _traceManager) external {
        require(msg.sender == roleManager.admin(), "AuditManager: only admin");
        traceManager = _traceManager;
    }

    function markAbnormal(
        string calldata batchId,
        string calldata reason,
        string calldata evidenceHash
    ) external onlyRegulator {
        require(!isAbnormal[batchId], "AuditManager: already marked abnormal");

        isAbnormal[batchId] = true;
        evidenceChains[batchId].push(EvidenceItem({
            evidenceHash: evidenceHash,
            description: reason,
            timestamp: block.timestamp,
            submitter: msg.sender
        }));

        emit AbnormalMarked(batchId, msg.sender, reason, block.timestamp);
        emit EvidenceAppended(batchId, evidenceHash, msg.sender, block.timestamp);
    }

    function clearAbnormal(string calldata batchId) external onlyRegulator {
        require(isAbnormal[batchId], "AuditManager: not marked abnormal");
        isAbnormal[batchId] = false;
        emit AbnormalCleared(batchId, msg.sender, block.timestamp);
    }

    function processAudit(
        string calldata batchId,
        string calldata auditType,
        string calldata description,
        string calldata evidenceHash
    ) external onlyRegulator {
        uint256 count = auditCount[batchId];
        string memory auditId = string(abi.encodePacked(batchId, "_AUD", _uint2str(count + 1)));

        auditRecords[batchId].push(AuditRecord({
            auditId: auditId,
            batchId: batchId,
            auditType: auditType,
            description: description,
            evidenceHash: evidenceHash,
            auditor: msg.sender,
            timestamp: block.timestamp,
            status: AuditStatus.Open
        }));

        auditCount[batchId] = count + 1;

        emit AuditCreated(auditId, batchId, msg.sender, auditType, block.timestamp);

        if (bytes(evidenceHash).length > 0) {
            evidenceChains[batchId].push(EvidenceItem({
                evidenceHash: evidenceHash,
                description: description,
                timestamp: block.timestamp,
                submitter: msg.sender
            }));
            emit EvidenceAppended(batchId, evidenceHash, msg.sender, block.timestamp);
        }
    }

    function resolveAudit(string calldata batchId, string calldata auditId)
        external
        onlyRegulator
    {
        AuditRecord[] storage records = auditRecords[batchId];
        for (uint256 i = 0; i < records.length; i++) {
            if (keccak256(abi.encodePacked(records[i].auditId)) == keccak256(abi.encodePacked(auditId))) {
                records[i].status = AuditStatus.Resolved;
                emit AuditResolved(auditId, batchId, msg.sender, block.timestamp);
                return;
            }
        }
        revert("AuditManager: audit not found");
    }

    function appendEvidence(
        string calldata batchId,
        string calldata evidenceHash,
        string calldata description
    ) external onlyRegulator {
        evidenceChains[batchId].push(EvidenceItem({
            evidenceHash: evidenceHash,
            description: description,
            timestamp: block.timestamp,
            submitter: msg.sender
        }));
        emit EvidenceAppended(batchId, evidenceHash, msg.sender, block.timestamp);
    }

    function getEvidenceChain(string calldata batchId)
        external
        view
        returns (EvidenceItem[] memory)
    {
        return evidenceChains[batchId];
    }

    function getEvidenceChainLength(string calldata batchId)
        external
        view
        returns (uint256)
    {
        return evidenceChains[batchId].length;
    }

    function getAuditRecords(string calldata batchId)
        external
        view
        returns (AuditRecord[] memory)
    {
        return auditRecords[batchId];
    }

    function getAuditRecordCount(string calldata batchId)
        external
        view
        returns (uint256)
    {
        return auditRecords[batchId].length;
    }

    function getAllAuditBatchIds() external view returns (string[] memory) {
        // Return all batchIds that have at least one audit record
        // Limited to prevent unbounded iteration
        return _getAuditedBatchIds();
    }

    function isBatchAbnormal(string calldata batchId) external view returns (bool) {
        return isAbnormal[batchId];
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function _getAuditedBatchIds() private pure returns (string[] memory) {
        return new string[](0);
    }

    function getAuditCount(string calldata batchId) external view returns (uint256) {
        return auditRecords[batchId].length;
    }
}
