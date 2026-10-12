/**
 * dsh-mode-seat — 浏览器半
 *
 * 在对话输入栏尾部（conversation.input.right）注册常驻的 “Agent 预设” 选择条：
 *   - 新任务（blank 会话）点击预设立即切换模式（宿主负责重组合成，并写会话事件），
 *     每任务独立，不影响其他任务；
 *   - 已开始（非 blank）的会话模式固定（宿主拒绝切换），点击预设仅提示锁定，
 *     不会修改任何默认值，避免一个任务改动影响其他任务；
 *   - 菜单底部的「设为新任务默认」是显式动作，才写入 settings 命名空间
 *     agent-preset-registry 的 selectedDefault，与新会话合成语义一致。
 *
 * 加载格式：window.__ModuleLoader__.load({id, factory})，factory 收到 require；
 * 依赖从平台 seed 解析（react / @deepseek-ai/dsh-client-store /
 * @deepseek-ai/dsh-client-ui-primitives）。
 */
window.__ModuleLoader__.load({
  id: "dsh-mode-seat",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    var react = require("react");
    var react_jsx_runtime = require("react/jsx-runtime");
    var primitives = require("@deepseek-ai/dsh-client-ui-primitives");
    var client_store = require("@deepseek-ai/dsh-client-store");

    var jsx = react_jsx_runtime.jsx;
    var jsxs = react_jsx_runtime.jsxs;

    var SETTINGS_NS = "agent-preset-registry";
    var SET_DEFAULT_ID = "__modeSeatSetDefault";
    var CSS_TAG = "dsh-mode-seat/mode-seat.css";
    var NS = "modeSeat";

    /** 内置预设文案（与内置 locale 词典一致，避免依赖内置命名空间）。 */
    var BUILT_IN = {
      standard: { name: "presetStandardName", description: "presetStandardDescription" },
      ptc: { name: "presetPtcName", description: "presetPtcDescription" },
      minimal: { name: "presetMinimalName", description: "presetMinimalDescription" },
      cordis: { name: "presetCordisName", description: "presetCordisDescription" }
    };

    var zh = {
      seatHint: "选择新任务使用的 Agent 预设",
      headerHint: "本任务的 Agent 预设，在任务开始时确定",
      setDefault: "设为新任务默认",
      setDefaultDone: "已将「{name}」设为新任务默认",
      noDescription: "暂无描述。",
      switchRefused: "无法切换到「{name}」：{reason}",
      runningLocked: "任务已开始，本任务的模式已固定，无法切换；每个任务独立选择，不受其他任务影响。如需更改新任务默认，请使用下方「设为新任务默认」。",
      presetStandardName: "标准模式",
      presetStandardDescription: "处理代码、文件和资料，适合大多数任务。Agent 会按需使用检索、编辑和终端等工具。",
      presetPtcName: "PTC 模式",
      presetPtcDescription: "包含标准模式的所有能力，更适合批量调用工具，并对结果进行筛选、整理、去重、统计或汇总的任务。",
      presetMinimalName: "极简模式",
      presetMinimalDescription: "Agent 仅使用终端工具完成任务，适合测试和对比其基础表现。",
      presetCordisName: "创造模式",
      presetCordisDescription: "用对话定制 DSH：让 Agent 编写插件，添加新功能或界面；也能组合工具和提示词，创建自己的模式。"
    };

    var en = {
      seatHint: "Choose the agent preset for your new task",
      headerHint: "The agent preset chosen when this task started",
      setDefault: "Set as new task default",
      setDefaultDone: "Set “{name}” as the default for new tasks",
      noDescription: "No description.",
      switchRefused: "Could not switch to {name}: {reason}",
      runningLocked: "This task already started and its mode is fixed; it cannot be switched. Each task chooses its mode independently. To change the default for new tasks, use “Set as new task default” below.",
      presetStandardName: "Standard mode",
      presetStandardDescription: "Work with code, files, and information. Suitable for most tasks, with search, editing, terminal commands, and other tools available as needed.",
      presetPtcName: "PTC mode",
      presetPtcDescription: "Includes all Standard mode capabilities. Better suited to tasks that call tools in batches and then filter, organize, deduplicate, count, or summarize the results.",
      presetMinimalName: "Minimal mode",
      presetMinimalDescription: "The agent works using only a terminal tool. Useful for testing and comparing its basic performance.",
      presetCordisName: "Creator mode",
      presetCordisDescription: "Customize DSH through conversation. Let the agent write plugins that add features or UI, or combine tools and prompts to create your own mode."
    };

    /** 行的显示名/描述：已发布 name 优先，否则落到内置词典。 */
    function displayOf(option, t) {
      if (option !== void 0 && typeof option.name === "string") {
        return { name: option.name, description: option.description };
      }
      var id = option === void 0 ? void 0 : option.id;
      var key = id === void 0 ? void 0 : BUILT_IN[id];
      if (key !== void 0) return { name: t(key.name), description: t(key.description) };
      return { name: id === void 0 ? "" : String(id), description: void 0 };
    }

    function presetOptions(rows) {
      return rows.filter(function (row) { return row.broken === void 0; }).map(function (row) {
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          isDefault: row.isDefault === true
        };
      });
    }

    async function readRoster(ctx) {
      var result = await ctx.remote.agentPresets.list();
      if (result.ok) return { ok: true, value: result.value };
      if (result.error !== void 0 && result.error.code === "gateway/invocation-unavailable") {
        return { ok: true, value: { presets: [] } };
      }
      return {
        ok: false,
        error: result.error !== void 0 && typeof result.error.message === "string" ? result.error.message : String(result.error)
      };
    }

    async function writeDefaultPreset(ctx, id) {
      var response = await ctx.remote.settings.update(SETTINGS_NS, { selectedDefault: id }, void 0);
      return response.ok ? void 0 : (response.error !== void 0 && typeof response.error.message === "string" ? response.error.message : "failed");
    }

    async function applySelection(ctx, sessionId, id) {
      var result = await ctx.remote.agentPresets.select(sessionId, id);
      if (result.ok) return void 0;
      var err = result.error;
      if (err !== void 0 && err.details !== void 0 && typeof err.details.reason === "string") return err.details.reason;
      if (err !== void 0 && typeof err.message === "string") return err.message;
      return "unknown error";
    }

    /** 常驻选择条（输入栏尾部）：新任务点击切换（每任务独立），已开始会话仅提示锁定。 */
    function ModeSeatDockImpl({ useRoster, useSessionSummary, select, setDefault, t, sessionId }) {
      var roster = useRoster(function (s) { return s; });
      var summary = useSessionSummary(function (s) {
        return s === void 0 ? void 0 : s.byId[sessionId];
      });
      var preset = summary !== void 0 && summary.projectionValues !== void 0 && typeof summary.projectionValues.agentPreset === "string"
        ? summary.projectionValues.agentPreset
        : void 0;
      var blank = summary !== void 0 && summary.blank === true;
      if (sessionId === void 0 || summary === void 0) return null;

      var _useState = react.useState(false), open = _useState[0], setOpen = _useState[1];
      var _useState2 = react.useState(false), busy = _useState2[0], setBusy = _useState2[1];
      var _useState3 = react.useState(null), toast = _useState3[0], setToast = _useState3[1];
      var toastSeq = react.useRef(0);

      var options = roster.options;
      var ready = options.length > 0 && preset !== void 0;
      if (!ready || sessionId === void 0) return null;

      var current = options.find(function (o) { return o.id === preset; });
      var currentDefault = current !== void 0 && current.isDefault === true;
      var label = displayOf(current, t).name;

      function showToast(text) {
        toastSeq.current += 1;
        setToast({ seq: toastSeq.current, text: text });
      }

      var items = options.map(function (o) {
        var d = displayOf(o, t);
        return {
          id: o.id,
          label: jsxs("span", { className: "ms-item", children: [
            jsx("span", { className: "ms-name", children: d.name }),
            jsx("span", { className: "ms-desc", children: d.description === void 0 ? t("noDescription") : d.description })
          ] })
        };
      });
      items.push({
        id: SET_DEFAULT_ID,
        disabled: currentDefault,
        label: jsx("span", { className: "ms-set", children: t("setDefault") })
      });

      var onSelect = function (id) {
        setOpen(false);
        if (id === SET_DEFAULT_ID) {
          if (currentDefault || preset === void 0) return;
          setBusy(true);
          setDefault(preset).then(function (refusal) {
            setBusy(false);
            if (refusal === void 0) showToast(t("setDefaultDone", { name: label }));
            else showToast(String(refusal));
          });
          return;
        }
        var picked = options.find(function (o) { return o.id === id; });
        var name = picked === void 0 ? id : displayOf(picked, t).name;
        if (!blank) {
          // 已开始的会话模式固定（宿主拒绝切换）：仅提示，不写全局默认，避免影响其他任务。
          showToast(t("runningLocked"));
          return;
        }
        setBusy(true);
        select(id).then(function (refusal) {
          setBusy(false);
          if (refusal !== void 0) showToast(t("switchRefused", { name: name, reason: String(refusal) }));
        });
      };

      var anchor = jsxs("button", {
        type: "button",
        className: "ms-seat",
        "aria-haspopup": "menu",
        "aria-expanded": open,
        title: t(blank ? "seatHint" : "headerHint"),
        disabled: busy,
        onClick: function () { setOpen(function (v) { return !v; }); },
        children: [
          jsx(primitives.IconAgentPresetOutlineRegular, { className: "ms-seatIcon" }),
          jsx("span", { className: "ms-label", children: label }),
          jsx(primitives.IconChevronDownOutlineRegular, { className: "ms-chevron" })
        ]
      });

      return jsxs(react.Fragment, { children: [
        jsx(primitives.Menu, {
          open: open,
          onClose: function () { setOpen(false); },
          items: items,
          selectedId: preset,
          onSelect: onSelect,
          align: "start",
          portal: true,
          className: "ms-menu",
          anchor: anchor
        }),
        toast !== null && jsx(primitives.Toast, {
          text: toast.text,
          holdMs: 6000,
          anchor: typeof document !== "undefined" ? document.querySelector("[data-composer-card]") : void 0,
          onDone: function () { setToast(null); }
        }, toast.seq)
      ] });
    }

    /** Cordis fiber inject：所需服务名（与 ui-agent-preset 相同的命名空间契约）。 */
    var inject = [
      "slots",
      "sessions",
      "locale",
      "remote",
      "remote.agentPresets",
      "remote.settings"
    ];

    function apply(ctx) {
      var roster = client_store.createSnapshotStore({ status: "idle", error: null, options: [] });

      function loadRoster() {
        readRoster(ctx).then(function (res) {
          if (!res.ok) {
            roster.set({ status: "error", error: res.error, options: [] });
            return;
          }
          roster.set({ status: "ready", error: null, options: presetOptions(res.value.presets) });
        });
      }

      ctx.effect(function () {
        return ctx.locale.register(NS, { zh: zh, en: en });
      }, "dsh-mode-seat: dictionaries");

      ctx.effect(function () {
        loadRoster();
        var disposers = [
          ctx.remote.$on("settings/document-updated", function (ns) {
            if (ns !== SETTINGS_NS) return;
            loadRoster();
          }),
          ctx.on("connection/reset", function () {
            loadRoster();
          })
        ];
        return function () {
          for (var i = 0; i < disposers.length; i++) disposers[i]();
        };
      }, "dsh-mode-seat: roster refresh");

      ctx.effect(function () {
        if (document.querySelector("style[data-plugin-css=\"" + CSS_TAG + "\"]") !== null) return;
        var tag = document.createElement("style");
        tag.setAttribute("data-plugin-css", CSS_TAG);
        tag.dataset.plugin = "dsh-mode-seat";
        tag.textContent = [
          ".ms-seat{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);background:transparent;color:inherit;font:inherit;font-size:13px;line-height:1;cursor:pointer;max-width:min(220px,32cqw)}",
          ".ms-seat:hover{background:color-mix(in srgb,currentColor 10%,transparent)}",
          ".ms-seat:disabled{opacity:.55;cursor:default}",
          ".ms-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
          ".ms-chevron{flex:none;opacity:.7}",
          ".ms-seatIcon{flex:none}",
          ".ms-item{display:flex;flex-direction:column;gap:3px;min-width:180px;max-width:280px}",
          ".ms-name{font-weight:600}",
          ".ms-desc{font-size:12px;opacity:.75;white-space:normal;line-height:1.45}",
          ".ms-set{font-weight:600}"
        ].join("");
        document.head.appendChild(tag);
      }, "dsh-mode-seat: styles");

      ctx.slots.inject("conversation.input.right", function () {
        return ctx.slots.register({
          name: "conversation.input.right",
          id: "mode-seat",
          order: 15,
          locale: NS,
          inject: function (sessionId) {
            return {
              hooks: {
                roster: roster,
                sessionSummary: ctx.sessions.list
              },
              sessionId: sessionId,
              select: function (id) { return applySelection(ctx, sessionId, id); },
              setDefault: function (id) { return writeDefaultPreset(ctx, id); }
            };
          }
        }, ModeSeatDockImpl);
      });
    }

    exports.name = "dsh-mode-seat";
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});