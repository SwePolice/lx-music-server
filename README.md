# lx-music-server

[lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server) 的 Cloudflare Workers 重构版本，使用 Durable Objects 实现有状态的 WebSocket 同步，无需自托管服务器即可运行。

[English](./README.en.md)

## 功能特性

- 基于 Cloudflare Workers + Durable Objects，零服务器运维
- 支持多用户隔离，每个用户拥有独立的 DO 实例和存储
- 实时 WebSocket 双向同步歌单与不喜欢规则
- 快照版本管理，支持多设备增量合并
- 设备管理 API（查看 / 删除已授权设备）
- GitHub Actions 一键部署

## 前置要求

- Cloudflare 账号（免费计划即可）
- 已创建 KV Namespace
- GitHub 仓库（用于 Actions 自动部署）

## 部署方式

### 1. Fork 并配置 Secrets

Fork 本仓库，在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中添加以下 Secrets：

| Secret 名称 | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token，需要 Workers 和 KV 的读写权限 |
| `KV_NAMESPACE_ID` | 已创建的 KV Namespace ID |
| `LX_USER_ADMIN` | 用户 `admin` 的密码（见下方用户配置说明） |

### 2. 配置用户

每个 Cloudflare Workers Secret 对应一个同步用户，命名规则为 `LX_USER_<用户名>`（用户名自动转为小写）。

**Secret 值格式：**

```
# 仅密码（最简单）
your_password

# JSON 格式（支持更多选项）
{"password": "your_password", "maxSnapshotNum": 20}
```

**支持的用户选项：**

| 选项 | 类型 | 说明 |
|---|---|---|
| `password` | string | 登录密码（必填） |
| `maxSnapshotNum` | number | 最大快照保留数量，默认 20 |
| `list.addMusicLocationType` | `"top"` \| `"bottom"` | 歌曲添加位置，默认 `"bottom"` |

**添加多用户：**

在 `.github/workflows/deploy.yml` 的 `Inject users config` 步骤中追加对应行：

```yaml
env:
  LX_USER_ADMIN: ${{ secrets.LX_USER_ADMIN }}
  LX_USER_BOB: ${{ secrets.LX_USER_BOB }}   # 新增用户
```

同时在 GitHub Secrets 中添加 `LX_USER_BOB`。

### 3. 触发部署

推送代码到 `main` 分支，GitHub Actions 会自动完成注入配置并部署到 Cloudflare Workers。

### 手动部署

```bash
pnpm install
pnpm deploy
```

## 本地开发

```bash
pnpm install
pnpm dev
```

> 本地开发使用 `wrangler dev`，Durable Objects 和 KV 均在本地模拟运行。

## 客户端配置

在 LX Music 客户端的同步设置中填写：

- **服务器地址**：`https://<your-worker-name>.<your-subdomain>.workers.dev`
- **用户名**：对应 `LX_USER_<用户名>` 中的用户名（小写）
- **密码**：对应 Secret 的值

## 设备管理 API

通过 Basic Auth 访问设备管理接口，用户名和密码与同步账号相同。

**查看已授权设备：**

```bash
curl -u <用户名>:<密码> https://<worker-url>/devices
```

**删除指定设备：**

```bash
curl -u <用户名>:<密码> -X DELETE https://<worker-url>/devices/<clientId>
```

## 技术架构

```
客户端
  │
  ├─ POST /ah          认证（新设备 / 重新认证）
  ├─ GET  /sync        WebSocket 升级 → UserSyncDO
  ├─ GET  /devices     设备列表（Basic Auth）
  ├─ DELETE /devices/:id  删除设备（Basic Auth）
  ├─ GET  /hello       连通性检测
  └─ GET  /id          服务器唯一 ID

Cloudflare Workers（无状态路由层）
  │  使用 KV 存储 clientId → userName 映射
  │
  └─ UserSyncDO（每用户一个实例）
       ├─ DO Storage：设备信息、歌单快照、不喜欢规则快照
       └─ WebSocket：多设备实时同步
```

**主要依赖：**

| 依赖 | 用途 |
|---|---|
| [Hono](https://hono.dev) | HTTP 路由框架 |
| [message2call](https://github.com/lyswhut/message2call) | WebSocket RPC |
| [aes-js](https://github.com/ricmoo/aes-js) | AES-128-ECB 加解密 |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | MD5 实现 |

## License

[MIT](LICENSE)
