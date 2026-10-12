# Annual Statement

状态：同步年度证明 CSV/多页 PDF 生成、下载、分享和后台审计闭环已接入；私有对象存储异步生成尚未接入

## Feature Goal

让会友获取年度奉献证明 PDF，让财务同工在管理 Web 中生成、重生成、查看状态、导出和审计年度证明。

## Non-Goals

- 不处理付款过程。
- 不改变交易最终状态。
- 不把手续费从会友年度奉献总额中扣除。
- 不让 App 生成可信证明。

## Owners

- Feature owner：backend statement service。
- PDF capability owner：pdf generation adapter。
- App surface：giving statements page and system share.
- Admin surface：annual statement management pages。
- Source of truth owner：backend confirmed giving records and statement metadata。

## Source Of Truth

后端拥有：

- 已确认奉献交易。
- statement metadata。
- PDF object key。
- statement status。
- generated timestamp。
- download authorization。

当前后端数据库存证明 identity、冻结总额、状态和权限；下载时 statement service 通过精确 identity 读取全部 confirmed gifts 并同步生成 CSV/PDF，不伪造 `pdfObjectKey`。未来接入异步对象存储后，object storage 才拥有 PDF 文件本体。

## State Model

年度证明状态：

- `pending`
- `ready`
- `sent`
- `failed`

更细的 queued/generating/revoked 状态属于后续任务系统增强；当前 App、Admin Web
和 shared contract 只消费以上四个 canonical 状态。

## Capability Contracts

使用：

- pdf generation：生成证明 PDF。
- object storage：存储 PDF。
- audit log：生成、重生成、下载、导出。
- notification delivery：证明 ready 提醒。

## App Surface Boundary

App 可以：

- 请求年度证明列表。
- 请求生成或下载。
- 预览 PDF。
- 调用系统分享。
- 清理临时文件，分享完成后主动删除本次生成的临时 PDF。

App 不可以：

- 计算年度总额。
- 生成可信 PDF。
- 长期把 PDF 放进普通缓存。
- 修改证明状态。

会友成功下载年度证明时，后端以会友 ID 和 statement ID 记录审计，只保留税年、
文件名和字节数等最小元数据；姓名、邮箱、CSV 内容和 PDF 内容不得进入审计日志。
不存在、未就绪或未授权的下载不得记录为成功下载。

## Admin Web Surface Boundary

管理 Web 可以：

- 按年份生成证明。
- 重生成失败或过期证明。
- 查看生成状态。
- 下载或导出。
- 查看审计。

管理 Web 不可以绕过后端直接读私有 PDF。

## Backend Service Boundary

Statement service 负责：

- 根据 confirmed gifts 汇总总额。
- 使用 statement 的 user id、精确邮箱或精确姓名查询全部交易，不复用分页/模糊后台列表。
- 使用 gross amount。
- 生成 statement payload。
- 调用 PDF capability。
- 写入 statement metadata。
- 授权下载。
- 管理端按 statement ID 查看和下载，不能仅按年份选择证明。
- 记录审计。

## Side Effects

- PDF 生成。
- 对象存储写入。
- 签名下载 URL。
- 通知发送。
- 审计日志。

## Lifecycle And Recovery

当前 PDF 由明确下载动作同步生成；多页明细不得被单页裁切。异步对象存储生成属于后续能力升级。

恢复路径：

- 生成失败可重试。
- 签名 URL 过期可重新请求。
- PDF 文件缺失时 statement 进入 recoverable error。
- 重生成必须写审计。

## Error Model

稳定错误：

- `statement_not_ready`
- `statement_year_invalid`
- `statement_no_confirmed_gifts`
- `statement_generation_failed`
- `statement_pdf_missing`
- `statement_download_expired`
- `statement_permission_denied`
- `statement_stale`
- `statement_currency_mismatch`

## Main Logic Chain

```text
member/admin requests statement
-> backend validates actor and year
-> statement service reads confirmed gifts
-> service calculates donor-facing gross total
-> PDF capability generates file
-> object storage stores PDF
-> statement metadata is marked ready
-> App downloads signed URL
-> App previews or shares temporary file
-> App cleans temporary share file after the share flow returns
```

## Failure Chains

必须验证：

- 该年无 confirmed gifts。
- PDF 生成失败。
- 对象存储写入失败。
- 下载链接过期。
- 用户访问别人的证明。
- 财务角色不足。
- 重生成审计。

## Verification Checklist

- 金额来自 confirmed gifts。
- 超过后台交易列表上限的明细仍完整计入证明和多页 PDF。
- 生成后交易变化时拒绝拼接旧总额和新明细，要求重生成。
- 不把不同币种直接相加。
- 会友证明显示 gross total。
- PDF 不在普通长期缓存。
- 下载授权由后端判断。
- 生成、下载、导出有审计。

## Related Docs

- [giving_flow.md](giving_flow.md)
- [../domains/giving_finance.md](../domains/giving_finance.md)
- [../capabilities/pdf_generation.md](../capabilities/pdf_generation.md)
- [../capabilities/object_storage.md](../capabilities/object_storage.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
