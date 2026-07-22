<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// Create a local instance to avoid HMR global pollution
const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

const parsedHtml = ref('')

const processContent = (text: string) => {
  return text.replace(/\[工具调用\]\s*(.*?)(?=\n|$)/g, (match, action) => {
    const parts = action.trim().split(/\s+/)
    const actionName = parts[0]
    const filepath = parts.slice(1).join(' ') || ''
    
    let iconSvg = ''
    switch (actionName) {
      case '写入文件':
      case '文件写入':
      case '创建文件':
      case '修改文件':
      case '文件修改':
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>'
        break
      case '删除文件':
      case '文件删除':
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'
        break
      case '读取文件':
      case '文件读取':
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
        break
      case '读取目录':
      case '目录读取':
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
        break
    }
    
    if (iconSvg) {
      return `\n<div class="tool-call-row">
        <span class="tool-icon">${iconSvg}</span>
        <span class="tool-maintext">${actionName}</span>
        <span class="tool-subtext">${filepath}</span>
      </div>\n`
    }
    
    // 默认备用显示
    return `\n<div class="tool-call-row">
      <span class="tool-icon">🛠</span>
      <span class="tool-maintext">${action}</span>
    </div>\n`
  })
}

// Simple throttle to avoid lagging during fast streaming
let throttleTimer: any = null
const updateHtml = () => {
  if (throttleTimer) return
  throttleTimer = setTimeout(() => {
    parsedHtml.value = markedInstance.parse(processContent(props.content || ' ')) as string
    throttleTimer = null
  }, 100) // 100ms throttle
}

watch(() => props.content, () => {
  updateHtml()
})

onMounted(() => {
  parsedHtml.value = markedInstance.parse(processContent(props.content || ' ')) as string
})
</script>

<template>
  <div class="markdown-body" v-html="parsedHtml"></div>
</template>

<style scoped>
.markdown-body :deep(.tool-call-row) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin: 12px 0 8px 0;
  border-radius: 10px;
  background-color: #f4f5f5;
  width: fit-content;
}
.markdown-body :deep(.tool-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}
.markdown-body :deep(.tool-maintext) {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.markdown-body :deep(.tool-subtext) {
  font-size: 14px;
  color: #999;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  margin-left: 2px;
}
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}
.markdown-body :deep(p) {
  margin-bottom: 0.8em;
}
.markdown-body :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 13px;
  margin-bottom: 1em;
}
.markdown-body :deep(code) {
  background: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 13px;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 1em;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25em;
}
</style>
