# 农产品供应链溯源系统 - 区块链底层环境部署手册

---

## 1. 部署环境清单

| 组件 | 版本/规格 | 说明 |
| :--- | :--- | :--- |
| 操作系统 | Windows 11 + WSL2 (Ubuntu 22.04) | 基础开发环境 |
| 区块链底层 | FISCO BCOS v2.11.0 | 4节点单群组联盟链 |
| 运维管理平台 | WeBASE-Front v1.5.5 | 合约IDE、私钥管理、接口服务 |
| 智能合约语言 | Solidity v0.4.25 | 业务逻辑实现 |
| 运行环境 | OpenJDK 11 | Java 运行环境 |

---

## 2. 核心部署步骤回顾

### 2.1 基础依赖与 Java 配置
1.  **安装工具**：`sudo apt install -y openssl curl wget unzip openjdk-11-jdk`
2.  **环境变量**：确保已写入 `~/.bashrc`：
    ```bash
    export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
    export PATH=$JAVA_HOME/bin:$PATH
    ```

### 2.2 区块链节点搭建
1.  **生成节点**：使用官方 `build_chain.sh` 脚本在本地构建。
2.  **启动命令**：
    ```bash
    bash ~/fisco/nodes/127.0.0.1/start_all.sh
    ```

### 2.3 WeBASE-Front 部署
1.  **包管理**：使用编译后的全量 Binary 包（约 75MB）。
2.  **证书同步**：必须将 SDK 证书拷贝至 `conf` 目录：
    ```bash
    cp ~/fisco/nodes/127.0.0.1/sdk/* ~/fisco/webase-front/conf/
    ```
3.  **服务启动**：`bash start.sh`
4.  **访问入口**：`http://localhost:5002/WeBASE-Front`
