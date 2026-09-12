<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick, onMounted } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/tokyo-night-dark.css'
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
  FileTextOutlined,
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
const lineHeight = computed(() => (fontSize.value <= 13 ? 22 : 24))

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
  // 弹性自适应步长：约 200 个 tick（20ms/tick，约 4 秒），保障平稳可读
  const step = Math.max(2, Math.ceil(total / 200))

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
  }, 20)
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
</script>

<template>
  <div class="code-ide-container" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Empty state -->
    <div v-if="files.size === 0" class="empty-state">
      <div class="empty-icon-card">
        <CodeOutlined class="empty-icon" />
      </div>
      <div class="empty-title">暂无项目代码</div>
      <p class="empty-desc">AI 生成的源码文件将在此以 IDE 视图实时同步与展示</p>
    </div>

    <template v-else>
      <!-- Left: File Explorer Sidebar -->
      <aside class="ide-sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <div class="sidebar-header">
          <div class="header-title">
            <span class="explorer-label">EXPLORER</span>
            <span class="file-count-badge">{{ files.size }}</span>
          </div>
          <div class="sidebar-actions">
            <button
              class="icon-btn"
              :title="expandedDirs.size > 0 ? '全部折叠' : '全部展开'"
              @click="toggleAllDirs"
            >
              <FolderOpenOutlined v-if="expandedDirs.size > 0" />
              <FolderOutlined v-else />
            </button>
            <button
              class="icon-btn"
              title="收起侧边栏"
              @click="isSidebarCollapsed = true"
            >
              <MenuFoldOutlined />
            </button>
          </div>
        </div>

        <!-- File search filter -->
        <div class="sidebar-search">
          <div class="search-input-wrapper">
            <SearchOutlined class="search-icon" />
            <input
              v-model="fileSearchQuery"
              type="text"
              placeholder="搜索文件..."
              class="search-input"
            />
            <button
              v-if="fileSearchQuery"
              class="search-clear-btn"
              @click="fileSearchQuery = ''"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        <!-- File tree list -->
        <div class="sidebar-tree">
          <div v-if="fileTree.length === 0" class="no-match-tip">
            未匹配到相关文件
          </div>

          <template v-else>
            <!-- Pre-order DFS Tree Rendering (supports arbitrary directory depth) -->
            <div
              v-for="node in visibleTreeNodes"
              :key="node.key"
              class="tree-node-wrapper"
            >
              <!-- Folder item -->
              <div
                v-if="!node.isLeaf"
                class="tree-item folder-item"
                :style="{ paddingLeft: `${node.depth * 14 + 10}px` }"
                @click="toggleDir(node.key)"
              >
                <span class="chevron-icon" :class="{ open: expandedDirs.has(node.key) }">
                  <RightOutlined />
                </span>
                <FolderOpenOutlined v-if="expandedDirs.has(node.key)" class="folder-icon open" />
                <FolderOutlined v-else class="folder-icon" />
                <span class="node-name folder-name">{{ node.name }}</span>
              </div>

              <!-- File item -->
              <div
                v-else
                class="tree-item file-item"
                :class="{ active: node.path === currentFile }"
                :style="{ paddingLeft: `${node.depth * 14 + 20}px` }"
                @click="selectFile(node.path!)"
              >
                <span class="file-icon-badge" :class="`icon-${getFileIconType(node.name)}`">
                  <span v-if="getFileIconType(node.name) === 'vue'" class="icon-text">V</span>
                  <span v-else-if="getFileIconType(node.name) === 'ts'" class="icon-text">TS</span>
                  <span v-else-if="getFileIconType(node.name) === 'js'" class="icon-text">JS</span>
                  <span v-else-if="getFileIconType(node.name) === 'json'" class="icon-text">{}</span>
                  <span v-else-if="getFileIconType(node.name) === 'css'" class="icon-text">#</span>
                  <span v-else-if="getFileIconType(node.name) === 'html'" class="icon-text">&lt;&gt;</span>
                  <FileTextOutlined v-else />
                </span>
                <span class="node-name file-name">{{ node.name }}</span>
                <span
                  v-if="streaming && node.path === currentFile"
                  class="streaming-pulse-dot"
                  title="正在接收流式代码"
                ></span>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Main Editor Workspace -->
      <main class="ide-workspace">
        <!-- Top Tab Bar & Actions -->
        <header class="workspace-header">
          <div ref="tabsScrollContainer" class="tabs-scroll-area">
            <button
              v-if="isSidebarCollapsed"
              class="unfold-sidebar-btn"
              title="展开侧边栏"
              @click="isSidebarCollapsed = false"
            >
              <MenuUnfoldOutlined />
            </button>

            <!-- File Tabs -->
            <div
              v-for="tabPath in openTabs"
              :key="tabPath"
              class="editor-tab"
              :class="{ active: tabPath === currentFile }"
              @click="selectFile(tabPath)"
            >
              <span class="tab-icon" :class="`icon-${getFileIconType(tabPath.split('/').pop() || '')}`">
                <span v-if="getFileIconType(tabPath.split('/').pop() || '') === 'vue'" class="icon-text">V</span>
                <span v-else-if="getFileIconType(tabPath.split('/').pop() || '') === 'ts'" class="icon-text">TS</span>
                <span v-else-if="getFileIconType(tabPath.split('/').pop() || '') === 'js'" class="icon-text">JS</span>
                <span v-else-if="getFileIconType(tabPath.split('/').pop() || '') === 'json'" class="icon-text">{}</span>
                <span v-else-if="getFileIconType(tabPath.split('/').pop() || '') === 'css'" class="icon-text">#</span>
                <span v-else-if="getFileIconType(tabPath.split('/').pop() || '') === 'html'" class="icon-text">&lt;&gt;</span>
                <FileTextOutlined v-else />
              </span>
              <span class="tab-title">{{ tabPath.split('/').pop() }}</span>
              <span
                v-if="streaming && tabPath === currentFile"
                class="tab-streaming-dot"
              ></span>
              <button
                class="tab-close-btn"
                title="关闭标签"
                @click="closeTab(tabPath, $event)"
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          <!-- Actions Toolbar -->
          <div class="toolbar-actions">
            <!-- Fast Forward Button during typing -->
            <button
              v-if="isTyping"
              class="action-btn action-fast-forward"
              title="跳过打字动画直接展示全量源码"
              @click="fastForward"
            >
              <FastForwardOutlined />
              <span class="btn-text">跳过动画</span>
            </button>

            <!-- Font zoom -->
            <button
              class="action-btn"
              :disabled="fontSize <= 12"
              title="缩小字体"
              @click="decreaseFontSize"
            >
              <ZoomOutOutlined />
            </button>
            <span class="font-size-indicator" title="当前字号">{{ fontSize }}px</span>
            <button
              class="action-btn"
              :disabled="fontSize >= 16"
              title="放大字体"
              @click="increaseFontSize"
            >
              <ZoomInOutlined />
            </button>

            <!-- Word wrap toggle -->
            <button
              class="action-btn"
              :class="{ active: isWordWrap }"
              :title="isWordWrap ? '取消自动换行 (显示行号)' : '开启自动换行 (不显示行号)'"
              @click="isWordWrap = !isWordWrap"
            >
              <AlignLeftOutlined />
            </button>

            <!-- Copy button -->
            <button
              class="action-btn"
              :class="{ success: copied }"
              :title="copied ? '已复制' : '复制代码'"
              @click="copyCode"
            >
              <CheckOutlined v-if="copied" />
              <CopyOutlined v-else />
              <span v-if="copied" class="btn-text">已复制</span>
            </button>

            <!-- Download button -->
            <button
              class="action-btn"
              title="下载此文件"
              @click="downloadFile"
            >
              <DownloadOutlined />
            </button>

            <!-- Fullscreen toggle -->
            <button
              class="action-btn"
              :title="isFullscreen ? '退出全屏 (Esc)' : '全屏查看'"
              @click="toggleFullscreen"
            >
              <FullscreenExitOutlined v-if="isFullscreen" />
              <FullscreenOutlined v-else />
            </button>
          </div>
        </header>

        <!-- Breadcrumb Bar -->
        <nav class="breadcrumb-bar" aria-label="文件路径">
          <div class="breadcrumb-path">
            <span class="crumb-root">ZeroStack</span>
            <template v-for="(seg, idx) in breadcrumbSegments" :key="idx">
              <span class="crumb-separator">/</span>
              <span class="crumb-item" :class="{ 'crumb-active': idx === breadcrumbSegments.length - 1 }">
                {{ seg }}
              </span>
            </template>
          </div>

          <!-- Streaming status pill -->
          <div v-if="streaming" class="streaming-status-pill">
            <span class="pill-dot"></span>
            <span class="pill-text">AI 正在流式生成中...</span>
          </div>
        </nav>

        <!-- Code Content Area -->
        <div
          ref="scrollContainer"
          class="code-viewport"
          :class="{ 'word-wrap': isWordWrap }"
        >
          <div class="code-flow-grid">
            <!-- Line numbers gutter (换行模式下隐藏，防止折行与固定高度行号错位) -->
            <div v-if="!isWordWrap" class="line-gutter" aria-hidden="true">
              <span
                v-for="(_, idx) in codeLines"
                :key="idx"
                class="gutter-number"
                :style="{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }"
              >
                {{ idx + 1 }}
              </span>
            </div>

            <!-- Code body -->
            <pre class="code-pre"><code class="hljs" :style="{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }" v-html="highlightedCode"></code><span v-if="isTyping" class="glow-cursor"></span></pre>
          </div>
        </div>

        <!-- IDE Status Bar -->
        <footer class="ide-status-bar">
          <div class="status-left">
            <span class="status-item file-path-item">{{ currentFile }}</span>
            <span class="status-divider">·</span>
            <span class="status-item">{{ fileStats.lines }} 行</span>
            <span class="status-divider">·</span>
            <span class="status-item">{{ fileStats.size }}</span>
            <span class="status-divider">·</span>
            <span class="status-item encoding-item">UTF-8</span>
          </div>
          <div class="status-right">
            <span class="status-item">Spaces: 2</span>
            <span class="status-divider">·</span>
            <span class="status-item lang-tag">{{ getDisplayLanguage(currentFile || '') }}</span>
            <span class="status-divider">·</span>
            <span class="status-item status-live" :class="{ active: streaming }">
              <span class="live-dot"></span>
              {{ streaming ? '正在编写' : '代码就绪' }}
            </span>
          </div>
        </footer>
      </main>
    </template>
  </div>
</template>

<style scoped>
.code-ide-container {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #16161e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #c0caf5;
}

.code-ide-container.is-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
  border: none !important;
}

/* Empty state */
.empty-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #16161e;
  color: #7aa2f7;
  gap: 14px;
}

.empty-icon-card {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(122, 162, 247, 0.08);
  border: 1px solid rgba(122, 162, 247, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 30px;
  color: #7aa2f7;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #c0caf5;
}

.empty-desc {
  font-size: 13px;
  color: #565f89;
  margin: 0;
}

/* Left Sidebar (Explorer) */
.ide-sidebar {
  width: 230px;
  min-width: 230px;
  background: #13141c;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
  user-select: none;
}

.ide-sidebar.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.sidebar-header {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: #13141c;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.explorer-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #787c99;
}

.file-count-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #9aa5ce;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #787c99;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #c0caf5;
}

/* Sidebar Search */
.sidebar-search {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: #565f89;
  font-size: 12px;
}

.search-input {
  width: 100%;
  height: 26px;
  padding: 0 24px 0 26px;
  background: #1a1b26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: #c0caf5;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: #7aa2f7;
}

.search-input::placeholder {
  color: #565f89;
}

.search-clear-btn {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  color: #565f89;
  font-size: 10px;
  cursor: pointer;
  padding: 2px;
}

.search-clear-btn:hover {
  color: #c0caf5;
}

/* Sidebar Tree */
.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.no-match-tip {
  padding: 16px 12px;
  font-size: 12px;
  color: #565f89;
  text-align: center;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 6px;
  padding-right: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
}

.tree-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tree-item.active {
  background: rgba(122, 162, 247, 0.15);
  color: #7dcfff;
}

.chevron-icon {
  font-size: 9px;
  color: #565f89;
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
}

.chevron-icon.open {
  transform: rotate(90deg);
}

.folder-icon {
  color: #e0af68;
  font-size: 13px;
}

.folder-icon.open {
  color: #ff9e64;
}

.node-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-name {
  color: #9aa5ce;
  font-weight: 500;
}

.file-name {
  color: #a9b1d6;
}

.tree-item.active .file-name {
  color: #7dcfff;
  font-weight: 500;
}

/* File Icon Badges */
.file-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  white-space: nowrap;
}

.icon-text {
  line-height: 1;
  font-family: Consolas, Monaco, monospace;
  white-space: nowrap;
  letter-spacing: -0.5px;
  user-select: none;
}

.icon-vue {
  color: #41b883;
}

.icon-ts {
  color: #3178c6;
}

.icon-js {
  color: #f7df1e;
}

.icon-json {
  color: #eab308;
}

.icon-css {
  color: #38bdf8;
}

.icon-html {
  color: #f97316;
}

.icon-md {
  color: #7aa2f7;
}

.icon-image {
  color: #bb9af7;
}

.icon-file {
  color: #9aa5ce;
}

.streaming-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  margin-left: auto;
  animation: pulse-stream 1.2s infinite ease-in-out;
}

@keyframes pulse-stream {
  0%, 100% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

/* Main Workspace */
.ide-workspace {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #1a1b26;
  overflow: hidden;
}

/* Workspace Header & Tabs */
.workspace-header {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #16161e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.tabs-scroll-area {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.tabs-scroll-area::-webkit-scrollbar {
  display: none;
}

.unfold-sidebar-btn {
  background: transparent;
  border: none;
  color: #787c99;
  padding: 0 12px;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: color 0.15s ease, background 0.15s ease;
}

.unfold-sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #c0caf5;
}

.editor-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 12px;
  background: #16161e;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-top: 2px solid transparent;
  color: #787c99;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.editor-tab:hover {
  background: #1a1b26;
  color: #a9b1d6;
}

.editor-tab.active {
  background: #1a1b26;
  color: #c0caf5;
  border-top-color: #7aa2f7;
  font-weight: 500;
}

.tab-icon {
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-title {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-streaming-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
  animation: pulse-stream 1.2s infinite ease-in-out;
}

.tab-close-btn {
  background: transparent;
  border: none;
  color: #565f89;
  padding: 2px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #c0caf5;
}

/* Toolbar Actions */
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  flex-shrink: 0;
  background: #16161e;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -6px 0 12px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #787c99;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #c0caf5;
}

.action-btn.active {
  background: rgba(122, 162, 247, 0.15);
  color: #7aa2f7;
}

.action-btn.success {
  background: rgba(65, 184, 131, 0.15);
  color: #41b883;
}

.action-fast-forward {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-weight: 500;
  animation: fastforward-pulse 2s infinite ease-in-out;
}

.action-fast-forward:hover {
  background: rgba(56, 189, 248, 0.25);
  color: #e0f2fe;
}

@keyframes fastforward-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(56, 189, 248, 0); }
  50% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.35); }
}

.btn-text {
  font-size: 11px;
}

/* Breadcrumb bar */
.breadcrumb-bar {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #181924;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 11px;
  color: #565f89;
  flex-shrink: 0;
}

.breadcrumb-path {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crumb-root {
  color: #7aa2f7;
  font-weight: 600;
}

.crumb-separator {
  color: #3b4261;
}

.crumb-item {
  color: #787c99;
}

.crumb-item.crumb-active {
  color: #c0caf5;
  font-weight: 500;
}

.streaming-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  font-size: 11px;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
  animation: pulse-stream 1s infinite;
}

/* Code Viewport */
.code-viewport {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #1a1b26;
}

.code-flow-grid {
  display: flex;
  min-height: 100%;
}

/* Line numbers */
.line-gutter {
  display: flex;
  flex-direction: column;
  padding: 14px 0;
  text-align: right;
  user-select: none;
  flex-shrink: 0;
  background: #181924;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  position: sticky;
  left: 0;
  z-index: 2;
  box-sizing: border-box;
}

.gutter-number {
  display: block;
  height: 22px;
  line-height: 22px;
  padding: 0 12px 0 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #414868;
  min-width: 3.2em;
  box-sizing: border-box;
}

/* Code pre & code */
.code-pre {
  margin: 0;
  padding: 14px 18px;
  background: transparent;
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.font-size-indicator {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #7aa2f7;
  padding: 0 2px;
  user-select: none;
}

.code-pre code.hljs,
.code-pre code {
  display: block;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 22px;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: pre;
  word-break: normal;
  word-wrap: normal;
  font-feature-settings: 'liga' 1, 'calt' 1;
  tab-size: 2;
}

.code-viewport.word-wrap .code-pre code.hljs,
.code-viewport.word-wrap .code-pre code {
  white-space: pre-wrap;
  word-break: break-all;
}

/* Typewriter glow cursor */
.glow-cursor {
  display: inline-block;
  width: 8px;
  height: 1.2em;
  background: #38bdf8;
  vertical-align: text-bottom;
  margin-left: 2px;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
  animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* IDE Bottom Status Bar */
.ide-status-bar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: #13141c;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  color: #565f89;
  flex-shrink: 0;
  user-select: none;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-item {
  color: #787c99;
}

.status-divider {
  color: #3b4261;
}

.file-path-item {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: Consolas, monospace;
  color: #9aa5ce;
}

.lang-tag {
  color: #7aa2f7;
  font-weight: 600;
}

.status-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #41b883;
}

.status-live.active {
  color: #38bdf8;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

/* Custom modern scrollbars */
.ide-sidebar::-webkit-scrollbar,
.code-viewport::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.ide-sidebar::-webkit-scrollbar-track,
.code-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.ide-sidebar::-webkit-scrollbar-thumb,
.code-viewport::-webkit-scrollbar-thumb {
  background: #292e42;
  border-radius: 4px;
}

.ide-sidebar::-webkit-scrollbar-thumb:hover,
.code-viewport::-webkit-scrollbar-thumb:hover {
  background: #3b4261;
}
</style>
