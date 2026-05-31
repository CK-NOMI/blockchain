import { ethers } from 'ethers';
import config from '../config/index.js';
import contractsConfig from '../config/contracts.js';
import fiscoConfig from '../config/fisco.js';

class FiscoClient {
  constructor() {
    this.webaseUrl = fiscoConfig.webaseFront.url;
    this.groupId = fiscoConfig.webaseFront.groupId;
    this.chainId = config.fisco.chainId;

    this.systemWallet = null;
    this._systemUserId = ''; // WeBASE-Front 中系统账户的标识（地址）
    this._initSystemWallet();
  }

  _initSystemWallet() {
    const pk = config.fisco.systemPrivateKey;
    if (pk && pk !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      this.systemWallet = new ethers.Wallet(pk);
      this._systemUserId = this.systemWallet.address;
    }
  }

  /**
   * 导入私钥至 WeBASE-Front，返回用户标识（地址）
   * 任一用户要调用写交易前，必须先用此方法导入密钥
   */
  async importKey(privateKey, userName) {
    const url = `${this.webaseUrl}/privateKey/import?privateKey=${privateKey}&userName=${encodeURIComponent(userName)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`导入 WeBASE 密钥失败: ${await res.text()}`);
    const data = await res.json();
    return data.address;
  }

  // ========== 合约配置查找 ==========

  async _getContractCfg(name) {
    const cfg = contractsConfig[name];
    if (cfg && cfg.address) return cfg;
    throw new Error(`合约 ${name} 未配置`);
  }

  // ========== 读操作：WeBASE-Front /trans/query-transaction ==========

  async callReadOnly(name, method, args = []) {
    const cfg = await this._getContractCfg(name);
    const iface = new ethers.Interface(cfg.abi);
    const encodeStr = iface.encodeFunctionData(method, await this._convertArgs(name, method, args));

    const body = {
      groupId: this.groupId,
      user: this._systemUserId || '0x0000000000000000000000000000000000000000',
      contractName: name,
      funcName: method,
      encodeStr,
      contractAddress: cfg.address,
      contractAbi: JSON.stringify(cfg.abi),
      useCns: false,
    };

    const res = await fetch(`${this.webaseUrl}/trans/query-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WeBASE-Front 查询失败: ${res.status} ${text}`);
    }

    const json = await res.json();

    // query-transaction 直接返回解码后的数组
    if (Array.isArray(json)) {
      if (json.length === 0) return null;
      return json.length === 1 ? json[0] : json;
    }

    // 回退：手动 ABI 解码原始输出
    try {
      const decoded = iface.decodeFunctionResult(method, json.result || json.output);
      return decoded.length === 1 ? decoded[0] : decoded;
    } catch {
      return json;
    }
  }

  /** 指定 from 地址的只读调用 */
  async callReadOnlyFrom(name, method, args = [], from) {
    const cfg = await this._getContractCfg(name);
    const iface = new ethers.Interface(cfg.abi);
    const encodeStr = iface.encodeFunctionData(method, await this._convertArgs(name, method, args));

    const body = {
      groupId: this.groupId,
      user: from || this._systemUserId || '0x0000000000000000000000000000000000000000',
      contractName: name,
      funcName: method,
      encodeStr,
      contractAddress: cfg.address,
      contractAbi: JSON.stringify(cfg.abi),
      useCns: false,
    };

    const res = await fetch(`${this.webaseUrl}/trans/query-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WeBASE-Front 查询失败: ${res.status} ${text}`);
    }

    const json = await res.json();
    if (Array.isArray(json)) {
      if (json.length === 0) return null;
      return json.length === 1 ? json[0] : json;
    }
    try {
      const decoded = iface.decodeFunctionResult(method, json.result || json.output);
      return decoded.length === 1 ? decoded[0] : decoded;
    } catch {
      return json;
    }
  }

  // ========== 写操作：WeBASE-Front /trans/handle ==========

  async _webaseTransact(name, method, args, userAddress, contractCfg) {
    const cfg = contractCfg || contractsConfig[name];
    if (!cfg || !cfg.address) throw new Error(`合约 ${name} 未配置`);

    // 注意：WeBASE-Front /trans/handle 不接受预编码的 encodeStr，
    // 必须传入原始参数 funcParam，由 WeBASE 自己用 Web3j 编码
    const body = {
      groupId: this.groupId,
      user: userAddress.toLowerCase(),
      contractName: name,
      funcName: method,
      funcParam: await this._convertArgs(name, method, args),
      contractAddress: cfg.address,
      contractAbi: cfg.abi,
      useCns: false,
    };

    const res = await fetch(`${this.webaseUrl}/trans/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WeBASE-Front 交易失败: ${res.status} ${text}`);
    }

    const json = await res.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(`WeBASE-Front 错误: ${json.message || json.errorMessage}`);
    }

    // 如果回执未就绪（status 缺失），轮询等待
    if (json.status === undefined && json.transactionHash) {
      try {
        const receipt = await this._waitReceipt(json.transactionHash);
        if (receipt && receipt.status !== undefined) {
          json.status = receipt.status;
          json.blockNumber = receipt.blockNumber || json.blockNumber;
        }
      } catch (e) {
        console.warn('[RECEIPT_POLL_FAIL] tx=%s %s', json.transactionHash, e.message.slice(0, 80));
      }
    }

    // 检查交易回执状态：status !== "0x0" 表示合约执行失败（revert / bad instruction 等）
    const txStatus = json.status;
    if (txStatus !== undefined && txStatus !== '0x0') {
      console.error('[RECEIPT_FAIL]', JSON.stringify({status: txStatus, statusOK: json.statusOK, msg: json.statusMsg || json.message, tx: json.transactionHash, method, args: args.slice(0,2)}));
      throw new Error(`交易回执失败: status=${txStatus}, msg=${json.statusMsg || json.message || 'unknown'}, tx=${json.transactionHash || ''}`);
    }

    return json;
  }

  /** 使用系统账户（部署者）签名发送交易 */
  async callContract(name, method, args = []) {
    if (!this._systemUserId) throw new Error('系统签名者未配置');
    return this._webaseTransact(name, method, args, this._systemUserId);
  }

  /** 使用指定钱包或地址签名发送交易（密钥须已导入 WeBASE-Front） */
  async callContractAs(walletOrAddress, name, method, args = []) {
    const userAddress = typeof walletOrAddress === 'string' ? walletOrAddress : walletOrAddress.address;
    return this._webaseTransact(name, method, args, userAddress);
  }

  // ========== 参数转换 ==========

  async _convertArgs(name, method, args) {
    // 自动将 string 参数转为 bytes32 hex（如果 ABI 期望 bytes32）
    let cfg;
    try { cfg = await this._getContractCfg(name); } catch { return args; }
    const iface = new ethers.Interface(cfg.abi);
    const fragment = iface.getFunction(method);
    if (!fragment) return args;
    return args.map((arg, i) => {
      const input = fragment.inputs[i];
      if (input && input.type === 'bytes32' && typeof arg === 'string' && !arg.startsWith('0x')) {
        return ethers.encodeBytes32String(arg);
      }
      return arg;
    });
  }

  // ========== 部署合约 ==========

  async deploy(name, args = []) {
    const cfg = contractsConfig[name];
    if (!cfg || !cfg.bytecode) throw new Error(`合约 ${name} 未配置 bytecode`);
    if (!this._systemUserId) throw new Error('系统签名者未配置');
    const factory = new ethers.ContractFactory(cfg.abi, cfg.bytecode, this.systemWallet);
    const deployTx = await factory.getDeployTransaction(...args);
    // 部署也用 WeBASE-Front
    const body = {
      groupId: this.groupId,
      user: this._systemUserId.toLowerCase(),
      contractName: name,
      funcName: '__Deploy__',
      encodeStr: deployTx.data,
      contractAddress: '',
      contractAbi: JSON.stringify(cfg.abi),
      useCns: false,
    };
    const res = await fetch(`${this.webaseUrl}/trans/handle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`部署失败: ${res.status}`);
    const json = await res.json();
    if (json.code !== undefined && json.code !== 0) {
      throw new Error(json.message || json.errorMessage || `部署失败: ${json.code}`);
    }
    return json;
  }

  // ========== 链上信息 ==========

  async getChainInfo() {
    const blockNumber = await this.getBlockNumber();
    return { chainId: this.chainId || 1, blockNumber };
  }

  async getBlockNumber() {
    const res = await fetch(`${this.webaseUrl}/${this.groupId}/web3/blockNumber`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return parseInt(text, 10);
  }

  // ========== 工具方法 ==========

  walletFromPrivateKey(pk) {
    return new ethers.Wallet(pk);
  }

  decodeEvent(contractName, log) {
    const cfg = contractsConfig[contractName];
    if (!cfg) return log;
    const iface = new ethers.Interface(cfg.abi);
    try {
      return iface.parseLog({ topics: [...log.topics], data: log.data });
    } catch {
      return log;
    }
  }

  isReady() {
    return !!this.webaseUrl;
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** 轮询等待交易回执，最多等 2 个区块间隔（约 12s） */
  async _waitReceipt(txHash, maxPolls = 24) {
    const url = `${this.webaseUrl}/${this.groupId}/web3/getTransactionReceipt`;
    for (let i = 0; i < maxPolls; i++) {
      try {
        let res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionHash: txHash }),
        });
        if (!res.ok) {
          // 部分 WeBASE 版本用 GET + query 参数
          res = await fetch(`${url}?transactionHash=${txHash}`);
        }
        if (res.ok) {
          const body = await res.json();
          const receipt = body.data || body.result || body;
          if (receipt && receipt.status !== undefined && receipt.status !== null) {
            return receipt;
          }
        }
      } catch { /* 继续轮询 */ }
      await this.sleep(500);
    }
    throw new Error(`等待交易回执超时: tx=${txHash}`);
  }
}

const fiscoClient = new FiscoClient();
export default fiscoClient;
