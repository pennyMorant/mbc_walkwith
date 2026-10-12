# Logic Chain

状态：主链路和失败链路验证标准

一个架构敏感 feature 不算完成，除非主链路和失败链路都能被审计。

## 1. Standard Chain

```text
input or event
-> typed intent
-> validation
-> source-of-truth read
-> business rule
-> side-effect boundary
-> state update
-> surface feedback
-> diagnostics/recovery path
```

## 2. Required Evidence

每条链路需要能说明：

- 谁触发。
- 谁校验。
- 谁读取 source of truth。
- 哪个业务规则决定状态迁移。
- 哪个 capability 执行副作用。
- 状态写在哪里。
- surface 从哪里刷新。
- 失败时给出什么 recovery action。

## 3. Failure Chain

失败链路至少覆盖：

- permission denied。
- validation failed。
- stale state。
- duplicate request。
- network/provider failure。
- timeout。
- canceled operation。
- retry exhausted。
- inconsistent external event。

只验证 happy path 不符合完成标准。

## 4. MBC Examples

- 活动报名：名额满、重复报名、活动关闭、未登录必须可解释。
- 奉献：checkout 成功页不能确认交易，webhook 才是最终状态。
- 年度证明：PDF 下载失败不影响 statement source of truth。
- 讲道发布：上传成功不代表 App 可见，发布状态才决定可见性。
- Bible TTS：系统打断或语言缺失必须回到可恢复状态。
