# Bible TTS

状态：App 本地圣经文字朗读、后台延续与原生媒体控制已接入

## Feature Goal

让会友在 App 内听本地圣经文字朗读。这里的 TTS 是读文字圣经，不是播放音频圣经资源。

## Non-Goals

- 不是音频圣经播放。
- 不需要后端参与普通朗读。
- 不上传用户朗读内容。
- 不把 TTS 状态同步成后端最终状态。

## Owners

- Feature owner：App study feature。
- Lifecycle owner：App TTS service/controller。
- Text owner：Bible content domain and local Bible data source。
- Surface owner：Study reader screen。

## Source Of Truth

App 本地拥有：

- 当前经文文本。
- 阅读位置。
- TTS 播放状态。
- 朗读语言和语速设置。

后端未来可以拥有授权版本目录或同步设置，但普通朗读状态不属于后端。

## State Model

TTS 状态：

- `idle`
- `loading`
- `speaking`
- `paused`
- `stopped`
- `interrupted`
- `error`

## Capability Contracts

使用：

- tts playback：系统 TTS engine。
- local storage：阅读设置和最近位置。
- bible content：本地圣经文本和版本元数据。

## App Surface Boundary

App reader 可以：

- 选择章节或经文。
- 触发朗读。
- 暂停、继续、停止。
- 调整语速。
- 展示当前朗读状态和错误。
- 在 Android 通知栏和 iOS 锁屏/控制中心显示当前书卷、章节、经节与版本。
- 通过系统媒体按钮播放、暂停、停止、上一节和下一节。

Reader UI 不直接拥有 TTS engine。它只调用 TTS controller/service。

## Admin Web Surface Boundary

普通 Bible TTS 没有管理 Web 操作。

未来如果管理圣经版本授权或文本包，属于 Bible content domain 和 backend/admin content workflow，不属于 TTS playback 本身。

## Backend Service Boundary

普通 TTS 不需要后端。

后端只在未来场景参与：

- 圣经版本授权目录。
- 文本包发布。
- 学习辅助或同步阅读进度。

## Side Effects

- 系统 TTS 播放。
- 本地设置写入。
- 可能的音频焦点或系统中断处理。

## Lifecycle And Recovery

TTS service 必须处理：

- start。
- pause。
- resume。
- stop。
- interruption。
- dispose。
- 阅读页面退出和 App 切入后台时继续当前朗读；页面重新进入同一章节后重新绑定全局
  状态并恢复经节高亮。
- TTS 与讲道共享唯一 `audio_service` media session；开始其中一个时必须停止另一个，
  系统媒体按钮始终路由到当前 owner。
- 通知栏显式终止会释放当前系统 TTS engine；页面再次播放时重新创建 engine 并重新
  激活 Android 媒体按钮路由，使同一 App 会话内可以可靠地重新朗读。
- language unavailable。
- text missing。
- 暂停、停止、切换章节或新朗读 intent 必须使旧 run 失效；旧 engine completion
  不能覆盖新状态，也不能在异步配置完成后继续开口。
- `loading` 期间播放、经节切换和语速入口保持禁用，只保留停止动作，避免并发配置
  系统 engine。
- controller 已发布为 `error`/`interrupted` 的预期异常由 reader session 消化，
  UI 显示本地化恢复提示，不能形成未处理 Future。

系统中断后，状态必须回到 `paused`、`interrupted` 或 `error`，UI 给出恢复动作。

## Error Model

稳定错误：

- `bible_text_missing`
- `tts_engine_unavailable`
- `tts_language_unavailable`
- `tts_interrupted`
- `tts_start_failed`
- `tts_disposed`

## Main Logic Chain

```text
reader selects chapter or verse
-> App creates speak intent
-> Bible local data source returns text
-> TTS controller validates language and text
-> TTS capability starts system speech
-> controller updates speaking state and current verse metadata
-> shared media session publishes native notification/lock-screen state
-> UI shows controls and progress
```

## Failure Chains

必须验证：

- 章节文本缺失。
- 系统没有对应语言。
- Android/iOS `setLanguage` 返回 `0` 或 `false`，而不是只抛异常。
- 播放中被系统中断。
- 用户离开阅读页面后继续朗读，App 级 service dispose 时才停止。
- 重复点击播放。
- 暂停后恢复。
- 通知栏播放、暂停、停止、上一节和下一节。
- TTS 与讲道互相切换时旧 owner 被停止，且系统按钮不会路由到旧 owner。

## Verification Checklist

- TTS 不是音频圣经播放。
- UI 不直接调用底层 TTS engine。
- 本地文本来源清楚。
- lifecycle owner 唯一。
- 只存在一个共享 media session，没有第二套 Android media service。
- 错误有恢复动作。

## Related Docs

- [../domains/bible_content.md](../domains/bible_content.md)
- [../capabilities/tts_playback.md](../capabilities/tts_playback.md)
- [../surfaces/mobile_app.md](../surfaces/mobile_app.md)
- [../core/lifecycle.md](../core/lifecycle.md)
