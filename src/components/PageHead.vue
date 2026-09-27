<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="page-head">
    <div class="head-text">
      <h1 class="head-title">{{ title }}</h1>
      <p v-if="subtitle" class="head-sub">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="head-actions">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(36px, 5vw, 56px) 0 20px;
  margin-bottom: 28px;
  border-bottom: 2px solid var(--ink);
}

.head-title {
  font-size: clamp(36px, 4.4vw, 56px);
}

.head-sub {
  margin-top: 10px;
  color: var(--ink-2);
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
