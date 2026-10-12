/**
 * DSH 模式常驻选择条插件（Mode Seat）
 * ====================================
 *
 * 形态：一个导出 `apply` 的 ESM 模块 —— DSH 插件的标准契约
 * （`export const name` + `export const inject` + `export function apply(ctx, config)`）。
 *
 * 它做什么：
 *   - 宿主半（本文件）为空 apply —— 所有行为都在浏览器半。
 *   - 浏览器半（dist/client.js）在对话输入区（composer）注册一个常驻的
 *     “Agent 预设”选择条，新任务与已运行会话都能看到当前模式，
 *     新任务可切换，已运行会话只读展示并支持“设为新任务默认”。
 *
 * 为什么零外部 import：插件通过 profile 的 cordis.patch.yml 挂载时，
 * Node 的裸模块解析走不到 harness 自己的 node_modules，任何
 * `import '@deepseek-ai/...'` 都会让加载失败。这里只依赖 `ctx` 表面。
 */

export const name = 'dsh-mode-seat'

export const inject = []

/** Host 半无宿主行为；浏览器半通过 dsh.client 声明被 clientModules 扫描发现。 */
export function apply() {}
