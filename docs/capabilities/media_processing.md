# Media Processing

状态：本地媒体处理能力边界

## Purpose

把教会已有视频或音频转换为可人工审核的讲道音频和转录文件，不让 VPS
承担 FFmpeg、Whisper 或其他媒体计算任务。

## Owner

Local sermon workstation / `apps/sermon_studio`。

## Contract

输入：教会拥有或获准处理的本地视频或音频、输出目录、音频编码配置和
faster-whisper 配置。

输出：

- `sermon_audio.m4a`；
- `transcript.txt`；
- `transcript.md`；
- `transcript.srt`；
- `processing_info.json`。

## Rules

- 完全在本地运行，不登录、不请求、不写入后端。
- 不持有后台账户、API key、发布 token 或对象存储凭据。
- 不负责标题、讲员、讲义、大纲、经文引用、审核或发布状态。
- 不生成 AI 摘要；工作人员在 Admin Web 中维护最终文案。
- 输出只是待审核素材，不是发布事实来源。
- 临时 Whisper WAV 在转录结束或失败后删除。

本地错误包括 source missing、no audio stream、FFprobe/FFmpeg 失败、模型
不可用、转录失败和输出写入失败。这些错误不映射成 VPS API 错误码。

## Used By

- [../features/sermon_publishing.md](../features/sermon_publishing.md)
- [../local_sermon_processing.md](../local_sermon_processing.md)
