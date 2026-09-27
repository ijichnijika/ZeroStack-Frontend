<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  ReloadOutlined,
  ExportOutlined,
  AimOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import CodeViewer from '@/components/chat/CodeViewer.vue'

type Viewport = 'desktop' | 'tablet' | 'mobile'
type Tab = 'preview' | 'code'

const props = defineProps<{
  iframeUrl: string
  generating: boolean
  buildStatusText: string
  buildFailed: boolean
  isVueProject: boolean
  codeFiles: Map<string, string>
  activeCodeFile: string
  activeTab: Tab
  viewportMode: Viewport
  isEditMode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', val: Tab): void
  (e: 'update:viewportMode', val: Viewport): void
  (e: 'update:activeCodeFile', val: string): void
  (e: 'iframeLoad', iframe: HTMLIFrameElement): void
  (e: 'refresh'): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

const showTabs = computed(() => props.isVueProject && (!!props.iframeUrl || props.codeFiles.size > 0))
const onPreviewTab = computed(() => !props.isVueProject || props.activeTab === 'preview')
const stage = computed(() => {
  if (props.isVueProject && props.activeTab === 'code') return 'code'
  if (props.generating) return 'generating'
  if (props.buildStatusText) return props.buildFailed ? 'failed' : 'building'
  if (props.iframeUrl) return 'frame'
  return 'empty'
})

const viewports: { key: Viewport; label: string; icon: typeof DesktopOutlined }[] = [
  { key: 'desktop', label: '桌面', icon: DesktopOutlined },
  { key: 'tablet', label: '平板 768', icon: TabletOutlined },
  { key: 'mobile', label: '手机 390', icon: MobileOutlined },
]

defineExpose({
  getIframe: () => iframeRef.value,
})
</script>

<template>
  <section class="preview" aria-label="预览与源码">
    <div class="preview-toolbar">
      <div v-if="showTabs" class="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-on': activeTab === 'preview' }"
          :aria-selected="activeTab === 'preview'"
          @click="emit('update:activeTab', 'preview')"
        >
          预览
        </button>
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-on': activeTab === 'code' }"
          :aria-selected="activeTab === 'code'"
          @click="emit('update:activeTab', 'code')"
        >
          源码
          <span v-if="codeFiles.size" class="tab-count tabular">{{ codeFiles.size }}</span>
        </button>
      </div>
      <span v-else class="toolbar-label">预览</span>

      <template v-if="stage === 'frame' && onPreviewTab">
        <div class="viewports" role="radiogroup" aria-label="预览尺寸">
          <a-tooltip v-for="v in viewports" :key="v.key" :title="v.label">
            <button
              type="button"
              role="radio"
              class="vp-btn"
              :class="{ 'is-on': viewportMode === v.key }"
              :aria-checked="viewportMode === v.key"
              :aria-label="v.label"
              @click="emit('update:viewportMode', v.key)"
            >
              <component :is="v.icon" />
            </button>
          </a-tooltip>
        </div>

        <div class="toolbar-right">
          <a-tooltip title="刷新预览">
            <button type="button" class="vp-btn" aria-label="刷新预览" @click="emit('refresh')">
              <ReloadOutlined />
            </button>
          </a-tooltip>
          <a-tooltip title="在新标签页打开">
            <a class="vp-btn" :href="iframeUrl" target="_blank" rel="noopener" aria-label="在新标签页打开">
              <ExportOutlined />
            </a>
          </a-tooltip>
        </div>
      </template>
    </div>

    <div class="preview-stage" :class="[`stage-${stage}`, `vp-${viewportMode}`]">
      <CodeViewer
        v-if="stage === 'code'"
        :files="codeFiles"
        :active-file="activeCodeFile"
        :streaming="generating"
        @update:active-file="emit('update:activeCodeFile', $event)"
      />

      <div v-else-if="stage === 'generating' || stage === 'building'" class="state" role="status">
        <div class="press" aria-hidden="true">
          <span class="press-plate pp-yellow"></span>
          <span class="press-plate pp-pink"></span>
          <span class="press-plate pp-blue"></span>
        </div>
        <h3 class="state-title">{{ stage === 'generating' ? '正在生成代码' : '正在构建 Vue 工程' }}</h3>
        <p class="state-desc">
          <template v-if="stage === 'generating'">通常需要几十秒到几分钟。左侧可以看到 AI 的思考和每一次文件改动。</template>
          <template v-else>{{ buildStatusText }}。后台正在安装依赖并打包，完成后预览会自动出现。</template>
        </p>
      </div>

      <div v-else-if="stage === 'failed'" class="state state-failed" role="alert">
        <span class="failed-mark" aria-hidden="true"><CloseOutlined /></span>
        <h3 class="state-title">构建没有完成</h3>
        <p class="state-desc">{{ buildStatusText }}。可以在左侧让 AI 检查并修复问题，修复后会重新构建。</p>
      </div>

      <div v-else-if="stage === 'frame'" class="frame-wrap">
        <div v-if="isEditMode" class="pick-banner">
          <AimOutlined />
          点选模式：点击预览里的任意元素，然后在左侧说明要怎么改
        </div>
        <div class="device" :class="`device-${viewportMode}`">
          <iframe
            ref="iframeRef"
            :src="iframeUrl"
            class="preview-iframe"
            title="应用预览"
            @load="iframeRef && emit('iframeLoad', iframeRef)"
          ></iframe>
        </div>
      </div>

      <div v-else class="state state-empty">
        <div class="empty-art" aria-hidden="true">
          <span class="ea-circle"></span>
          <span class="ea-rect halftone"></span>
        </div>
        <h3 class="state-title">预览会出现在这里</h3>
        <p class="state-desc">在左侧描述你想要的网站，生成完成后这里会显示可以直接操作的页面。</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  background: var(--paper-2);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 14px;
  flex-shrink: 0;
}

.toolbar-label {
  padding-left: 6px;
  font-size: 13px;
  font-weight: 700;
}

.tabs {
  display: flex;
  padding: 3px;
  border-radius: var(--pill);
  background: var(--paper-3);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--pill);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
}

.tab.is-on {
  background: var(--sheet);
  color: var(--ink);
}

.tab-count {
  padding: 0 6px;
  border-radius: var(--pill);
  background: var(--pink);
  font-size: 11px;
  line-height: 17px;
}

.viewports {
  display: flex;
  gap: 2px;
  margin-inline: auto;
}

.toolbar-right {
  display: flex;
  gap: 2px;
}

.vp-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-2);
  font-size: 15px;
  cursor: pointer;
  text-decoration: none;
}

.vp-btn:hover {
  background: var(--paper-3);
  color: var(--ink);
  text-decoration: none;
}

.vp-btn.is-on {
  background: var(--ink);
  color: #fff;
}

.preview-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0 14px 14px;
}

.frame-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.pick-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  border-radius: var(--radius) var(--radius) 0 0;
  background: var(--pink);
  font-size: 13px;
  font-weight: 600;
}

.device {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--sheet);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
}

.pick-banner + .device {
  border-top: 0;
  border-radius: 0 0 var(--radius) var(--radius);
  border-color: var(--pink);
  border-width: 3px;
}

.device-tablet {
  width: min(768px, 100%);
  max-height: 1024px;
}

.device-mobile {
  width: min(390px, 100%);
  max-height: 844px;
  border-radius: 18px;
}

.pick-banner:has(+ .device-tablet),
.pick-banner:has(+ .device-mobile) {
  width: min(768px, 100%);
}

.pick-banner:has(+ .device-mobile) {
  width: min(390px, 100%);
}

.preview-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

/* ---------- states ---------- */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  padding: 24px;
  border-radius: var(--radius);
  background: var(--paper);
  text-align: center;
}

.state-title {
  font-size: 30px;
}

.state-desc {
  max-width: 30em;
  font-size: 14px;
  color: var(--ink-2);
}

.press {
  position: relative;
  width: 112px;
  height: 112px;
  margin-bottom: 18px;
}

.press-plate {
  position: absolute;
  inset: 16px;
  mix-blend-mode: multiply;
}

.pp-yellow {
  background: var(--yellow);
  border-radius: 50%;
  animation: press-y 1.8s var(--ease-in-out) infinite;
}

.pp-pink {
  background: var(--pink);
  inset: 30px 16px 30px 16px;
  animation: press-p 1.8s var(--ease-in-out) infinite;
}

.pp-blue {
  inset: 16px 38px;
  background: var(--blue);
  animation: press-b 1.8s var(--ease-in-out) infinite;
}

@keyframes press-y {
  0%,
  100% {
    transform: translate(-14px, 10px);
  }
  45%,
  60% {
    transform: translate(0, 0);
  }
}

@keyframes press-p {
  0%,
  100% {
    transform: translate(16px, -6px);
  }
  45%,
  60% {
    transform: translate(0, 0);
  }
}

@keyframes press-b {
  0%,
  100% {
    transform: translate(4px, 14px);
  }
  45%,
  60% {
    transform: translate(0, 0);
  }
}

.state-failed {
  background: var(--pink-tint);
}

.failed-mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: var(--op-pink-yellow);
  font-size: 22px;
  color: var(--ink);
}

.empty-art {
  position: relative;
  width: 180px;
  height: 130px;
  margin-bottom: 18px;
}

.ea-circle {
  position: absolute;
  left: 20px;
  top: 0;
  width: 110px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--yellow);
  mix-blend-mode: multiply;
}

.ea-rect {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 120px;
  height: 80px;
  color: var(--blue);
  mix-blend-mode: multiply;
}
</style>
