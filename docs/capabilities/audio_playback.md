# Audio Playback

状态：移动端讲道与 Bible TTS 共享原生媒体播放能力

## Purpose

让 App 的讲道音频与 Bible TTS 接入 Android 和 iOS 的同一个原生媒体播放体系。

## Owner

- App bootstrap：`apps/mobile/lib/main.dart`
- Android media service：`apps/mobile/android/app/src/main/AndroidManifest.xml`
- Android activity：`apps/mobile/android/app/src/main/kotlin/com/example/mbc_walkwith/MainActivity.kt`
- iOS background mode：`apps/mobile/ios/Runner/Info.plist`
- Shared media session：`apps/mobile/lib/core/media/app_media_session.dart`
- Audio engine：`apps/mobile/lib/features/sermons/data/player/sermon_audio_engine.dart`
- Playback session：`apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart`

## Provider Boundary

移动端使用：

- `just_audio`：实际音频播放。
- `audio_session`：iOS `AVAudioSession` 和 Android audio focus / noisy / interruption 行为。
- `audio_service`：唯一的 Android media notification、MediaSession、耳机按键、锁屏/控制中心、CarPlay/Android Auto 远程控制桥接；由讲道与 Bible TTS 共享。

后端只提供已发布讲道音频 URL 和 Range audio stream。Range stream 必须支持
`bytes=N-M`、`bytes=N-` 和 `bytes=-N`，无效 range 必须安全回退。App 不直接访问私有对象存储。

## Contract

输入：

- published sermon audio URL。
- sermon media metadata：title、speaker、series、duration、artwork。
- playback speed。
- saved local position。
- newer server progress for the current member or external installation。

输出：

- playback state：playing、buffering、completed。
- current position and duration。
- Android / iOS native media session metadata。
- local progress save。
- backend progress report。
- member/external progress restore with `updatedAt` conflict resolution。

平台要求：

Android 必须具备：

- `AudioServiceActivity` 或其子类。
- `AudioService` service。
- `MediaButtonReceiver`。
- `WAKE_LOCK`。
- `FOREGROUND_SERVICE`。
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK`。
- foreground service type `mediaPlayback`。

iOS 必须具备：

- `UIBackgroundModes` 包含 `audio`。
- 播放时配置 `AudioSessionConfiguration.speech()`，即 `AVAudioSessionCategory.playback` 和 `AVAudioSessionMode.spokenAudio`。

## Rules

- App 内播放按钮、Android 通知栏、iOS 控制中心、锁屏和耳机按钮都必须作用到同一个播放器 session。
- 讲道与 Bible TTS 不得分别初始化媒体 service；切换 owner 时，共享 session 必须先停止前一个 owner，再发布新 owner 的元数据和控制动作。
- 播放器 session 属于讲道 feature 层，不属于详情页 widget 生命周期；从详情页返回列表不能自动停止播放。
- 底层原生播放器状态是播放、暂停、缓冲和完成态的来源。
- 系统暂停、耳机拔出、来电或 audio focus 被抢占时，session 必须保存当前进度。
- 播放完成时必须清理本地进度，并向后端上报完成状态。
- 本地进度先写入；服务器同步失败不能阻断暂停、切换或退出。
- 恢复时只接受比本地记录更新的服务器进度，避免旧服务器状态覆盖离线播放。
- 后端按 canonical duration 限制位置并推导完成态，App 不能单独决定完成状态。
- 完成后再次点击播放应从头开始。
- 播放速度和恢复进度属于 App 本地偏好；发布状态和音频 URL 属于后端 sermon source of truth。
- 切换讲道 source 前先以旧讲道快照保存本地进度，远端上报在后台继续；原生
  source replacement 产生的 pause 事件不能把旧位置写入新讲道。
- 系统媒体 artwork 优先使用后端发布的 `thumbnailUrl`；缺失时使用 App 内置讲道默认封面。

## Errors

- 无音频：App 显示 `sermonAudioMissing`。
- 音频未准备好：App 显示 `sermonAudioPreparing`。
- 加载中：App 显示 `sermonAudioLoading`。
- 加载失败或对象缺失：App 显示 `sermonAudioUnavailable` 并允许重试。

## Used By

- [../features/sermon_publishing.md](../features/sermon_publishing.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../sdk/sermons.md](../sdk/sermons.md)

## Verification

- `flutter analyze`
- `flutter test test/sermon_player_session_test.dart`
- `flutter test test/widget_test.dart`
- 真机/模拟器人工验证：后台播放、锁屏控制、系统暂停/继续、耳机拔出、完成后重播。

## Related Docs

- [../features/sermon_publishing.md](../features/sermon_publishing.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../sdk/sermons.md](../sdk/sermons.md)
