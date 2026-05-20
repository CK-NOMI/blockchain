import fiscoClient from './fiscoClient.js';

export async function registerUser(userAddr, username, role, organization) {
  return fiscoClient.callContract('RoleManager', 'register', [userAddr, username, role, organization]);
}

export async function approveUser(userAddr) {
  return fiscoClient.callContract('RoleManager', 'approveUser', [userAddr]);
}

export async function suspendUser(userAddr) {
  return fiscoClient.callContract('RoleManager', 'suspendUser', [userAddr]);
}

export async function activateUser(userAddr) {
  return fiscoClient.callContract('RoleManager', 'activateUser', [userAddr]);
}

export async function changeRole(userAddr, newRole) {
  return fiscoClient.callContract('RoleManager', 'changeRole', [userAddr, newRole]);
}

export async function getUser(userAddr) {
  return fiscoClient.callReadOnly('RoleManager', 'getUser', [userAddr]);
}

export async function getUserList() {
  return fiscoClient.callReadOnly('RoleManager', 'getUserList', []);
}

export async function getUserCount() {
  return fiscoClient.callReadOnly('RoleManager', 'getUserCount', []);
}

export async function isUserActive(userAddr) {
  return fiscoClient.callReadOnly('RoleManager', 'isUserActive', [userAddr]);
}

export async function getUserRole(userAddr) {
  return fiscoClient.callReadOnly('RoleManager', 'getUserRole', [userAddr]);
}
