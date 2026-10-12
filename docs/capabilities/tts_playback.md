# TTS Playback

状态：系统文字朗读能力边界

## Purpose

封装设备系统 TTS engine，让 App 可以朗读本地圣经文字。

## Owner

App TTS platform service。

## Contract

输入：

- text。
- language。
- voice preference。
- speed。
- pitch。

输出：

- playback state。
- progress event。
- completion event。
- structured error。

## Rules

- TTS 读文字，不播放音频圣经。
- UI 不直接调用底层 TTS engine。
- TTS service 是 lifecycle owner。
- 语言不可用必须返回可恢复错误。
- Android/iOS adapter 必须保留 `setLanguage` 的平台返回值；`0`/`false` 视为
  `tts_language_unavailable`，不能因调用未抛异常就判断成功。
- 每个 speak intent 使用唯一 run identity；所有异步 engine await 后必须确认该
  intent 仍有效。
- TTS service 使用 App 级生命周期；阅读页面 dispose 或 App 进入后台时不得自动
  停止正在进行的朗读。
- 只有用户主动停止、切换章节朗读、系统中断或 App 级 service dispose 才终止当前
  run。
- iOS 使用 `playback` category、`spokenAudio` mode 和共享 audio session；Android
  每次朗读请求系统 audio focus。
- TTS 必须注册到 App 唯一的 `audio_service` handler，不得初始化第二套媒体 service。
  handler 只桥接系统媒体元数据和控制 intent，朗读状态仍由 Bible TTS controller
  持有。
- Android 每次开始或重新开始 TTS 前必须重新启用系统媒体按钮路由。用户从通知栏
  显式终止后，controller 必须释放旧 TTS engine；下一次播放 intent 创建新 engine，
  不能复用平台可能已经终止的会话。
- TTS 系统媒体元数据随当前经节更新；支持播放、暂停、停止、上一节和下一节。
- 讲道或 TTS 取得媒体 owner 时必须停止前一个 owner，避免同时播放和系统按钮错投。

## Errors

- `tts_engine_unavailable`
- `tts_language_unavailable`
- `tts_start_failed`
- `tts_interrupted`
- `tts_disposed`

## Used By

- [../features/bible_tts.md](../features/bible_tts.md)
