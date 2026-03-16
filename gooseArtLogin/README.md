# GooseArt 飞书免登录 H5 应用

飞书内嵌 H5 应用，通过飞书 JSAPI 实现免登录，获取用户身份信息并签发 JWT。

## 快速开始

```bash
npm install
npm start        # 生产模式
npm run dev      # 开发模式（热重载）
```

服务默认运行在 `http://localhost:3000`。

## 环境变量（.env）

| 变量 | 说明 |
|---|---|
| `FEISHU_APP_ID` | 飞书自建应用 App ID |
| `FEISHU_APP_SECRET` | 飞书自建应用 App Secret |
| `JWT_SECRET` | JWT 签名密钥（请在生产环境替换） |
| `PORT` | 服务端口，默认 3000 |

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/feishu/auto-login` | 前端传入 code，返回 JWT + 用户信息 |
| POST | `/api/feishu/jsapi-signature` | 前端传入 url，返回 JSAPI 签名参数 |
| GET | `/api/auth/me` | 通过 JWT 验证当前用户 |
| GET | `/health` | 健康检查 |

## 飞书开放平台配置

1. 在 [飞书开放平台](https://open.feishu.cn/) 创建自建应用
2. 添加权限：`contact:user.base:readonly`、`contact:department.base:readonly`
3. 在「网页应用」中配置 H5 页面地址
4. 发布应用版本

## 登录流程

```
前端 H5 (飞书内嵌)               后端 Express
  │  1. tt.config() 初始化          │
  │  2. tt.login() → code           │
  ├── POST /api/auth/feishu/auto-login { code } ──▶│
  │                                  │ 3. 获取 app_access_token
  │                                  │ 4. code → user_access_token
  │                                  │ 5. 拉取用户信息
  │◀── { token: JWT, user } ────────┤ 6. 签发 JWT 返回
```
