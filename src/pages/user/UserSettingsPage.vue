<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { editUser } from '@/api/userController'
import PageHead from '@/components/PageHead.vue'

const userStore = useUserStore()
const submitLoading = ref(false)

const formState = reactive({
  userName: '',
  userAvatar: '',
  userProfile: '',
})

onMounted(() => {
  const { loginUser } = userStore
  formState.userName = loginUser.userName || ''
  formState.userAvatar = loginUser.userAvatar || ''
  formState.userProfile = loginUser.userProfile || ''
})

const handleSubmit = async () => {
  submitLoading.value = true
  try {
    const res = await editUser({ ...formState })
    if (res.data?.code === 0) {
      message.success('资料已保存')
      await userStore.fetchLoginUser()
    } else {
      message.error(res.data?.message || '保存失败')
    }
  } catch (error: unknown) {
    message.error(error instanceof Error ? error.message : '网络异常，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <div class="page">
    <router-link to="/user/profile" class="back-link">
      <ArrowLeftOutlined />
      个人中心
    </router-link>
    <PageHead title="个人设置" subtitle="修改昵称、头像和简介，右侧会实时显示效果。" />

    <div class="settings">
      <a-form layout="vertical" :model="formState" class="settings-form" @finish="handleSubmit">
        <a-form-item label="昵称" name="userName">
          <a-input v-model:value="formState.userName" placeholder="别人看到的名字" :maxlength="30" show-count />
        </a-form-item>
        <a-form-item label="头像地址" name="userAvatar" extra="填写一张图片的网络地址（URL）">
          <a-input v-model:value="formState.userAvatar" placeholder="https://…" />
        </a-form-item>
        <a-form-item label="简介" name="userProfile">
          <a-textarea
            v-model:value="formState.userProfile"
            placeholder="用一两句话介绍自己"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="200"
            show-count
          />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="submitLoading" class="save-btn">保存修改</a-button>
      </a-form>

      <aside class="preview" aria-label="资料预览">
        <p class="preview-label">预览</p>
        <div class="preview-card">
          <a-avatar :size="72" :src="formState.userAvatar" class="preview-avatar">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <p class="preview-name">{{ formState.userName || '还没有昵称' }}</p>
          <p class="preview-bio">{{ formState.userProfile || '还没有简介' }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
}

.back-link + :deep(.page-head) {
  padding-top: 16px;
}

.settings {
  display: grid;
  grid-template-columns: minmax(0, 560px) minmax(260px, 340px);
  gap: clamp(32px, 6vw, 96px);
  align-items: start;
}

.save-btn {
  height: 44px;
  padding: 0 28px;
  border-radius: var(--pill);
  font-weight: 700;
}

.preview {
  position: sticky;
  top: calc(var(--header-h) + 24px);
}

.preview-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
}

.preview-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 26px 24px;
  border-radius: var(--radius);
  background: var(--yellow);
}

.preview-avatar {
  border: 3px solid var(--ink);
  background: var(--pink);
  color: var(--ink);
  margin-bottom: 8px;
}

.preview-name {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.1;
  word-break: break-all;
}

.preview-bio {
  color: var(--ink-2);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 860px) {
  .settings {
    grid-template-columns: 1fr;
  }

  .preview {
    position: static;
  }
}
</style>
