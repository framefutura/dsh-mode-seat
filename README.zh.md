# dsh-mode-seat

[English](README.md) | 中文

DeepSeek Harness 对话框常驻的 **Agent 预设（模式）选择条**，位于输入栏尾部、模型选择器旁。

## 功能

- **新任务（blank 会话）**——点开胶囊选择预设：该模式立即应用于当前新任务（宿主按所选预设重组合成）。
- **已开始的会话**——只读展示当前模式；点击其它预设无法切换运行中的任务，插件会改为把该项**设为新任务默认**并提示，选择始终可用。
- **不依赖 developerTools 开关**——内置的 Agent 预设选择条只在 `developerTools: true` 时渲染（同时会带回轨迹视图、代码差异等干扰项）。本插件是独立胶囊，无需此开关，也不会把这些干扰带回来。

默认值写入与内置一致的设置命名空间（`agent-preset-registry` / `selectedDefault`），新会话合成时语义完全相同。

## 安装

```sh
dsh plugin --profile web add github:framefutura/dsh-mode-seat
```

或从 [dsh-market](https://github.com/dsh-market/dsh-market) 插件安装（设置 → 插件市场 → 搜索 "mode-seat"）。

重启 Harness（客户端 bundle 在启动期组合并缓存，必须完整重启），打开任意对话即可在输入栏尾部、模型选择器旁看到模式胶囊。

## 使用

1. 点击胶囊（例如「标准模式」）。
2. **新任务/空白会话**——选择条目即切换该任务的预设。
3. **已开始的会话**——选择条目即设为新任务默认（有 toast 提示），因为运行中的会话保持其开始时确定的组合。

## 开发

- `index.js` —— 宿主半：空的 `apply`（全部行为在浏览器半）。
- `dist/client.js` —— 浏览器半：`window.__ModuleLoader__.load({id, factory})` 格式的 bundle，注册进 `conversation.input.right` 槽位（`id: mode-seat`，`order: 15`）。
- `cordis.patch.yml` —— 组合补丁，把包接入 profile 的 bundle 列表。

本地开发安装：把包放到 profile 的 `node_modules` 下，并在 profile `package.json` 的 `dsh.profile.bundles` 中加入 `dsh-mode-seat`。

## 许可

[MIT](LICENSE)