# Docker 可选部署

状态：可选部署适配器
适用范围：本地容器验证、测试 VPS、离线 AMD64 交付

Docker 是现有原生 VPS 部署之外的第二条路径，不替代
`tools/scripts/vps/mbc_walkwith.sh`、systemd、宿主机 PostgreSQL 或宿主机 Nginx。
两种方式共享同一套后端契约、Drizzle schema/migrations、Web 构建和环境变量语义，
但不能同时管理同一份数据库目录或占用同一端口。

## 1. Topology

```text
host/browser
  -> web:8080
       -> public web at /
       -> admin web at /admin/
       -> /v1/* proxy to api:3020
  -> api
       -> postgres:5432 on private Compose network
       -> R2/S3 for production sermon media

migrate (one shot)
  -> Drizzle Kit
  -> postgres
```

服务边界：

- `postgres` 是容器部署的业务数据 source of truth，数据保存在命名卷。
- `migrate` 只执行 Drizzle Kit migration，成功后退出，不是常驻 worker。
- `api` 只运行已 bundle 的 Bun 后端，不在启动时隐式迁移数据库。
- `web` 只提供静态站点和反向代理，不持有业务状态。
- 讲道转录、大纲和经文提取仍在本地工作站执行。

## 2. Files

```text
infra/docker/api.Dockerfile
infra/docker/web.Dockerfile
infra/docker/nginx.conf
infra/docker/compose.yml
infra/docker/compose.env.example
infra/docker/backend.env.example
tools/scripts/docker/build_images.sh
tools/scripts/docker/export_images.sh
tools/scripts/docker/manage.sh
tools/scripts/docker/database_backup.sh
```

实际 `compose.env`、`backend.env`、数据库 dump 和镜像 archive 都不提交 Git。

## 3. Prepare Configuration

```sh
cp infra/docker/compose.env.example infra/docker/compose.env
cp infra/docker/backend.env.example infra/docker/backend.env
```

至少替换：

- `POSTGRES_PASSWORD` 和完全一致、URL-safe 的 `DATABASE_URL` 密码。
- 两个互不相同且不少于 32 字符的 JWT secret。
- 对外 `PUBLIC_API_BASE_URL` 与 `ADMIN_WEB_ORIGIN`。
- 只覆盖容器私有网段的 `TRUST_PROXY`，不要配置为任意来源。
- R2、Firebase、Stripe、Resend 等实际启用能力的服务端密钥。

生产媒体应使用 `MEDIA_STORAGE_DRIVER=s3`。`media_uploads` 命名卷只用于本地或测试
环境的 local storage，不能作为生产媒体的唯一副本。

## 4. Build Locally

构建机需要 Docker Desktop 或兼容的 Docker Engine + buildx。默认目标是
`linux/amd64`，适合当前 VPS：

```sh
IMAGE_TAG=<git-sha> tools/scripts/docker/build_images.sh
```

可覆盖：

```sh
DOCKER_PLATFORM=linux/amd64
API_IMAGE=registry.example.com/mbc/api
MIGRATION_IMAGE=registry.example.com/mbc/migration
WEB_IMAGE=registry.example.com/mbc/web
DOCKER_OUTPUT_MODE=--load
```

`--load` 把单平台镜像载入本地 Docker。使用镜像仓库时，把
`DOCKER_OUTPUT_MODE=--push`，并提前完成 registry 登录。

## 5. Offline VPS Transfer

没有 registry 时，在本机导出三个已构建镜像：

```sh
IMAGE_TAG=<git-sha> tools/scripts/docker/export_images.sh
scp dist/docker/mbc_walkwith_images_<git-sha>.tar.gz* root@<server-ip>:/tmp/
```

VPS 校验并载入：

```sh
cd /tmp
sha256sum -c mbc_walkwith_images_<git-sha>.tar.gz.sha256
gzip -dc mbc_walkwith_images_<git-sha>.tar.gz | docker load
```

把仓库中的 `infra/docker/` 和 `tools/scripts/docker/` 同步到 VPS，配置
`compose.env` 的 `IMAGE_TAG=<git-sha>`，再执行部署。

## 6. Deploy and Operate

```sh
tools/scripts/docker/manage.sh deploy
tools/scripts/docker/manage.sh status
tools/scripts/docker/manage.sh logs api
tools/scripts/docker/manage.sh stop
tools/scripts/docker/manage.sh down
```

`deploy` 的固定顺序是：

1. 启动 PostgreSQL 并等待健康。
2. 运行一次性 Drizzle migration；失败立即停止。
3. 启动 API 并等待容器健康。
4. 启动 Web。
5. 从宿主机请求 `/v1/health`。

默认只绑定 `127.0.0.1:8080`，可与现有原生 Nginx 共存。Docker-only 测试机可在
确认 80 端口空闲后设置：

```text
WEB_BIND_ADDRESS=0.0.0.0
WEB_PORT=80
```

正式 HTTPS 仍建议由宿主机 Nginx/Caddy 终止 TLS，再代理到
`127.0.0.1:8080`。不要在 Compose 文件或镜像中写入证书与私钥。

## 7. Database Backup

创建 custom-format dump：

```sh
MBC_DOCKER_BACKUP_DIR=/var/backups/mbc_walkwith \
  tools/scripts/docker/database_backup.sh
```

脚本使用 `pg_dump -Fc`，同时生成 SHA-256 文件。它只负责一致性 dump，不等同于
异地备份。生产环境必须再由宿主机 restic 把该目录加密发送到独立私有 R2 bucket，
配置保留、邮件告警和定期恢复演练。不得把 dump 作为邮件附件发送。

恢复必须在维护窗口由授权运维人员手动执行：先恢复到新数据库核验，再决定是否切换，
不得把自动 `pg_restore --clean` 加入日常部署脚本。

## 8. Upgrade and Rollback

升级使用新的不可变 `IMAGE_TAG`：

1. 本机运行代码检查并构建新 tag。
2. push 或离线载入新镜像。
3. 修改 `compose.env` 中的 `IMAGE_TAG`。
4. 先备份，再运行 `manage.sh deploy`。
5. 验证健康、Admin 登录、公开页面和关键 API。

应用回滚可以恢复上一个 image tag，但数据库 migration 不自动回滚。若 migration 改变
数据结构，必须按对应 migration 的恢复方案和数据库快照处理，不能只切旧镜像。

## 9. Verification

有 Docker 的构建机执行：

```sh
docker compose --env-file infra/docker/compose.env \
  -f infra/docker/compose.yml config
IMAGE_TAG=verification tools/scripts/docker/build_images.sh
tools/scripts/docker/manage.sh deploy
curl --fail http://127.0.0.1:8080/v1/health
curl --fail http://127.0.0.1:8080/
curl --fail http://127.0.0.1:8080/admin/
```

至少再验证迁移重复执行、容器重启后数据保留、R2 上传、管理端登录和一次真实备份恢复。
当前机器没有 Docker 时，只能完成 shell、YAML 和仓库测试，不能声称镜像或 Compose
运行验证已经通过。
