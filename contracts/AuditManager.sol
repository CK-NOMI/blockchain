pragma solidity ^0.4.25;

import "./RoleManager.sol";

contract AuditManager {
    struct AuditRecord {
        uint256 auditId;
        bytes32 batchId;
        string auditType;
        string description;
        string evidenceHash;
        address auditor;
        uint8 status;           // 0 = open, 1 = closed
        uint256 timestamp;
    }

    struct EvidenceItem {
        string evidenceHash;
        string description;
        address submitter;
        uint256 timestamp;
    }

    RoleManager private roleManager;

    // batchId => 是否异常
    mapping(bytes32 => bool) public batchAbnormal;

    // batchId => 审计记录列表
    mapping(bytes32 => AuditRecord[]) private batchAuditRecords;

    // batchId => 审计计数（用作 auditId 自增）
    mapping(bytes32 => uint256) private batchAuditCounts;

    // batchId => 证据链
    mapping(bytes32 => EvidenceItem[]) private batchEvidenceChain;

    event BatchFlagged(bytes32 indexed batchId, string reason, address indexed regulator);
    event AbnormalCleared(bytes32 indexed batchId);
    event AuditSubmitted(bytes32 indexed batchId, uint256 auditId, address indexed auditor);
    event AuditResolved(bytes32 indexed batchId, uint256 auditId);
    event EvidenceAppended(bytes32 indexed batchId, string evidenceHash);

    constructor(address _roleManagerAddress) public {
        roleManager = RoleManager(_roleManagerAddress);
    }

    modifier onlyRegulator() {
        require(roleManager.checkRole(msg.sender, 5), "Only Regulator can perform this action");
        _;
    }

    // ========== 写函数 ==========

    /// 标记批次异常
    function markAbnormal(
        bytes32 _batchId,
        string memory _reason,
        string memory _evidenceHash
    ) public onlyRegulator {
        batchAbnormal[_batchId] = true;
        uint256 auditId = batchAuditCounts[_batchId];
        batchAuditCounts[_batchId] = auditId + 1;
        batchAuditRecords[_batchId].push(AuditRecord(
            auditId, _batchId, "ABNORMAL", _reason, _evidenceHash,
            msg.sender, 0, now
        ));
        emit BatchFlagged(_batchId, _reason, msg.sender);
    }

    /// 清除异常标记
    function clearAbnormal(bytes32 _batchId) public onlyRegulator {
        batchAbnormal[_batchId] = false;
        emit AbnormalCleared(_batchId);
    }

    /// 提交审计
    function processAudit(
        bytes32 _batchId,
        string memory _auditType,
        string memory _description,
        string memory _evidenceHash
    ) public onlyRegulator {
        uint256 auditId = batchAuditCounts[_batchId];
        batchAuditCounts[_batchId] = auditId + 1;
        batchAuditRecords[_batchId].push(AuditRecord(
            auditId, _batchId, _auditType, _description, _evidenceHash,
            msg.sender, 0, now
        ));
        emit AuditSubmitted(_batchId, auditId, msg.sender);
    }

    /// 关闭审计
    function resolveAudit(bytes32 _batchId, uint256 _auditId) public onlyRegulator {
        AuditRecord[] storage records = batchAuditRecords[_batchId];
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].auditId == _auditId) {
                records[i].status = 1;
                emit AuditResolved(_batchId, _auditId);
                return;
            }
        }
        revert("Audit record not found");
    }

    /// 补充证据
    function appendEvidence(
        bytes32 _batchId,
        string memory _evidenceHash,
        string memory _description
    ) public onlyRegulator {
        batchEvidenceChain[_batchId].push(EvidenceItem(
            _evidenceHash, _description, msg.sender, now
        ));
        emit EvidenceAppended(_batchId, _evidenceHash);
    }

    // ========== 读函数（按索引查询，避免动态数组返回） ==========

    /// 检查批次是否异常
    function isBatchAbnormal(bytes32 _batchId) public view returns (bool) {
        return batchAbnormal[_batchId];
    }

    /// 获取审计记录数
    function getAuditCount(bytes32 _batchId) public view returns (uint256) {
        return batchAuditRecords[_batchId].length;
    }

    /// 获取单条审计记录
    function getAuditRecord(bytes32 _batchId, uint256 _index) public view returns (
        uint256 auditId,
        bytes32 batchId,
        string auditType,
        string description,
        string evidenceHash,
        address auditor,
        uint8 status,
        uint256 timestamp
    ) {
        AuditRecord storage r = batchAuditRecords[_batchId][_index];
        return (r.auditId, r.batchId, r.auditType, r.description, r.evidenceHash, r.auditor, r.status, r.timestamp);
    }

    /// 获取证据数量
    function getEvidenceCount(bytes32 _batchId) public view returns (uint256) {
        return batchEvidenceChain[_batchId].length;
    }

    /// 获取单条证据
    function getEvidenceItem(bytes32 _batchId, uint256 _index) public view returns (
        string evidenceHash,
        string description,
        address submitter,
        uint256 timestamp
    ) {
        EvidenceItem storage item = batchEvidenceChain[_batchId][_index];
        return (item.evidenceHash, item.description, item.submitter, item.timestamp);
    }
}
