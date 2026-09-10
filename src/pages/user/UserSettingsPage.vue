<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { editUser } from '@/api/userController'
import { UserOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const submitLoading = ref(false)

const formState = reactive({
  userName: '',
  userAvatar: '',
  userProfile: '',
})

onMounted(() => {
  // 初始化表单数据
  const { loginUser } = userStore
  formState.userName = loginUser.userName || ''
  formState.userAvatar = loginUser.userAvatar || ''
  formState.userProfile = loginUser.userProfile || ''
})

const handleSubmit = async () => {
  submitLoading.value = true
  try {
    const res = await editUser({
      userName: formState.userName,
      userAvatar: formState.userAvatar,
      userProfile: formState.userProfile,
    })
    if (res.data?.code === 0) {
      message.success('保存成功')
      // 重新拉取最新的用户信息
      await userStore.fetchLoginUser()
    } else {
      message.error(res.data?.message || '保存失败')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="user-settings-page">
    <div class="settings-header">
      <a-button type="link" class="back-link" @click="router.push('/user/profile')">
        <template #icon><ArrowLeftOutlined /></template>
        返回个人中心
      </a-button>
      <h2>个人设置</h2>
      <p class="subtitle">更新您的个人基本资料和头像</p>
    </div>

    <div class="settings-content">
      <div class="form-container">
        <a-form layout="vertical" :model="formState" @finish="handleSubmit">
          <a-form-item label="个人昵称" name="userName">
            <a-input v-model:value="formState.userName" placeholder="请输入昵称" class="glass-input" />
          </a-form-item>

          <a-form-item label="头像地址 (URL)" name="userAvatar">
            <a-input v-model:value="formState.userAvatar" placeholder="请输入头像 URL 地址" class="glass-input" />
          </a-form-item>

          <a-form-item label="个人简介" name="userProfile">
            <a-textarea v-model:value="formState.userProfile" placeholder="请输入您的个人简介" :rows="4" class="glass-input" />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submitLoading" size="large" class="save-btn">
              <template #icon><SaveOutlined /></template>
              保存修改
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 头像预览区域 -->
      <div class="preview-container">
        <h3>头像预览</h3>
        <div class="glow-avatar-wrapper preview-avatar">
          <a-avatar
            :size="150"
            :src="formState.userAvatar"
            style="border: 4px solid #fff;"
          >
            <template #icon><UserOutlined /></template>
          </a-avatar>
        </div>
        <p class="preview-tip">在左侧填入头像图片链接，可实时预览预览效果</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-header {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding-bottom: 16px;
}

.back-link {
  padding: 0;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.back-link:hover {
  color: #4f46e5;
}

.settings-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 0;
}

.settings-content {
  display: flex;
  gap: 60px;
  padding: 24px 0;
}

.form-container {
  flex: 1;
  max-width: 500px;
}

.preview-container {
  width: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-left: 60px;
  border-left: 1px solid rgba(15, 23, 42, 0.08);
}

.preview-container h3 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
}

.preview-tip {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}

.save-btn {
  border-radius: 9999px !important;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.save-btn:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55) !important;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .settings-content {
    flex-direction: column-reverse;
    align-items: center;
    gap: 32px;
  }

  .preview-container {
    width: 100%;
    border-left: none;
    padding-left: 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    padding-bottom: 32px;
  }
}
</style>
