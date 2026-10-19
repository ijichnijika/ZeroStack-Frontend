import test from 'node:test'
import assert from 'node:assert/strict'
import { postEventStream } from '../src/utils/postEventStream.ts'

function responseFrom(text, size = 1) {
  const bytes = new TextEncoder().encode(text)
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream;charset=UTF-8' } },
  )
}

test('长中文使用 POST 请求体，保留 Cookie，并正确解析分片中文和 CRLF', async (t) => {
  const prompt = '博客'.repeat(10000)
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/app/chat/gen/code')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(JSON.parse(options.body).message, prompt)
    assert.equal(options.headers.Accept, 'text/event-stream')
    return responseFrom(
      ':heartbeat\r\ndata: 中文\r\ndata: 第二行\r\n\r\nevent: done\r\ndata:\r\n\r\n',
    )
  })
  const events = []
  await postEventStream(
    '/api/app/chat/gen/code',
    { message: prompt },
    new AbortController().signal,
    (event) => {
      events.push(event)
      if (event.event === 'done') return false
    },
  )
  assert.deepEqual(events, [
    { event: 'message', data: '中文\n第二行' },
    { event: 'done', data: '' },
  ])
})

test('业务错误可以结束读取，不再触发后续事件', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    responseFrom(
      'event: business-error\ndata: {"message":"未登录"}\n\nevent: done\ndata: {}\n\n',
      4096,
    ),
  )
  const events = []
  await postEventStream('/stream', {}, new AbortController().signal, (event) => {
    events.push(event)
    return false
  })
  assert.deepEqual(
    events.map((event) => event.event),
    ['business-error'],
  )
})

test('没有结束事件的断流报错，未完成的事件不发送', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => responseFrom('data: 未完成'))
  await assert.rejects(
    postEventStream('/stream', {}, new AbortController().signal, () => assert.fail()),
    /连接已断开/,
  )
})

test('HTTP 错误和非 SSE 响应不会被当作正常生成', async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('', { status: 400 }),
  )
  await assert.rejects(
    postEventStream('/stream', {}, new AbortController().signal, () => {}),
    /HTTP 400/,
  )
  fetchMock.mock.mockImplementation(
    async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
  )
  await assert.rejects(
    postEventStream('/stream', {}, new AbortController().signal, () => {}),
    /未返回生成数据流/,
  )
})

test('取消信号传递给请求且不会自动重试生成', async (t) => {
  const controller = new AbortController()
  controller.abort()
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_, options) => {
    assert.equal(options.signal, controller.signal)
    options.signal.throwIfAborted()
  })
  await assert.rejects(
    postEventStream('/stream', {}, controller.signal, () => {}),
    { name: 'AbortError' },
  )
  assert.equal(fetchMock.mock.callCount(), 1)
})
