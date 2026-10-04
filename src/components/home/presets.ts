/**
 * 首页示例预设与缓存常量定义
 */

/** 未登录状态下暂存的提示词与 Agent 开关 Storage Key，用于登录跳转后还原输入 */
export const PENDING_PROMPT_KEY = 'zerostack_pending_prompt'
export const PENDING_AGENT_KEY = 'zerostack_pending_agent'

export type PresetKey = 'blog' | 'portfolio' | 'dashboard' | 'product' | 'todo'

export interface Preset {
  key: PresetKey
  label: string
  /** 样张在默认或选中预设时展示的示例标题 */
  sampleTitle: string
  prompt: string
}

export const PRESETS: Preset[] = [
  {
    key: 'blog',
    label: '个人博客',
    sampleTitle: '慢慢写的技术笔记',
    prompt:
      '做一个个人技术博客：首页是文章列表，可以按标签筛选；文章页带目录和代码高亮；再加一个“关于我”页面。整体简洁、适合长时间阅读。',
  },
  {
    key: 'portfolio',
    label: '作品集',
    sampleTitle: '插画师林木的作品',
    prompt:
      '为一名插画师做作品集网站：首页用大图瀑布流展示作品，点击可以放大查看；另有个人简介和联系方式，风格大胆、色彩鲜明。',
  },
  {
    key: 'dashboard',
    label: '数据看板',
    sampleTitle: '今日店铺运营',
    prompt:
      '做一个电商运营数据看板：顶部显示今日销售额、订单数、访客数，下面是近 30 天销售趋势图和热销商品排行，信息密度高但清楚。',
  },
  {
    key: 'product',
    label: '产品落地页',
    sampleTitle: '安静，是一种新声音',
    prompt:
      '为一款降噪耳机做产品落地页：首屏是产品大图和购买按钮，往下依次是三个卖点、参数表、用户评价和常见问题。',
  },
  {
    key: 'todo',
    label: '待办清单',
    sampleTitle: '今天要做的三件事',
    prompt:
      '做一个待办清单应用：可以添加、完成、删除任务，按“今天 / 本周 / 全部”筛选，数据保存在浏览器本地。',
  },
]
