<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getCodeGenTypeConfig } from '@/enums/codeGenType'

dayjs.extend(relativeTime)

const props = withDefaults(
  defineProps<{
    app: API.AppVO
    /** 封面单色印刷使用的专色 */
    ink?: 'pink' | 'blue'
    showAuthor?: boolean
  }>(),
  { ink: 'blue', showAuthor: false },
)

const typeConfig = computed(() => getCodeGenTypeConfig(props.app.codeGenType))
const initial = computed(() => (props.app.appName || '未').trim().charAt(0))
const timeText = computed(() => (props.app.createTime ? dayjs(props.app.createTime).fromNow() : ''))
const author = computed(() => props.app.user?.userName || props.app.user?.userAccount || '匿名')
</script>

<template>
  <router-link :to="`/app/chat/${app.id}?view=1`" class="app-card" :class="`ink-${ink}`">
    <div class="cover">
      <img v-if="app.cover" :src="app.cover" :alt="`${app.appName || '应用'}的页面截图`" loading="lazy" />
      <div v-else class="cover-empty halftone" aria-hidden="true">
        <span class="cover-initial">{{ initial }}</span>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ app.appName || '未命名应用' }}</h3>
      <p class="card-meta">
        <span v-if="typeConfig" class="tag" :class="`tag--${typeConfig.ink}`">{{ typeConfig.label }}</span>
        <span v-if="showAuthor" class="meta-text">{{ author }}</span>
        <span v-if="timeText" class="meta-text">{{ timeText }}</span>
      </p>
    </div>
  </router-link>
</template>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--ink);
  text-decoration: none;
  border-radius: var(--radius);
}

.app-card:hover {
  text-decoration: none;
}

.app-card:focus-visible {
  outline-offset: 6px;
}

/* 封面：有封面展示原图，无封面时展示 Riso 专色首字母底板 */
.cover {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--paper-2);
  border: 1px solid var(--rule);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: transform 720ms var(--ease-out);
}

.app-card:hover .cover img,
.app-card:focus-visible .cover img {
  transform: scale(1.03);
}

.cover-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--blue);
  color: rgba(255, 255, 255, 0.35);
}

.ink-pink .cover-empty {
  background: var(--pink);
  color: rgba(23, 23, 26, 0.18);
}

.cover-initial {
  font-family: var(--font-display);
  font-size: 88px;
  line-height: 1;
  color: #fff;
  transition: transform var(--t-register) var(--ease-out);
}

.ink-pink .cover-initial {
  color: var(--ink);
}

.app-card:hover .cover-initial {
  transform: scale(1.08) rotate(-4deg);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.card-title {
  position: relative;
  isolation: isolate;
  align-self: flex-start;
  max-width: 100%;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-title::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  height: 8px;
  z-index: -1;
  background: var(--yellow);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 380ms var(--ease-out);
}

.app-card:hover .card-title::after {
  transform: scaleX(1);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-size: 13px;
  color: var(--ink-3);
}

.meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
