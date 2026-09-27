<script setup lang="ts">
const stations = [
  { word: '一句话', note: '用平常说话的方式描述需求' },
  { word: '自动选型', note: '按需求选 HTML 单页、多文件或 Vue 工程' },
  { word: '边写边看', note: '代码流式生成，思考与文件改动实时可见' },
  { word: '点哪改哪', note: '在预览里点选元素，只改这一处' },
  { word: '一键上线', note: '部署后得到可分享的访问地址' },
]
</script>

<template>
  <section class="run-strip" aria-label="ZeroStack 如何工作">
    <ol class="page stations">
      <li v-for="s in stations" :key="s.word" class="station">
        <span class="station-word">{{ s.word }}</span>
        <span class="station-note">{{ s.note }}</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.run-strip {
  position: relative;
  overflow: hidden;
  background: var(--blue);
  color: #fff;
}

.stations {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  list-style: none;
  padding-block: 44px 48px;
}

.station {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 28px;
}

.station + .station {
  padding-left: 28px;
  border-left: 1.5px solid rgba(255, 255, 255, 0.4);
}

.station-word {
  font-family: var(--font-display);
  font-size: clamp(26px, 2.6vw, 38px);
  line-height: 1.05;
}

.station:first-child .station-word {
  align-self: flex-start;
  padding: 2px 8px 4px;
  margin-left: -8px;
  background: var(--yellow);
  color: var(--ink);
}

.station-note {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 900px) {
  .stations {
    grid-template-columns: 1fr 1fr;
    gap: 28px 0;
  }

  .station + .station {
    padding-left: 0;
    border-left: 0;
  }

  .station:nth-child(even) {
    padding-left: 24px;
    border-left: 1.5px solid rgba(255, 255, 255, 0.4);
  }
}
</style>
