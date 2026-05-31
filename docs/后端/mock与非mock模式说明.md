# Mock 与非 Mock 模式说明

## 一句话

- **mock 模式** = 前端自己编数据，不需要后端、不需要区块链，界面是原型图
- **非 mock 模式** = 前端调真实后端 API，数据来自数据库和区块链，界面是真实组件

## 三处判断逻辑

### 1. router/index.js（决定路由）

```js
const isMock = import.meta.env.VITE_USE_MOCK === 'true'
```

| 环境变量 | isMock 值 | 效果 |
| :--- | :--- | :--- |
| `VITE_USE_MOCK=true` | `true` | 路由全部走原型 iframe |
| `VITE_USE_MOCK=false` | `false` | 路由走真实组件 |
| 没设这个变量 | `false` | 同上 |

### 2. api.js（决定数据来源）

```js
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
```

| 环境变量 | USE_MOCK 值 | 效果 |
| :--- | :--- | :--- |
| `VITE_USE_MOCK=true` | `true` | API 调用返回内存假数据 |
| `VITE_USE_MOCK=false` | `false` | API 调用发 HTTP 到后端 |
| 没设这个变量 | `true` | **走内存假数据** |

### 3. 两处的默认值不一致

| 情况 | router（路由） | api.js（数据） |
| :--- | :--- | :--- |
| 正常使用（有 .env） | 两者一致 | 两者一致 |
| 没配环境变量 | 非 mock | **mock** |

**例外情况：** 不设 `VITE_USE_MOCK` 时，页面显示真实组件，但数据是假的。

## 两种模式的具体差异

### 路由（地址栏能看到的区别）

| 页面 | mock 模式 | 非 mock 模式 |
| :--- | :--- | :--- |
| `/login` | 原型 iframe 内嵌图片 | LoginView 登录表单组件 |
| `/register` | 原型 iframe 内嵌图片 | RegisterView 注册表单组件 |
| `/farmer/dashboard` | 原型 iframe 内嵌图片 | FarmerDashboardView 仪表盘组件 |
| `/processor/dashboard` | 原型 iframe 内嵌图片 | ProcessorDashboardView 仪表盘组件 |
| `/` 根路径 | 跳转 `/logistics/dashboard` | 跳转 `/login` |

### API（开发者工具 Network 面板能看到的区别）

| 操作 | mock 模式 | 非 mock 模式 |
| :--- | :--- | :--- |
| 登录 | 直接返回假 token，不发 HTTP | POST `http://127.0.0.1:3001/api/auth/login` |
| 创建批次 | 内存生成 batchId，不发 HTTP | POST `http://127.0.0.1:3001/api/batches/create` |
| 提交加工记录 | 内存追加一条记录，不发 HTTP | POST `http://127.0.0.1:3001/api/batches/{id}/process-record` |
| 批次列表 | 从内存 `mockStore.batches` 读取 | GET `http://127.0.0.1:3001/api/batches/` |

### 数据

| 特性 | mock 模式 | 非 mock 模式 |
| :--- | :--- | :--- |
| 数据存储位置 | 浏览器内存变量 | MySQL 数据库 + FISCO BCOS 区块链 |
| 重启后数据 | 丢失 | 持久化 |
| token 时效性 | 永不过期 | JWT 过期需重新登录 |
| transactionHash | `0xmock_...` 假哈希 | 真实的链上交易哈希 |
| 文件上传 | 不传文件，返回假 hash | 真实写入 uploads 目录并返回 hash |

### 页面行为

| 行为 | mock 模式 | 非 mock 模式 |
| :--- | :--- | :--- |
| 登录 | 自动填充，点登录即进 | 调用后端验证密码 |
| 注册 | 调用假函数，返回成功 | POST 到后端，状态为 PENDING |
| 导航守卫 | 不检查登录状态 | 无 token 跳转登录页 |
| 新人账号状态 | 直接可用 | 注册后为 PENDING，需要管理员审批 |

## 怎么切换

### 方式一：改 .env 文件

编辑项目根目录的 `.env` 文件：

```ini
# mock 模式
VITE_USE_MOCK=true

# 非 mock 模式
VITE_USE_MOCK=false
```

改完等终端提示 `[vite] .env changed, restarting server...` 即生效，或重启 `npm run dev`。

### 方式二：用专用命令

```bash
# 非 mock 模式（默认，读 .env），端口 5173
npm run dev

# mock 模式（读 .env.mock），端口 5174
npm run dev:mock
```

可在浏览器中同时打开两个窗口（`http://localhost:5173` 和 `http://localhost:5174`）对照查看差异。

## 生产环境

生产构建 `npm run build` 走非 mock 模式：

- 编译后的页面是真实组件（不是原型 iframe）
- API 请求发到部署地址的同域 `/api/*`（由反向代理转发）
- 生产构建不需要 `.env`，`VITE_USE_MOCK` 在构建时已编译进代码
