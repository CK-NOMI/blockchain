import fiscoClient from './fiscoClient.js';

// 实际部署的 RoleManager ABI 函数: authorizeRole, revokeRole, checkRole, users, admin
export const ROLE_ENUM = { FARMER: 1, PROCESSOR: 2, LOGISTICS: 3, RETAIL: 4, REGULATOR: 5, ADMIN: 6 };

export async function approveUser(userAddr, role, name) {
  return fiscoClient.callContract('RoleManager', 'authorizeRole', [userAddr, role, name || '']);
}

export async function suspendUser(userAddr) {
  return fiscoClient.callContract('RoleManager', 'revokeRole', [userAddr]);
}

export async function changeRole(userAddr, newRole) {
  await fiscoClient.callContract('RoleManager', 'revokeRole', [userAddr]);
  return fiscoClient.callContract('RoleManager', 'authorizeRole', [userAddr, newRole, '']);
}

export async function getUser(userAddr) {
  return fiscoClient.callReadOnly('RoleManager', 'users', [userAddr]);
}

export async function checkRole(userAddr, expectedRole) {
  return fiscoClient.callReadOnly('RoleManager', 'checkRole', [userAddr, expectedRole]);
}

export async function getAdmin() {
  return fiscoClient.callReadOnly('RoleManager', 'admin', []);
}
