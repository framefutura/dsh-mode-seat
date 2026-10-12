# dsh-mode-seat

[English](README.md) | 中文

A persistent **Agent-preset (mode) selector** docked inside the DeepSeek Harness composer input bar, next to the model selector.

## What it does

- **New task (blank session)** — click the chip, pick a mode: the preset applies to this new task immediately (the host recomposes with the chosen agent preset).
- **Already started session** — the current mode is shown read-only; picking a different entry can't switch a running task, so the plugin instead sets that mode as the **new-task default** and tells you so.
- **Works regardless of the Developer Tools gate** — the built-in agent-preset seat only renders when `developerTools: true` (it hides the trajectory view / code diff clutter too). This plugin is a standalone chip that does not need that switch and does not bring the clutter back.

The default is stored in the same settings namespace the built-in UI uses (`agent-preset-registry` / `selectedDefault`), so new sessions pick it up with the exact same semantics.

## Install

```sh
dsh plugin --profile web add github:framefutura/dsh-mode-seat
```

Or install it from the [dsh-market](https://github.com/dsh-market/dsh-market) plugin (Settings → Plugin Market → search "mode-seat").

After a full restart of the harness (client bundles are composed at boot and cached), open any conversation and find the mode chip at the right end of the input bar, next to the model selector.

## Usage

1. Click the chip (e.g. `标准模式` / `Standard mode`).
2. In a **new/blank task** — choosing an entry switches that task's preset.
3. In a **started task** — choosing an entry sets it as the new-task default (a toast explains this), because a running session keeps the composition it began with.

## Development

- `index.js` — host half: an empty `apply` (all behavior is client-side).
- `dist/client.js` — browser half: a `window.__ModuleLoader__.load({id, factory})` bundle registered into the `conversation.input.right` slot (`id: mode-seat`, `order: 15`).
- `cordis.patch.yml` — composition patch that wires the package into a profile's bundle list.

Local install during development: drop the package under your profile's `node_modules` and add `dsh-mode-seat` to `dsh.profile.bundles` in the profile `package.json`.

## License

[MIT](LICENSE)