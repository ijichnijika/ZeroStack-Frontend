<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDeployUrl } from '@/config/env'
import { useUserStore } from '@/stores/user'
import { getAppVoById, getAppVoByIdByAdmin, updateApp, updateAppByAdmin } from '@/api/appController'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const appId = route.params.id as any
const loading = ref(false)
const submitLoading = ref(false)


const appInfo = ref<API.AppVO | null>(null)

const formState = ref({
  appName: '',
  cover: '',
  priority: 0,
})

const isAdmin = computed(() => {
  return userStore.loginUser?.userRole === 'admin'
})

const loadAppInfo = async () => {
  loading.value = true
  try {
    let res
    if (isAdmin.value) {
      res = await getAppVoByIdByAdmin({ id: appId })
    } else {
      res = await getAppVoById({ id: appId })
    }

    if (res.data?.code === 0 && res.data?.data) {
      const app = res.data.data
      appInfo.value = app
      formState.value = {
        appName: app.appName || '',
        cover: app.cover || '',
        priority: app.priority || 0,
      }
    } else {
      message.error(res.data?.message || '获取应用信息失败')
    }
  } catch (error: any) {
    message.error('网络异常: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  if (appInfo.value) {
    formState.value = {
      appName: appInfo.value.appName || '',
      cover: appInfo.value.cover || '',
      priority: appInfo.value.priority || 0,
    }
  }
}

const handleSubmit = async () => {
  if (!formState.value.appName.trim()) {
    message.warning('应用名称不能为空')
    return
  }

  submitLoading.value = true
  try {
    let res
    if (isAdmin.value) {
      res = await updateAppByAdmin({
        id: appId,
        appName: formState.value.appName,
        cover: formState.value.cover,
        priority: formState.value.priority,
      })
    } else {
      res = await updateApp({
        id: appId,
        appName: formState.value.appName,
      })
    }

    if (res.data?.code === 0) {
      message.success('更新成功')
      router.back()
    } else {
      message.error(res.data?.message || '更新失败')
    }
  } catch (error: any) {
    message.error('网络异常: ' + error.message)
  } finally {
    submitLoading.value = false
  }
}

const gotoChat = () => {
  router.push(`/app/chat/${appId}`)
}

onMounted(() => {
  if (!userStore.loginUser?.id) {
    userStore.fetchLoginUser().then(() => {
      loadAppInfo()
    })
  } else {
    loadAppInfo()
  }
})
</script>

<template>
  <div class="app-edit-page">
    <div class="page-header">
      <a-button type="text" @click="router.back()" class="back-btn">
        <template #icon><ArrowLeftOutlined /></template>
        返回
      </a-button>
      <h2>编辑应用信息</h2>
    </div>

    <div class="content-wrapper">
      <a-spin :spinning="loading">
        <!-- 基本信息模块 -->
        <div class="module-title">基本信息</div>
        <a-form layout="vertical" class="edit-form">
          <a-form-item label="应用名称" required>
            <a-input v-model:value="formState.appName" placeholder="请输入应用名称" show-count :maxlength="50" size="large" />
          </a-form-item>

          <a-form-item label="应用封面">
            <a-input v-model:value="formState.cover" placeholder="请输入应用封面图片的 URL" size="large" :disabled="!isAdmin" />
            <div v-if="formState.cover" class="cover-preview">
              <img :src="formState.cover" alt="封面预览" />
            </div>
            <div class="field-desc">支持图片链接，建议尺寸: 400x300</div>
          </a-form-item>

          <a-form-item label="优先级">
            <a-input-number v-model:value="formState.priority" :disabled="!isAdmin" :min="0" :max="99" style="width: 240px" size="large" />
            <div class="field-desc">设置为99表示精选应用</div>
          </a-form-item>

          <a-form-item label="初始提示词">
            <a-textarea :value="appInfo?.initPrompt" disabled :auto-size="{ minRows: 4, maxRows: 8 }" show-count :maxlength="1000" size="large" />
            <div class="field-desc">初始提示词不可修改</div>
          </a-form-item>

          <a-form-item label="生成类型">
            <a-input :value="appInfo?.codeGenType" disabled size="large" />
            <div class="field-desc">生成类型不可修改</div>
          </a-form-item>

          <a-form-item label="部署密钥">
            <a-input :value="appInfo?.deployKey" disabled size="large" />
            <div class="field-desc">部署密钥不可修改</div>
          </a-form-item>

          <a-form-item class="form-actions">
            <a-space size="large">
              <a-button type="primary" size="large" :loading="submitLoading" @click="handleSubmit">
                保存修改
              </a-button>
              <a-button size="large" @click="handleReset">
                重置
              </a-button>
              <a-button type="link" size="large" @click="gotoChat">
                进入对话
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
        
        <a-divider style="margin: 40px 0" />

        <!-- 应用信息模块 -->
        <div class="module-title">应用信息</div>
        <a-descriptions bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }" class="info-descriptions">
          <a-descriptions-item label="应用ID">
            {{ appInfo?.id || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="创建者">
            <div class="creator-info" v-if="appInfo?.user">
              <a-avatar size="small" :src="appInfo.user.userAvatar" />
              <span>{{ appInfo.user.userName || appInfo.user.userAccount }}</span>
            </div>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ appInfo?.createTime ? dayjs(appInfo.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ appInfo?.updateTime ? dayjs(appInfo.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="部署时间">
            {{ appInfo?.deployedTime ? dayjs(appInfo.deployedTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="访问链接">
            <a v-if="appInfo?.deployKey" :href="getDeployUrl(appInfo.deployKey)" target="_blank">查看预览</a>
            <span v-else>-</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </div>
  </div>
</template>

<style scoped>
.app-edit-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  color: #333;
  padding: 4px 8px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0;
}

.content-wrapper {
  width: 100%;
}

.module-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1a1a1a;
}

.cover-preview {
  margin-top: 12px;
  border-radius: 6px;
  overflow: hidden;
  max-width: 320px;
  border: 1px solid #f0f0f0;
}

.cover-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.edit-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #333;
}

.field-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 8px;
  line-height: 1.5;
}

.form-actions {
  margin-top: 40px;
  margin-bottom: 0;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
