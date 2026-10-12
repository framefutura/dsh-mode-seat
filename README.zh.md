# dsh-mode-seat

[English](README.md) | 中文

DeepSeek Harness 对话框常驻的 **Agent 预设（模式）选择条**，位于输入栏尾部、模型选择器旁。

## 功能

- **新任务（blank 会话）**——点开胶囊选择预设：该模式**只**应用于当前新任务（宿主按所选预设重组合成），每个任务独立，不影响其他任务。
- **已开始的会话**——只读展示当前模式；运行中的任务保持开始时的模式，点击其它预设不会切换，也**不会改动任何全局设置**，只会提示该任务模式已固定（每个任务独立选择）。
- **「设为新任务默认」**——菜单底部有一个显式动作，才写入全局的*未来*新任务默认（`agent-preset-registry` / `selectedDefault`）。只有这个显式动作会影响其他任务；在新任务里切换模式永远不会。
- **不依赖 developerTools 开关**——内置的 Agent 预设选择条只在 `developerTools: true` 时渲染（同时会带回轨迹视图、代码差异等干扰项）。本插件是独立胶囊，无需此开关，也不会把这些干扰带回来。

默认值写入与内置一致的设置命名空间（`agent-preset-registry` / `selectedDefault`），新会话合成时语义完全相同。

## 安装

三种方式任选。

### 1. 从插件市场安装（最简单）

已启用 [dsh-market](https://github.com/dsh-market/dsh-market) 插件时：设置 → **插件市场** → 搜索 **"mode-seat"** → **安装**。

> 如果市场里暂时搜不到，说明目录尚未刷新——awesome-dsh-plugin 目录由 CI 每天刷新，刷新后即可搜到。

### 2. 直接从 GitHub 安装

```sh
dsh plugin --profile desktop add github:framefutura/dsh-mode-seat
```

### 3. 手动安装（开发 / 离线）

1. 把 `dsh-mode-seat` 包目录复制到 profile 的 `node_modules` 下（例如 `~/.dsh/profiles/desktop/node_modules/dsh-mode-seat/`）。
2. 在 profile 的 `package.json` 的 `dsh.profile.bundles` 数组中添加 `"dsh-mode-seat"`。
3. 重启 Harness。

### 安装后

客户端 bundle 在启动期组合并缓存，需要**完整重启** Harness。重启后打开任意对话，即可在输入栏尾部、模型选择器旁看到模式胶囊。

## 使用

1. 点击胶囊（例如「标准模式」）。
2. **新任务/空白会话**——选择条目即切换**该任务**的预设（每任务独立）。
3. **已开始的会话**——模式已固定（运行中的会话保持其开始时确定的组合）；选择条目只会提示无法切换，不改变任何全局设置。
4. 若要更改**未来**新任务的默认，请使用菜单底部的「设为新任务默认」。

## 开发

- `index.js` —— 宿主半：空的 `apply`（全部行为在浏览器半）。
- `dist/client.js` —— 浏览器半：`window.__ModuleLoader__.load({id, factory})` 格式的 bundle，注册进 `conversation.input.right` 槽位（`id: mode-seat`，`order: 15`）。
- `cordis.patch.yml` —— 组合补丁，把包接入 profile 的 bundle 列表。

本地开发安装：把包放到 profile 的 `node_modules` 下，并在 profile `package.json` 的 `dsh.profile.bundles` 中加入 `dsh-mode-seat`。

## 许可

[MIT](LICENSE)