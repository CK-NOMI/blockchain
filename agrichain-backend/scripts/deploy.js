import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const RPC_URL = (process.env.FISCO_RPC_URLS || 'http://127.0.0.1:8545').split(',')[0].trim();

async function rpc(method, params = []) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result;
}

function loadContract(name) {
  const abisDir = path.resolve(__dirname, '../src/contracts/abis');
  const abiPath = path.join(abisDir, `src_contracts_${name}_sol_${name}.abi`);
  const binPath = path.join(abisDir, `src_contracts_${name}_sol_${name}.bin`);
  if (!fs.existsSync(abiPath)) throw new Error(`ABI not found: ${abiPath}`);
  if (!fs.existsSync(binPath)) throw new Error(`Bytecode not found: ${binPath}`);
  return {
    abi: JSON.parse(fs.readFileSync(abiPath, 'utf8')),
    bytecode: '0x' + fs.readFileSync(binPath, 'utf8').trim(),
  };
}

async function sendLegacyTx(wallet, txParams) {
  const chainId = parseInt(await rpc('eth_chainId'), 16);
  const nonce = parseInt(await rpc('eth_getTransactionCount', [wallet.address, 'latest']), 16);

  const tx = {
    type: 0, // Legacy transaction (NO EIP-2718 prefix)
    chainId,
    nonce,
    gasPrice: 0,
    gasLimit: txParams.gasLimit || 30000000,
    to: txParams.to || null,
    value: 0,
    data: txParams.data || '0x',
  };

  const signedTx = await wallet.signTransaction(tx);
  console.log('  发送交易...');
  const txHash = await rpc('eth_sendRawTransaction', [signedTx]);
  console.log('  交易哈希:', txHash);

  let receipt = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    receipt = await rpc('eth_getTransactionReceipt', [txHash]);
    if (receipt && receipt.blockNumber) break;
    if (i % 5 === 0) process.stdout.write(`  等待确认... (${i + 1}s)\n`);
  }

  if (!receipt) throw new Error(`Transaction ${txHash} not mined`);
  if (receipt.status === '0x0') {
    console.error('  交易失败!');
    console.error('  Receipt:', JSON.stringify(receipt));
    throw new Error('Transaction reverted');
  }

  console.log('  区块高度:', parseInt(receipt.blockNumber, 16));
  console.log('  合约地址:', receipt.contractAddress || '(none)');
  return { txHash, receipt };
}

async function deployContract(wallet, abi, bytecode, args = []) {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction(...args);
  const result = await sendLegacyTx(wallet, { data: deployTx.data, gasLimit: 30000000 });
  return result.receipt.contractAddress;
}

async function callContract(wallet, contractAddr, abi, method, args = []) {
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData(method, args);
  await sendLegacyTx(wallet, { to: contractAddr, data, gasLimit: 3000000 });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('连接 FISCO BCOS 节点:', RPC_URL);

  const blockNum = await rpc('eth_blockNumber');
  console.log('当前区块:', parseInt(blockNum, 16));

  // Setup wallet
  let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const wallet = ethers.Wallet.createRandom();
    privateKey = wallet.privateKey;
    console.log('已生成新部署账户:');
    console.log('  地址:', wallet.address);
    console.log('  私钥:', privateKey);
  }
  const wallet = new ethers.Wallet(privateKey);
  console.log('部署账户:', wallet.address);

  // Load contracts
  const roleArtifact = loadContract('RoleManager');
  const traceArtifact = loadContract('TraceManager');
  const auditArtifact = loadContract('AuditManager');

  // Deploy RoleManager
  console.log('\n=== 部署 RoleManager ===');
  const roleAddr = await deployContract(wallet, roleArtifact.abi, roleArtifact.bytecode);

  // Deploy TraceManager
  console.log('\n=== 部署 TraceManager ===');
  const traceAddr = await deployContract(wallet, traceArtifact.abi, traceArtifact.bytecode, [roleAddr]);

  // Deploy AuditManager
  console.log('\n=== 部署 AuditManager ===');
  const auditAddr = await deployContract(wallet, auditArtifact.abi, auditArtifact.bytecode, [roleAddr]);

  // Set TraceManager on AuditManager
  console.log('\n=== 配置 AuditManager.setTraceManager ===');
  await callContract(wallet, auditAddr, auditArtifact.abi, 'setTraceManager', [traceAddr]);
  console.log('AuditManager.traceManager =', traceAddr);

  // Save to .env
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  const chainId = parseInt(await rpc('eth_chainId'), 16);

  const updates = {
    'ROLE_MANAGER_ADDRESS': roleAddr,
    'TRACE_MANAGER_ADDRESS': traceAddr,
    'AUDIT_MANAGER_ADDRESS': auditAddr,
    'FISCO_CHAIN_ID': chainId,
    'DEPLOYER_PRIVATE_KEY': privateKey,
    'DEPLOYER_ADDRESS': wallet.address,
  };

  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=.*`, 'm');
    if (envContent.match(re)) {
      envContent = envContent.replace(re, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envPath, envContent);

  console.log('\n===== 部署完成 =====');
  console.log('RoleManager:', roleAddr);
  console.log('TraceManager:', traceAddr);
  console.log('AuditManager:', auditAddr);
  console.log('Deployer:', wallet.address);
  console.log('合约地址已写入 .env');
}

main().catch((err) => {
  console.error('部署失败:', err.message || err);
  process.exit(1);
});
