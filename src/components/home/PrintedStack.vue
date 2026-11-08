<script setup lang="ts">
/**
 * 首页样张堆组件
 * 在示意样张下方错落叠放最近的精选作品截图，没有作品时不渲染。
 */
import { computed } from 'vue'

const props = defineProps<{
  apps: API.AppVO[]
}>()

const INKS = ['pink', 'blue', 'yellow'] as const
const STACK_SIZE = 3

// 有截图的作品优先上堆，不足时用无封面作品补齐
const sheets = computed(() => {
  const withCover = props.apps.filter((app) => app.cover)
  const withoutCover = props.apps.filter((app) => !app.cover)
  return [...withCover, ...withoutCover].slice(0, STACK_SIZE)
})

const initialOf = (app: API.AppVO) => (app.appName || '未').trim().charAt(0)
</script>

<template>
  <div v-if="sheets.length" class="stack">
    <ul class="sheets" aria-label="最近的精选作品">
      <li
        v-for="(app, i) in sheets"
        :key="app.id"
        class="sheet"
        :class="[`sheet--${i}`, `ink-${INKS[i]}`]"
      >
        <router-link :to="`/app/chat/${app.id}?view=1`" class="sheet-link">
          <img v-if="app.cover" :src="app.cover" :alt="`${app.appName || '应用'}的页面截图`" loading="lazy" />
          <span v-else class="sheet-blank halftone" aria-hidden="true">
            <span class="sheet-initial">{{ initialOf(app) }}</span>
          </span>
          <span class="sr-only">{{ app.appName || '未命名应用' }}</span>
        </router-link>
      </li>
    </ul>

    <p class="stack-caption">
      刚印好的：{{ sheets.map((app) => app.appName || '未命名应用').join('、') }}
    </p>
  </div>
</template>

<style scoped>
.stack {
  margin-top: 36px;
}

.sheets {
  position: relative;
  height: clamp(132px, 11vw, 160px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sheet {
  --ink-color: var(--pink);
  --tilt: 0deg;

  position: absolute;
  top: 0;
  width: 46%;
  aspect-ratio: 16 / 10;
  rotate: var(--tilt);
  transition:
    rotate var(--t-register) var(--ease-out),
    translate var(--t-register) var(--ease-out);
  animation: sheet-drop 760ms var(--ease-out) backwards;
}

.sheet--0 {
  --tilt: -4deg;

  left: 0;
  top: 10px;
  animation-delay: 220ms;
}

.sheet--1 {
  --tilt: 2.5deg;

  left: 27%;
  animation-delay: 300ms;
}

.sheet--2 {
  --tilt: -1.5deg;

  left: 54%;
  top: 14px;
  animation-delay: 380ms;
}

.ink-blue {
  --ink-color: var(--blue);
}

.ink-yellow {
  --ink-color: var(--yellow);
}

/* 每张样纸下垫一层专色版，错位露出，与主样张的黄色衬板同一套语言 */
.sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: var(--radius);
  background: var(--ink-color);
  mix-blend-mode: multiply;
  translate: 7px 7px;
  transition: translate var(--t-register) var(--ease-out);
}

.sheet:hover,
.sheet:focus-within {
  z-index: 2;
  rotate: 0deg;
  translate: 0 -10px;
}

.sheet:hover::before,
.sheet:focus-within::before {
  translate: 11px 11px;
}

.sheet-link {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
  background: var(--sheet);
}

.sheet-link:focus-visible {
  outline-offset: 4px;
}

.sheet-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.sheet-blank {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--ink-color);
  color: rgba(23, 23, 26, 0.16);
}

.sheet-initial {
  font-family: var(--font-display);
  font-size: 56px;
  line-height: 1;
  color: var(--ink);
}

.ink-blue .sheet-initial {
  color: #fff;
}

.stack-caption {
  margin-top: 18px;
  overflow: hidden;
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes sheet-drop {
  from {
    opacity: 0;
    translate: 0 -18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet:hover,
  .sheet:focus-within {
    translate: none;
  }
}
</style>
