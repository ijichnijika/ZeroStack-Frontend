<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang === 'vue' ? 'html' : lang
      return hljs.highlight(code, { language: hljs.getLanguage(language) ? language : 'plaintext' })
        .value
    },
  }),
)

const svg = (body: string, cls = '') =>
  `<svg class="${cls}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const ICONS = {
  write: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
  remove: svg(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  ),
  read: svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  folder: svg(
    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  ),
  ok: svg('<circle cx="12" cy="12" r="10"/><polyline points="8.5 12 11 14.5 15.5 9.5"/>', 'is-ok'),
  fail: svg(
    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    'is-fail',
  ),
  star: svg(
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'is-star',
  ),
  spin: svg(
    '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
    'spin-icon',
  ),
}

const TOOL_ICON: Record<string, string> = {
  写入文件: ICONS.write,
  文件写入: ICONS.write,
  创建文件: ICONS.write,
  修改文件: ICONS.write,
  文件修改: ICONS.write,
  删除文件: ICONS.remove,
  文件删除: ICONS.remove,
  读取文件: ICONS.read,
  文件读取: ICONS.read,
  读取目录: ICONS.folder,
  目录读取: ICONS.folder,
  退出工具调用: ICONS.ok,
  退出: ICONS.ok,
  exit: ICONS.ok,
  执行结束: ICONS.ok,
}

const STATUS_ICON: Record<string, string> = {
  '🚀': ICONS.spin,
  '✅': ICONS.ok,
  '❌': ICONS.fail,
  '🎉': ICONS.star,
}

const row = (icon: string, main: string, sub = '', cls = '') =>
  `\n<div class="tool-call-row ${cls}"><span class="tool-icon">${icon}</span><span class="tool-maintext">${main}</span>${
    sub ? `<span class="tool-subtext">${sub}</span>` : ''
  }</div>\n`

/**
 * 把后端流里的工具调用标记转换成状态行：
 * [选择工具] 与 [工具调用] 成对抵消，未匹配的视为仍在执行。
 */
const processContent = (text: string) => {
  const executedCounts: Record<string, number> = {}
  const executedRegex = /\[工具调用\]\s*([^\s]+)/g
  let match
  while ((match = executedRegex.exec(text)) !== null) {
    const action = match[1]
    if (action) executedCounts[action] = (executedCounts[action] || 0) + 1
  }

  if (/\[执行结束\]/.test(text)) {
    for (const key of ['exit', '退出工具调用', '退出', '执行结束']) {
      executedCounts[key] = (executedCounts[key] || 0) + 1
    }
  }

  let result = text.replace(/(?:\n\n)?\[选择工具\]\s*([^\s]+)[ \t]*(?:\n\n)?/g, (_m, action) => {
    if (action && (executedCounts[action] || 0) > 0) {
      executedCounts[action] = (executedCounts[action] || 0) - 1
      return '\n\n'
    }
    return `\n\n[未完成的工具] ${action}\n\n`
  })

  result = result.replace(/\[执行结束\]/g, () => row(ICONS.ok, '执行结束', '', 'is-finish'))

  result = result.replace(/\[(?:工具调用|未完成的工具)\]\s*(.*?)(?=\n|$)/g, (full, action) => {
    const parts = action.trim().split(/\s+/)
    const actionName = parts[0]
    const filepath = parts.slice(1).join(' ')
    const icon = TOOL_ICON[actionName]
    if (!icon) return row(ICONS.write, action)
    const pending = full.startsWith('[未完成的工具]')
    return row(pending ? ICONS.spin : icon, actionName, filepath, pending ? 'is-pending' : '')
  })

  // 工作流进度：`> 🚀 [初始化] 消息` 或 `> 🚀 **[初始化]** 消息`
  result = result.replace(
    /(?:>|&gt;)\s*(🚀|✅|❌|🎉)\s*(?:\*\*)?\[(.*?)\](?:\*\*)?\s*([^\n\r]*)/g,
    (_m, icon, stepName, msg) => row(STATUS_ICON[icon] ?? icon, stepName, msg, 'is-step'),
  )

  // 最终完成提示，例如 `✅ Agent 已完成代码生成...`
  result = result.replace(/(?:^|\n)(✅|❌|🎉)\s*(Agent[^\n\r]*)/g, (_m, icon, msg) =>
    row(STATUS_ICON[icon] ?? icon, msg, '', 'is-step'),
  )

  return result
}

const parsedHtml = ref('')
let throttleTimer: ReturnType<typeof setTimeout> | null = null

const render = () => {
  parsedHtml.value = markedInstance.parse(processContent(props.content || ' ')) as string
}

// 流式输出时节流，避免每个 token 都重新解析
watch(
  () => props.content,
  () => {
    if (throttleTimer) return
    throttleTimer = setTimeout(() => {
      render()
      throttleTimer = null
    }, 100)
  },
)

onMounted(render)
onUnmounted(() => {
  if (throttleTimer) clearTimeout(throttleTimer)
})
</script>

<template>
  <div class="markdown-body" v-html="parsedHtml"></div>
</template>

<style scoped>
.markdown-body {
  font-size: 15px;
  line-height: 1.75;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.markdown-body :deep(> *:first-child) {
  margin-top: 0;
}

.markdown-body :deep(p) {
  margin: 0 0 0.8em;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-family: var(--font-body);
  font-weight: 700;
  line-height: 1.35;
  margin: 1.3em 0 0.5em;
}

.markdown-body :deep(h1) {
  font-size: 21px;
}

.markdown-body :deep(h2) {
  font-size: 18px;
}

.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-size: 16px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.4em;
  margin: 0 0 0.9em;
}

.markdown-body :deep(li) {
  margin-bottom: 0.3em;
}

.markdown-body :deep(li::marker) {
  color: var(--blue);
}

.markdown-body :deep(blockquote) {
  margin: 0 0 0.9em;
  padding: 8px 14px;
  border-radius: var(--radius);
  background: var(--paper-2);
  color: var(--ink-2);
}

.markdown-body :deep(a) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--blue-tint);
  color: var(--op-pink-blue);
  font-family: var(--font-mono);
  font-size: 0.86em;
}

.markdown-body :deep(pre) {
  margin: 0 0 1em;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--sheet);
  border: 1px solid var(--rule);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.65;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
}

.markdown-body :deep(table) {
  width: 100%;
  margin-bottom: 1em;
  border-collapse: collapse;
  font-size: 14px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 6px 10px;
  border-bottom: 1px solid var(--rule);
  text-align: left;
}

/* ---------- tool & workflow rows ---------- */
.markdown-body :deep(.tool-call-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  margin: 6px 0;
  padding: 6px 14px 6px 10px;
  border-radius: var(--pill);
  background: var(--paper-2);
  font-size: 13px;
  line-height: 1.4;
}

.markdown-body :deep(.tool-icon) {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--ink-2);
}

.markdown-body :deep(.tool-maintext) {
  font-weight: 600;
  white-space: nowrap;
}

.markdown-body :deep(.tool-subtext) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-3);
}

.markdown-body :deep(.tool-call-row.is-step) {
  align-items: flex-start;
  background: transparent;
  padding-left: 2px;
  border-radius: 0;
}

.markdown-body :deep(.tool-call-row.is-step .tool-icon) {
  margin-top: 2px;
}

.markdown-body :deep(.tool-call-row.is-step .tool-maintext) {
  white-space: normal;
}

.markdown-body :deep(.tool-call-row.is-step .tool-subtext) {
  font-family: var(--font-body);
  font-size: 13px;
  white-space: normal;
}

.markdown-body :deep(.tool-call-row.is-pending) {
  background: var(--yellow-tint);
}

.markdown-body :deep(.tool-call-row.is-finish) {
  background: var(--blue-tint);
}

.markdown-body :deep(.is-ok) {
  color: var(--success);
}

.markdown-body :deep(.is-fail) {
  color: var(--danger);
}

.markdown-body :deep(.is-star) {
  color: var(--blue);
}

.markdown-body :deep(.spin-icon) {
  color: var(--blue);
  animation: md-spin 0.9s linear infinite;
}

@keyframes md-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
