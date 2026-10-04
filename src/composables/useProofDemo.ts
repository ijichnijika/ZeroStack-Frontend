import { onUnmounted, ref } from 'vue'
import { PRESETS, type PresetKey } from '@/components/home/presets'

const START_DELAY = 1400
const CHAR_MS = 46
const PUNCT_MS = 240
const HOLD_MS = 2400
const PUNCT = /[，。：；、,.:;]/

/**
 * 首页示例需求自动键入演示 Hook
 * 在无用户输入时模拟逐字输入示例需求，联动触发样张版式与标题更新。
 * 仅执行单轮演示；遇用户主动交互、页面切后台或系统减弱动效配置时立即退出。
 */
export function useProofDemo() {
  const running = ref(false)
  const key = ref<PresetKey | null>(null)
  const text = ref('')

  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms)
    })

  const stop = () => {
    stopped = true
    if (timer) clearTimeout(timer)
    running.value = false
    key.value = null
    text.value = ''
  }

  const start = async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    await wait(START_DELAY)

    for (const preset of PRESETS) {
      if (stopped) return
      running.value = true
      key.value = preset.key
      text.value = ''

      for (const ch of Array.from(preset.prompt)) {
        await wait(PUNCT.test(text.value.slice(-1)) ? PUNCT_MS : CHAR_MS)
        while (document.hidden && !stopped) await wait(400)
        if (stopped) return
        text.value += ch
      }

      await wait(HOLD_MS)
    }

    if (!stopped) stop()
  }

  onUnmounted(stop)

  return { running, key, text, start, stop }
}
