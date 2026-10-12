# Data Export

状态：名单、财务和证明导出能力边界，CSV/PDF 路径已接入

## Purpose

封装 CSV、PDF、表格报表、名单、统计和财务导出能力。

## Owner

Backend export service/scheduler。

## Contract

输入：

- export type。
- filter。
- actor。
- requested fields。
- output format。

输出：

- export id。
- status。
- file reference 或 signed URL。
- row count。
- diagnostic evidence。

## Rules

- 导出能力不决定业务可见性，调用前必须由 feature service 授权。
- 高风险导出必须审计。
- 导出文件应使用对象存储或受控下载路径。
- 导出失败不改变业务 source of truth。

## Errors

- `data_export_permission_denied`
- `data_export_too_large`
- `data_export_failed`
- `data_export_expired`

## Used By

- event registration。
- group ministry。
- course learning。
- serving schedule。
- giving funds。
- annual statement。
- ministry analytics。
