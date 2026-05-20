import fiscoClient from '../services/fiscoClient.js';
import * as roleService from '../services/roleService.js';
import logger from '../utils/logger.js';

export async function getUsers(req, res) {
  try {
    const addrs = await roleService.getUserList();
    const users = [];
    for (const addr of addrs) {
      try {
        const u = await roleService.getUser(addr);
        users.push({
          address: u.userAddr,
          username: u.username,
          role: ['None', 'Admin', 'Farmer', 'Processor', 'Logistics', 'Retail', 'Regulator'][u.role] || 'Unknown',
          organization: u.organization,
          isActive: u.isActive,
          createdAt: new Date(Number(u.createdAt)).toISOString(),
        });
      } catch { /* skip */ }
    }
    res.json({ code: 0, data: users, msg: 'ok' });
  } catch (err) {
    res.json({ code: 0, data: [], msg: 'ok' });
  }
}

export async function approveUser(req, res) {
  try {
    const { addr } = req.params;
    const result = await roleService.approveUser(addr);
    logger.info({ addr }, '用户审批通过');
    res.json({ code: 0, data: result, msg: '用户审核通过' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '审批失败' });
  }
}

export async function suspendUser(req, res) {
  try {
    const { addr } = req.params;
    const result = await roleService.suspendUser(addr);
    logger.info({ addr }, '用户停用');
    res.json({ code: 0, data: result, msg: '用户已停用' });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, msg: err.message || '停用失败' });
  }
}

export async function getNodeStatus(_req, res) {
  try {
    const info = await fiscoClient.getChainInfo();
    const nodeCount = fiscoClient.providers.length;
    res.json({
      code: 0,
      data: {
        nodeCount,
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
    res.json({ code: 0, data: [], msg: '链上日志可通过事件监听获取' });
  } catch (err) {
    res.json({ code: 0, data: [], msg: 'ok' });
  }
}
