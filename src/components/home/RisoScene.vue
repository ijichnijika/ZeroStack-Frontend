<script setup lang="ts">
import { useId } from 'vue'

const skyId = `riso-sky-${useId()}`
const sunId = `riso-sun-${useId()}`
</script>

<template>
  <svg
    class="riso-scene"
    viewBox="0 0 360 112"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
  >
    <defs>
      <pattern :id="skyId" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.15" fill="var(--blue)" />
      </pattern>
      <pattern :id="sunId" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.45" fill="var(--pink)" />
      </pattern>
    </defs>
    <rect width="360" height="112" fill="#f3f8fc" />
    <rect width="360" height="112" :fill="`url(#${skyId})`" opacity="0.45" />
    <circle cx="268" cy="36" r="24" fill="var(--pink-tint)" />
    <circle class="ink" cx="268" cy="36" r="24" :fill="`url(#${sunId})`" />

    <path class="ink" d="M-8 112 L96 28 L184 112 Z" fill="var(--blue)" />
    <path d="M96 28 L72 52 L88 47 L98 58 L112 46 L122 51 Z" fill="var(--sheet)" />

    <path class="ink" d="M118 112 L206 38 L292 112 Z" fill="var(--blue)" opacity="0.92" />
    <path d="M206 38 L186 58 L199 54 L208 63 L222 55 Z" fill="var(--sheet)" />

    <path class="ink" d="M236 112 L308 58 L372 112 Z" fill="var(--blue)" opacity="0.85" />
    <path d="M308 58 L292 72 L303 69 L312 76 L322 70 Z" fill="var(--sheet)" />
  </svg>
</template>

<style scoped>
.riso-scene {
  display: block;
  width: 100%;
  height: 100%;
}

.ink {
  mix-blend-mode: multiply;
}
</style>
