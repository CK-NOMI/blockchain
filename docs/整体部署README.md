# AgriChain 整体部署 README

本文档用于在本机完整部署并演示“基于 FISCO BCOS 的农产品供应链溯源系统”。覆盖 MySQL、FISCO BCOS、Console、WeBASE-Front、智能合约、后端、前端，以及演示前的自检清单。

> 适用场景：课程展示、阶段验收、本机答辩演示。
> 当前主线：农户创建批次 -> 加工质检 -> 物流运输 -> 零售上架/二维码 -> 消费者溯源 -> 监管审计 -> 管理端查看用户、节点、合约、日志。

## 1. 项目组成

| 模块 | 技术/服务 | 默认地址 |
| --- | --- | --- |
| 前端 | Vue 3 + Vite | `http://127.0.0.1:5173` |
| 后端 | Express + Sequelize | `http://127.0.0.1:3001` |
| 数据库 | MySQL 8 | `127.0.0.1:3306` |
| 区块链 | FISCO BCOS 2.x | 本地节点目录 `~/fisco/nodes/127.0.0.1` |
| 链交互 | WeBASE-Front | `http://127.0.0.1:5002/WeBASE-Front` |
| 合约 | RoleManager / TraceManager / AuditManager | 部署后填入 `.env` |

## 2. 环境要求

推荐环境：

- Ubuntu/WSL2：运行 FISCO BCOS 节点、Console、WeBASE-Front
- Node.js：18 或以上
- MySQL：8.0 或以上
- Java：WeBASE-Front 推荐使用 JDK 8/11，若系统已有 Java 21，可单独安装 JDK 11 并为 WeBASE-Front 指定 `JAVA_HOME`
- Git、curl、wget、openssl

如果使用代理，访问本机服务时建议设置：

```bash
export no_proxy=127.0.0.1,localhost,::1
export NO_PROXY=127.0.0.1,localhost,::1
```

所有本机 `curl` 检查建议使用：

```bash
curl --noproxy '*' http://127.0.0.1:3001/api/health
```

## 3. MySQL 配置

进入 MySQL：

```bash
sudo mysql
```

创建数据库和演示用户：

```sql
CREATE DATABASE IF NOT EXISTS agrichain
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'agrichain'@'localhost' IDENTIFIED BY 'agrichain123';
CREATE USER IF NOT EXISTS 'agrichain'@'127.0.0.1' IDENTIFIED BY 'agrichain123';

GRANT ALL PRIVILEGES ON agrichain.* TO 'agrichain'@'localhost';
GRANT ALL PRIVILEGES ON agrichain.* TO 'agrichain'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

检查连接：

```bash
mysql -h127.0.0.1 -uagrichain -pagrichain123 -e "SHOW DATABASES;"
```

后端启动时会自动执行 `sequelize.sync()` 创建表，并初始化 6 个种子账号。

## 4. FISCO BCOS 节点

以下以本机 `~/fisco` 为例。

进入目录：

```bash
mkdir -p ~/fisco
cd ~/fisco
```

如果已有 `build_chain.sh` 和 `nodes/`，直接启动节点：

```bash
cd ~/fisco/nodes/127.0.0.1
bash start_all.sh
```

检查节点：

```bash
bash status.sh
```

若看到节点进程均为 `running`，说明链已启动。

常见坑：

- `console-*.tar.gz` 只有几字节且内容为 `Not Found`，说明下载链接错误或版本不存在，需要重新下载正确 release。
- 若 `curl` 本机服务返回 `502 Bad Gateway`，通常是代理接管了 `127.0.0.1`，使用 `--noproxy '*'`。

## 5. FISCO Console 与合约部署

进入 Console：

```bash
cd ~/fisco/console
bash start.sh
```

启动后看到：

```text
[group:1]>
```

将项目合约复制到 Console 合约目录。假设项目在 `/mnt/e/Project/blockchain`：

```bash
cp /mnt/e/Project/blockchain/contracts/*.sol ~/fisco/console/contracts/solidity/
```

按顺序部署三个合约：

```text
deploy RoleManager
```

记录返回的 `contract address`，例如：

```text
RoleManager = 0xcadb4fdf2b3c9bd0cc685d5b3296d90d0c6f1584
```

然后部署依赖 `RoleManager` 的两个合约：

```text
deploy TraceManager 0x你的RoleManager地址
deploy AuditManager 0x你的RoleManager地址
```

记录三个地址，稍后填入项目根目录 `.env`：

```env
ROLE_MANAGER_ADDRESS=0x...
TRACE_MANAGER_ADDRESS=0x...
AUDIT_MANAGER_ADDRESS=0x...
```

## 6. 导出部署者私钥

后端需要部署者私钥作为系统签名者，用于管理员审批、角色授权、链上写交易等操作。

在 Console 目录查找当前部署账户。Console 部署合约后会显示：

```text
currentAccount: 0x603a43036a3850306700e7b1872b86d632a086c6
```

查找对应私钥文件，注意不要选 `.pub` 公钥文件：

```bash
cd ~/fisco/console
find account/ecdsa -type f -name '*.pem' ! -name '*.pub'
```

设置变量：

```bash
PEM=account/ecdsa/0x你的地址.pem
```

导出私钥：

```bash
HEX=$(openssl ec -in "$PEM" -text -noout 2>/dev/null \
  | awk '/priv:/{p=1;next}/pub:/{p=0}p{gsub(/[:[:space:]]/,"");printf "%s",$0}')
echo "0x${HEX: -64}"
```

将输出填入 `.env`：

```env
DEPLOYER_PRIVATE_KEY=0x你的私钥
```

安全提醒：

- 不要把真实私钥发到聊天、截图、仓库或公开文档。
- `.env` 应保持在本机，不要提交。

## 7. WeBASE-Front 配置

进入 WeBASE-Front：

```bash
cd ~/fisco/webase-front
```

复制节点 SDK 证书：

```bash
cp ~/fisco/nodes/127.0.0.1/sdk/* ./conf/
```

如果提示 `JAVA_HOME has not been configured`，安装 JDK 11 并设置：

```bash
sudo apt install openjdk-11-jdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

启动：

```bash
bash start.sh
```

检查：

```bash
curl --noproxy '*' -I http://127.0.0.1:5002/WeBASE-Front
```

正常会返回 `302` 并跳转到 `/WeBASE-Front/`。

导入部署者私钥到 WeBASE-Front：

```bash
read -s -p "Admin private key: " ADMIN_PK; echo
curl --noproxy '*' "http://127.0.0.1:5002/WeBASE-Front/privateKey/import?privateKey=${ADMIN_PK}&userName=deployer_admin"
```

这里输入的是上一节导出的部署者私钥，不是 `.pem.pub` 公钥。

## 8. 项目环境变量

项目根目录创建 `.env`：

```bash
cd /mnt/e/Project/blockchain
cp .env.example .env
```

演示环境推荐配置：

```env
VITE_USE_MOCK=false

PORT=3001
JWT_SECRET=agrichain-dev-secret
JWT_EXPIRES_IN=7d

WEBASE_FRONT_URL=http://127.0.0.1:5002/WeBASE-Front
DEPLOYER_PRIVATE_KEY=0x你的部署者私钥

ROLE_MANAGER_ADDRESS=0x你的RoleManager地址
TRACE_MANAGER_ADDRESS=0x你的TraceManager地址
AUDIT_MANAGER_ADDRESS=0x你的AuditManager地址

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=agrichain
DB_USER=agrichain
DB_PASS=agrichain123

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

说明：

- `VITE_USE_MOCK=false` 表示走真实后端、真实 MySQL、真实链。
- 合约地址必须与 Console 部署出来的地址一致。
- `DEPLOYER_PRIVATE_KEY` 对应的地址应当是部署/管理合约的账户。

## 9. 安装依赖

前端依赖：

```bash
cd /mnt/e/Project/blockchain
npm install
```

后端依赖：

```bash
cd /mnt/e/Project/blockchain/agrichain-backend
npm install
```

## 10. 启动顺序

建议开 4 个终端。

终端 1：FISCO BCOS 节点

```bash
cd ~/fisco/nodes/127.0.0.1
bash start_all.sh
```

终端 2：WeBASE-Front

```bash
cd ~/fisco/webase-front
bash start.sh
```

终端 3：后端

```bash
cd /mnt/e/Project/blockchain/agrichain-backend
npm run start
```

成功后会看到类似：

```text
AgriChain backend running on http://127.0.0.1:3001
WeBASE-Front 已就绪
chain self-check PASS
```

终端 4：前端

```bash
cd /mnt/e/Project/blockchain
npm run dev -- --host 127.0.0.1 --force
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

## 11. 预置账号

后端首次启动会初始化以下账号：

| 角色 | 用户名 | 密码 | 入口 |
| --- | --- | --- | --- |
| 管理员 | `admin` | `admin123` | `/admin/dashboard` |
| 农户 | `farmer1` | `123456` | `/farmer/dashboard` |
| 加工方 | `processor1` | `123456` | `/processor/dashboard` |
| 物流方 | `logistics1` | `123456` | `/logistics/dashboard` |
| 零售方 | `retail1` | `123456` | `/retail/dashboard` |
| 监管方 | `regulator1` | `123456` | `/regulator/dashboard` |

## 12. 自检命令

后端健康检查：

```bash
curl --noproxy '*' http://127.0.0.1:3001/api/health
```

期望返回：

```json
{"code":0,"data":{"status":"ok","time":...},"msg":"ok"}
```

WeBASE-Front：

```bash
curl --noproxy '*' -I http://127.0.0.1:5002/WeBASE-Front
```

前端：

```bash
curl --noproxy '*' -I http://127.0.0.1:5173/
```

端口：

```bash
ss -lntp | grep -E '3001|5002|5173'
```

前端构建：

```bash
cd /mnt/e/Project/blockchain
npm run build
```

## 13. 演示主线验收

建议按以下顺序演示：

1. `farmer1` 登录，创建农产品批次，例如“有机苹果”。
2. `farmer1` 填写农事记录并提交。
3. `processor1` 登录，查看该批次，填写加工/质检记录。
4. `logistics1` 登录，查看该批次，填写物流运输和温湿度记录。
5. `retail1` 登录，入库、上架并生成二维码。
6. 打开二维码链接，消费者页面能看到完整溯源链路。
7. `regulator1` 登录，在综合检索中查到该批次，查看详情/审计。
8. `admin` 登录，查看：
   - 用户审核
   - 用户与角色
   - 节点状态
   - 合约配置
   - 操作日志

当前演示版应满足：

- 真实批次能跨角色流转。
- 重新登录不同角色后仍能看到对应阶段批次。
- 二维码页面可打开消费者溯源链路。
- 监管端能看到真实批次全过程。
- 管理端用户、节点、合约页面不再显示示例数据。

## 14. 管理端说明

管理端已接入真实数据：

- 用户审核：读取 MySQL 用户表。
- 用户与角色：读取真实用户、角色、状态。
- 节点状态：读取 WeBASE/FISCO 当前区块高度和链 ID。
- 合约配置：读取 `.env` 中三个合约地址。
- 操作日志：读取真实管理员操作日志。

注意：

- 操作日志初始为空是正常的。
- 执行用户通过、驳回、停用、改角色后才会产生真实日志。
- 如果页面仍显示 `UA20260001`、`user_1`、`机构-4`，说明前端仍在跑旧缓存，重启前端：

```bash
npm run dev -- --host 127.0.0.1 --force
```

## 15. 常见问题

### 15.1 `tar -xzf console-*.tar.gz` 报 not in gzip format

先检查文件：

```bash
ls -lh console-*.tar.gz
head -n 5 console-*.tar.gz
```

如果只有几字节并显示 `Not Found`，说明下载到的是 404 页面，不是真压缩包。重新确认 release 地址后下载。

### 15.2 `curl http://127.0.0.1:3001/api/health` 返回 502

通常是代理劫持本机请求。

使用：

```bash
curl --noproxy '*' http://127.0.0.1:3001/api/health
```

并设置：

```bash
export no_proxy=127.0.0.1,localhost,::1
export NO_PROXY=127.0.0.1,localhost,::1
```

### 15.3 WeBASE-Front 提示 `JAVA_HOME has not been configured`

安装 JDK 11，并只在启动 WeBASE 的终端指定：

```bash
sudo apt install openjdk-11-jdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
bash start.sh
```

系统已有 Java 21 不影响，只要 WeBASE 启动终端使用 JDK 11 即可。

### 15.4 导出私钥时误选 `.pem.pub`

`.pem.pub` 是公钥，不能用来导出私钥。

正确查找：

```bash
find account/ecdsa -type f -name '*.pem' ! -name '*.pub'
```

### 15.5 页面还是旧数据

可能是 Vite 缓存或旧服务进程。

查看端口：

```bash
ss -lntp | grep -E '3001|5173'
```

停止旧进程后重启：

```bash
cd /mnt/e/Project/blockchain/agrichain-backend
npm run start

cd /mnt/e/Project/blockchain
npm run dev -- --host 127.0.0.1 --force
```

### 15.6 后端启动但链写入失败

重点检查：

- `WEBASE_FRONT_URL` 是否能访问。
- `DEPLOYER_PRIVATE_KEY` 是否已填。
- 部署者私钥是否已导入 WeBASE-Front。
- 三个合约地址是否为当前链上的最新地址。
- WeBASE-Front 的 `groupId` 是否为 `1`。

## 16. 交付建议

演示/验收时建议表述为：

```text
系统已完成本地部署联调，MySQL、FISCO BCOS、WeBASE-Front、后端与前端均可正常运行。
农户、加工方、物流方、零售方、监管方、管理员的核心演示流程已验证通过。
批次数据、合约地址、节点状态、用户角色等关键页面均已接入真实数据。
```

避免表述为“所有功能完全无缺陷”。更稳妥的说法是：

```text
核心业务主线和展示功能已验证通过，可作为演示版提交。
```

## 17. 参考文档

- `docs/后端/区块链环境部署（详细版）.md`
- `docs/后端/合约部署.md`
- `docs/后端/后端接入MySQL.md`
- `docs/后端/测试.md`
- `docs/后端/mock与非mock模式说明.md`
