# Capabilities

状态：外部能力和副作用边界入口

Capability 是可替换能力或外部副作用边界。Capability 只封装外部世界，不拥有 feature 业务规则。

## 1. Capability Boundary

Capability 可以：

- 定义输入输出。
- 调用外部 provider。
- 处理 provider 错误。
- 暴露 retry、timeout、diagnostic evidence。
- 提供 adapter。

Capability 不可以：

- 决定活动报名成功。
- 决定奉献最终状态。
- 决定讲道是否发布。
- 决定年度证明总额。
- 决定内容可见性。

## 2. Current Capabilities

- [capability_matrix.md](capability_matrix.md)：当前实现、owner 文件和 provider 配置矩阵。
- [payment_gateway.md](payment_gateway.md)：Stripe 等支付 provider。
- [object_storage.md](object_storage.md)：对象存储和签名 URL。
- [notification_delivery.md](notification_delivery.md)：推送和通知投递。
- [email_delivery.md](email_delivery.md)：会员注册邮箱验证码投递。
- [firebase_identity.md](firebase_identity.md)：Google/Apple Firebase 身份验证与后端会员绑定。
- [audio_playback.md](audio_playback.md)：讲道音频播放、后台播放和原生媒体控制。
- [pdf_generation.md](pdf_generation.md)：PDF 生成。
- [tts_playback.md](tts_playback.md)：系统 TTS。
- [media_processing.md](media_processing.md)：转录、大纲、经文引用等媒体处理。
- [qr_check_in.md](qr_check_in.md)：二维码或签到码生成、校验和过期。
- [data_export.md](data_export.md)：名单、统计和财务报表导出。
- [scheduled_notification.md](scheduled_notification.md)：延迟通知、定时提醒和重复提醒。
- [ai_provider.md](ai_provider.md)：OpenAI、Gemini 和 OpenAI-compatible provider adapter。
