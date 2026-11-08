# Changelog

## 0.2.0 — 2026-11-08

Targets DeepSeek Harness **0.2.2** (cordis 4.1.x). Verified against `@deepseek-ai/dsh-desktop` 0.2.2-rc.1.

- **Manifest** — peer `@deepseek-ai/cordis` moves from `^4.0.4` to `~4.1.0`; the client `inject` list now also names `@deepseek-ai/dsh-client-ui-session` and `@deepseek-ai/dsh-api-remotes`, i.e. the two services the dock actually reads (`ctx.sessions`, `ctx.remote`).
- **Refusals** — when the host refuses a switch it raises `RemoteError` with the stable code `agent-preset/locked`; the dock now maps that code to its own localized "the mode is fixed for this task" copy instead of echoing the host's internal English sentence. Other refusal reasons still surface the host's own message.
- **Docs** — compatibility section in both READMEs, and this changelog.

No rendered change, no new slot, no behaviour change for the per-task / set-as-default rules.

## 0.1.0

First release: a persistent Agent-preset chip in the composer (`conversation.input.right`, `id: mode-seat`, `order: 15`), per-task switching for blank sessions, read-only display for started sessions, and an explicit "set as new task default" action that writes `agent-preset-registry` / `selectedDefault`.
