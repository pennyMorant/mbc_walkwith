# Media Processing

状态：媒体处理能力边界

## Purpose

封装讲道转录、大纲生成、经文引用提取、未来 embedding 等本地处理能力。

## Owner

Local sermon workstation / `apps/sermon_studio`。

## Contract

输入：

- media asset id。
- processing type。
- language。
- source metadata。
- correlation id。

输出：

- transcript。
- outline。
- scripture references。
- processing diagnostics。
- local package diagnostics。

## Rules

- 生成内容默认不发布。
- Processing capability 不决定讲道可见性。
- 本地工具必须支持可重复运行、超时诊断和人工复核。
- 外部 provider key 不进入移动 App、管理 Web 或 VPS 后端。
- 处理结果进入审核流程。

## Errors

这些错误属于本地处理工具和本地 package 诊断，不是 VPS 后端 API 的
稳定错误码。

- `media_processing_queued`
- `media_processing_failed`
- `media_source_missing`
- `media_provider_unavailable`
- `media_processing_timeout`

## Used By

- [../features/sermon_publishing.md](../features/sermon_publishing.md)
