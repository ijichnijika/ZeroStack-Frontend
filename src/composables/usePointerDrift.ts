import { onMounted, onUnmounted, type Ref } from 'vue'

export interface PointerDrift {
  /** 指针相对元素左上角的坐标（px，已缓动） */
  x: number
  y: number
  /** 指针相对视口中心的归一化位置（-1 ~ 1，已缓动） */
  vx: number
  vy: number
  /** 指针是否在元素范围内 */
  inside: boolean
}

/**
 * 光标移动阻尼缓动 Hook
 * 对光标坐标及视口归一化位置进行平滑阻尼采样；仅在移动期间运行 rAF 循环，收敛后自动停机。
 * 在触控设备及减弱动态效果模式下自动停用以保障性能。
 */
export function usePointerDrift(
  el: Ref<HTMLElement | null>,
  apply: (state: PointerDrift) => void,
  ease = 0.16,
) {
  const target = { x: 0, y: 0, vx: 0, vy: 0 }
  const state: PointerDrift = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    inside: false,
  }
  let rafId = 0
  let primed = false

  const tick = () => {
    state.x += (target.x - state.x) * ease
    state.y += (target.y - state.y) * ease
    state.vx += (target.vx - state.vx) * ease
    state.vy += (target.vy - state.vy) * ease
    apply(state)

    const settled =
      Math.abs(target.x - state.x) < 0.2 &&
      Math.abs(target.y - state.y) < 0.2 &&
      Math.abs(target.vx - state.vx) < 0.002 &&
      Math.abs(target.vy - state.vy) < 0.002
    rafId = settled ? 0 : requestAnimationFrame(tick)
  }

  const handleMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !el.value) return
    const rect = el.value.getBoundingClientRect()
    target.x = e.clientX - rect.left
    target.y = e.clientY - rect.top
    target.vx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
    target.vy = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1))
    state.inside =
      target.x >= 0 && target.y >= 0 && target.x <= rect.width && target.y <= rect.height

    if (!primed) {
      primed = true
      state.x = target.x
      state.y = target.y
    }
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  const handleLeave = () => {
    state.inside = false
    target.vx = 0
    target.vy = 0
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  let enabled = false

  onMounted(() => {
    enabled =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!enabled) return
    window.addEventListener('pointermove', handleMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', handleLeave)
  })

  onUnmounted(() => {
    if (!enabled) return
    window.removeEventListener('pointermove', handleMove)
    document.documentElement.removeEventListener('pointerleave', handleLeave)
    if (rafId) cancelAnimationFrame(rafId)
  })
}
