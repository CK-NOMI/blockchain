# 基于 FISCO BCOS 的农产品供应链溯源系统（前端原型版）

本项目是《基于 FISCO BCOS 的农产品供应链溯源系统》前端实现，采用 Vue 3 + Vite，当前阶段以“高保真原型 + 统一路由流转 + Mock 数据驱动”为主，支持多角色业务流程演示与页面互通验证。

## 版权与许可

- Copyright (c) 2026 Kang Chen, Yinuo Xu
- 本项目采用“受邀请用户专用”限制许可（Invited-User Restricted License）。
- 仅获得作者书面邀请/授权的用户可使用、修改本项目。
- 未受邀请用户不得擅自使用、复制、篡改、分发或二次发布。
- 详细条款见 [LICENSE](./LICENSE)。

## 1. 项目定位

- 技术栈：Vue 3、Vite、Vue Router、Pinia、Axios、TailwindCSS、Playwright
- 当前阶段：前端原型联调阶段（非后端实连）
- 目标：完整还原蓝图页面，并保证跨页面跳转、角色路径、侧栏导航可用

## 2. 角色与端

本项目包含以下端与角色：

- 管理端（ADMIN）
- 农户端（FARMER）
- 加工端（PROCESSOR）
- 物流端（LOGISTICS）
- 零售端（RETAIL）
- 监管端（REGULATOR）
- 消费者移动 H5（TRACE）

## 3. 页面分组（与蓝图对应）

- 公共页：`P01 ~ P06`
- 管理端：`A01 ~ A06`
- 农户端：`F01 ~ F05`
- 加工端：`M01 ~ M05`
- 物流端：`L01 ~ L05`
- 零售端：`R01 ~ R06`
- 监管端：`G01 ~ G09`
- 消费者端：`C01 ~ C06`

原型 HTML 存放目录：`public/prototypes/`

## 4. 关键能力

- 统一原型路由映射：业务路由 -> 原型页 slug
- 统一侧栏点击代理：支持中英文/别名映射，保证侧栏可跳转
- 左栏兜底策略：未命中词条时回到当前角色工作台，避免“点击无反应”
- 角色权限守卫：按角色拦截不匹配路由
- 原型目录页：支持快速浏览与跳转

## 5. 主要目录

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

## 6. 本地运行

### 6.1 安装依赖

```bash
npm install
```

### 6.2 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:5173`

### 6.3 构建

```bash
npm run build
```

### 6.4 端到端测试

```bash
npm run test:e2e
```

首次执行 Playwright 时如需浏览器：

```bash
npx playwright install chromium
```

## 7. 常用入口路由

- 登录页：`/login`
- 原型目录：`/prototype`
- 管理端：`/admin/dashboard`
- 农户端：`/farmer/dashboard`
- 加工端：`/processor/dashboard`
- 物流端：`/logistics/dashboard`
- 零售端：`/retail/dashboard`
- 监管端：`/regulator/dashboard`
- 消费者查询：`/trace/search`

## 8. 当前状态说明

- 前端页面主链路已打通，支持跨端演示
- Mock 数据已接入，便于前端联调与交互验证
- 可在下一阶段切换为“后端接口对接版”（Pinia + Axios 实际 API）

## 9. 后续建议

- 对接后端 API：替换 `mock` 数据源
- 补充更细粒度 E2E 用例：覆盖每个角色核心业务按钮
- 固化术语与文案规范：减少同义词映射维护成本
