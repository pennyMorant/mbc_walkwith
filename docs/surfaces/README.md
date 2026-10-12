# Surfaces

状态：表达层边界入口

Surface 是表达层。它可以展示状态、收集输入、触发 typed intent、显示 loading/empty/error 和恢复动作。它不能拥有核心业务状态或业务规则。

## 1. Surface Types

- [mobile_app.md](mobile_app.md)：会友移动 App。
- [admin_web.md](admin_web.md)：后台管理 Web。
- [public_web.md](public_web.md)：公开官网 landing。
- [backend_api.md](backend_api.md)：HTTP route、webhook 等 API surface。

## 2. Surface Can Do

- Present state。
- Collect input。
- Dispatch typed intent。
- Show progress。
- Render structured errors。
- Offer next action。

## 3. Surface Must Not Do

- Own durable business state。
- Implement domain rules。
- Directly manage durable runtime resources。
- Directly call provider secrets。
- Reach into another feature private internals。

## 4. Rule

如果一个页面开始决定付款、报名、发布、可见性、权限或证明金额，它已经越过 surface 边界。
