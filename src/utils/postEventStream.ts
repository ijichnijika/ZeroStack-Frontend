interface StreamEvent {
  event: string
  data: string
}

export async function postEventStream(
  url: string,
  body: unknown,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => boolean | void,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw new Error(`请求失败（HTTP ${response.status}）`)
  if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body) {
    throw new Error('服务器未返回生成数据流')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = ''
  let data: string[] = []

  const readLines = (end: boolean): boolean => {
    while (true) {
      const index = buffer.search(/[\r\n]/)
      if (index < 0 || (!end && buffer[index] === '\r' && index === buffer.length - 1)) {
        return false
      }
      const line = buffer.slice(0, index)
      const delimiterLength = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1
      buffer = buffer.slice(index + delimiterLength)
      if (line === '') {
        const nextEvent = { event: event || 'message', data: data.join('\n') }
        const hasData = data.length > 0
        event = ''
        data = []
        if (hasData && onEvent(nextEvent) === false) return true
      } else if (!line.startsWith(':')) {
        const colon = line.indexOf(':')
        const field = colon < 0 ? line : line.slice(0, colon)
        let value = colon < 0 ? '' : line.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        if (field === 'event') event = value
        if (field === 'data') data.push(value)
      }
    }
  }

  try {
    while (true) {
      const chunk = await reader.read()
      buffer += decoder.decode(chunk.value, { stream: !chunk.done })
      if (readLines(chunk.done)) return
      if (chunk.done) throw new Error('生成中断，连接已断开')
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
