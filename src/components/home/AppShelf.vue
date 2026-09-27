<script setup lang="ts">
import AppCard from '@/components/AppCard.vue'

withDefaults(
  defineProps<{
    title: string
    apps: API.AppVO[]
    total: number
    page: number
    pageSize: number
    loading: boolean
    error: boolean
    showAuthor?: boolean
  }>(),
  { showAuthor: false },
)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'retry'): void
}>()
</script>

<template>
  <section class="shelf" :aria-labelledby="`shelf-${title}`">
    <header class="shelf-head">
      <h2 :id="`shelf-${title}`" class="shelf-title">{{ title }}</h2>
      <span v-if="total > 0" class="shelf-count tabular">{{ total }}</span>
    </header>

    <div v-if="loading && apps.length === 0" class="shelf-grid" aria-busy="true">
      <div v-for="i in 4" :key="i" class="skeleton">
        <span class="sk-cover"></span>
        <span class="sk-line"></span>
        <span class="sk-line short"></span>
      </div>
    </div>

    <div v-else-if="error" class="shelf-note">
      <p>没能加载{{ title }}，可能是网络或服务暂时不可用。</p>
      <button type="button" class="btn btn--line btn--sm" @click="emit('retry')">重新加载</button>
    </div>

    <div v-else-if="apps.length === 0" class="shelf-empty">
      <slot name="empty" />
    </div>

    <template v-else>
      <div class="shelf-grid" :class="{ 'is-loading': loading }">
        <AppCard
          v-for="(app, i) in apps"
          :key="app.id"
          :app="app"
          :ink="i % 2 === 0 ? 'blue' : 'pink'"
          :show-author="showAuthor"
        />
      </div>
      <div v-if="total > pageSize" class="shelf-pager">
        <a-pagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          :show-size-changer="false"
          @change="(p: number) => emit('page-change', p)"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.shelf-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 28px;
  border-bottom: 2px solid var(--ink);
}

.shelf-title {
  font-size: clamp(32px, 3.4vw, 46px);
}

.shelf-count {
  display: grid;
  place-items: center;
  min-width: 38px;
  height: 38px;
  padding: 0 8px;
  border-radius: var(--pill);
  background: var(--pink);
  font-family: var(--font-wide);
  font-stretch: 112%;
  font-weight: 800;
  font-size: 15px;
}

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 40px 28px;
  transition: opacity var(--t-fast) var(--ease-out);
}

.shelf-grid.is-loading {
  opacity: 0.5;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton span {
  display: block;
  background: var(--paper-2);
  border-radius: var(--radius);
  animation: sk-pulse 1.4s var(--ease-in-out) infinite;
}

.sk-cover {
  aspect-ratio: 16 / 10;
}

.sk-line {
  height: 14px;
  width: 70%;
}

.sk-line.short {
  width: 40%;
}

@keyframes sk-pulse {
  50% {
    opacity: 0.5;
  }
}

.shelf-note {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 22px 24px;
  border-radius: var(--radius);
  background: var(--pink-tint);
  color: var(--ink-2);
}

.shelf-pager {
  display: flex;
  justify-content: center;
  margin-top: 44px;
}

.shelf-pager :deep(.ant-pagination-item) {
  border-radius: var(--pill);
  border: 0;
  background: transparent;
  font-weight: 600;
}

.shelf-pager :deep(.ant-pagination-item-active) {
  background: var(--ink);
}

.shelf-pager :deep(.ant-pagination-item-active a) {
  color: #fff !important;
}
</style>
