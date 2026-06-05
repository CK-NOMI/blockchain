import fiscoClient from '../services/fiscoClient.js';
import * as roleService from '../services/roleService.js';
import * as userStore from '../services/userStore.js';
import * as adminLogStore from '../services/adminLogStore.js';
import logger from '../utils/logger.js';

// 管理员模块：用户审批、角色管理、链上状态查询
// 写操作（审批/停用/改角色）均通过 WeBASE-Front 签名发送至 FISCO BCOS

export async function getUsers(req, res) {
  try {
    const users = await userStore.listUsers(req.query || {});
    res.json({ code: 0, data: users, summary: await userStore.getSummary(), msg: 'ok' });
  } catch (err) {
    res.json({ code: 0, data: [], summary: await userStore.getSummary(), msg: 'ok' });
  }
}

export async function approveUser(req, res) {
  try {
    const { addr } = req.params;
    // 从 userStore 获取用户角色，传给合约 authorizeRole
    const storeUser = await userStore.findByAddress(addr);
    if (!storeUser) {
      return res.status(404).json({ code: 404, data: null, msg: '用户不存在，请先在系统注册' });
    }
    const roleNum = roleService.ROLE_ENUM[storeUser.role];
    if (!roleNum) {
      return res.status(400).json({ code: 400, data: null, msg: `无法识别的角色: ${storeUser.role}` });
    }
    // 使用部署者账户（系统管理员）签名，在链上授权角色
    const result = await roleService.approveUser(addr, roleNum, storeUser.username);
    await userStore.approveUser(addr, req.user.username);
    logger.info({ addr, operator: req.user.username, role: storeUser.role }, '用户审批通过');
    adminLogStore.addLog('approve', addr, storeUser.username, req.user.username, { role: storeUser.role });
    res.json({ code: 0, data: result, msg: '用户审核通过' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '审批失败' });
  }
}

export async function rejectUser(req, res) {
  try {
    const { addr } = req.params;
    const reason = req.body?.reason || '管理员驳回';
    const user = await userStore.rejectUser(addr, reason, req.user.username);
    logger.info({ addr, operator: req.user.username, reason }, '用户驳回');
    adminLogStore.addLog('reject', addr, user.username, req.user.username, { reason });
    res.json({ code: 0, data: user, msg: '用户已驳回' });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, data: null, msg: err.message || '驳回失败' });
  }
}

export async function suspendUser(req, res) {
  try {
    const { addr } = req.params;
    const storeUser = await userStore.findByAddress(addr);
    // 链上撤销角色
    const result = await roleService.suspendUser(addr);
    await userStore.suspendUser(addr, req.user.username);
    logger.info({ addr, operator: req.user.username }, '用户停用');
    adminLogStore.addLog('suspend', addr, storeUser?.username || addr, req.user.username);
    res.json({ code: 0, data: result, msg: '用户已停用' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '停用失败' });
  }
}

export async function changeUserRole(req, res) {
  try {
    const { addr } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ code: 400, data: null, msg: '目标角色不能为空' });
    }
    const roleNum = roleService.ROLE_ENUM[role];
    if (!roleNum) {
      return res.status(400).json({ code: 400, data: null, msg: `无法识别的角色: ${role}` });
    }
    // 链上：先撤销旧角色，再授权新角色
    await roleService.changeRole(addr, roleNum);
    const user = await userStore.changeUserRole(addr, role, req.user.username);
    logger.info({ addr, role, operator: req.user.username }, '用户角色变更');
    adminLogStore.addLog('changeRole', addr, user.username, req.user.username, { newRole: role });
    res.json({ code: 0, data: { ...user, onChain: true }, msg: '用户角色已更新' });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, data: null, msg: err.message || '角色更新失败' });
  }
}

export async function getNodeStatus(_req, res) {
  try {
    const info = await fiscoClient.getChainInfo();
    res.json({
      code: 0,
      data: {
        nodeCount: 1,
        blockHeight: info.blockNumber,
        chainId: info.chainId,
        status: info.blockNumber > 0 ? 'online' : 'offline',
      },
      msg: 'ok',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取节点状态失败' });
  }
}

export async function getChainInfo(_req, res) {
  try {
    const info = await fiscoClient.getChainInfo();
    res.json({ code: 0, data: info, msg: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取链信息失败' });
  }
}

export async function getContractConfig(_req, res) {
  try {
    res.json({
      code: 0,
      data: {
        contracts: [
          { name: 'RoleManager', address: process.env.ROLE_MANAGER_ADDRESS || '0x...', version: '1.0.0', status: 'deployed' },
          { name: 'TraceManager', address: process.env.TRACE_MANAGER_ADDRESS || '0x...', version: '1.0.0', status: 'deployed' },
          { name: 'AuditManager', address: process.env.AUDIT_MANAGER_ADDRESS || '0x...', version: '1.0.0', status: 'deployed' },
        ],
      },
      msg: 'ok',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '获取合约配置失败' });
  }
}

export async function getLogs(req, res) {
  try {
    const logs = adminLogStore.listLogs();
    res.json({ code: 0, data: logs, msg: 'ok' });
  } catch (err) {
    res.json({ code: 0, data: [], msg: 'ok' });
  }
}
