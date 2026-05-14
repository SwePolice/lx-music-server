# lx-music-server

A Cloudflare Workers port of [lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server), using Durable Objects for stateful WebSocket sync — no self-hosted server required.

[中文](./README.md)

## Features

- Runs on Cloudflare Workers + Durable Objects — zero server maintenance
- Multi-user isolation: each user gets a dedicated DO instance and storage
- Real-time bidirectional WebSocket sync for playlists and dislike rules
- Snapshot-based version management with multi-device incremental merge
- Device management API (list / revoke authorized devices)
- One-click deployment via GitHub Actions

## Prerequisites

- A Cloudflare account (free plan is sufficient)
- A KV Namespace already created
- A GitHub repository (for Actions-based deployment)

## Deployment

### 1. Fork and configure Secrets

Fork this repository, then go to **Settings → Secrets and variables → Actions** in your GitHub repository and add the following Secrets:

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with Workers and KV read/write permissions |
| `KV_NAMESPACE_ID` | The ID of your existing KV Namespace |
| `LX_USER_ADMIN` | Password for the `admin` user (see user configuration below) |

### 2. Configure users

Each GitHub Secret named `LX_USER_<username>` defines one sync user. Usernames are automatically lowercased.

**Secret value formats:**

```
# Password only (simplest)
your_password

# JSON format (supports additional options)
{"password": "your_password", "maxSnapshotNum": 20}
```

**Supported user options:**

| Option | Type | Description |
|---|---|---|
| `password` | string | Login password (required) |
| `maxSnapshotNum` | number | Maximum number of snapshots to retain, default 20 |
| `list.addMusicLocationType` | `"top"` \| `"bottom"` | Where new songs are added, default `"bottom"` |

**Adding multiple users:**

Append a line to the `env` block of the `Inject users config` step in `.github/workflows/deploy.yml`:

```yaml
env:
  LX_USER_ADMIN: ${{ secrets.LX_USER_ADMIN }}
  LX_USER_BOB: ${{ secrets.LX_USER_BOB }}   # new user
```

Then add the corresponding `LX_USER_BOB` Secret in GitHub.

### 3. Trigger deployment

Push to the `main` branch — GitHub Actions will inject the configuration and deploy to Cloudflare Workers automatically.

### Manual deployment

```bash
pnpm install
pnpm deploy
```

## Local Development

```bash
pnpm install
pnpm dev
```

> `wrangler dev` simulates Durable Objects and KV locally.

## Client Configuration

In LX Music's sync settings:

- **Server URL**: `https://<your-worker-name>.<your-subdomain>.workers.dev`
- **Username**: the username part of `LX_USER_<username>` (lowercase)
- **Password**: the corresponding Secret value

## Device Management API

All endpoints use HTTP Basic Auth with the same credentials as the sync account.

**List authorized devices:**

```bash
curl -u <username>:<password> https://<worker-url>/devices
```

**Revoke a device:**

```bash
curl -u <username>:<password> -X DELETE https://<worker-url>/devices/<clientId>
```

## Architecture

```
Client
  │
  ├─ POST /ah              Authentication (new device / re-auth)
  ├─ GET  /sync            WebSocket upgrade → UserSyncDO
  ├─ GET  /devices         List devices (Basic Auth)
  ├─ DELETE /devices/:id   Revoke device (Basic Auth)
  ├─ GET  /hello           Connectivity check
  └─ GET  /id              Server unique ID

Cloudflare Workers (stateless routing layer)
  │  KV stores clientId → userName mapping
  │
  └─ UserSyncDO (one instance per user)
       ├─ DO Storage: device info, playlist snapshots, dislike rule snapshots
       └─ WebSocket: real-time multi-device sync
```

**Key dependencies:**

| Dependency | Purpose |
|---|---|
| [Hono](https://hono.dev) | HTTP routing framework |
| [message2call](https://github.com/lyswhut/message2call) | WebSocket RPC |
| [aes-js](https://github.com/ricmoo/aes-js) | AES-128-ECB encryption |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | MD5 implementation |

## License

[MIT](LICENSE)
