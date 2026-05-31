# 基于 FISCO BCOS 的农产品供应链溯源系统

本项目是《基于 FISCO BCOS 的农产品供应链溯源系统》前后端实现，采用 Vue 3 + Vite + Express + FISCO BCOS，支持多角色业务流程操作与区块链数据存证。

---

## 环境准备与启动

### 需要安装的软件

| 位置 | 软件 | 用途 |
|------|------|------|
| Windows | **Node.js 18+** | 运行前端和后端 |
| Windows | **MySQL 8.0+** | 业务数据库 |
| Windows | **Git** | 克隆代码 |
| WSL2 (Ubuntu) | **FISCO BCOS v2.11.0** | 4 节点单群组联盟链 |
| WSL2 (Ubuntu) | **WeBASE-Front v1.5.5** | 合约 IDE、私钥管理、交易签名 |
| WSL2 (Ubuntu) | **OpenJDK 11** | WeBASE-Front 依赖 |

### 区块链环境（WSL2）

> **注意**：本系统使用 Solidity v0.4.25（FISCO BCOS v2.x 配套版本），该版本语法和工具链与高版本差异较大，容易踩坑。建议按照 [`合约部署.md`](docs/后端/合约部署.md) 进行合约的编译和部署。

详见：**[`区块链环境部署（详细版）.md`](docs/后端/区块链环境部署（详细版）.md)** 和 **[`合约部署.md`](docs/后端/合约部署.md)**

### MySQL

```sql
CREATE DATABASE agrichain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

启动后端后表会自动创建（Sequelize sync）。

### 配置文件

项目根目录 `.env` 是唯一配置文件（复制 `.env.example` 修改）：

```env
# 前端 mock 模式：true=原型页面 / false=真实组件+后端
VITE_USE_MOCK=false

# 后端端口
PORT=3001
JWT_SECRET=agrichain-dev-secret

# WeBASE-Front 地址（WSL2）
WEBASE_FRONT_URL=http://127.0.0.1:5002/WeBASE-Front

# 部署者私钥
DEPLOYER_PRIVATE_KEY=96300107a8dabda21d3186d7eaaa667f656da1883b33580339f533f2005d9077

# 合约地址（在 WeBASE 部署合约后获得）
ROLE_MANAGER_ADDRESS=0x...
TRACE_MANAGER_ADDRESS=0x...
AUDIT_MANAGER_ADDRESS=0x...

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=agrichain
DB_USER=root
DB_PASS=你的密码
```

### 安装依赖

```bash
# 前端（根目录）
npm install

# 后端
cd agrichain-backend
npm install
cd ..
```

### 项目结构（后端）

```
agrichain-backend/
├── src/
│   ├── app.js                 # 入口
│   ├── config/                # 配置（数据库、合约、全局）
│   ├── controllers/           # API 控制器
│   ├── services/              # 业务逻辑与区块链交互
│   ├── models/                # 数据模型
│   ├── middleware/            # 认证与角色中间件
│   └── routes/                # 路由定义
├── scripts/                   # 数据库初始化与种子数据
├── tests/                     # 后端集成测试
├── contracts/                 # 智能合约源码
└── contract_build_info/       # ABI、部署信息
```

### 启动所有进程（按顺序）

```
步骤1: WSL2 → FISCO BCOS 节点
步骤2: WSL2 → WeBASE-Front
步骤3: Windows → MySQL
步骤4: Windows → 后端 (npm run dev)
步骤5: Windows → 前端 (npm run dev)
```

具体命令：

```bash
# 终端1（WSL2）— 区块链
cd ~/fisco/nodes/127.0.0.1 && bash start_all.sh

# 终端2（WSL2）— WeBASE-Front
cd ~/fisco/webase-front && bash start.sh

# 终端3（Windows）— MySQL
net start MySQL80   # 或确保 MySQL 服务已在运行中

# 终端4（Windows）— 后端
cd agrichain-backend && npm run dev
# 看到 "Server listening on http://0.0.0.0:3001" 即成功

# 终端5（Windows）— 前端
npm run dev
# 浏览器打开 http://localhost:5173
```

### Mock 模式（不依赖后端/区块链）

详细说明见 [`mock与非mock模式说明.md`](docs/后端/mock与非mock模式说明.md)。

```bash
npm run dev:mock
```

- 端口 **5174**（与正常版 5173 不同，可同时启动）
- 显示原型 HTML 页面，API 返回模拟数据
- 不依赖后端、MySQL、区块链
- 适合 UI 走查和原型演示

### 非 mock 模式 vs Mock 模式

| | 非 mock 模式 | Mock 模式 |
|--|---------|----------|
| 命令 | `npm run dev` | `npm run dev:mock` |
| 端口 | 5173 | 5174 |
| VITE_USE_MOCK | false | true |
| 前端页面 | 真实 Vue 组件（部分页面仍使用原型 iframe 占位） | 全部原型 HTML iframe |
| API 数据 | 请求后端 | 前端内联 mock |
| 依赖后端/链 | 需要 | 不需要 |

### 预置账号（种子数据）

| 角色 | 用户名 | 密码 | 路由前缀 |
|------|--------|------|---------|
| 管理员 | admin | admin123 | `/admin/` |
| 农户 | farmer1 | 123456 | `/farmer/` |
| 加工企业 | processor1 | 123456 | `/processor/` |
| 物流方 | logistics1 | 123456 | `/logistics/` |
| 零售方 | retail1 | 123456 | `/retail/` |
| 监管机构 | regulator1 | 123456 | `/regulator/` |

### 如何测试

**前端 E2E：** 详见 [6.4 端到端测试](#64-端到端测试)。

**后端集成测试（需后端+链运行中）：** 详见 [`测试.md`](docs/后端/测试.md)。

**数据库重置：** 详见 [`后端接入MySQL.md`](docs/后端/后端接入MySQL.md) 的"数据库重置"一节。

### 当前状态

- 前端原型主链路已打通，支持跨端演示
- Mock 数据已接入，便于前端联调与交互验证
- 后端 API 已对接，支持真实数据读写与区块链交互
- MySQL 已接入，替代 JSON 文件持久化
- 合约、E2E 测试已有基础框架，用例待完善
- 缺少真实用户测试验证
- 部分页面仍使用原型 iframe 占位，真实 Vue 组件待补全

### 后续建议

- 补齐所有真实 Vue 组件，替换原型 iframe 占位页面
- 补充更细粒度 E2E 用例：覆盖每个角色核心业务按钮
- 接入真实用户测试，验证业务流程完整性

---

## 版权与许可

- Copyright (c) 2026 Kang Chen, Yinuo Xu
- 本项目采用“受邀请用户专用”限制许可（Invited-User Restricted License）。
- 仅获得作者书面邀请/授权的用户可使用、修改本项目。
- 未受邀请用户不得擅自使用、复制、篡改、分发或二次发布。
- 详细条款见 [LICENSE](./LICENSE)。

## 前端原型部分

### 1. 项目定位

- 技术栈：Vue 3、Vite、Vue Router、Pinia、Axios、TailwindCSS、Playwright、Express、Sequelize、FISCO BCOS
- 当前阶段：前端原型联调阶段 + 后端 API 对接阶段
- 目标：完整还原蓝图页面，并保证跨页面跳转、角色路径、侧栏导航可用

### 2. 角色与端

本项目包含以下端与角色：

- 管理端（ADMIN）
- 农户端（FARMER）
- 加工端（PROCESSOR）
- 物流端（LOGISTICS）
- 零售端（RETAIL）
- 监管端（REGULATOR）
- 消费者移动 H5（TRACE）

### 3. 页面分组（与蓝图对应）

- 公共页：`P01 ~ P06`
- 管理端：`A01 ~ A06`
- 农户端：`F01 ~ F05`
- 加工端：`M01 ~ M05`
- 物流端：`L01 ~ L05`
- 零售端：`R01 ~ R06`
- 监管端：`G01 ~ G09`
- 消费者端：`C01 ~ C06`

原型 HTML 存放目录：`public/prototypes/`

### 4. 关键能力

- 统一原型路由映射：业务路由 -> 原型页 slug
- 统一侧栏点击代理：支持中英文/别名映射，保证侧栏可跳转
- 左栏兜底策略：未命中词条时回到当前角色工作台，避免“点击无反应”
- 角色权限守卫：按角色拦截不匹配路由
- 原型目录页：支持快速浏览与跳转

### 5. 主要目录

```text
my-agri-chain/
├─ public/prototypes/                 # 全部原型 HTML 与截图
├─ src/router/index.js                # 业务路由与角色守卫
├─ src/config/prototypeFlow.js        # 原型流转规则与文本映射
├─ src/config/menus.js                # 标准左侧菜单定义
├─ src/views/prototype/
│  ├─ PrototypeCatalogView.vue        # 原型目录
│  └─ PrototypeFrameView.vue          # 原型承载与点击代理
├─ tests/smoke.spec.js                # Playwright 冒烟测试
└─ README.md
```

### 6. 本地运行

#### 6.1 安装依赖

```bash
npm install
```

#### 6.2 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:5173`

#### 6.3 构建

```bash
npm run build
```

#### 6.4 端到端测试

```bash
npm run test:e2e
```

首次执行 Playwright 时如需浏览器：

```bash
npx playwright install chromium
```

### 7. 常用入口路由

- 登录页：`/login`
- 原型目录：`/prototype`
- 管理端：`/admin/dashboard`
- 农户端：`/farmer/dashboard`
- 加工端：`/processor/dashboard`
- 物流端：`/logistics/dashboard`
- 零售端：`/retail/dashboard`
- 监管端：`/regulator/dashboard`
- 消费者查询：`/trace/search`

