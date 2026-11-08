<script setup lang="ts">
import { computed } from 'vue'
import { PRESETS, type PresetKey } from './presets'
import RisoScene from './RisoScene.vue'

const props = withDefaults(
  defineProps<{
    layout: PresetKey
    plate?: 'blue' | 'pink' | 'yellow'
  }>(),
  { plate: 'blue' },
)

const label = computed(() => PRESETS.find((p) => p.key === props.layout)?.label)
const bars = [42, 62, 36, 54, 46, 74, 68, 92]
const miniBars = [38, 62, 86, 52]
</script>

<template>
  <div class="thumb-wrap" :class="`plate-${plate}`" aria-hidden="true">
    <div class="thumb">
      <div class="thumb-bar">
        <span class="dot dot-pink"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-blue"></span>
        <span class="thumb-label">{{ label }}</span>
        <span class="thumb-nav"><i></i><i></i><i></i></span>
      </div>

      <div class="thumb-body">
        <template v-if="layout === 'blog'">
          <RisoScene class="scene" />
          <div class="post">
            <span class="post-sq ink ink-pink"></span>
            <span class="post-copy">
              <span class="ln ln-ink"></span>
              <span class="ln ln-wide"></span>
              <span class="ln"></span>
            </span>
          </div>
          <div class="post post-compact">
            <span class="post-copy">
              <span class="ln ln-ink ln-mid"></span>
              <span class="ln ln-wide"></span>
            </span>
          </div>
        </template>

        <template v-else-if="layout === 'dashboard'">
          <div class="tiles">
            <span class="tile ink ink-pink">
              <svg viewBox="0 0 64 28" fill="none">
                <path
                  d="M4 21 Q14 9 22 17 T40 13 T60 8"
                  stroke="#fff"
                  stroke-width="2.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="tile ink ink-yellow tile-bars">
              <i v-for="(h, idx) in miniBars" :key="idx" :style="{ height: `${h}%` }"></i>
            </span>
            <span class="tile ink ink-blue">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="11" fill="#fff" />
                <path d="M18 18 L18 7 A11 11 0 0 1 28.5 14.5 Z" fill="var(--pink)" />
              </svg>
            </span>
          </div>
          <div class="dash-lower">
            <div class="bars">
              <span
                v-for="(h, i) in bars"
                :key="i"
                class="ink ink-blue"
                :style="{ height: `${h}%` }"
              ></span>
            </div>
            <div class="feed">
              <span v-for="i in 3" :key="i" class="feed-row">
                <b :class="`dot-${['pink', 'pink', 'yellow'][i - 1]}`"></b>
                <span>
                  <i class="ln ln-ink"></i>
                  <i class="ln"></i>
                </span>
              </span>
            </div>
          </div>
        </template>

        <template v-else-if="layout === 'portfolio'">
          <svg class="pf-art" viewBox="0 0 260 96" preserveAspectRatio="xMidYMax slice">
            <rect width="260" height="96" fill="#faf6ee" />
            <circle cx="196" cy="64" r="46" fill="var(--yellow)" />
            <polygon points="24,96 24,42 78,16 78,96" fill="var(--pink)" />
            <polygon class="ink" points="78,16 146,56 146,96 78,96" fill="var(--pink)" />
            <polygon
              class="ink"
              points="78,16 146,56 146,96 78,96"
              fill="var(--blue)"
              opacity="0.72"
            />
            <polygon class="ink" points="146,48 232,96 146,96" fill="var(--blue)" />
          </svg>
          <div class="pf-mini">
            <span class="ink ink-blue"></span>
            <span class="ink ink-yellow"></span>
            <span class="ink ink-pink"></span>
          </div>
        </template>

        <div v-else-if="layout === 'product'" class="product">
          <span class="disc ink ink-blue"></span>
          <span class="disc disc-ring ink ink-pink"></span>
          <span class="product-lines">
            <span class="ln ln-ink"></span>
            <span class="ln"></span>
            <span class="pill"></span>
          </span>
        </div>

        <template v-else>
          <span v-for="i in 4" :key="i" class="todo">
            <span class="todo-box" :class="{ 'ink ink-blue': i < 3 }"></span>
            <span class="ln" :class="{ 'ln-ink': i >= 3 }"></span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumb-wrap {
  --plate-color: var(--blue);

  position: relative;
}

.thumb-wrap.plate-pink {
  --plate-color: var(--pink);
}

.thumb-wrap.plate-yellow {
  --plate-color: var(--yellow);
}

.thumb-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: var(--radius);
  background: var(--plate-color);
  mix-blend-mode: multiply;
  translate: 6px 6px;
}

.thumb {
  display: flex;
  flex-direction: column;
  background: var(--sheet);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius);
  overflow: hidden;
}

.thumb-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 11px;
  border-bottom: 1.5px solid var(--ink);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-pink {
  background: var(--pink);
}

.dot-yellow {
  background: var(--yellow);
}

.dot-blue {
  background: var(--blue);
}

.thumb-label {
  margin-left: 7px;
  font-family: var(--font-wide);
  font-size: 14px;
  font-weight: 900;
  font-stretch: 112%;
  color: var(--ink);
}

.thumb-nav {
  display: inline-flex;
  gap: 5px;
  margin-left: auto;
}

.thumb-nav i {
  width: 14px;
  height: 3.5px;
  border-radius: 1px;
  background: var(--ink-3);
}

.thumb-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 204px;
  padding: 12px 13px;
  overflow: hidden;
}

.ink {
  mix-blend-mode: multiply;
}

.ink-pink {
  background-color: var(--pink);
  color: var(--pink);
}

.ink-yellow {
  background-color: var(--yellow);
  color: var(--yellow);
}

.ink-blue {
  background-color: var(--blue);
  color: var(--blue);
}

.ln {
  display: block;
  width: 68%;
  height: 5.5px;
  border-radius: 1px;
  background: var(--paper-3);
}

.ln-wide {
  width: 92%;
}

.ln-mid {
  width: 58%;
}

.ln-ink {
  width: 78%;
  height: 6.5px;
  background: var(--ink);
}

.scene {
  height: 78px;
  flex-shrink: 0;
  border-radius: 2px;
  overflow: hidden;
}

.post {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-compact {
  padding-top: 6px;
  border-top: 1px solid var(--rule);
}

.post-sq {
  width: 42px;
  height: 42px;
  border-radius: 2px;
  flex-shrink: 0;
}

.post-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 8px;
  height: 58px;
  flex-shrink: 0;
}

.tile {
  display: grid;
  place-items: center;
  border-radius: 3px;
  padding: 6px;
}

.tile svg {
  width: 100%;
  height: 100%;
}

.tile-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 5px;
  padding: 10px 10px 8px;
}

.tile-bars i {
  width: 7px;
  border-radius: 1px;
  background: var(--op-pink-blue);
}

.dash-lower {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-top: 8px;
  border-bottom: 1.5px solid var(--ink);
}

.bars span {
  flex: 1;
  border-radius: 1px 1px 0 0;
}

.feed {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--rule);
}

.feed-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.feed-row b {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feed-row span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.pf-art {
  width: 100%;
  height: 94px;
  flex-shrink: 0;
  border-radius: 2px;
}

.pf-mini {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  flex: 1;
}

.pf-mini span {
  border-radius: 2px;
}

.product {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.disc {
  width: 96px;
  aspect-ratio: 1;
  border-radius: 50%;
  flex-shrink: 0;
}

.disc-ring {
  position: absolute;
  left: 34px;
  width: 64px;
}

.product-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  margin-left: 18px;
}

.pill {
  width: 52px;
  height: 18px;
  border-radius: var(--pill);
  background: var(--ink);
}

.todo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--rule);
}

.todo-box {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  flex-shrink: 0;
}

.todo-box.ink {
  border-color: transparent;
}
</style>
