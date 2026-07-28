<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { ArrowUpOutlined } from '@ant-design/icons-vue'
import { addApp, listMyAppVoByPage, listGoodAppVoByPage } from '@/api/appController'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import AppCard from '@/components/AppCard.vue'
import AgentSwitch from '@/components/AgentSwitch.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()

const prompt = ref('')
const submitting = ref(false)
const useAgent = ref(false) // 默认不开启 agent 模式

const handleAdd = async () => {
  if (!prompt.value.trim()) {
    message.warning('请输入您的需求提示词')
    return
  }
  if (!userStore.loginUser?.id) {
    message.warning('请先登录')
    router.push('/user/login')
    return
  }
  submitting.value = true
  try {
    const res = await addApp({ initPrompt: prompt.value })
    if (res.data.code === 0 && res.data.data) {
      message.success('创建成功')
      router.push(`/app/chat/${res.data.data}?auto=1&agent=${useAgent.value}`)
    } else {
      message.error(res.data.message || '创建失败')
    }
  } catch (error: any) {
    message.error('请求失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 分页列表逻辑
const myAppList = ref<API.AppVO[]>([])
const myAppTotal = ref(0)
const myAppPage = ref(1)

const goodAppList = ref<API.AppVO[]>([])
const goodAppTotal = ref(0)
const goodAppPage = ref(1)

const pageSize = 8

const loadMyAppList = async () => {
  if (!userStore.loginUser?.id) return
  try {
    const res = await listMyAppVoByPage({
      pageNum: myAppPage.value,
      pageSize,
      sortField: 'createTime',
      sortOrder: 'descend'
    })
    if (res.data.code === 0 && res.data.data) {
      myAppList.value = res.data.data.records || []
      myAppTotal.value = Number(res.data.data.totalRow) || 0
    }
  } catch (e: any) {
    message.error('加载我的应用失败')
  }
}

const loadGoodAppList = async () => {
  try {
    const res = await listGoodAppVoByPage({
      pageNum: goodAppPage.value,
      pageSize,
      sortField: 'createTime',
      sortOrder: 'descend'
    })
    if (res.data.code === 0 && res.data.data) {
      goodAppList.value = res.data.data.records || []
      goodAppTotal.value = Number(res.data.data.totalRow) || 0
    }
  } catch (e: any) {
    message.error('加载精选应用失败')
  }
}

const placeholderText = ref('使用ZeroStack帮我生成网站')
const examples = ['个人博客', '企业官网', '电商后台', '数据看板', '在线文档']
let currentExampleIndex = 0
let isDeleting = false
let currentText = ''
let typeTimeout: any = null

const typeWriter = () => {
  const targetText = examples[currentExampleIndex]
  if (isDeleting) {
    currentText = targetText.substring(0, currentText.length - 1)
  } else {
    currentText = targetText.substring(0, currentText.length + 1)
  }
  
  placeholderText.value = `使用ZeroStack帮我生成${currentText}网站`
  
  let typingSpeed = isDeleting ? 50 : 150
  
  if (!isDeleting && currentText === targetText) {
    typingSpeed = 2000
    isDeleting = true
  } else if (isDeleting && currentText === '') {
    isDeleting = false
    currentExampleIndex = (currentExampleIndex + 1) % examples.length
    typingSpeed = 500
  }
  
  typeTimeout = setTimeout(typeWriter, typingSpeed)
}

onMounted(() => {
  typeWriter()
  if (userStore.loginUser?.id) {
    loadMyAppList()
  }
  loadGoodAppList()
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (typeTimeout) clearTimeout(typeTimeout)
})

const handleMyPageChange = (page: number) => {
  myAppPage.value = page
  loadMyAppList()
}

const handleGoodPageChange = (page: number) => {
  goodAppPage.value = page
  loadGoodAppList()
}

const goChat = (appId: number) => {
  router.push(`/app/chat/${appId}?view=1`)
}
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="hero-title">
        一句话 <img src="@/assets/logo.png" alt="logo" class="inline-logo" /> 呈所想
      </h1>
      <p class="hero-desc">与 AI 对话轻松创建应用和网站</p>

      <div class="input-wrapper">
        <a-textarea
          v-model:value="prompt"
          :placeholder="placeholderText"
          :auto-size="{ minRows: 4, maxRows: 6 }"
          class="prompt-input"
          @pressEnter.prevent="handleAdd"
        />
          <div class="input-actions">
            <div class="input-tags">
              <a-tag @click="prompt = '帮我生成一个极简风格的个人博客网站，包含首页、文章列表页和文章详情页。首页需要展示最新的5篇文章和个人简介，整体色调以黑白灰为主，支持移动端自适应，排版要清晰舒适，符合现代审美。'">极简个人博客</a-tag>
              <a-tag @click="prompt = '创建一个SaaS产品的企业官网，需要有吸引人的首屏，包含产品特性介绍、客户评价轮播图、详细的定价方案（分基础版、专业版、企业版），以及底部的联系我们表单。整体风格专业、现代、有科技感。'">SaaS企业官网</a-tag>
              <a-tag @click="prompt = '开发一个电商后台管理系统的首页数据看板。需要包含今日营业额、新增用户数、订单总数等核心指标统计卡片，以及订单趋势折线图、商品分类占比饼图。界面设计需要专业现代，使用经典的侧边栏加顶部导航布局。'">电商数据看板</a-tag>
              <a-tag @click="prompt = '设计一个暗黑模式的程序员社区交流页面。包含顶部导航栏（支持全局搜索和快捷发布）、左侧边栏（热门话题分类）、主体区域为动态列表（展示帖子标题、摘要、作者头像、点赞数和评论数），风格极客。'">暗黑极客社区</a-tag>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <AgentSwitch v-model:checked="useAgent" />
              <a-button type="primary" shape="circle" size="large" class="submit-btn" :loading="submitting" @click="handleAdd">
                <template #icon><ArrowUpOutlined /></template>
              </a-button>
            </div>
          </div>
      </div>
    </div>

    <div class="content-section">
      <!-- 我的作品 -->
      <div v-if="userStore.loginUser?.id" class="list-container">
        <h2 class="section-title">我的作品</h2>
        <a-list
          :grid="{ gutter: 24, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }"
          :data-source="myAppList"
          :pagination="myAppTotal > pageSize ? {
            current: myAppPage,
            pageSize: pageSize,
            total: myAppTotal,
            onChange: handleMyPageChange
          } : false"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <AppCard :app="item" />
            </a-list-item>
          </template>
        </a-list>
      </div>

      <!-- 精选案例 -->
      <div class="list-container">
        <h2 class="section-title">精选案例</h2>
        <a-list
          :grid="{ gutter: 24, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }"
          :data-source="goodAppList"
          :pagination="goodAppTotal > pageSize ? {
            current: goodAppPage,
            pageSize: pageSize,
            total: goodAppTotal,
            onChange: handleGoodPageChange
          } : false"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <AppCard :app="item" :showCreator="true" />
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  width: 100%;
}

.hero-section {
  text-align: center;
  width: 100%;
  max-width: 900px;
  margin-top: 20px;
  margin-bottom: 60px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.inline-logo {
  height: 48px;
  border-radius: 12px;
}

.hero-desc {
  font-size: 18px;
  color: #5f6368;
  margin-bottom: 40px;
}

.input-wrapper {
  background: #ffffff;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.input-wrapper:hover, .input-wrapper:focus-within {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: #d0d0d0;
}

.prompt-input {
  border: none !important;
  box-shadow: none !important;
  font-size: 16px;
  resize: none;
  background: transparent;
}

.prompt-input:focus {
  outline: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}



.input-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.input-tags .ant-tag {
  border-radius: 16px;
  padding: 4px 12px;
  cursor: pointer;
  background: #f5f5f5;
  border: none;
  color: #666;
  transition: all 0.2s;
}

.input-tags .ant-tag:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.submit-btn {
  background: #1a1a1a;
  border: none;
}

.submit-btn:hover {
  background: #333333;
}

.content-section {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.list-container {
  width: 100%;
}
</style>


