pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2; 

// 1. 声明 RoleManager 合约
contract RoleManager {
    function checkRole(address _user, uint8 _expectedRole) public view returns (bool);
}

contract TraceManager {
    // 状态机定义（用 uint8 常量而非 enum，允许后端在 0-10 范围内灵活映射）
    uint8 constant STATE_CREATED = 0;
    uint8 constant STATE_FARM_RECORDED = 1;
    uint8 constant STATE_PROCESS_RECORDED = 2;
    uint8 constant STATE_LOGISTICS_RECORDED = 3;
    uint8 constant STATE_RETAIL_RECORDED = 4;
    uint8 constant STATE_EXPIRED = 5;
    uint8 constant STATE_SOLD = 6;

    struct FarmInfo {
        string name;         
        string variety;      
        string origin;       
        string plantDate;    
        string harvestDate;  
        address operator;    
        uint256 timestamp;   
    }

    struct ProcessInfo {
        string processDate;  
        string checkResult;  
        string fileHash;     
        address operator;
        uint256 timestamp;
    }

    struct LogisticsInfo {
        string transportData; 
        string temperature;   
        address operator;
        uint256 timestamp;
    }

    struct RetailInfo {
        string shelfDate;    
        string expiryDate;   
        address operator;
        uint256 timestamp;
    }

    struct ProductBatch {
        bytes32 batchId;
        uint8 currentState;
        FarmInfo farm;
        ProcessInfo process;
        LogisticsInfo logistics;
        RetailInfo retail;
    }

    RoleManager private roleManager;
    mapping(bytes32 => ProductBatch) public batches;
    bytes32[] public batchIds; 

    event BatchCreated(bytes32 indexed batchId, string name, address indexed farmer);
    event FarmRecorded(bytes32 indexed batchId, string name, address indexed farmer);
    event ProcessUpdated(bytes32 indexed batchId, string checkResult, string fileHash);
    event LogisticsUpdated(bytes32 indexed batchId, string temperature);
    event RetailUpdated(bytes32 indexed batchId, string shelfDate, uint8 state);

    modifier onlyRole(uint8 _role) {
        require(roleManager.checkRole(msg.sender, _role), "Unauthorized role");
        _;
    }

    constructor(address _roleManagerAddress) public {
        roleManager = RoleManager(_roleManagerAddress);
    }

    // 【修复点 1】修改为 view，解决了 msg.sender 导致的 pure 错误
    function generateBatchId(
        string memory _name, 
        string memory _origin, 
        string memory _plantDate, 
        uint256 _nonce
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(_name, _origin, _plantDate, msg.sender, _nonce));
    }

    function createBatch(
        bytes32 _batchId,
        string memory _name,
        string memory _variety,
        string memory _origin,
        string memory _plantDate,
        string memory _harvestDate
    ) public onlyRole(1) {
        require(batches[_batchId].batchId == bytes32(0), "BatchID already exists");
        batches[_batchId].batchId = _batchId;
        batches[_batchId].currentState = STATE_CREATED;
        batchIds.push(_batchId);
        emit BatchCreated(_batchId, _name, msg.sender);
    }

    // 农户提交农事记录：必须从 CREATED 状态推进
    function recordFarmInfo(
        bytes32 _batchId,
        string memory _name,
        string memory _variety,
        string memory _origin,
        string memory _plantDate,
        string memory _harvestDate
    ) public onlyRole(1) {
        require(batches[_batchId].batchId != bytes32(0), "Batch does not exist");
        require(batches[_batchId].currentState == STATE_CREATED, "Farm record already submitted or batch not in CREATED state");
        batches[_batchId].farm = FarmInfo(_name, _variety, _origin, _plantDate, _harvestDate, msg.sender, block.timestamp);
        batches[_batchId].currentState = STATE_FARM_RECORDED;
        emit FarmRecorded(_batchId, _name, msg.sender);
    }

    function recordProcessInfo(
        bytes32 _batchId,
        string memory _processDate,
        string memory _checkResult,
        string memory _fileHash
    ) public onlyRole(2) { 
        require(batches[_batchId].batchId != bytes32(0), "Batch does not exist");
        require(batches[_batchId].currentState == STATE_FARM_RECORDED, "Invalid state transition");
        batches[_batchId].process = ProcessInfo(_processDate, _checkResult, _fileHash, msg.sender, block.timestamp);
        batches[_batchId].currentState = STATE_PROCESS_RECORDED;
        emit ProcessUpdated(_batchId, _checkResult, _fileHash);
    }

    // 加工后单独更新文件哈希（不改变状态，允许重复调用）
    function updateProcessFileHash(
        bytes32 _batchId,
        string memory _fileHash
    ) public onlyRole(2) {
        require(batches[_batchId].batchId != bytes32(0), "Batch does not exist");
        batches[_batchId].process.fileHash = _fileHash;
        emit ProcessUpdated(_batchId, batches[_batchId].process.checkResult, _fileHash);
    }

    function recordLogisticsInfo(
        bytes32 _batchId,
        string memory _transportData,
        string memory _temperature
    ) public onlyRole(3) {
        require(batches[_batchId].currentState == STATE_PROCESS_RECORDED, "Invalid state transition");
        batches[_batchId].logistics = LogisticsInfo(_transportData, _temperature, msg.sender, block.timestamp);
        batches[_batchId].currentState = STATE_LOGISTICS_RECORDED;
        emit LogisticsUpdated(_batchId, _temperature);
    }

    function recordRetailInfo(
        bytes32 _batchId,
        string memory _shelfDate,
        string memory _expiryDate
    ) public onlyRole(4) { 
        require(batches[_batchId].currentState == STATE_LOGISTICS_RECORDED, "Invalid state transition");
        batches[_batchId].retail = RetailInfo(_shelfDate, _expiryDate, msg.sender, block.timestamp);
        batches[_batchId].currentState = STATE_RETAIL_RECORDED;
        emit RetailUpdated(_batchId, _shelfDate, STATE_RETAIL_RECORDED);
    }

    function changeBatchState(bytes32 _batchId, uint8 _state) public onlyRole(4) {
        require(batches[_batchId].batchId != bytes32(0), "Batch missing");
        batches[_batchId].currentState = _state;
    }

    // 【修复点 2】将查询函数拆分为两个，彻底解决 "Stack too deep" 错误
    
    // 查询第一部分：状态与农户信息、加工信息
    function getBatchBaseInfo(bytes32 _batchId) public view returns (
        uint8 currentState,
        string memory farmName, string memory farmOrigin, uint256 farmTime,
        string memory checkResult, string memory fileHash, uint256 processTime
    ) {
        ProductBatch storage b = batches[_batchId];
        return (
            uint8(b.currentState),
            b.farm.name, b.farm.origin, b.farm.timestamp,
            b.process.checkResult, b.process.fileHash, b.process.timestamp
        );
    }

    // 查询第二部分：物流与零售信息
    function getBatchLogisticInfo(bytes32 _batchId) public view returns (
        string memory temperature, uint256 logisticsTime,
        string memory expiryDate, uint256 retailTime
    ) {
        ProductBatch storage b = batches[_batchId];
        return (
            b.logistics.temperature, b.logistics.timestamp,
            b.retail.expiryDate, b.retail.timestamp
        );
    }

    // 查询全链路时间戳（避免 Stack too deep，只返回时间戳，由后端从 MySQL 补充描述）
    function queryTimeline(bytes32 _batchId) public view returns (
        uint256 farmTime,
        uint256 processTime,
        uint256 logisticsTime,
        uint256 retailTime
    ) {
        ProductBatch storage b = batches[_batchId];
        return (
            b.farm.timestamp,
            b.process.timestamp,
            b.logistics.timestamp,
            b.retail.timestamp
        );
    }
}
