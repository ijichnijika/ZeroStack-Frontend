/**
 * 环境变量配置
 */

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// 静态资源基础地址（用于直接访问，如轮询检测、非预览场景）
export const STATIC_BASE_URL = import.meta.env.VITE_PREVIEW_BASE_URL || 'http://localhost:8080/api/static'

// 应用部署域名
export const DEPLOY_BASE_URL = import.meta.env.VITE_DEPLOY_BASE_URL || 'http://localhost'

// 获取部署应用的完整 URL
export const getDeployUrl = (deployKey: string) => {
  return `${DEPLOY_BASE_URL}/${deployKey}/`
}

/**
 * 获取静态资源预览 URL
 *
 * 开发环境下，通过 Vite proxy 将 /preview-static 转发到后端静态资源，
 * 使 iframe 与主页面同源，从而允许可视化编辑模式直接操作 iframe DOM。
 *
 * 生产环境下，主页与静态资源通常已在同一域名下（Nginx 统一代理），
 * 可直接使用 STATIC_BASE_URL。
 */
export const getStaticPreviewUrl = (codeGenType: string, appId: string | number) => {
  const isDev = import.meta.env.DEV
  const baseUrl = isDev
    ? `/preview-static/${codeGenType}_${appId}/`
    : `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
  if (codeGenType === 'vue_project') {
    return `${baseUrl}dist/index.html`
  }
  return baseUrl
}

