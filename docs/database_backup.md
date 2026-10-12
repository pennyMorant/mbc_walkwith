# PostgreSQL Backup and Recovery

状态：生产运维规范

本文档定义 MBC WalkWith 自建 VPS PostgreSQL 的异地加密备份、校验和恢复流程。它保护数据库，不替代 R2 媒体桶自身的生命周期管理。

## 1. Boundary

Source of truth 是 VPS PostgreSQL。备份 owner 是 VPS deployment manager：

```text
PostgreSQL -> pg_dump -> encrypted restic repository in private R2 -> operator alert
```

备份不经过 App、Admin Web 或 API，不读取应用 `DATABASE_URL`，而是通过本机
`postgres` Unix 用户执行 `pg_dump`。讲道音频、图片和年度证明本体仍以 R2 为主存储；
数据库备份只保存其业务记录和元数据。

以上 owner 描述适用于原生 VPS 部署。可选 Docker 部署先通过
`tools/scripts/docker/database_backup.sh` 从 PostgreSQL 容器生成 custom-format dump，
再由宿主机 restic 执行同样的加密异地上传、保留、告警和恢复演练。Docker dump
不能作为邮件附件发送，也不能只保存在 PostgreSQL 所在 VPS。详见
[docker_deployment.md](docker_deployment.md)。

## 2. What Is Installed

VPS 安装脚本会安装 `restic`，并写入以下内容：

```text
/etc/mbc_walkwith/backup.env
/etc/mbc_walkwith/backup-restic-password
/usr/local/libexec/mbcwalkwith_backup
/var/lib/mbc_walkwith/backup/
/var/lib/mbc_walkwith/restore/
```

`backup-restic-password` 和 R2 凭证必须同时保存在教会受控的密码管理器中。VPS 丢失
时，只有 R2 文件不足以恢复。

安装但未配置时，备份默认关闭；不会在首次部署或后续 release 中自行上传数据。

## 3. R2 Preparation

创建独立、私有的 bucket，例如：

```text
mbc-walkwith-db-backups-prod
```

不要复用讲道媒体 bucket，也不要复用媒体访问密钥。为备份创建单独 R2 API token，只限
此 bucket 的 list、read、write、delete 权限；`delete` 是周/月保留清理所必需的。

R2 repository 值使用 S3 格式：

```text
s3:https://<cloudflare-account-id>.r2.cloudflarestorage.com/<backup-bucket>
```

bucket 必须保持私有，不能提供公开下载 URL。Restic 在上传前加密，R2 不持有可恢复
密码；不要把 restic 密码写入 Git、邮件或聊天记录。

## 4. Configure and Enable

在 VPS 编辑 root-only 配置：

```sh
sudoedit /etc/mbc_walkwith/backup.env
```

生产示例：

```sh
BACKUP_ENABLED=true
BACKUP_DATABASE_NAME=mbc_walkwith
BACKUP_RESTIC_REPOSITORY=s3:https://<account-id>.r2.cloudflarestorage.com/mbc-walkwith-db-backups-prod
RESTIC_PASSWORD_FILE=/etc/mbc_walkwith/backup-restic-password
AWS_ACCESS_KEY_ID=<dedicated-r2-access-key>
AWS_SECRET_ACCESS_KEY=<dedicated-r2-secret>
AWS_DEFAULT_REGION=auto
BACKUP_TIMEZONE=America/Los_Angeles

BACKUP_ALERT_ENABLED=true
BACKUP_ALERT_TO=ops@example.org
BACKUP_ALERT_FROM='MBC WalkWith Backup <backup@example.org>'
BACKUP_ALERT_RESEND_API_KEY=<dedicated-resend-api-key>
```

`BACKUP_ALERT_*` 只发送结果通知，不携带 dump、成员信息、连接串或 R2 凭证。建议创建
独立 Resend key，便于单独轮换和撤销。

首次启用：

```sh
sudo mbcwalkwith upgrade-script
sudo mbcwalkwith backup-init
sudo mbcwalkwith backup-now
sudo mbcwalkwith backup-status
```

`backup-init` 会验证时区、初始化 restic 加密仓库并启用 timer。首次 `backup-now` 是
上线前必做演练；未成功前不要把备份任务视为已上线。

## 5. Schedule and Retention

所有任务使用排他锁，避免备份、校验与恢复验证重叠。timer 具有 `Persistent=true`，VPS
在计划时间关闭时会在恢复后补跑。

| Task | Schedule | Result |
| --- | --- | --- |
| Database dump | 每日 02:30 | `pg_dump` custom format、可读性检查、加密上传、成功/失败邮件 |
| Repository verification | 每周日 03:30 | Restic repository metadata/integrity check，失败告警 |
| Restore verification | 每月 1 日 04:00 | 恢复最新快照至临时数据库，检查关键表后删除临时库 |

每日 dump 成功后保留：每日 30 份、每周 12 份、每月 12 份。每周执行 `forget`，每月执行
`prune`。原始 dump 只短暂写入 VPS 的受限 staging 目录。目录只允许 root 与本机
`postgres` 用户进入，以便 `pg_dump` 写入；正常上传后删除，失败文件最多保留三天供排查。

## 6. Operator Commands

```sh
sudo mbcwalkwith backup-status
sudo mbcwalkwith backup-now
sudo mbcwalkwith backup-verify
sudo mbcwalkwith logs backup
sudo mbcwalkwith logs backup-verify
sudo mbcwalkwith logs backup-restore
```

`backup-verify` 用于人工立即检查 restic repository。月度恢复验证绝不覆盖生产数据库，
只创建临时 `mbc_backup_verify_*` 数据库；成功或失败后都会尝试清理。

## 7. Disaster Recovery

生产恢复不能使用一键命令，必须由授权运维人员在维护窗口执行。恢复前：

1. 宣布维护并停止 API 写入。
2. 在新 VPS 或隔离临时环境中配置相同 R2 凭证和 restic 密码。
3. 先恢复到临时库并验收，而不是直接覆盖生产库。
4. 核对迁移版本、`users`、`sermons`、奉献记录、年度证明和近期管理操作。
5. 经负责人批准后才执行生产切换；保留故障库副本直到验收结束。

示例恢复到临时目录：

```sh
sudo -i
source /etc/mbc_walkwith/backup.env
restic snapshots --tag database
restic restore <snapshot-id> --target /var/lib/mbc_walkwith/restore/manual
find /var/lib/mbc_walkwith/restore/manual -name '*.dump' -print
sudo -u postgres createdb --template=template0 mbc_walkwith_recovery
sudo -u postgres pg_restore --exit-on-error --no-owner --no-privileges \
  --dbname mbc_walkwith_recovery /path/to/restored.dump
```

不要在未确认目标数据库名称的情况下使用 `pg_restore --clean`。任何覆盖生产库的操作需要
两人复核、当前数据库快照和变更记录。

## 8. Scope and Remaining Operations

此机制满足 VPS 与 R2 两地的数据库恢复。若教会未来要求严格的 `3-2-1`，应把每月加密
快照复制到独立账户或第二家存储商。媒体桶则应单独执行每月对象清单和抽样读取检查，确认
R2 对象和数据库媒体记录未断链。
