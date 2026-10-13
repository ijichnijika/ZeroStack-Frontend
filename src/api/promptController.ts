import request from '@/request'

export interface PromptOptimizeRequest {
  prompt: string
  mode?: 'create' | 'modify'
  context?: string
}

export interface PromptOptimizationVO {
  optimizedPrompt: string
  assumptions: string[]
  questions: string[]
  requiredDependencies: string[]
}

/** 独立优化提示词，由用户决定是否用于生成网页。 */
export async function optimizePrompt(body: PromptOptimizeRequest, signal?: AbortSignal) {
  return request<{ code: number; message?: string; data?: PromptOptimizationVO }>(
    '/prompt/optimize',
    {
      method: 'POST',
      data: body,
      signal,
    },
  )
}
