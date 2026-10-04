<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ArrowLeftOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons-vue'
import { getDeployUrl } from '@/config/env'
import { useUserStore } from '@/stores/user'
import { getAppVoById, getAppVoByIdByAdmin, updateApp, updateAppByAdmin } from '@/api/appController'
import { getCodeGenTypeConfig } from '@/enums/codeGenType'
import PageHead from '@/components/PageHead.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 雪花 ID 保留字符串，避免精度丢失
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const appId = route.params.id as any
const loading = ref(false)
const submitLoading = ref(false)
const appInfo = ref<API.AppVO | null>(null)

const formState = ref({
  appName: '',
  cover: '',
  priority: 0,
})

const isAdmin = computed(() => userStore.loginUser?.userRole === 'admin')
const typeConfig = computed(() => getCodeGenTypeConfig(appInfo.value?.codeGenType))
const initial = computed(() => (formState.value.appName || '未').trim().charAt(0))
const fmt = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '—')

const fillForm = (app: API.AppVO) => {
  formState.value = {
    appName: app.appName || '',
    cover: app.cover || '',
    priority: app.priority || 0,
  }
}

const loadAppInfo = async () => {
  loading.value = true
  try {
    const res = isAdmin.value ? await getAppVoByIdByAdmin({ id: appId }) : await getAppVoById({ id: appId })
    if (res.data?.code === 0 && res.data.data) {
      appInfo.value = res.data.data
      fillForm(res.data.data)
    } else {
      message.error(res.data?.message || '获取应用信息失败')
    }
  } catch (error: unknown) {
    message.error(`获取应用信息失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  if (appInfo.value) fillForm(appInfo.value)
}

const handleSubmit = async () => {
  if (!formState.value.appName.trim()) {
    message.warning('应用名称不能为空')
    return
  }
  submitLoading.value = true
  try {
    const res = isAdmin.value
      ? await updateAppByAdmin({ id: appId, ...formState.value })
      : await updateApp({ id: appId, appName: formState.value.appName })
    if (res.data?.code === 0) {
      message.success('已保存')
      router.back()
    } else {
      message.error(res.data?.message || '保存失败')
    }
  } catch (error: unknown) {
    message.error(`保存失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  if (!userStore.loginUser?.id) await userStore.fetchLoginUser()
  loadAppInfo()
})
</script>

<template>
  <div class="page">
    <button type="button" class="back-link" @click="router.back()">
      <ArrowLeftOutlined />
      返回
    </button>
    <PageHead title="编辑应用" :subtitle="appInfo?.appName ? `正在编辑「${appInfo.appName}」` : '修改应用的名称与展示信息'">
      <router-link :to="`/app/chat/${appId}`" class="btn btn--line">
        <MessageOutlined />
        进入对话
      </router-link>
    </PageHead>

    <a-spin :spinning="loading">
      <div class="edit">
        <a-form layout="vertical" class="edit-form" @finish="handleSubmit">
          <a-form-item label="应用名称" required>
            <a-input v-model:value="formState.appName" placeholder="给应用起个名字" show-count :maxlength="50" />
          </a-form-item>

          <a-form-item label="封面图地址" :extra="isAdmin ? '建议使用 16:10 的截图' : '仅管理员可修改封面'">
            <a-input v-model:value="formState.cover" placeholder="https://…" :disabled="!isAdmin" />
          </a-form-item>

          <a-form-item label="优先级" :extra="isAdmin ? '设为 99 即进入首页精选' : '仅管理员可修改优先级'">
            <div class="priority-row">
              <a-input-number v-model:value="formState.priority" :disabled="!isAdmin" :min="0" :max="99" style="width: 140px" />
              <span v-if="formState.priority === 99" class="tag tag--pink">★ 精选应用</span>
            </div>
          </a-form-item>

          <a-form-item label="初始需求" extra="创建时的需求原文，不可修改">
            <a-textarea :value="appInfo?.initPrompt" disabled :auto-size="{ minRows: 4, maxRows: 10 }" />
          </a-form-item>

          <div class="edit-actions">
            <a-button type="primary" html-type="submit" :loading="submitLoading" class="pill-btn">保存修改</a-button>
            <a-button class="pill-btn" @click="handleReset">还原</a-button>
          </div>
        </a-form>

        <aside class="edit-side">
          <div class="cover-frame">
            <img v-if="formState.cover" :src="formState.cover" alt="封面预览" />
            <div v-else class="cover-empty halftone" aria-hidden="true">
              <span class="cover-initial">{{ initial }}</span>
            </div>
          </div>

          <dl class="side-facts">
            <div>
              <dt>生成类型</dt>
              <dd>
                <span v-if="typeConfig" class="tag" :class="`tag--${typeConfig.ink}`">{{ typeConfig.label }}</span>
                <span v-else>—</span>
              </dd>
            </div>
            <div>
              <dt>创建者</dt>
              <dd class="creator">
                <a-avatar :size="22" :src="appInfo?.user?.userAvatar">
                  <template #icon><UserOutlined /></template>
                </a-avatar>
                {{ appInfo?.user?.userName || appInfo?.user?.userAccount || '—' }}
              </dd>
            </div>
            <div>
              <dt>应用 ID</dt>
              <dd class="mono">{{ appInfo?.id || '—' }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd class="tabular">{{ fmt(appInfo?.createTime) }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd class="tabular">{{ fmt(appInfo?.updateTime) }}</dd>
            </div>
            <div>
              <dt>部署时间</dt>
              <dd class="tabular">{{ fmt(appInfo?.deployedTime) }}</dd>
            </div>
            <div>
              <dt>访问地址</dt>
              <dd>
                <a v-if="appInfo?.deployKey" :href="getDeployUrl(appInfo.deployKey)" target="_blank" rel="noopener">
                  /{{ appInfo.deployKey }}
                </a>
                <span v-else>未部署</span>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
  padding: 0;
  border: 0;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
}

.back-link:hover {
  color: var(--ink);
}

.back-link + :deep(.page-head) {
  padding-top: 16px;
}

.edit {
  display: grid;
  grid-template-columns: minmax(0, 620px) minmax(280px, 380px);
  gap: clamp(32px, 6vw, 96px);
  align-items: start;
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.pill-btn {
  height: 42px;
  padding: 0 24px;
  border-radius: var(--pill);
  font-weight: 700;
}

.cover-frame {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--blue);
}

.cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.priority-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.35);
}

.cover-initial {
  font-family: var(--font-display);
  font-size: 88px;
  line-height: 1;
  color: #fff;
}

.side-facts {
  margin: 20px 0 0;
}

.side-facts div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--rule);
  font-size: 14px;
}

.side-facts dt {
  color: var(--ink-3);
  flex-shrink: 0;
}

.side-facts dd {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  text-align: right;
}

.creator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mono {
  font-family: var(--font-mono);
  font-size: 12.5px;
}

@media (max-width: 900px) {
  .edit {
    grid-template-columns: 1fr;
  }
}
</style>
