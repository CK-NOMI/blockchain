# 任务 3：注册登录 / 角色权限 / 管理员审核模块

这个目录是任务 3 的独立实现，不依赖修改小组原有前后端文件。可以单独运行演示，也可以在最终集成时把 `src/` 里的服务、路由和中间件合并到主后端。

## 功能范围

- 用户注册：非管理员角色可注册，初始状态为 `PENDING`
- 用户登录：密码哈希校验、账号状态校验、角色匹配校验
- JWT 鉴权：登录后返回 token，接口通过 `Authorization: Bearer <token>` 访问
- 角色权限：`ADMIN` 可管理用户，普通角色只能访问自己的受限接口
- 管理员审核：通过、驳回、停用、修改角色
- 用户持久化：数据保存到 `data/users.json`，重启后不会丢失

## 预置账号

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | ADMIN |
| farmer1 | 123456 | FARMER |
| processor1 | 123456 | PROCESSOR |
| logistics1 | 123456 | LOGISTICS |
| retail1 | 123456 | RETAIL |
| regulator1 | 123456 | REGULATOR |

## 运行

```bash
cd task3-auth-admin
npm install
npm run dev
```

默认地址：`http://127.0.0.1:3003`

## 完整演示流程

以下流程可以完整展示“注册登录、管理员审核、角色权限控制”。

### 1. 健康检查

```bash
curl http://127.0.0.1:3003/api/health
```

正常返回示例：

```json
{
  "code": 0,
  "data": {
    "status": "ok",
    "time": 1779955286206
  },
  "msg": "ok"
}
```

### 2. 注册一个农户用户

```bash
curl -X POST http://127.0.0.1:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ynimi",
    "password": "123456",
    "organization": "示例农场",
    "role": "FARMER"
  }'
```

注册成功后，用户状态是 `PENDING`，代表“等待管理员审核”。返回中的 `address` 要保存下来，管理员审核时会用到。

### 3. 未审核用户尝试登录

```bash
curl -X POST http://127.0.0.1:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ynimi",
    "password": "123456",
    "role": "FARMER"
  }'
```

预期结果：登录失败，提示账号正在审核中。这一步用于证明“注册后不能直接使用系统，必须经过管理员审核”。

### 4. 管理员登录

```bash
curl -X POST http://127.0.0.1:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

返回结果里会有 `data.token`。为了后续命令方便，可以把 token 保存成变量：

```bash
ADMIN_TOKEN="把管理员登录返回的 token 粘贴到这里"
```

### 5. 管理员查看待审核用户

```bash
curl http://127.0.0.1:3003/api/admin/users?status=PENDING \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

这里可以看到刚注册的 `ynimi`，并确认他的 `status` 是 `PENDING`。

### 6. 管理员审核通过

把下面命令里的地址替换成注册接口返回的 `address`：

```bash
curl -X PUT http://127.0.0.1:3003/api/admin/users/0x38332074ad69c55d5aaccd2a690f79814d61c7c4/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

审核通过后，用户状态会变成 `ACTIVE`，`isActive` 会变成 `true`。

### 7. 新用户再次登录

```bash
curl -X POST http://127.0.0.1:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ynimi",
    "password": "123456",
    "role": "FARMER"
  }'
```

这次应该登录成功，并返回普通用户自己的 token。

```bash
USER_TOKEN="把 ynimi 登录返回的 token 粘贴到这里"
```

### 8. 普通用户访问自己的资料

```bash
curl http://127.0.0.1:3003/api/auth/profile \
  -H "Authorization: Bearer $USER_TOKEN"
```

### 9. 验证角色权限隔离

普通农户尝试访问管理员接口：

```bash
curl http://127.0.0.1:3003/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"
```

预期结果：返回 403，说明普通用户不能访问管理员接口。

普通农户访问农户演示接口：

```bash
curl http://127.0.0.1:3003/api/demo/farmer-only \
  -H "Authorization: Bearer $USER_TOKEN"
```

预期结果：访问成功，说明角色匹配时允许访问。

### 10. 可选：管理员停用用户

```bash
curl -X PUT http://127.0.0.1:3003/api/admin/users/0x38332074ad69c55d5aaccd2a690f79814d61c7c4/suspend \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

停用后，该用户旧 token 会失效，再访问接口会提示账号状态已变更或账号不可用。

## 核心接口

### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "new_farmer",
  "password": "123456",
  "organization": "示例农场",
  "role": "FARMER"
}
```

### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "ADMIN"
}
```

### 获取当前用户

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 管理员查看用户

```http
GET /api/admin/users?status=PENDING
Authorization: Bearer <admin-token>
```

### 审核通过

```http
PUT /api/admin/users/:address/approve
Authorization: Bearer <admin-token>
```

### 驳回

```http
PUT /api/admin/users/:address/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "资料不完整"
}
```

### 停用

```http
PUT /api/admin/users/:address/suspend
Authorization: Bearer <admin-token>
```

### 修改角色

```http
PUT /api/admin/users/:address/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "LOGISTICS"
}
```

## 答辩说明要点

- 密码不明文保存，只保存 bcrypt 哈希。
- 注册用户不能直接使用系统，必须由管理员审核通过。
- 登录 token 内只放身份声明，接口访问时仍会检查账号是否存在、是否停用、token 版本是否有效。
- 普通用户不能通过请求体伪造角色；登录角色必须和账号真实角色一致。
- 管理员停用或修改用户角色后，会提升 `tokenVersion`，旧 token 立即失效。
