// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RoleManager {
    enum Role { None, Admin, Farmer, Processor, Logistics, Retail, Regulator }

    struct UserInfo {
        address userAddr;
        Role role;
        string username;
        string organization;
        bool isActive;
        uint256 createdAt;
        address approvedBy;
    }

    mapping(address => UserInfo) public users;
    mapping(address => bool) public isRegistered;
    address[] public userList;
    address public admin;

    event UserRegistered(address indexed userAddr, Role indexed role, string username, uint256 timestamp);
    event UserApproved(address indexed userAddr, address indexed approvedBy, uint256 timestamp);
    event UserSuspended(address indexed userAddr, address indexed suspendedBy, uint256 timestamp);
    event UserActivated(address indexed userAddr, address indexed activatedBy, uint256 timestamp);
    event RoleChanged(address indexed userAddr, Role oldRole, Role newRole, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "RoleManager: caller is not admin");
        _;
    }

    modifier onlyActive() {
        require(users[msg.sender].isActive, "RoleManager: account suspended");
        _;
    }

    modifier onlyActiveRole(Role _role) {
        require(users[msg.sender].isActive && users[msg.sender].role == _role, "RoleManager: unauthorized role");
        _;
    }

    constructor() {
        admin = msg.sender;
        users[admin] = UserInfo({
            userAddr: admin,
            role: Role.Admin,
            username: "admin",
            organization: "Platform",
            isActive: true,
            createdAt: block.timestamp,
            approvedBy: admin
        });
        isRegistered[admin] = true;
        userList.push(admin);
        emit UserRegistered(admin, Role.Admin, "admin", block.timestamp);
        emit UserApproved(admin, admin, block.timestamp);
    }

    function register(address userAddr, string calldata username, Role role, string calldata organization) external onlyAdmin {
        require(!isRegistered[userAddr], "RoleManager: already registered");
        require(role != Role.None, "RoleManager: invalid role");

        users[userAddr] = UserInfo({
            userAddr: userAddr,
            role: role,
            username: username,
            organization: organization,
            isActive: false,
            createdAt: block.timestamp,
            approvedBy: address(0)
        });
        isRegistered[userAddr] = true;
        userList.push(userAddr);
        emit UserRegistered(userAddr, role, username, block.timestamp);
    }

    function approveUser(address userAddr) external onlyAdmin {
        require(isRegistered[userAddr], "RoleManager: not registered");
        require(!users[userAddr].isActive, "RoleManager: already active");

        users[userAddr].isActive = true;
        users[userAddr].approvedBy = msg.sender;
        emit UserApproved(userAddr, msg.sender, block.timestamp);
    }

    function suspendUser(address userAddr) external onlyAdmin {
        require(isRegistered[userAddr], "RoleManager: not registered");
        require(users[userAddr].isActive, "RoleManager: already suspended");
        require(userAddr != admin, "RoleManager: cannot suspend admin");

        users[userAddr].isActive = false;
        emit UserSuspended(userAddr, msg.sender, block.timestamp);
    }

    function activateUser(address userAddr) external onlyAdmin {
        require(isRegistered[userAddr], "RoleManager: not registered");
        require(!users[userAddr].isActive, "RoleManager: already active");

        users[userAddr].isActive = true;
        emit UserActivated(userAddr, msg.sender, block.timestamp);
    }

    function changeRole(address userAddr, Role newRole) external onlyAdmin {
        require(isRegistered[userAddr], "RoleManager: not registered");
        require(newRole != Role.None, "RoleManager: invalid role");
        require(userAddr != admin, "RoleManager: cannot change admin role");

        Role oldRole = users[userAddr].role;
        users[userAddr].role = newRole;
        emit RoleChanged(userAddr, oldRole, newRole, block.timestamp);
    }

    function getUser(address userAddr) external view returns (UserInfo memory) {
        require(isRegistered[userAddr], "RoleManager: not registered");
        return users[userAddr];
    }

    function getUserList() external view returns (address[] memory) {
        return userList;
    }

    function getUserCount() external view returns (uint256) {
        return userList.length;
    }

    function isUserActive(address userAddr) external view returns (bool) {
        return isRegistered[userAddr] && users[userAddr].isActive;
    }

    function getUserRole(address userAddr) external view returns (Role) {
        require(isRegistered[userAddr], "RoleManager: not registered");
        return users[userAddr].role;
    }
}
