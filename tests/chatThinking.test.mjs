import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

const stubs = new Map([
  ['@/config/env', "export const API_BASE_URL = '/api'"],
  ['@/api/appController', 'export const stopAppGenCode = async () => ({ data: { code: 0 } })'],
  ['ant-design-vue', 'export const message = { error() {}, success() {} }'],
  ['@ant-design/icons-vue', 'export const DownOutlined = { render() { return null } }'],
  ['@/components/BrandMark.vue', 'export default { render() { return null } }'],
  [
    '@/components/MarkdownViewer.vue',
    "import { h } from 'vue'; export default { props: ['content'], render() { return h('pre', this.content) } }",
  ],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (stubs.has(specifier)) {
      return { url: `stub:${specifier}`, shortCircuit: true }
    }
    if (specifier.startsWith('@/')) {
      const path = specifier.slice(2)
      return {
        url: new URL(`../src/${path}${path.endsWith('.vue') ? '' : '.ts'}`, import.meta.url).href,
        shortCircuit: true,
      }
    }
    return nextResolve(specifier, {
      ...context,
      parentURL: context.parentURL?.startsWith('stub:') ? import.meta.url : context.parentURL,
    })
  },
  load(url, context, nextLoad) {
    if (url.startsWith('stub:')) {
      return { format: 'module', source: stubs.get(url.slice(5)), shortCircuit: true }
    }
    if (url.endsWith('.vue')) {
      const { descriptor } = parse(readFileSync(new URL(url), 'utf8'))
      const script = compileScript(descriptor, { id: url, inlineTemplate: true })
      return {
        format: 'module',
        source: ts.transpileModule(script.content, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
        }).outputText,
        shortCircuit: true,
      }
    }
    return nextLoad(url, context)
  },
})
const { default: ChatMessageList } = await import('../src/components/chat/ChatMessageList.vue')
const { useCodeGeneration } = await import('../src/composables/useCodeGeneration.ts')
hooks.deregister()

function render(messages, generating = true) {
  return renderToString(
    createSSRApp({
      render: () =>
        h(ChatMessageList, {
          messages,
          generating,
          historyLoading: false,
          hasMoreHistory: false,
        }),
    }),
  )
}

test('流未结束时，收到的每段思考立即可见', async (t) => {
  let stream
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            stream = controller
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      ),
  )
  const messages = ref([])
  let generation
  let received
  await renderToString(
    createSSRApp({
      setup() {
        generation = useCodeGeneration({
          appId: '123',
          messages,
          useAgent: ref(false),
          onChunk: () => received?.(),
        })
        return () => null
      },
    }),
  )
  const running = generation.generate('创建工作台')
  const send = async (data) => {
    const arrived = new Promise((resolve) => {
      received = resolve
    })
    stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ d: data })}\n\n`))
    await arrived
  }
  try {
    await send('<think>\n先分析需求')
    assert.equal(generation.generating.value, true)
    let html = await render(messages.value)
    assert.match(html, /先分析需求/)
    assert.doesNotMatch(html, /class="thinking-body" style="display:none/)
    await send('，再安排布局')
    html = await render(messages.value)
    assert.match(html, /先分析需求，再安排布局/)
    assert.doesNotMatch(html, /class="thinking-body" style="display:none/)
  } finally {
    stream.enqueue(new TextEncoder().encode('event: done\ndata:\n\n'))
    await running
  }
})

test('收到思考开始标记就展示正在思考的块', async () => {
  const html = await render([{ role: 'ai', content: '<think>\n' }])
  assert.match(html, /正在思考/)
})

test('思考标签闭合后立即结束思考状态，不等待整个回复完成', async () => {
  const html = await render([{ role: 'ai', content: '<think>完成分析</think>\n\n' }])
  assert.match(html, /思考过程/)
  assert.doesNotMatch(html, /is-streaming|正在思考/)
})

test('历史思考默认折叠', async () => {
  const html = await render([{ role: 'ai', content: '<think>历史分析</think>正文' }], false)
  assert.match(html, /class="thinking-body" style="display:none/)
  assert.match(html, /正文/)
})
