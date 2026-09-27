<script setup lang="ts">
import { computed, ref } from 'vue'
import { CopyOutlined, CheckOutlined, ExportOutlined } from '@ant-design/icons-vue'
import { getDeployUrl } from '@/config/env'

const props = defineProps<{
  open: boolean
  deployKey: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'copyLink'): void
  (e: 'visitWebsite'): void
}>()

const copied = ref(false)
const url = computed(() => (props.deployKey ? getDeployUrl(props.deployKey) : ''))

const handleCopy = () => {
  emit('copyLink')
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <a-modal
    :open="open"
    :footer="null"
    :width="520"
    centered
    :closable="false"
    wrap-class-name="deploy-modal"
    @update:open="emit('update:open', $event)"
  >
    <div class="deploy">
      <div class="deploy-banner" aria-hidden="true">
        <span class="ban-pink"></span>
        <span class="ban-blue halftone"></span>
        <span class="ban-word">上线了</span>
      </div>

      <div class="deploy-body">
        <h2 class="deploy-title">网站已部署，任何人都可以打开</h2>
        <p class="deploy-desc">把下面的地址发给别人即可访问。之后修改了内容，重新部署就会更新到同一个地址。</p>

        <div class="url-row">
          <code class="url-text">{{ url }}</code>
          <button type="button" class="btn btn--line btn--sm" @click="handleCopy">
            <CheckOutlined v-if="copied" />
            <CopyOutlined v-else />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>

        <div class="deploy-actions">
          <button type="button" class="btn btn--quiet" @click="emit('update:open', false)">关闭</button>
          <button type="button" class="btn btn--pink" @click="emit('visitWebsite')">
            打开网站
            <ExportOutlined />
          </button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.deploy {
  margin: -20px -24px;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.deploy-banner {
  position: relative;
  isolation: isolate;
  height: 168px;
  overflow: hidden;
  background: var(--yellow);
}

.ban-pink {
  position: absolute;
  right: -40px;
  top: -70px;
  width: 240px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--pink);
  mix-blend-mode: multiply;
  animation: ban-in 800ms var(--ease-out) both;
}

.ban-blue {
  position: absolute;
  left: 38%;
  bottom: -30px;
  width: 190px;
  height: 120px;
  color: var(--blue);
  mix-blend-mode: multiply;
  animation: ban-in 800ms var(--ease-out) 90ms both;
}

.ban-word {
  position: absolute;
  left: 28px;
  bottom: 18px;
  font-family: var(--font-display);
  font-size: 64px;
  line-height: 1;
  color: var(--ink);
}

@keyframes ban-in {
  from {
    transform: translate(14px, -10px);
    opacity: 0;
  }
}

.deploy-body {
  padding: 24px 28px 26px;
}

.deploy-title {
  font-family: var(--font-body);
  font-size: 19px;
  font-weight: 700;
}

.deploy-desc {
  margin-top: 6px;
  font-size: 14px;
  color: var(--ink-2);
}

.url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 8px 8px 8px 14px;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-lg);
}

.url-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 13px;
}

.deploy-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
