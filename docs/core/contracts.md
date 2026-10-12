# Core Contracts

状态：全系统契约定义

本文档定义所有 feature、domain、surface、capability 和 SDK 必须遵守的 core contract。这里写 contract 形状，不写具体 feature 业务。

## 1. Feature Contract

每个 feature 必须声明：

- `feature_id`：稳定 snake_case 名称。
- `business_goal`：用户或管理员要完成的闭环目标。
- `owner`：最终业务 owner。
- `surfaces`：App、Admin Web、Backend API、local tools、notification 等入口。
- `source_of_truth`：最终状态归属。
- `state_model`：核心状态和状态迁移。
- `capabilities_used`：用到的外部能力。
- `domains_used`：依赖的共享业务规则。
- `permissions`：需要的角色和身份。
- `audit_events`：必须审计的动作。
- `lifecycle_owner`：长任务或可恢复行为 owner。
- `error_categories`：稳定错误类别。
- `verification_chain`：主链路和失败链路。

## 2. Source Of Truth Contract

每个关键状态必须声明：

- 状态名称。
- 唯一 owner。
- 存储位置。
- 允许读取者。
- 允许写入者。
- 派生缓存是否允许。
- 缓存失效规则。
- 删除或归档规则。

任何页面、缓存、provider callback、redirect success page 都不能替代 source of truth。

## 3. Capability Contract

外部能力必须通过 capability contract 暴露：

- capability id。
- 输入和输出。
- 成功条件。
- 错误类别。
- retry 规则。
- timeout 规则。
- permission 或配置要求。
- diagnostic evidence。
- adapter owner。

Capability 只封装副作用，不拥有业务规则。

## 4. Surface Contract

Surface 必须声明：

- 展示哪些状态。
- 收集哪些输入。
- 触发哪个 typed intent。
- 如何展示 loading、empty、error。
- 哪些业务规则不属于 surface。
- 如何从 canonical state 刷新。

Surface 包括 App screen、Admin Web page/dialog/table、Backend route、CLI、notification callback。

## 5. Lifecycle Contract

可恢复行为必须声明：

- start。
- stop。
- pause。
- resume。
- retry。
- cancel。
- recover。
- dispose。
- timeout。
- stale cleanup。

如果两个 owner 都能恢复同一个 runtime resource，边界是错的。

## 6. Error Contract

重要错误必须包含：

- stable code。
- category。
- source layer。
- human message。
- recoverability。
- retryability。
- evidence。
- next action。
- permission 或配置要求。

禁止只返回 `false`、`null` 或 `failed`。

## 7. Permission Contract

需要权限的动作必须声明：

- actor type。
- required role。
- resource owner。
- visibility rule。
- denial error。
- audit requirement。

前端隐藏按钮不是权限控制。权限最终由后端 service 判断。

## 8. Audit Contract

高风险动作必须声明：

- actor。
- action。
- resource type。
- resource id。
- before/after 或关键 metadata。
- provider event id。
- request correlation id。
- timestamp。

审计日志是高风险链路的恢复和追责依据，不是 UI 装饰。
