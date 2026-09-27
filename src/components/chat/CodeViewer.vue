<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick, onMounted } from 'vue'
import hljs from 'highlight.js'
import {
  FolderOutlined,
  FolderOpenOutlined,
  CopyOutlined,
  CheckOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FastForwardOutlined,
  DownloadOutlined,
  SearchOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  CodeOutlined,
  FileOutlined,
  AlignLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons-vue'

// 注册 Vue 单文件组件 (SFC) 的高亮解析，正确支持 <script setup lang="ts"> 与 <style scoped>
if (!hljs.getLanguage('vue')) {
  hljs.registerLanguage('vue', () => ({
    subLanguage: 'xml',
    contains: [
      {
        className: 'tag',
        begin: /<script(?=\s|>)/,
        end: />/,
        keywords: { name: 'script' },
        contains: [
          {
            className: 'attr',
            begin: /[\p{L}0-9._:-]+/u,
            relevance: 0,
          },
          {
            begin: /=\s*["'][^"']*["']/,
            relevance: 0,
          },
        ],
        starts: {
          end: /<\/script>/,
          returnEnd: true,
          subLanguage: ['typescript', 'javascript'],
        },
      },
      {
        className: 'tag',
        begin: /<style(?=\s|>)/,
        end: />/,
        keywords: { name: 'style' },
        contains: [
          {
            className: 'attr',
            begin: /[\p{L}0-9._:-]+/u,
            relevance: 0,
          },
          {
            begin: /=\s*["'][^"']*["']/,
            relevance: 0,
          },
        ],
        starts: {
          end: /<\/style>/,
          returnEnd: true,
          subLanguage: ['css', 'scss', 'less'],
        },
      },
    ],
  }))
}

const props = withDefaults(
  defineProps<{
    files: Map<string, string>
    activeFile: string
    streaming?: boolean
  }>(),
  {
    streaming: false,
  }
)

const emit = defineEmits<{
  'update:activeFile': [path: string]
}>()

interface FileTreeNode {
  key: string
  name: string
  path?: string
  isLeaf: boolean
  children?: FileTreeNode[]
  depth: number
}

const displayedCode = ref('')
const isTyping = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
let typewriterTimer: ReturnType<typeof setInterval> | null = null

const isSidebarCollapsed = ref(false)
const isFullscreen = ref(false)
const isWordWrap = ref(false)
const fontSize = ref(13)
const lineHeight = computed(() => {
  if (fontSize.value <= 12) return 20
  if (fontSize.value === 13) return 22
  if (fontSize.value === 14) return 24
  if (fontSize.value === 15) return 25
  return 26
})

const increaseFontSize = () => {
  if (fontSize.value < 16) fontSize.value += 1
}

const decreaseFontSize = () => {
  if (fontSize.value > 12) fontSize.value -= 1
}

const fileSearchQuery = ref('')
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const openTabs = ref<string[]>([])
const expandedDirs = ref<Set<string>>(new Set())
const tabsScrollContainer = ref<HTMLElement | null>(null)

const scrollToActiveTab = () => {
  nextTick(() => {
    if (!tabsScrollContainer.value) return
    const activeEl = tabsScrollContainer.value.querySelector('.editor-tab.active') as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' })
    }
  })
}

const stopTypewriter = () => {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
}

const currentFile = computed(() => {
  if (props.files.size === 0) return null
  if (props.files.has(props.activeFile)) return props.activeFile
  return props.files.keys().next().value ?? null
})

const fastForward = () => {
  stopTypewriter()
  if (currentFile.value) {
    displayedCode.value = props.files.get(currentFile.value) ?? ''
  }
  isTyping.value = false
}

watch(
  () => props.streaming,
  (isStreaming) => {
    if (!isStreaming && isTyping.value) {
      fastForward()
    }
  }
)

const startTypewriter = (targetText: string) => {
  stopTypewriter()
  if (!props.streaming || !targetText) {
    displayedCode.value = targetText
    isTyping.value = false
    return
  }

  isTyping.value = true
  let currentIndex = 0
  const total = targetText.length
  // 约 80 个 tick（50ms/tick，约 4 秒）：每个 tick 都要整段重新高亮，间隔过密会掉帧
  const step = Math.max(4, Math.ceil(total / 80))

  typewriterTimer = setInterval(() => {
    currentIndex = Math.min(total, currentIndex + step)
    displayedCode.value = targetText.slice(0, currentIndex)

    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
      }
    })

    if (currentIndex >= total) {
      stopTypewriter()
      isTyping.value = false
    }
  }, 50)
}

watch(
  [() => currentFile.value, () => (currentFile.value ? props.files.get(currentFile.value) : null)],
  ([file, content], [prevFile]) => {
    if (file && !openTabs.value.includes(file)) {
      openTabs.value.push(file)
    }

    if (content !== undefined && content !== null) {
      // 仅当是流式推送且文件正在写入时播放打字动效，普通文件切换直接渲染
      if (props.streaming && file === prevFile) {
        startTypewriter(content)
      } else if (props.streaming && !prevFile) {
        startTypewriter(content)
      } else {
        stopTypewriter()
        displayedCode.value = content
        isTyping.value = false
      }
    } else {
      displayedCode.value = ''
      isTyping.value = false
    }
  },
  { immediate: true }
)

watch(currentFile, (val) => {
  if (val && val !== props.activeFile) {
    emit('update:activeFile', val)
  }
  scrollToActiveTab()
})

const fileTree = computed<FileTreeNode[]>(() => {
  const root: FileTreeNode = { key: '', name: '', isLeaf: false, children: [], depth: 0 }
  const query = fileSearchQuery.value.trim().toLowerCase()

  for (const [filePath] of props.files) {
    const normalized = filePath.replace(/\\/g, '/')
    if (query && !normalized.toLowerCase().includes(query)) {
      continue
    }

    const segments = normalized.split('/')
    let current = root

    segments.forEach((segment, idx) => {
      const isFile = idx === segments.length - 1
      const currentPath = segments.slice(0, idx + 1).join('/')

      if (!current.children) {
        current.children = []
      }

      let child = current.children.find((c) => c.name === segment)
      if (!child) {
        child = {
          key: currentPath,
          name: segment,
          isLeaf: isFile,
          path: isFile ? normalized : undefined,
          children: isFile ? undefined : [],
          depth: idx,
        }
        current.children.push(child)
      }
      current = child
    })
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isLeaf === b.isLeaf) {
        return a.name.localeCompare(b.name)
      }
      return a.isLeaf ? 1 : -1
    })
    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children)
      }
    })
  }

  if (root.children) {
    sortNodes(root.children)
  }

  return root.children || []
})

const visibleTreeNodes = computed<FileTreeNode[]>(() => {
  const result: FileTreeNode[] = []
  const traverse = (nodes: FileTreeNode[]) => {
    for (const node of nodes) {
      result.push(node)
      if (!node.isLeaf && expandedDirs.value.has(node.key) && node.children) {
        traverse(node.children)
      }
    }
  }
  traverse(fileTree.value)
  return result
})

// 默认展开全部文件夹
watch(
  () => props.files.size,
  () => {
    for (const [filePath] of props.files) {
      const segments = filePath.replace(/\\/g, '/').split('/')
      for (let i = 1; i < segments.length; i++) {
        expandedDirs.value.add(segments.slice(0, i).join('/'))
      }
    }
  },
  { immediate: true }
)

const toggleDir = (dirKey: string) => {
  if (expandedDirs.value.has(dirKey)) {
    expandedDirs.value.delete(dirKey)
  } else {
    expandedDirs.value.add(dirKey)
  }
}

const toggleAllDirs = () => {
  const allDirs: string[] = []
  const collect = (nodes: FileTreeNode[]) => {
    for (const node of nodes) {
      if (!node.isLeaf) {
        allDirs.push(node.key)
        if (node.children) collect(node.children)
      }
    }
  }
  collect(fileTree.value)

  if (expandedDirs.value.size >= allDirs.length && allDirs.length > 0) {
    expandedDirs.value.clear()
  } else {
    allDirs.forEach((d) => expandedDirs.value.add(d))
  }
}

const selectFile = (path: string) => {
  if (!openTabs.value.includes(path)) {
    openTabs.value.push(path)
  }
  emit('update:activeFile', path)
  scrollToActiveTab()
}

const closeTab = (path: string, event: MouseEvent) => {
  event.stopPropagation()
  const idx = openTabs.value.indexOf(path)
  if (idx >= 0) {
    openTabs.value.splice(idx, 1)
    if (currentFile.value === path) {
      const nextActive = openTabs.value[idx] || openTabs.value[idx - 1] || null
      if (nextActive) {
        emit('update:activeFile', nextActive)
      }
    }
  }
}

const EXT_LANG_MAP: Record<string, string> = {
  vue: 'vue',
  jsx: 'javascript',
  tsx: 'typescript',
  ts: 'typescript',
  js: 'javascript',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  svg: 'xml',
}

const EXT_DISPLAY_LANG: Record<string, string> = {
  vue: 'Vue',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  json: 'JSON',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  html: 'HTML',
  md: 'Markdown',
  svg: 'SVG',
  xml: 'XML',
  yml: 'YAML',
  yaml: 'YAML',
}

function getLanguage(filePath: string): string {
  const dotIdx = filePath.lastIndexOf('.')
  if (dotIdx < 0) return 'plaintext'
  const ext = filePath.slice(dotIdx + 1).toLowerCase()
  const mapped = EXT_LANG_MAP[ext] ?? ext
  return hljs.getLanguage(mapped) ? mapped : 'plaintext'
}

function getDisplayLanguage(filePath: string): string {
  const dotIdx = filePath.lastIndexOf('.')
  if (dotIdx < 0) return 'Plain Text'
  const ext = filePath.slice(dotIdx + 1).toLowerCase()
  return EXT_DISPLAY_LANG[ext] || ext.toUpperCase()
}

const highlightedCode = computed(() => {
  if (!currentFile.value) return ''
  const lang = getLanguage(currentFile.value)
  return hljs.highlight(displayedCode.value, { language: lang }).value
})

const codeLines = computed(() => {
  if (!currentFile.value || !displayedCode.value) return [1]
  return displayedCode.value.split('\n')
})

const fileStats = computed(() => {
  if (!currentFile.value) return { lines: 0, size: '', bytes: 0 }
  const content = displayedCode.value
  const lines = content.split('\n').length
  const bytes = new TextEncoder().encode(content).length
  let size: string
  if (bytes < 1024) size = `${bytes} B`
  else if (bytes < 1024 * 1024) size = `${(bytes / 1024).toFixed(1)} KB`
  else size = `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return { lines, size, bytes }
})

const breadcrumbSegments = computed(() => {
  if (!currentFile.value) return []
  return currentFile.value.split('/')
})

const copyCode = async () => {
  if (!displayedCode.value) return
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(displayedCode.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = displayedCode.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

const downloadFile = () => {
  if (!currentFile.value || !displayedCode.value) return
  const blob = new Blob([displayedCode.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const fileName = currentFile.value.split('/').pop() || 'code.txt'
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopTypewriter()
  if (copyTimer) clearTimeout(copyTimer)
  window.removeEventListener('keydown', handleKeydown)
})

function getFileIconType(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.')
  if (dotIdx < 0) return 'file'
  const ext = fileName.slice(dotIdx + 1).toLowerCase()
  if (['vue'].includes(ext)) return 'vue'
  if (['ts', 'tsx'].includes(ext)) return 'ts'
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'js'
  if (['json'].includes(ext)) return 'json'
  if (['html', 'htm'].includes(ext)) return 'html'
  if (['css', 'scss', 'less', 'sass'].includes(ext)) return 'css'
  if (['md'].includes(ext)) return 'md'
  if (['svg', 'png', 'jpg', 'ico'].includes(ext)) return 'image'
  return 'file'
}

const BADGE_TEXT: Record<string, string> = {
  vue: 'VUE',
  ts: 'TS',
  js: 'JS',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  md: 'MD',
}

const badgeText = (fileName: string) => BADGE_TEXT[getFileIconType(fileName)] ?? ''
</script>

<template>
  <div class="code-ide" :class="{ 'is-fullscreen': isFullscreen }">
    <div v-if="files.size === 0" class="code-empty">
      <CodeOutlined class="code-empty-icon" />
      <p class="code-empty-title">还没有源码</p>
      <p class="code-empty-desc">AI 写入的文件会实时出现在这里。</p>
    </div>

    <template v-else>
      <aside class="ide-sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <div class="sidebar-head">
          <span class="sidebar-title">文件 <span class="tabular">{{ files.size }}</span></span>
          <div class="sidebar-actions">
            <button
              type="button"
              class="icon-btn"
              :title="expandedDirs.size > 0 ? '全部折叠' : '全部展开'"
              @click="toggleAllDirs"
            >
              <FolderOpenOutlined v-if="expandedDirs.size > 0" />
              <FolderOutlined v-else />
            </button>
            <button type="button" class="icon-btn" title="收起文件栏" @click="isSidebarCollapsed = true">
              <MenuFoldOutlined />
            </button>
          </div>
        </div>

        <div class="sidebar-search">
          <SearchOutlined class="search-icon" />
          <input v-model="fileSearchQuery" type="text" placeholder="搜索文件" class="search-input" aria-label="搜索文件" />
          <button v-if="fileSearchQuery" type="button" class="icon-btn search-clear" title="清空" @click="fileSearchQuery = ''">
            <CloseOutlined />
          </button>
        </div>

        <div class="sidebar-tree">
          <p v-if="fileTree.length === 0" class="no-match">没有匹配的文件</p>
          <template v-else>
            <template v-for="node in visibleTreeNodes" :key="node.key">
              <button
                v-if="!node.isLeaf"
                type="button"
                class="tree-item is-folder"
                :style="{ paddingLeft: `${node.depth * 14 + 10}px` }"
                :aria-expanded="expandedDirs.has(node.key)"
                @click="toggleDir(node.key)"
              >
                <RightOutlined class="chevron" :class="{ open: expandedDirs.has(node.key) }" />
                <span class="node-name">{{ node.name }}</span>
              </button>
              <button
                v-else
                type="button"
                class="tree-item is-file"
                :class="{ active: node.path === currentFile }"
                :style="{ paddingLeft: `${node.depth * 14 + 24}px` }"
                @click="selectFile(node.path!)"
              >
                <span v-if="badgeText(node.name)" class="file-badge" :class="`badge-${getFileIconType(node.name)}`">{{ badgeText(node.name) }}</span>
                <FileOutlined v-else class="file-icon" />
                <span class="node-name">{{ node.name }}</span>
                <span v-if="streaming && node.path === currentFile" class="live-dot" title="正在写入"></span>
              </button>
            </template>
          </template>
        </div>
      </aside>

      <main class="ide-main">
        <header class="ide-head">
          <div ref="tabsScrollContainer" class="tabs">
            <button
              v-if="isSidebarCollapsed"
              type="button"
              class="icon-btn unfold-btn"
              title="展开文件栏"
              @click="isSidebarCollapsed = false"
            >
              <MenuUnfoldOutlined />
            </button>
            <div
              v-for="tabPath in openTabs"
              :key="tabPath"
              class="editor-tab"
              :class="{ active: tabPath === currentFile }"
              role="button"
              tabindex="0"
              @click="selectFile(tabPath)"
              @keydown.enter="selectFile(tabPath)"
            >
              <span class="tab-title">{{ tabPath.split('/').pop() }}</span>
              <span v-if="streaming && tabPath === currentFile" class="live-dot"></span>
              <button type="button" class="tab-close" title="关闭" @click="closeTab(tabPath, $event)">
                <CloseOutlined />
              </button>
            </div>
          </div>

          <div class="ide-tools">
            <button v-if="isTyping" type="button" class="tool-btn is-text" title="直接显示完整代码" @click="fastForward">
              <FastForwardOutlined />
              <span>跳过动画</span>
            </button>
            <button type="button" class="tool-btn" :disabled="fontSize <= 12" title="缩小字号" @click="decreaseFontSize">
              <ZoomOutOutlined />
            </button>
            <span class="font-size tabular">{{ fontSize }}</span>
            <button type="button" class="tool-btn" :disabled="fontSize >= 16" title="放大字号" @click="increaseFontSize">
              <ZoomInOutlined />
            </button>
            <button
              type="button"
              class="tool-btn"
              :class="{ active: isWordWrap }"
              :aria-pressed="isWordWrap"
              :title="isWordWrap ? '取消自动换行' : '自动换行'"
              @click="isWordWrap = !isWordWrap"
            >
              <AlignLeftOutlined />
            </button>
            <button type="button" class="tool-btn" :class="{ success: copied }" :title="copied ? '已复制' : '复制代码'" @click="copyCode">
              <CheckOutlined v-if="copied" />
              <CopyOutlined v-else />
            </button>
            <button type="button" class="tool-btn" title="下载此文件" @click="downloadFile">
              <DownloadOutlined />
            </button>
            <button type="button" class="tool-btn" :title="isFullscreen ? '退出全屏 (Esc)' : '全屏'" @click="toggleFullscreen">
              <FullscreenExitOutlined v-if="isFullscreen" />
              <FullscreenOutlined v-else />
            </button>
          </div>
        </header>

        <nav class="crumbs" aria-label="文件路径">
          <template v-for="(seg, idx) in breadcrumbSegments" :key="idx">
            <span v-if="idx > 0" class="crumb-sep">/</span>
            <span class="crumb" :class="{ 'is-last': idx === breadcrumbSegments.length - 1 }">{{ seg }}</span>
          </template>
          <span v-if="streaming" class="crumb-live">
            <span class="live-dot"></span>
            正在写入
          </span>
        </nav>

        <div ref="scrollContainer" class="code-scroll" :class="{ 'word-wrap': isWordWrap }">
          <div
            class="code-grid"
            :style="{
              '--code-font-size': `${fontSize}px`,
              '--code-line-height': `${lineHeight}px`,
            }"
          >
            <div v-if="!isWordWrap" class="gutter" aria-hidden="true">
              <span
                v-for="(_, idx) in codeLines"
                :key="idx"
                class="gutter-num"
              >{{ idx + 1 }}</span>
            </div>
            <pre class="code-pre"><code class="hljs" v-html="highlightedCode"></code><span v-if="isTyping" class="caret"></span></pre>
          </div>
        </div>

        <footer class="ide-status">
          <span class="tabular">{{ fileStats.lines }} 行 · {{ fileStats.size }}</span>
          <span>{{ getDisplayLanguage(currentFile || '') }} · UTF-8</span>
        </footer>
      </main>
    </template>
  </div>
</template>

<style scoped>
.code-ide {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--sheet);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
  color: var(--ink);
}

.code-ide.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  border: 0;
  border-radius: 0;
}

.code-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  color: var(--ink-3);
}

.code-empty-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.code-empty-title {
  font-weight: 700;
  color: var(--ink);
}

.code-empty-desc {
  font-size: 13px;
}

/* ---------- sidebar ---------- */
.ide-sidebar {
  display: flex;
  flex-direction: column;
  width: 236px;
  flex-shrink: 0;
  border-right: 1px solid var(--rule);
  background: var(--paper);
}

.ide-sidebar.collapsed {
  display: none;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--rule);
}

.sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-2);
}

.sidebar-title .tabular {
  margin-left: 4px;
  padding: 1px 7px;
  border-radius: var(--pill);
  background: var(--pink);
  color: var(--ink);
}

.sidebar-actions {
  display: flex;
}

.icon-btn,
.tool-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 13px;
  transition: background-color var(--t-fast) var(--ease-out);
}

.icon-btn:hover,
.tool-btn:hover:not(:disabled) {
  background: var(--paper-2);
  color: var(--ink);
}

.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.tool-btn.active {
  background: var(--ink);
  color: #fff;
}

.tool-btn.success {
  color: var(--success);
}

.tool-btn.is-text {
  display: inline-flex;
  gap: 6px;
  width: auto;
  padding: 0 10px;
  background: var(--yellow);
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
}

.sidebar-search {
  position: relative;
  display: flex;
  align-items: center;
  margin: 10px;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.search-input {
  width: 100%;
  height: 30px;
  padding: 0 28px 0 30px;
  border: 1px solid var(--rule);
  border-radius: var(--pill);
  outline: none;
  background: var(--sheet);
  font-size: 12px;
}

.search-input:focus {
  border-color: var(--ink);
}

.search-clear {
  position: absolute;
  right: 2px;
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 2px 6px 12px;
}

.no-match {
  padding: 16px 10px;
  font-size: 12px;
  color: var(--ink-3);
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 28px;
  padding-right: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  text-align: left;
  color: var(--ink-2);
  cursor: pointer;
}

.tree-item:hover {
  background: var(--paper-2);
  color: var(--ink);
}

.tree-item.active {
  background: var(--yellow);
  color: var(--ink);
  font-weight: 600;
}

.is-folder {
  font-weight: 600;
  color: var(--ink);
}

.chevron {
  font-size: 9px;
  transition: transform var(--t-fast) var(--ease-out);
}

.chevron.open {
  transform: rotate(90deg);
}

.node-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-badge {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 17px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--paper-3);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--ink);
  flex-shrink: 0;
}

.file-icon {
  width: 34px;
  font-size: 13px;
  color: var(--ink-3);
  flex-shrink: 0;
}

.badge-vue {
  background: var(--op-blue-yellow);
  color: #fff;
}

.badge-ts {
  background: var(--blue);
  color: #fff;
}

.badge-js,
.badge-json {
  background: var(--yellow);
}

.badge-html {
  background: var(--pink);
}

.badge-css {
  background: var(--op-pink-blue);
  color: #fff;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pink);
  flex-shrink: 0;
  animation: live-pulse 1.1s var(--ease-in-out) infinite;
}

@keyframes live-pulse {
  50% {
    opacity: 0.35;
  }
}

/* ---------- main ---------- */
.ide-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.ide-head {
  display: flex;
  align-items: stretch;
  height: 42px;
  border-bottom: 1px solid var(--rule);
}

.tabs {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.unfold-btn {
  align-self: center;
  margin: 0 4px 0 8px;
}

.editor-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 14px;
  border-right: 1px solid var(--rule);
  font-size: 13px;
  color: var(--ink-3);
  white-space: nowrap;
  cursor: pointer;
}

.editor-tab:hover {
  color: var(--ink);
}

.editor-tab.active {
  color: var(--ink);
  font-weight: 600;
  background: var(--sheet);
}

.editor-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 3px;
  background: var(--pink);
}

.tab-close {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  font-size: 9px;
  color: var(--ink-3);
  cursor: pointer;
  opacity: 0;
}

.editor-tab:hover .tab-close,
.editor-tab.active .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--paper-2);
  color: var(--ink);
}

.ide-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  flex-shrink: 0;
  border-left: 1px solid var(--rule);
}

.font-size {
  min-width: 20px;
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 16px;
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-3);
  overflow: hidden;
  white-space: nowrap;
}

.crumb.is-last {
  color: var(--ink);
  font-weight: 600;
}

.crumb-sep {
  color: var(--ink-4);
}

.crumb-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink);
}

.code-scroll {
  flex: 1;
  overflow: auto;
  background: var(--sheet);
}

.code-grid {
  display: flex;
  min-width: max-content;
  min-height: 100%;
}

.word-wrap .code-grid {
  min-width: 0;
}

.gutter {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 14px 12px 40px 14px;
  background: var(--paper);
  border-right: 1px solid var(--rule);
  text-align: right;
  user-select: none;
  font-family: var(--font-mono);
  font-size: calc(var(--code-font-size) - 1px);
  line-height: var(--code-line-height);
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
  box-sizing: border-box;
}

.gutter-num {
  display: block;
  height: var(--code-line-height);
  line-height: var(--code-line-height);
  box-sizing: border-box;
}

.code-pre {
  flex: 1;
  margin: 0;
  padding: 14px 20px 40px;
  font-family: var(--font-mono);
  font-size: var(--code-font-size);
  line-height: var(--code-line-height);
  tab-size: 2;
  box-sizing: border-box;
}

.code-pre code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  vertical-align: baseline;
}

.code-pre code.hljs {
  padding: 0;
  margin: 0;
  background: transparent;
}

.word-wrap .code-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.caret {
  display: inline-block;
  width: 8px;
  height: 1em;
  margin-left: 1px;
  vertical-align: -0.15em;
  background: var(--pink);
  animation: live-pulse 0.9s steps(2) infinite;
}

.ide-status {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  height: 28px;
  padding: 0 16px;
  align-items: center;
  border-top: 1px solid var(--rule);
  background: var(--paper);
  font-size: 11.5px;
  color: var(--ink-3);
}

@media (max-width: 760px) {
  .ide-sidebar {
    display: none;
  }
}
</style>
