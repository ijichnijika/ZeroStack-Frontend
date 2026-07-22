import { ref, onUnmounted } from 'vue'

/**
 * 用户选中的 iframe 内元素信息
 */
export interface SelectedElementInfo {
  tagName: string
  id: string
  className: string
  textContent: string
  selector: string
}

const INJECTED_STYLE_ID = '__ve_style__'

/**
 * 构建全局唯一的 CSS 选择器路径（与浏览器 DevTools「复制 selector」效果一致）
 *
 * 策略：
 * 1. 遇到带有 id 的祖先元素时，直接使用 #id 短路，避免路径过长
 * 2. 否则一路追溯到 body，每层用 :nth-child() 精确定位
 */
function buildSelector(el: HTMLElement, body: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = el
  while (current && current !== body) {
    let selector = current.tagName.toLowerCase()
    if (current.id) {
      // 遇到有 id 的元素，直接短路，路径已足够唯一
      parts.unshift(`#${current.id}`)
      return parts.join(' > ')
    }
    const siblings = Array.from(current.parentElement?.children || [])
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1
      selector += `:nth-child(${index})`
    }
    parts.unshift(selector)
    current = current.parentElement
  }
  return parts.join(' > ')
}

/**
 * 可视化编辑器组合式函数
 *
 * 职责：
 * - 管理"编辑模式"开关状态
 * - 向 iframe 注入悬浮高亮 / 点击选中逻辑
 * - 通过 postMessage 接收 iframe 回传的选中元素信息
 * - 提供"将元素信息追加到提示词"的工具函数
 */
export function useVisualEditor() {
  const isEditMode = ref(false)
  const selectedElement = ref<SelectedElementInfo | null>(null)

  // 当前持有的 iframe 引用，用于注入/清理
  let currentIframe: HTMLIFrameElement | null = null

  // ------------------------------------------------------------------ //
  //  接收来自 iframe 的 postMessage
  // ------------------------------------------------------------------ //
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'VISUAL_EDITOR_SELECT') {
      selectedElement.value = event.data.payload as SelectedElementInfo
    }
  }
  window.addEventListener('message', handleMessage)

  // ------------------------------------------------------------------ //
  //  向 iframe 注入高亮交互逻辑
  // ------------------------------------------------------------------ //
  function injectIntoIframe(iframe: HTMLIFrameElement) {
    try {
      const doc = iframe.contentDocument
      if (!doc || !doc.body) return

      // 注入 CSS 样式（悬浮虚线框 + 选中实线框）
      if (!doc.getElementById(INJECTED_STYLE_ID)) {
        const style = doc.createElement('style')
        style.id = INJECTED_STYLE_ID
        style.textContent = `
          .__ve_hover {
            outline: 2px dashed #1890ff !important;
            outline-offset: 2px !important;
            cursor: crosshair !important;
          }
          .__ve_selected {
            outline: 3px solid #f5222d !important;
            outline-offset: 2px !important;
            background-color: rgba(245,34,45,0.04) !important;
          }
        `
        doc.head.appendChild(style)
      }

      const body = doc.body

      const onMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target === body || target === doc.documentElement) return
        doc.querySelectorAll('.__ve_hover').forEach(el => el.classList.remove('__ve_hover'))
        if (!target.classList.contains('__ve_selected')) {
          target.classList.add('__ve_hover')
        }
        e.stopPropagation()
      }

      const onMouseOut = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        target.classList.remove('__ve_hover')
      }

      const onClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target === body || target === doc.documentElement) return
        e.preventDefault()
        e.stopPropagation()

        // 清除旧选中，标记新选中
        doc.querySelectorAll('.__ve_selected').forEach(el => el.classList.remove('__ve_selected'))
        doc.querySelectorAll('.__ve_hover').forEach(el => el.classList.remove('__ve_hover'))
        target.classList.add('__ve_selected')

        // 过滤掉注入的内部类名
        const cleanClassName = Array.from(target.classList)
          .filter(c => !c.startsWith('__ve_'))
          .join(' ')

        const info: SelectedElementInfo = {
          tagName: target.tagName.toLowerCase(),
          id: target.id || '',
          className: cleanClassName,
          textContent: (target.textContent || '').trim().slice(0, 80),
          selector: buildSelector(target, body),
        }

        // 通过 postMessage 传递给主页面（同域名）
        window.parent.postMessage({ type: 'VISUAL_EDITOR_SELECT', payload: info }, '*')
      }

      body.addEventListener('mouseover', onMouseOver, true)
      body.addEventListener('mouseout', onMouseOut, true)
      body.addEventListener('click', onClick, true)

      // 将清理函数挂在 iframe 元素上，方便后续调用
      ;(iframe as any).__ve_cleanup = () => {
        body.removeEventListener('mouseover', onMouseOver, true)
        body.removeEventListener('mouseout', onMouseOut, true)
        body.removeEventListener('click', onClick, true)
        const styleEl = doc.getElementById(INJECTED_STYLE_ID)
        if (styleEl) styleEl.remove()
        doc.querySelectorAll('.__ve_hover, .__ve_selected').forEach(el => {
          el.classList.remove('__ve_hover', '__ve_selected')
        })
      }
    } catch (err) {
      console.error('[useVisualEditor] 注入失败:', err)
    }
  }

  function cleanupIframe(iframe: HTMLIFrameElement) {
    try {
      if (typeof (iframe as any).__ve_cleanup === 'function') {
        ;(iframe as any).__ve_cleanup()
        delete (iframe as any).__ve_cleanup
      }
    } catch (err) {
      console.error('[useVisualEditor] 清理失败:', err)
    }
  }

  // ------------------------------------------------------------------ //
  //  对外暴露的操作方法
  // ------------------------------------------------------------------ //

  /**
   * 进入编辑模式，并立即向 iframe 注入交互逻辑
   * @param iframe 预览 iframe 的 DOM 元素引用
   */
  function enterEditMode(iframe: HTMLIFrameElement) {
    if (currentIframe) cleanupIframe(currentIframe)
    currentIframe = iframe
    isEditMode.value = true
    injectIntoIframe(iframe)
  }

  /**
   * 退出编辑模式，清除选中状态并移除 iframe 注入逻辑
   */
  function exitEditMode() {
    isEditMode.value = false
    selectedElement.value = null
    if (currentIframe) {
      cleanupIframe(currentIframe)
      currentIframe = null
    }
  }

  /**
   * 切换编辑模式
   * @param iframe 预览 iframe 的 DOM 元素引用（退出时可不传）
   */
  function toggleEditMode(iframe: HTMLIFrameElement | null) {
    if (isEditMode.value) {
      exitEditMode()
    } else if (iframe) {
      enterEditMode(iframe)
    }
  }

  /**
   * 仅清除已选中的元素（保持编辑模式开启）
   */
  function clearSelectedElement() {
    selectedElement.value = null
    if (currentIframe) {
      try {
        const doc = currentIframe.contentDocument
        if (doc) {
          doc.querySelectorAll('.__ve_selected').forEach(el =>
            el.classList.remove('__ve_selected')
          )
        }
      } catch (_) {}
    }
  }

  /**
   * 当 iframe 内容刷新（src 变化后重新 load）时调用，重新注入交互逻辑
   * 仅在编辑模式开启时有效
   */
  function onIframeLoad(iframe: HTMLIFrameElement) {
    if (isEditMode.value) {
      currentIframe = iframe
      injectIntoIframe(iframe)
    }
  }

  /**
   * 构建"元素信息"的提示词追加文本
   * 在用户发送消息前调用，将选中元素上下文注入提示词
   */
  function buildElementPromptSuffix(): string {
    if (!selectedElement.value) return ''
    const el = selectedElement.value
    const lines: string[] = [
      '\n\n---',
      '【用户在页面中选中了以下元素，请针对该元素进行修改】',
      `- 标签类型: <${el.tagName}>`,
    ]
    if (el.id) lines.push(`- 元素 ID: #${el.id}`)
    if (el.className) lines.push(`- 元素类名: .${el.className.split(' ').join('.')}`)
    if (el.textContent) lines.push(`- 元素文本内容: "${el.textContent}"`)
    lines.push(`- CSS 选择器路径: ${el.selector}`)
    return lines.join('\n')
  }

  // 组件卸载时统一清理
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
    if (currentIframe) cleanupIframe(currentIframe)
  })

  return {
    isEditMode,
    selectedElement,
    toggleEditMode,
    exitEditMode,
    clearSelectedElement,
    buildElementPromptSuffix,
    onIframeLoad,
  }
}
