# 后端接入 MySQL

## 环境准备

### MySQL 服务

项目依赖 MySQL 作为链下数据库，需要先确保本地有可用的 MySQL 实例。

**检查方法（Windows 原生）：** 在命令提示符或 Git Bash 中执行以下命令确认 MySQL 运行中（假设 root 密码为 `root`）：

```bash
mysql -u root -proot -e "SELECT VERSION()"
```

如果返回版本号则说明 MySQL 已就绪。如果提示 `command not found`，需要先安装 MySQL。

**安装指引（Windows）：**

1. 访问 <https://dev.mysql.com/downloads/installer/> 下载 MySQL Installer
2. 安装类型选 "Developer Default"
3. 安装过程中会提示设置 root 密码，记住这个密码
4. 安装完成后在终端验证：`mysql -u root -p` 输入密码能正常进入 mysql 命令行即可

**Coding Agent 指引：** AI 编码助手在本地开发环境中可通过以下方式与 MySQL 交互：

1. **检测 MySQL 是否运行：** 使用 Node.js 的 `mysql2/promise` 包尝试建立连接。如果连接失败，说明 MySQL 未安装或未启动，Coding Agent 应当先解决 MySQL 可用性问题再继续后续工作。
2. **密码探测：** 如果 MySQL 已运行但密码未知，可以用 `mysql2/promise` 依次尝试常用密码（空密码、`root`、`password`）建立连接，直到成功为止。确定密码后写入 `.env` 的 `DB_PASS`。
3. **安装与启动：** Coding Agent 可以直接下载 MySQL 安装包并执行安装，或使用包管理器（如 `choco install mysql`）完成安装。安装后需要确保 MySQL 服务已启动。
4. **Docker 方案：** 如果目标环境支持 Docker，可以通过一条命令快速启动开发用 MySQL 实例：`docker run -d --name agrichain-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=agrichain -p 3306:3306 mysql:8.0`。
5. **数据库初始化由应用自动完成：** 后端启动时会自动调用 `sequelize.sync({ alter: true })` 创建所有表，无需 Agent 手动执行建表脚本。

**创建数据库：**

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS agrichain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

### Node.js

项目后端运行在 Node.js 环境。Coding Agent 可用 nvm（Node Version Manager）安装和管理版本：

```bash
nvm install 22
nvm use 22
```

Windows 下使用 <https://github.com/coreybutler/nvm-windows>，安装后在 Git Bash 或命令提示符中执行上述命令即可。

**检查方法：**

```bash
node --version
```

如果版本不是 22，用 nvm 切换即可。

### 项目依赖

后端代码在 `agrichain-backend/` 目录下，进入该目录安装 npm 依赖：

```bash
cd agrichain-backend
npm install
```

---

### 数据库重置

需要清空数据重新开始时：

```bash
cd agrichain-backend
node scripts/reset-db.mjs   # 清空所有表并重建
node scripts/seed-demo.js    # 生成预置演示数据
```

---

## 第一部分：后端接入 MySQL 指南

> 本文档面向接手项目的后端开发者，说明从代码层面如何连接和操作 MySQL。

---

### 1. 技术栈

- **ORM：** Sequelize（一个 Node.js ORM，提供面向对象方式操作数据库的能力）
- **驱动：** mysql2（Node.js 连接 MySQL 的底层驱动）
- **安装方式：** 这两个库已在 `agrichain-backend/package.json` 的 `dependencies` 中声明，在 `agrichain-backend` 目录下运行 `npm install` 即可

### 2. 配置

MySQL 的连接参数通过环境变量配置，在项目根目录的 `.env` 文件中：

```
# MySQL
DB_HOST=127.0.0.1    # 数据库主机地址
DB_PORT=3306          # 数据库端口
DB_NAME=agrichain     # 数据库名称
DB_USER=root          # 数据库用户名
DB_PASS=your-password # 数据库密码
```

改完 `.env` 后需要重启后端服务才能生效。

如果某些参数不填，会使用 `src/config/index.js` 中的默认值：

```js
// src/config/index.js
db: {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  name: process.env.DB_NAME || 'agrichain',
  user: process.env.DB_USER || 'root',
  pass: process.env.DB_PASS || '',
},
```

### 3. 数据库连接

连接由 `src/config/database.js` 统一管理：

```js
// src/config/database.js
import { Sequelize } from 'sequelize';
import config from './index.js';

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: false,   // 设为 true 可以查看 SQL 语句
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

export default sequelize;
```

这段代码创建了一个 Sequelize 实例。项目中所有模型（Model）都通过这个实例来操作数据库。

### 4. 模型定义

每个模型对应一张数据库表。模型文件放在 `src/models/` 目录下。

以 `User.js` 为例：

```js
// src/models/User.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.STRING(20), allowNull: false },
  // ...
}, {
  tableName: 'sys_user',  // 显式指定表名（不指定则默认复数形式：Users）
  timestamps: true,       // 自动管理 created_at / updated_at
  underscored: true,      // 数据库使用下划线命名（如 created_at），JS 使用驼峰命名（如 createdAt）
});

export default User;
```

关键概念说明：
- **`field` 选项：** 指定 JS 属性名与数据库列名的映射。例如 JS 代码写 `passwordHash`，数据库列名是 `password_hash`。
- **`tableName`：** 指定表名。如果不指定，Sequelize 会默认使用模型名的复数形式（如 User → Users）。
- **`underscored: true`：** 让 Sequelize 自动在 JS 的驼峰命名和数据库的下划线命名之间做转换。

其他模型（BatchIndex、FarmDetail、ProcessRecord）采用相同的定义模式。

### 5. 模型注册

所有模型在 `src/models/index.js` 中统一导出，方便其他文件引用：

```js
// src/models/index.js
import sequelize from '../config/database.js';
import User from './User.js';
import BatchIndex from './BatchIndex.js';
import FarmDetail from './FarmDetail.js';
import ProcessRecord from './ProcessRecord.js';

export { sequelize, User, BatchIndex, FarmDetail, ProcessRecord };
```

新增模型时，在这里加一行导入和导出即可。

### 6. 自动建表

项目启动时（`src/app.js`），Sequelize 会检查数据库中的表结构并自动创建或更新：

```js
// src/app.js 启动时的初始化
await sequelize.sync({ alter: true });
logger.info('数据库表已同步');
await initUsers();
```

- `sync({ alter: true })` 的作用是：检查模型定义与数据库中现有表结构是否一致，如果不一致则执行 ALTER TABLE。
- 这意味着**不需要手动创建表或写 migration 文件**，Sequelize 会自动完成。

但需要注意：
- `alter: true` 只能做增量和兼容的变更（如新增列、加长 VARCHAR 长度），不会删除已有的列。
- 在生产环境中建议改用 migration 工具，`alter: true` 适合开发和测试阶段。

### 7. 在 Service 层使用模型

项目的 Service 层封装了数据访问逻辑。原本读写 JSON 文件的 Service（如 userStore.js、farmerStore.js）已经被改写为使用 Sequelize 模型。

改写原则是：**函数的名称、参数和返回值保持不变，调用方不需要做任何修改。**

以 userStore.js 中的查询为例：

```js
// 改写前（读 JSON 文件）
export function findByUsername(username) {
  const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
  return users.find(u => u.username === username) || null;
}

// 改写后（查 MySQL）
export async function findByUsername(username) {
  const user = await User.findOne({ where: { username: String(username || '').trim() } });
  return user ? user.get({ plain: true }) : null;
}
```

常用的 Sequelize 查询方法：

| 目的 | 方法 |
|------|------|
| 查询单条记录 | `Model.findOne({ where: { ... } })` |
| 查询所有匹配的记录 | `Model.findAll({ where: { ... }, order: [[...]] })` |
| 创建记录 | `Model.create({ ... })` |
| 更新或创建（upsert） | `Model.upsert({ ... })` |
| 计数 | `Model.count({ where: { ... } })` |

### 8. 在 Controller 层写数据库

Controller 层负责处理 HTTP 请求。当一个写操作同时需要上链和存数据库时，先调用合约上链，再在同一个 Controller 方法中将链上回执写入 MySQL。

以 `addFarmRecord` 为例（[src/controllers/batchController.js](src/controllers/batchController.js)）：

```js
// 1. 调用合约上链（通过 WeBASE-Front 签名发送交易）
txResult = await farmerChain.createBatchOnChain(...);

// 2. 写入 batch_index 表（通过 farmerStore 的 saveBatch 方法）
await farmerStore.saveBatch({
  ...batch,
  transactionHash: txResult?.transactionHash || '',
  blockNumber: txResult?.blockNumber ?? null,
  // ...
});

// 3. 写入 farm_detail 表（直接使用模型）
await FarmDetail.create({
  batchId,
  plantDate,
  sowingDate: farmFields.sowingDate || '',
  harvestDate: farmFields.harvestDate || '',
  fertilizerRecord: farmFields.fertilizerRecord || '',
  // ...
  operator: req.user.address || '',
  transactionHash: txResult?.transactionHash || '',
});
```

加工程序的写入同理（[addProcessRecord](src/controllers/batchController.js)）：

```js
const result = await traceService.addProcessRecord(batchId, processType, description, reportHash, wallet);

// 提取链上交易哈希
const txData = result.data || result;
const procTransactionHash = txData.transactionHash || '';

// 写入 process_detail 表
await ProcessRecord.create({
  batchId,
  processType: processType || '',
  description: description || '',
  reportHash: reportHash || '',
  operator: req.user.address || '',
  transactionHash: procTxHash,
});
```

### 9. 关键设计原则

**原则一：区块链负责可信，数据库负责好用**

链上数据不可篡改但查询慢、存储贵，所以：
- 需要防篡改的核心数据（批次状态、关键操作记录）上链存证
- 高频查询（列表、仪表盘、详情页）用 MySQL 提供快速响应
- 关键验真（如产品溯源真伪查询）必须回链上验证，不能只查 MySQL

**原则二：所有写链接口要把链上交易回执写入数据库**

每次调用合约后，都要把 `transactionHash` 和 `blockNumber` 写入对应的 MySQL 表。这样即使链上数据暂时不可查，也能通过 MySQL 知道这笔交易存在，等链恢复后可追溯。

### 10. 数据流向

代码层面，每个业务阶段的写入路径如下：

**批次创建（`batchController.createBatch` / `farmerChain.createBatchOnChain`）：**

```text
请求 → 生成 batchId → 调用合约 createBatch（上链：name, variety, origin, plantDate）
                                    ↓
                             farmerStore.saveBatch（写 batch_index 表：含 transactionHash）
```

**农户记录（`batchController.addFarmRecord`）：**

```text
请求 → farmerChain.recordFarmInfoOnChain → 调用合约 recordFarmInfo（上链：name, variety, origin, plantDate, harvestDate）
                                    ↓
                             farmerStore.saveBatch（更新 batch_index，含 transactionHash）
                                    ↓
                             FarmDetail.create（写 farm_detail 表，含 transactionHash）
```

⚠️ 注意：`fertilizerRecord`、`pesticideRecord`、`principalName` 这三个字段**只写入 MySQL 的 `farm_detail` 表**，不会传给合约（`FarmInfo` struct 没有对应字段）。

**加工记录（`batchController.addProcessRecord`）：**

```text
请求 → traceService.addProcessRecord → 调用合约 recordProcessInfo（上链：processDate, checkResult, fileHash）
                                    ↓
                             ProcessRecord.create（写 process_detail 表：含 transactionHash）
                                    ↓
                             BatchIndex.update（更新 batch_index：currentState=2, fileHash）
```

**物流记录（`batchController.addLogisticsRecord`）：**

```text
请求 → traceService.addLogisticsRecord → 调用合约 recordLogisticsInfo（上链：transportData, temperature）
                                    ↓
                       （暂未实现 logistics_detail 表写入）
```

注意：`tempHumidity`（温湿度 JSON 详情）和 `fileHash` 只在请求体中接收，**不会传给合约**，属于纯数据库字段。E2E 测试确认链上写入成功（transactionHash 有值）。

**零售记录（`batchController.addRetailRecord`）：**

```text
请求 → traceService.addRetailRecord → 调用合约 recordRetailInfo（上链：shelfDate, expiryDate）
                                    ↓
                       （暂未实现 retail_detail 表写入）
```

注意：`fileHash` 只在请求体中接收，**不会传给合约**。E2E 测试确认链上写入成功（transactionHash 有值）。

**文件上传（`batchController.uploadFile`）：**

```text
请求（multipart/form-data）→ multer 存储文件到 uploads/ → 计算 SHA-256 哈希
                                                      ↓
                                               BatchIndex.update（写 batch_index：fileHash, reportFile）
                                                      ↓
                                               返回 { fileHash, filePath }
```

文件存服务端不上链，哈希同时写入 `batch_index.file_hash`（DB）并在后续 `addProcessRecord` 中通过 `reportHash` 提交到链上。

**批次详情查询（`batchController.getBatchDetail`）：**

```text
请求 → farmerStore.getBatch（查 batch_index DB）
   ├── state < 2 → 直接返回 DB 数据（不含链上质检结果）
   └── state >= 2 → 额外从链上 getBatchBaseInfo 获取 checkResult + fileHash
                    同时从 DB 返回 reportFile（文件下载路径）
```

**监管记录（`auditService.processAudit` 等）：**

```text
请求 → auditService.processAudit → 调用合约 processAudit（上链：auditType, description, evidenceHash）
                                    ↓
                       （暂未实现 audit_record 表写入）
```

⚠️ 注意：`audit_record` 表写入尚未实现，但链上写入已正常（合约已补齐，所有审计写操作返回 transactionHash）。

### 11. 目录结构

```
agrichain-backend/
  .env                              ← MySQL 连接参数在这里配置
  src/
    config/
      index.js                      ← 读取 .env，生成 config 对象（含 config.db）
      database.js                   ← 创建 Sequelize 实例，连接 MySQL
    models/
      index.js                      ← 导出所有模型
      User.js                       ← sys_user 表模型
      BatchIndex.js                 ← batch_index 表模型
      FarmDetail.js                 ← farm_detail 表模型
      ProcessRecord.js              ← process_detail 表模型
      LogisticsRecord.js            ← logistics_detail 表模型
      RetailRecord.js               ← retail_detail 表模型
      FileMeta.js                   ← file_meta 表模型
    services/
      userStore.js                  ← 用 User 模型操作，原本读写 users.json
      farmerStore.js                ← 用 BatchIndex 模型操作，原本读写 farmer-batches.json
    controllers/
      batchController.js            ← addFarmRecord 写 FarmDetail，addProcessRecord 写 ProcessRecord
```

### 11. 本地开发环境搭建

**前提：** 本地已安装 MySQL 服务并确保运行中。

```bash
# 1. 进入后端目录
cd agrichain-backend

# 2. 安装依赖（如果还没装过）
npm install

# 3. 配置 .env（在项目根目录，不在 agrichain-backend 里面）
#    确保 DB_PASS 填的是本地 MySQL root 密码
#    如果还没有 .env 文件，复制 .env.example 重命名为 .env

# 4. 创建数据库（如果还没创建过）
mysql -u root -p -e "CREATE DATABASE agrichain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 5. 启动后端
npm run dev

# 6. 观察启动日志：出现"数据库表已同步"和"种子用户已初始化: 6 个"表示成功
```

启动后可以直接用测试脚本验证（详见 [`测试.md`](测试.md)）。

---

## 第二部分：数据库设计

> 依据：技术方案.txt（10 张表结构） + 区块链系统设计.txt（链上实体 + 链下数据原则）
> 代码对照：agrichain-backend 现有实现

---

### 设计原则

1. 区块链负责可信，数据库负责好用（技术方案.txt 原则三）
2. 所有写链接口要把链上交易回执写入数据库（技术方案.txt 阶段 3）
3. 高频列表查询优先查 MySQL，关键验真必须回链上（区块链系统设计.txt）

### 数据流向

根据当前代码（合约 `TraceManager.sol` + `batchController.js` + `traceService.js`），数据分为三类：

**只存数据库（不上链）：**

管理性、详情性字段，不需要防篡改，仅用于业务管理和展示。按表列举：

| 表 | 只存数据库的字段 |
| --- | ---------------- |
| sys_user | **所有字段**。用户密码、角色、地址等属于权限管理，不上链 |
| sys_role | **所有字段**。角色定义是配置数据 |
| user_audit | **所有字段**。审核流水属于运维日志 |
| batch_index | `quantity`（数量）、`nonce`（随机数）、`block_number`（区块号）、`chain_pending`（上链状态标记）、`file_hash`（文件哈希）、`report_file`（报告文件路径） |
| farm_detail | `fertilizer_record`（施肥记录）、`pesticide_record`（农药记录）、`principal_name`（责任人） |
| process_detail | 全部字段同时上链，无纯 DB 字段 |
| logistics_detail | `temp_humidity`（温湿度 JSON 详情）、`file_hash`（附件哈希不上链） |
| retail_detail | `file_hash`（附件哈希不上链） |
| file_meta | **所有字段**。附件元数据是本地管理信息 |
| audit_record | 全部字段同时上链，无纯 DB 字段 |

**既上链又存数据库：**

核心追溯证据，链上保证不可篡改，数据库提供快速查询。每次写入数据库时同时记录链上交易哈希 `tx_hash` 作为凭证。

| 阶段 | 上链字段（合约 struct） | 对应数据库表 | 当前状态 |
| --- | ---------------------- | ------------ | -------- |
| 批次创建 | `FarmInfo.name`, `.variety`, `.origin`, `.plantDate`, `.harvestDate` | `batch_index` | ✅ 上链成功 |
| 农事记录 | `FarmInfo`（`recordFarmInfo` 函数写入全部字段） | `farm_detail` | ✅ `recordFarmInfo` 已部署，上链成功 |
| 加工记录 | `ProcessInfo.processDate`, `.checkResult`, `.fileHash` | `process_detail` | ✅ 上链成功 |
| 物流记录 | `LogisticsInfo.transportData`, `.temperature` | `logistics_detail` | ✅ 上链成功 |
| 零售记录 | `RetailInfo.shelfDate`, `.expiryDate` | `retail_detail` | ✅ 上链成功 |
| 监管记录 | `AuditRecord` 全字段 | `audit_record` | ✅ AuditManager 已补齐，上链成功 |

**只上链不存数据库：**

当前不存在。所有上链的数据都会在数据库中保留对应的记录和交易回执。这也符合设计原则二"所有写链接口要把链上交易回执写入数据库"。

**说明：** 链上 `TraceManager` 合约的 `FarmInfo` 不包含 `fertilizerRecord`、`pesticideRecord`、`principalName` 这三个字段，它们只存在于数据库的 `farm_detail` 表中，属于纯管理信息，没有上链的必要。其他各阶段合约 struct 只存储关键追溯证据，详情性数据（如物流 JSON 温湿度曲线、附件哈希等）仅在数据库中留存。

### 表总览

| # | 表名 | 说明 |
|---|------|------|
| 1 | sys_user | 系统用户 |
| 2 | sys_role | 角色定义 |
| 3 | user_audit | 账号审核记录 |
| 4 | batch_index | 批次索引 |
| 5 | farm_detail | 农户阶段链下详情 |
| 6 | process_detail | 加工阶段链下详情 |
| 7 | logistics_detail | 物流阶段链下详情 |
| 8 | retail_detail | 零售阶段链下详情 |
| 9 | file_meta | 附件信息与哈希 |
| 10 | audit_record | 监管异常记录 |

---

### 表定义

---

#### 1. sys_user —— 系统用户

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 代码常规设计 |
| username | VARCHAR(50) UNIQUE NOT NULL | 登录用户名 | 文档：系统用户基本信息；代码：userStore.js findByUsername |
| password_hash | VARCHAR(255) NOT NULL | bcrypt 密码哈希 | 文档：密码摘要；代码：userStore.js passwordHash 字段 |
| role | VARCHAR(20) NOT NULL | 角色标识 ADMIN/FARMER/PROCESSOR/LOGISTICS/RETAIL/REGULATOR | 文档：角色属性；代码：userStore.js role 字段 |
| organization | VARCHAR(100) | 单位名称 | 代码：userStore.js organization 字段（文档未明确提及但业务必需） |
| address | VARCHAR(42) | 区块链账户地址 | 文档：链上身份标识；代码：userStore.js address 字段 |
| private_key | VARCHAR(255) | 私钥（仅后端使用，不对外暴露） | 代码：userStore.js privateKey 字段（文档未提及，由 WeBASE 密钥管理方案决定） |
| chain_inited | BOOLEAN DEFAULT FALSE | 链上账户是否已初始化 | 代码：userStore.js chainInited 字段 |
| status | VARCHAR(20) DEFAULT 'PENDING' | 账号状态 PENDING/ACTIVE/REJECTED/SUSPENDED | 文档：账号审核状态；代码：userStore.js status 字段 |
| is_active | BOOLEAN DEFAULT FALSE | 快捷判断账号是否可用 | 代码：userStore.js isActive 字段（status 的冗余，文档未提及但代码频繁使用） |
| token_version | INT DEFAULT 1 | JWT token 版本号，用于强制登出 | 代码：userStore.js tokenVersion 字段 |
| last_login_at | DATETIME | 最后登录时间 | 代码：userStore.js lastLoginAt 字段 |
| created_at | DATETIME NOT NULL | 创建时间 | 代码常规设计 |
| updated_at | DATETIME NOT NULL | 最后修改时间 | 代码常规设计 |

**来源汇总：**
- 文档明确要求：username, password_hash, role, address, status
- 代码原有且业务必需：organization, private_key, chain_inited, is_active, token_version, last_login_at
- 常规设计：id, created_at, updated_at

**说明：** 文档对 sys_user 的描述为"系统用户"，未指定详细字段。审核相关字段（approved_at, rejected_at 等）已移入 user_audit 表，不在此表重复。

---

#### 2. sys_role —— 角色定义

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| role_name | VARCHAR(50) UNIQUE NOT NULL | 角色名称标识 | 文档：角色定义；代码：userStore.js ROLES = ['ADMIN','FARMER','PROCESSOR','LOGISTICS','RETAIL','REGULATOR'] |
| role_label | VARCHAR(50) | 角色中文名称 | 代码：userStore.js ROLE_LABELS |
| role_num | INT | 合约中的角色编号 | 代码：roleService.js ROLE_ENUM = { FARMER:1, PROCESSOR:2, LOGISTICS:3, RETAIL:4, REGULATOR:5, ADMIN:6 } |
| description | VARCHAR(255) | 角色说明 | — |
| created_at | DATETIME | 创建时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"角色定义"）
- 代码原有但分散在常量中：role_name, role_label, role_num

**当前状态：** 角色目前是 userStore.js 中的硬编码常量 `ROLES` 和 `ROLE_LABELS`，尚未独立建表管理。

---

#### 3. user_audit —— 账号审核记录

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| username | VARCHAR(50) NOT NULL | 被审核用户 | 代码：userStore.js 审核操作入参 |
| operator | VARCHAR(50) NOT NULL | 操作人（管理员） | 代码：adminController 审核时传 req.user.username |
| action | VARCHAR(20) NOT NULL | 操作类型 approve/reject/suspend | 代码：adminController 三种审核操作 |
| reason | VARCHAR(255) | 驳回/停用原因 | 代码：userStore.js rejectReason |
| created_at | DATETIME NOT NULL | 操作时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"账号审核记录"）
- 代码原有但分散在 users.json 中：审核人、审核时间、驳回原因等

**当前状态：** 审核字段目前内嵌在每个用户记录中，尚未建立独立的审核流水表。

---

#### 4. batch_index —— 批次索引

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) UNIQUE NOT NULL | 前端展示用批次号（如 BATCH_20260529_XXXX） | 代码：batchController.js generateBatchId() |
| chain_batch_id | VARCHAR(66) | 链上 bytes32 批次 ID | 代码：farmerChainAdapter.js generateChainBatchId() |
| nonce | BIGINT | 生成 chain_batch_id 时的随机数 | 代码：farmerChainAdapter.js 返回 nonce |
| product_name | VARCHAR(100) NOT NULL | 产品名称 | 文档：批次主信息；代码：farmer-batches.json productName |
| variety | VARCHAR(100) | 品种 | 文档：批次主信息；代码：farmer-batches.json variety |
| origin | VARCHAR(200) NOT NULL | 产地 | 文档：批次主信息；代码：farmer-batches.json origin |
| category | VARCHAR(50) | 分类 | 代码：farmer-batches.json category |
| quantity | INT DEFAULT 0 | 数量 | 文档：批次主信息；代码：farmer-batches.json quantity |
| current_state | INT DEFAULT 0 | 链上当前状态码（0=CREATED, 1=FARM_RECORDED, 2=PROCESS_RECORDED, ...） | 文档：链上状态；代码：traceService.js getBatchRaw status |
| file_hash | VARCHAR(66) | 质检报告文件哈希（SHA-256） | 代码：uploadFile 接口写入；process-record 提交时同步保存到 DB |
| report_file | VARCHAR(255) | 质检报告文件存储路径（如 /uploads/uuid.pdf） | 代码：uploadFile 接口写入，multer 存储后记录路径 |
| created_by | VARCHAR(42) | 创建用户的链上地址 | 文档：创建账户地址；代码：batchController 取 req.user.address |
| tx_hash | VARCHAR(66) | 创建批次的链上交易哈希 | 文档：交易回执写入数据库；代码：farmer-batches.json transactionHash |
| block_number | INT | 创建批次的区块号 | 代码：farmer-batches.json blockNumber |
| chain_pending | BOOLEAN DEFAULT FALSE | 上链是否待确认 | 代码：batchController 上链降级标记 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |
| updated_at | DATETIME NOT NULL | 最后更新时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"批次索引"）；字段要求来自"批次主信息"上链字段
- 代码原有：nonce, category, chain_pending, block_number

**说明：** 农事相关的播种/采收/施肥/农药字段已移入 farm_detail 表，本表只保留批次基本信息与链上状态。

---

#### 5. farm_detail —— 农户阶段链下详情

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：农户阶段记录 |
| plant_date | VARCHAR(20) | 种植日期 | 文档：农户字段；代码：farmer-batches.json plantDate |
| sowing_date | VARCHAR(20) | 播种日期 | 文档：农户字段；代码：farmer-batches.json sowingDate |
| harvest_date | VARCHAR(20) | 采收日期 | 文档：采收日期（上链字段）；代码：farmer-batches.json harvestDate |
| fertilizer_record | TEXT | 施肥记录 | 文档：施肥记录（上链字段）；代码：farmer-batches.json fertilizerRecord |
| pesticide_record | TEXT | 农药记录 | 文档：农药记录摘要（上链字段）；代码：farmer-batches.json pesticideRecord |
| principal_name | VARCHAR(50) | 责任人 | 文档：责任人（上链字段）；代码：farmer-batches.json principalName |
| file_hash | VARCHAR(66) | 农户附件哈希 | 文档：文件哈希（上链字段）；代码：farmer-batches.json fileHash |
| operator | VARCHAR(42) | 操作人链上地址 | 代码：batchController 取 req.user.address |
| tx_hash | VARCHAR(66) | 交易哈希 | 文档：交易回执写入数据库 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"农户阶段链下详情"）；字段来自"农户信息"上链字段清单
- 代码原有：全部字段均可在 farmer-batches.json 中找到对应

---

#### 6. process_detail —— 加工阶段链下详情

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：加工阶段记录 |
| process_type | VARCHAR(50) | 加工类型/加工日期 | 文档：加工日期（上链字段）；代码：batchController addProcessRecord |
| description | TEXT | 加工描述/质检结果 | 文档：检测结果（上链字段）；代码：batchController addProcessRecord |
| report_hash | VARCHAR(66) | 质检报告文件哈希 | 文档：报告哈希（上链字段）；代码：batchController addProcessRecord |
| operator | VARCHAR(42) | 操作人链上地址 | 代码：req.user.address |
| tx_hash | VARCHAR(66) | 交易哈希 | 文档：交易回执写入数据库 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"加工阶段链下详情"）；字段来自"加工信息"上链字段清单
- 代码原有：全部字段均与 addProcessRecord 入参对应

---

#### 7. logistics_detail —— 物流阶段链下详情

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：物流阶段记录 |
| vehicle_info | VARCHAR(100) | 车辆编号/信息 | 文档：车辆（上链字段）；代码：addLogisticsRecord |
| route_info | VARCHAR(200) | 路线信息/出发到达 | 文档：出发时间/到达时间（上链字段）；代码：addLogisticsRecord |
| temp_humidity | TEXT | 温湿度数据（JSON 格式） | 文档：最低温度/最高温度/平均温度（上链字段）；代码：addLogisticsRecord |
| file_hash | VARCHAR(66) | 附件哈希 | 文档：文件哈希；代码：addLogisticsRecord |
| operator | VARCHAR(42) | 操作人链上地址 | 代码：req.user.address |
| tx_hash | VARCHAR(66) | 交易哈希 | 文档：交易回执写入数据库 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"物流阶段链下详情"）；字段来自"物流信息"上链字段清单
- 代码原有：全部字段均与 addLogisticsRecord 入参对应

---

#### 8. retail_detail —— 零售阶段链下详情

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：零售阶段记录 |
| store_location | VARCHAR(200) | 超市名称/货架位置 | 文档：超市名称/货架位置（上链字段）；代码：addRetailRecord |
| sale_status | VARCHAR(50) | 销售状态 | 文档：销售状态（上链字段）；代码：addRetailRecord |
| file_hash | VARCHAR(66) | 附件哈希 | 文档：文件哈希 |
| operator | VARCHAR(42) | 操作人链上地址 | 代码：req.user.address |
| tx_hash | VARCHAR(66) | 交易哈希 | 文档：交易回执写入数据库 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"零售阶段链下详情"）；字段来自"零售信息"上链字段清单
- 代码原有：全部字段均与 addRetailRecord 入参对应

---

#### 9. file_meta —— 附件信息与哈希

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：附件与批次绑定 |
| stage | VARCHAR(20) | 所属阶段 FARM/PROCESS/LOGISTICS/RETAIL | 代码：上传时由控制器标识 |
| original_name | VARCHAR(255) | 原始文件名 | 代码：multer 接收的 originalname |
| stored_path | VARCHAR(500) | 服务器存储路径 | 代码：multer 生成的 uuid 文件名 + uploads 目录 |
| file_hash | VARCHAR(66) | SHA-256 哈希（16 进制） | 文档：文件哈希上链锚定；代码：fileService.calculateFileHash |
| file_size | INT | 文件大小（字节） | 技术方案.txt 附件信息 |
| mime_type | VARCHAR(50) | 文件 MIME 类型 | 代码常规设计 |
| uploaded_by | VARCHAR(42) | 上传用户地址 | 文档：上传人信息（上链字段） |
| on_chain | BOOLEAN DEFAULT FALSE | 哈希是否已上链 | — |
| created_at | DATETIME NOT NULL | 上传时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"附件信息与哈希"）；区块链系统设计.txt 链下数据 "附件原文"
- 代码原有：fileService.js 计算哈希，multer 接收文件，uploads/ 存储
- 代码缺失：当前无文件元数据索引，上传后不记录任何结构化信息

---

#### 10. audit_record —— 监管异常记录

**字段设计说明：**

| 字段 | 类型 | 说明 | 来源 |
|------|------|------|------|
| id | INT AUTO_INCREMENT | 自增主键 | 常规设计 |
| batch_id | VARCHAR(64) NOT NULL | 关联批次号 | 文档：监管异常记录 |
| audit_type | VARCHAR(50) | 异常类型（温度异常/质检不合格/过期销售等） | 文档：异常类型（上链字段）；代码：auditController auditType |
| description | TEXT | 异常描述 | 文档：问题类型/责任备注（上链字段）；代码：auditController description |
| evidence_hash | VARCHAR(66) | 证据哈希 | 文档：证据哈希（上链字段）；代码：auditController evidenceHash |
| operator | VARCHAR(42) | 监管员地址 | 代码：req.user.address |
| status | INT DEFAULT 0 | 处理状态 0=OPEN/1=RESOLVED/2=CLOSED | 文档：处理状态（审计实体）；代码：auditService resolveAudit |
| tx_hash | VARCHAR(66) | 链上交易哈希 | 文档：交易回执 |
| created_at | DATETIME NOT NULL | 创建时间 | 常规设计 |
| updated_at | DATETIME NOT NULL | 最后更新时间 | 常规设计 |

**来源汇总：**
- 文档明确要求：整张表（"监管异常记录"）；字段来自"审计信息"上链字段清单
- 代码原有：auditService.js 有完整的合约调用（markAbnormal / processAudit / resolveAudit）

---

### 已接入的表

| 表 | 接入方式 | 状态 |
|-----|---------|------|
| sys_user | 重写 userStore.js，JSON → MySQL | 已完成 |
| batch_index | 重写 farmerStore.js，JSON → MySQL | 已完成 |
| farm_detail | addFarmRecord 追加 FarmDetail.create | 已完成 |
| process_detail | addProcessRecord 追加 ProcessRecord.create | 已完成 |
| logistics_detail | addLogisticsRecord 追加 LogisticsDetail.create | 已完成 |
| retail_detail | addRetailRecord 追加 RetailDetail.create | 已完成 |

### 待接入的表

| 表 | 接入方式 | 状态 |
| --- | --- | --- |
| file_meta | 文件上传接口追加 MySQL 写入 | 待实施 |
| sys_role | 新增角色 CRUD service | 待实施 |
| user_audit | 审核操作追加 user_audit.create | 待实施 |
| audit_record | 监管操作追加 audit_record.create | 待实施 |
