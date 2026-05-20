// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RoleManager.sol";

contract TraceManager {
    enum BatchStatus {
        Created,
        Farming,
        Submitted,
        Processing,
        Processed,
        Transporting,
        Delivered,
        Stored,
        OnSale,
        SoldOut,
        Abnormal
    }

    struct FarmRecord {
        string recordType;
        string description;
        string fileHash;
        uint256 timestamp;
        address operator;
    }

    struct ProcessRecord {
        string processType;
        string description;
        string reportHash;
        uint256 timestamp;
        address operator;
    }

    struct LogisticsRecord {
        string vehicleInfo;
        string routeInfo;
        string tempHumidity;
        string fileHash;
        uint256 timestamp;
        address operator;
    }

    struct RetailRecord {
        string storeLocation;
        string saleStatus;
        string fileHash;
        uint256 timestamp;
        address operator;
    }

    struct BatchInfo {
        string batchId;
        string productName;
        string origin;
        string category;
        uint256 quantity;
        address farmer;
        BatchStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    RoleManager public roleManager;

    mapping(string => BatchInfo) public batches;
    mapping(string => FarmRecord[]) public farmRecords;
    mapping(string => ProcessRecord[]) public processRecords;
    mapping(string => LogisticsRecord[]) public logisticsRecords;
    mapping(string => RetailRecord[]) public retailRecords;
    mapping(address => string[]) public farmerBatches;
    string[] public batchIdList;

    event BatchCreated(string indexed batchId, address indexed farmer, string productName, uint256 timestamp);
    event FarmRecordAdded(string indexed batchId, string recordType, string fileHash, uint256 timestamp);
    event ProcessRecordAdded(string indexed batchId, string processType, string reportHash, uint256 timestamp);
    event LogisticsRecordAdded(string indexed batchId, string vehicleInfo, string fileHash, uint256 timestamp);
    event RetailRecordAdded(string indexed batchId, string saleStatus, string fileHash, uint256 timestamp);
    event BatchStatusChanged(string indexed batchId, BatchStatus oldStatus, BatchStatus newStatus, uint256 timestamp);

    constructor(address _roleManager) {
        roleManager = RoleManager(_roleManager);
    }

    modifier onlyFarmer() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Farmer),
            "TraceManager: caller is not active farmer or admin"
        );
        _;
    }

    modifier onlyProcessor() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Processor),
            "TraceManager: caller is not active processor or admin"
        );
        _;
    }

    modifier onlyLogistics() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Logistics),
            "TraceManager: caller is not active logistics or admin"
        );
        _;
    }

    modifier onlyRetail() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Retail),
            "TraceManager: caller is not active retail or admin"
        );
        _;
    }

    modifier onlyRegulator() {
        require(
            msg.sender == roleManager.admin() ||
            (roleManager.isUserActive(msg.sender) &&
            roleManager.getUserRole(msg.sender) == RoleManager.Role.Regulator),
            "TraceManager: caller is not active regulator or admin"
        );
        _;
    }

    modifier batchExists(string calldata batchId) {
        require(batches[batchId].exists, "TraceManager: batch not found");
        _;
    }

    function createBatch(
        string calldata batchId,
        string calldata productName,
        string calldata origin,
        string calldata category,
        uint256 quantity
    ) external onlyFarmer {
        require(!batches[batchId].exists, "TraceManager: batch already exists");
        require(bytes(batchId).length > 0, "TraceManager: empty batchId");
        require(bytes(productName).length > 0, "TraceManager: empty productName");

        batches[batchId] = BatchInfo({
            batchId: batchId,
            productName: productName,
            origin: origin,
            category: category,
            quantity: quantity,
            farmer: msg.sender,
            status: BatchStatus.Created,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });

        farmerBatches[msg.sender].push(batchId);
        batchIdList.push(batchId);

        emit BatchCreated(batchId, msg.sender, productName, block.timestamp);
    }

    function addFarmRecord(
        string calldata batchId,
        string calldata recordType,
        string calldata description,
        string calldata fileHash
    ) external batchExists(batchId) onlyFarmer {
        require(batches[batchId].farmer == msg.sender, "TraceManager: not batch owner");

        farmRecords[batchId].push(FarmRecord({
            recordType: recordType,
            description: description,
            fileHash: fileHash,
            timestamp: block.timestamp,
            operator: msg.sender
        }));

        batches[batchId].updatedAt = block.timestamp;
        if (batches[batchId].status == BatchStatus.Created) {
            _updateStatus(batchId, BatchStatus.Farming);
        }

        emit FarmRecordAdded(batchId, recordType, fileHash, block.timestamp);
    }

    function addProcessRecord(
        string calldata batchId,
        string calldata processType,
        string calldata description,
        string calldata reportHash
    ) external batchExists(batchId) onlyProcessor {
        require(
            batches[batchId].status == BatchStatus.Submitted ||
            batches[batchId].status == BatchStatus.Processing,
            "TraceManager: batch not ready for processing"
        );

        processRecords[batchId].push(ProcessRecord({
            processType: processType,
            description: description,
            reportHash: reportHash,
            timestamp: block.timestamp,
            operator: msg.sender
        }));

        batches[batchId].updatedAt = block.timestamp;
        _updateStatus(batchId, BatchStatus.Processing);

        emit ProcessRecordAdded(batchId, processType, reportHash, block.timestamp);
    }

    function addLogisticsRecord(
        string calldata batchId,
        string calldata vehicleInfo,
        string calldata routeInfo,
        string calldata tempHumidity,
        string calldata fileHash
    ) external batchExists(batchId) onlyLogistics {
        require(
            batches[batchId].status == BatchStatus.Processed ||
            batches[batchId].status == BatchStatus.Transporting,
            "TraceManager: batch not ready for logistics"
        );

        logisticsRecords[batchId].push(LogisticsRecord({
            vehicleInfo: vehicleInfo,
            routeInfo: routeInfo,
            tempHumidity: tempHumidity,
            fileHash: fileHash,
            timestamp: block.timestamp,
            operator: msg.sender
        }));

        batches[batchId].updatedAt = block.timestamp;
        _updateStatus(batchId, BatchStatus.Transporting);

        emit LogisticsRecordAdded(batchId, vehicleInfo, fileHash, block.timestamp);
    }

    function addRetailRecord(
        string calldata batchId,
        string calldata storeLocation,
        string calldata saleStatus,
        string calldata fileHash
    ) external batchExists(batchId) onlyRetail {
        require(
            batches[batchId].status == BatchStatus.Delivered ||
            batches[batchId].status == BatchStatus.Stored,
            "TraceManager: batch not ready for retail"
        );

        retailRecords[batchId].push(RetailRecord({
            storeLocation: storeLocation,
            saleStatus: saleStatus,
            fileHash: fileHash,
            timestamp: block.timestamp,
            operator: msg.sender
        }));

        batches[batchId].updatedAt = block.timestamp;
        _updateStatus(batchId, BatchStatus.Stored);

        emit RetailRecordAdded(batchId, saleStatus, fileHash, block.timestamp);
    }

    function updateBatchStatus(string calldata batchId, BatchStatus newStatus)
        external
        batchExists(batchId)
    {
        BatchStatus oldStatus = batches[batchId].status;
        batches[batchId].status = newStatus;
        batches[batchId].updatedAt = block.timestamp;
        emit BatchStatusChanged(batchId, oldStatus, newStatus, block.timestamp);
    }

    function markAbnormal(string calldata batchId) external batchExists(batchId) onlyRegulator {
        batches[batchId].status = BatchStatus.Abnormal;
        batches[batchId].updatedAt = block.timestamp;
        emit BatchStatusChanged(batchId, batches[batchId].status, BatchStatus.Abnormal, block.timestamp);
    }

    function verifyFileHash(string calldata batchId, string calldata fileHash)
        external
        view
        batchExists(batchId)
        returns (bool found, string memory recordType)
    {
        FarmRecord[] storage frs = farmRecords[batchId];
        for (uint256 i = 0; i < frs.length; i++) {
            if (keccak256(abi.encodePacked(frs[i].fileHash)) == keccak256(abi.encodePacked(fileHash))) {
                return (true, frs[i].recordType);
            }
        }

        ProcessRecord[] storage prs = processRecords[batchId];
        for (uint256 i = 0; i < prs.length; i++) {
            if (keccak256(abi.encodePacked(prs[i].reportHash)) == keccak256(abi.encodePacked(fileHash))) {
                return (true, prs[i].processType);
            }
        }

        LogisticsRecord[] storage lrs = logisticsRecords[batchId];
        for (uint256 i = 0; i < lrs.length; i++) {
            if (keccak256(abi.encodePacked(lrs[i].fileHash)) == keccak256(abi.encodePacked(fileHash))) {
                return (true, "logistics");
            }
        }

        RetailRecord[] storage rrs = retailRecords[batchId];
        for (uint256 i = 0; i < rrs.length; i++) {
            if (keccak256(abi.encodePacked(rrs[i].fileHash)) == keccak256(abi.encodePacked(fileHash))) {
                return (true, rrs[i].saleStatus);
            }
        }

        return (false, "");
    }

    function getBatchDetail(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (BatchInfo memory)
    {
        return batches[batchId];
    }

    function getFarmRecords(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (FarmRecord[] memory)
    {
        return farmRecords[batchId];
    }

    function getProcessRecords(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (ProcessRecord[] memory)
    {
        return processRecords[batchId];
    }

    function getLogisticsRecords(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (LogisticsRecord[] memory)
    {
        return logisticsRecords[batchId];
    }

    function getRetailRecords(string calldata batchId)
        external
        view
        batchExists(batchId)
        returns (RetailRecord[] memory)
    {
        return retailRecords[batchId];
    }

    function getBatchesByFarmer(address farmer) external view returns (string[] memory) {
        return farmerBatches[farmer];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return batchIdList;
    }

    function getBatchCount() external view returns (uint256) {
        return batchIdList.length;
    }

    function _updateStatus(string memory batchId, BatchStatus newStatus) private {
        BatchStatus oldStatus = batches[batchId].status;
        batches[batchId].status = newStatus;
        batches[batchId].updatedAt = block.timestamp;
        emit BatchStatusChanged(batchId, oldStatus, newStatus, block.timestamp);
    }
}
