/**
 * 环境变量配置
 */

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// 静态资源基础地址
export const STATIC_BASE_URL = import.meta.env.VITE_PREVIEW_BASE_URL || 'http://localhost:8080/api/static'

// 应用部署域名
export const DEPLOY_BASE_URL = import.meta.env.VITE_DEPLOY_BASE_URL || 'http://localhost'

// 获取部署应用的完整 URL
export const getDeployUrl = (deployKey: string) => {
  return `${DEPLOY_BASE_URL}/${deployKey}/`
}

// 获取静态资源预览 URL
// Vue 项目构建产物在 dist/ 子目录下，需要特殊处理
export const getStaticPreviewUrl = (codeGenType: string, appId: string | number) => {
  const baseUrl = `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
  if (codeGenType === 'vue_project') {
    return `${baseUrl}dist/index.html`
  }
  return baseUrl
}
