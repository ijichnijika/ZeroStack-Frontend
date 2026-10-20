import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { createSSRApp, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

const modules = new Map([
  ['@/config/env', "export const API_BASE_URL = '/api'"],
  ['@/api/appController', 'export const stopAppGenCode = async () => ({ data: { code: 0 } })'],
  ['ant-design-vue', 'export const message = { error() {}, success() {} }'],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (modules.has(specifier)) {
      return {
        url: `data:text/javascript,${encodeURIComponent(modules.get(specifier))}`,
        shortCircuit: true,
      }
    }
    if (specifier === '@/utils/postEventStream') {
      return {
        url: new URL('../src/utils/postEventStream.ts', import.meta.url).href,
        shortCircuit: true,
      }
    }
    return nextResolve(specifier, context)
  },
})
const { useCodeGeneration } = await import('../src/composables/useCodeGeneration.ts')
hooks.deregister()

async function setup(onFinish) {
  const messages = ref([])
  let generation
  await renderToString(
    createSSRApp({
      setup() {
        generation = useCodeGeneration({ appId: '123', messages, useAgent: ref(false), onFinish })
        return () => null
      },
    }),
  )
  return { ...generation, messages }
}

function response(text) {
  return new Response(text, { headers: { 'Content-Type': 'text/event-stream' } })
}

function chunk(data) {
  return `data: ${JSON.stringify({ d: typeof data === 'string' ? data : JSON.stringify(data) })}\n\n`
}

test('业务拒绝不会触发构建回调，并释放生成状态', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    response('event: business-error\ndata: {"message":"请求过于频繁"}\n\nevent: done\ndata:\n\n'),
  )
  const onFinish = t.mock.fn()
  const generation = await setup(onFinish)
  await generation.generate('创建工作台')
  assert.equal(onFinish.mock.callCount(), 0)
  assert.equal(generation.generating.value, false)
  assert.match(generation.messages.value.at(-1).content, /请求过于频繁/)
})

test('HTTP 错误和断流不会触发构建回调', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch')
  for (const result of [new Response('', { status: 503 }), response(chunk('残缺代码'))]) {
    fetchMock.mock.mockImplementation(async () => result)
    const onFinish = t.mock.fn()
    const generation = await setup(onFinish)
    await generation.generate('创建工作台')
    assert.equal(onFinish.mock.callCount(), 0)
    assert.equal(generation.generating.value, false)
  }
})

test('重试重置残缺内容，正常完成后只回调一次', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    response(
      chunk('残缺代码') +
        chunk({ type: 'code_reset' }) +
        chunk('完整代码') +
        'event: done\ndata:\n\n',
    ),
  )
  const onFinish = t.mock.fn()
  const generation = await setup(onFinish)
  generation.codeFiles.value.set('old.html', '旧代码')
  generation.activeCodeFile.value = 'old.html'
  await generation.generate('创建工作台')
  assert.equal(onFinish.mock.callCount(), 1)
  assert.equal(generation.generating.value, false)
  assert.equal(generation.messages.value.at(-1).content, '完整代码')
  assert.equal(generation.codeFiles.value.size, 0)
  assert.equal(generation.activeCodeFile.value, '')
})
