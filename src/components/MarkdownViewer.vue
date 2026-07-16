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

// Simple throttle to avoid lagging during fast streaming
let throttleTimer: any = null
const updateHtml = () => {
  if (throttleTimer) return
  throttleTimer = setTimeout(() => {
    parsedHtml.value = markedInstance.parse(props.content || ' ') as string
    throttleTimer = null
  }, 100) // 100ms throttle
}

watch(() => props.content, () => {
  updateHtml()
})

onMounted(() => {
  parsedHtml.value = markedInstance.parse(props.content || ' ') as string
})
</script>

<template>
  <div class="markdown-body" v-html="parsedHtml"></div>
</template>

<style scoped>
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
