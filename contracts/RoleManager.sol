pragma solidity ^0.4.25;

contract RoleManager {
    // 定义6类角色
    enum RoleType { None, Farmer, Processor, Logistics, Retailer, Regulator, Admin }

    struct User {
        RoleType role;
        bool isValid;
        string name;
    }

    address public admin;
    mapping(address => User) public users;

    event RoleAuthorized(address indexed userAddress, RoleType role, string name);
    event RoleRevoked(address indexed userAddress);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() public {
        admin = msg.sender;
        users[msg.sender] = User(RoleType.Admin, true, "System Admin");
    }

    // 管理员审核并授权角色
    function authorizeRole(address _user, uint8 _role, string memory _name) public onlyAdmin {
        require(_role > 0 && _role <= 6, "Invalid role type");
        users[_user] = User(RoleType(_role), true, _name);
        emit RoleAuthorized(_user, RoleType(_role), _name);
    }

    // 取消角色权限
    function revokeRole(address _user) public onlyAdmin {
        users[_user].isValid = false;
        emit RoleRevoked(_user);
    }

    // 检查是否有特定角色权限
    function checkRole(address _user, uint8 _expectedRole) public view returns (bool) {
        if (!users[_user].isValid) return false;
        return uint8(users[_user].role) == _expectedRole;
    }
}
