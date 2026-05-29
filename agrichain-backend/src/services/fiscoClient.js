import { ethers } from 'ethers';
import config from '../config/index.js';
import contractsConfig from '../config/contracts.js';
import contractsV2 from '../config/contractsV2.js';

class FiscoClient {
  constructor() {
    this.providers = config.fisco.rpcUrls.filter(Boolean);
    this.currentRpc = this.providers[0] || 'http://127.0.0.1:8545';
    this.chainId = config.fisco.chainId;
    this.systemWallet = null;
    this._initSystemWallet();
  }

  _initSystemWallet() {
    const pk = config.fisco.systemPrivateKey;
    if (pk && pk !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      this.systemWallet = new ethers.Wallet(pk);
    }
  }

  async rpc(method, params = []) {
    const res = await fetch(this.currentRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });
    const json = await res.json();
    if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
    return json.result;
  }

  async sendLegacyTx(wallet, { to, data, gasLimit = 30000000 }) {
    if (!this.chainId) this.chainId = parseInt(await this.rpc('eth_chainId'), 16);
    const nonce = parseInt(await this.rpc('eth_getTransactionCount', [wallet.address, 'latest']), 16);

    const tx = {
      type: 0, // Legacy
      chainId: this.chainId,
      nonce,
      gasPrice: 0,
      gasLimit,
      to: to || null,
      value: 0,
      data: data || '0x',
    };

    const signedTx = await wallet.signTransaction(tx);
    const txHash = await this.rpc('eth_sendRawTransaction', [signedTx]);

    let receipt = null;
    for (let i = 0; i < 30; i++) {
      await this.sleep(1000);
      receipt = await this.rpc('eth_getTransactionReceipt', [txHash]);
      if (receipt && receipt.blockNumber) break;
    }

    if (!receipt) throw new Error(`Transaction ${txHash} not mined`);
    if (receipt.status === '0x0') throw new Error('Transaction reverted');
    return { txHash, blockNumber: parseInt(receipt.blockNumber, 16), receipt };
  }

  async callReadOnly(name, method, args = []) {
    const cfg = contractsConfig[name];
    if (!cfg || !cfg.address) throw new Error(`Contract ${name} not configured`);
    const iface = new ethers.Interface(cfg.abi);
    const data = iface.encodeFunctionData(method, args);
    const result = await this.rpc('eth_call', [{ to: cfg.address, data }, 'latest']);
    if (result === '0x') return null;
    try {
      const decoded = iface.decodeFunctionResult(method, result);
      return decoded.length === 1 ? decoded[0] : decoded;
    } catch {
      return result;
    }
  }

  async callContract(name, method, args = []) {
    if (!this.systemWallet) throw new Error('System signer not configured');
    const cfg = contractsConfig[name];
    if (!cfg || !cfg.address) throw new Error(`Contract ${name} not configured`);
    const iface = new ethers.Interface(cfg.abi);
    const data = iface.encodeFunctionData(method, args);
    return this.sendLegacyTx(this.systemWallet, { to: cfg.address, data });
  }

  async callContractAs(wallet, name, method, args = []) {
    const cfg = contractsConfig[name];
    if (!cfg || !cfg.address) throw new Error(`Contract ${name} not configured`);
    const iface = new ethers.Interface(cfg.abi);
    const data = iface.encodeFunctionData(method, args);
    return this.sendLegacyTx(wallet, { to: cfg.address, data });
  }

  async deploy(name, args = []) {
    if (!this.systemWallet) throw new Error('System signer not configured');
    const cfg = contractsConfig[name];
    const factory = new ethers.ContractFactory(cfg.abi, cfg.bytecode, this.systemWallet);
    const deployTx = await factory.getDeployTransaction(...args);
    const result = await this.sendLegacyTx(this.systemWallet, {
      data: deployTx.data,
      gasLimit: 30000000,
    });
    return result;
  }

  async getChainInfo() {
    const [blockNumber, chainIdHex] = await Promise.all([
      this.rpc('eth_blockNumber'),
      this.rpc('eth_chainId'),
    ]);
    return {
      chainId: parseInt(chainIdHex, 16),
      blockNumber: parseInt(blockNumber, 16),
    };
  }

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
    return !!this.currentRpc;
  }

  // === 4号农户模块专用：V2 合约交互方法 ===

  async callReadOnlyFrom(name, method, args = [], from) {
    const cfg = contractsV2[name] || contractsConfig[name];
    if (!cfg || !cfg.address) throw new Error(`Contract ${name} not configured`);
    const iface = new ethers.Interface(cfg.abi);
    const data = iface.encodeFunctionData(method, args);
    const callParams = { to: cfg.address, data };
    if (from) callParams.from = from;
    const result = await this.rpc('eth_call', [callParams, 'latest']);
    if (result === '0x') return null;
    try {
      const decoded = iface.decodeFunctionResult(method, result);
      return decoded.length === 1 ? decoded[0] : decoded;
    } catch {
      return result;
    }
  }

  async callContractV2(name, method, args = []) {
    if (!this.systemWallet) throw new Error('System signer not configured');
    const cfg = contractsV2[name];
    if (!cfg || !cfg.address) throw new Error(`Contract ${name} not configured`);
    const iface = new ethers.Interface(cfg.abi);
    const data = iface.encodeFunctionData(method, args);
    return this.sendLegacyTx(this.systemWallet, { to: cfg.address, data });
  }

  // === V2 方法结束 ===

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

const fiscoClient = new FiscoClient();
export default fiscoClient;
