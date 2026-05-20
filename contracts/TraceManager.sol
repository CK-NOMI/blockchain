pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2; 

// 1. 声明 RoleManager 合约
contract RoleManager {
    function checkRole(address _user, uint8 _expectedRole) public view returns (bool);
}

contract TraceManager {
    // 状态机定义
    enum State { Created, FarmRecorded, ProcessRecorded, LogisticsRecorded, RetailRecorded, Expired }

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
        State currentState;
        FarmInfo farm;
        ProcessInfo process;
        LogisticsInfo logistics;
        RetailInfo retail;
    }

    RoleManager private roleManager;
    mapping(bytes32 => ProductBatch) public batches;
    bytes32[] public batchIds; 

    event BatchCreated(bytes32 indexed batchId, string name, address indexed farmer);
    event ProcessUpdated(bytes32 indexed batchId, string checkResult, string fileHash);
    event LogisticsUpdated(bytes32 indexed batchId, string temperature);
    event RetailUpdated(bytes32 indexed batchId, string shelfDate, State state);

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
        batches[_batchId].currentState = State.FarmRecorded;
        batches[_batchId].farm = FarmInfo(_name, _variety, _origin, _plantDate, _harvestDate, msg.sender, block.timestamp);
        batchIds.push(_batchId);
        emit BatchCreated(_batchId, _name, msg.sender);
    }

    function recordProcessInfo(
        bytes32 _batchId,
        string memory _processDate,
        string memory _checkResult,
        string memory _fileHash
    ) public onlyRole(2) { 
        require(batches[_batchId].batchId != bytes32(0), "Batch does not exist");
        require(batches[_batchId].currentState == State.FarmRecorded, "Invalid state transition");
        batches[_batchId].process = ProcessInfo(_processDate, _checkResult, _fileHash, msg.sender, block.timestamp);
        batches[_batchId].currentState = State.ProcessRecorded;
        emit ProcessUpdated(_batchId, _checkResult, _fileHash);
    }

    function recordLogisticsInfo(
        bytes32 _batchId,
        string memory _transportData,
        string memory _temperature
    ) public onlyRole(3) { 
        require(batches[_batchId].currentState == State.ProcessRecorded, "Invalid state transition");
        batches[_batchId].logistics = LogisticsInfo(_transportData, _temperature, msg.sender, block.timestamp);
        batches[_batchId].currentState = State.LogisticsRecorded;
        emit LogisticsUpdated(_batchId, _temperature);
    }

    function recordRetailInfo(
        bytes32 _batchId,
        string memory _shelfDate,
        string memory _expiryDate
    ) public onlyRole(4) { 
        require(batches[_batchId].currentState == State.LogisticsRecorded, "Invalid state transition");
        batches[_batchId].retail = RetailInfo(_shelfDate, _expiryDate, msg.sender, block.timestamp);
        batches[_batchId].currentState = State.RetailRecorded;
        emit RetailUpdated(_batchId, _shelfDate, State.RetailRecorded);
    }

    function changeBatchState(bytes32 _batchId, uint8 _state) public {
        require(batches[_batchId].batchId != bytes32(0), "Batch missing");
        require(roleManager.checkRole(msg.sender, 4) || roleManager.checkRole(msg.sender, 5), "No permission");
        batches[_batchId].currentState = State(_state);
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
}
