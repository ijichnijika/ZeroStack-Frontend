<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { addApp, listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController'
import { usePagedApps } from '@/composables/usePagedApps'
import PromptComposer from '@/components/home/PromptComposer.vue'
import ProofSheet from '@/components/home/ProofSheet.vue'
import RunStrip from '@/components/home/RunStrip.vue'
import AppShelf from '@/components/home/AppShelf.vue'
import { PRESETS, type PresetKey } from '@/components/home/presets'

const router = useRouter()
const userStore = useUserStore()

const prompt = ref('')
const useAgent = ref(false)
const submitting = ref(false)
const activePreset = ref<PresetKey | null>(null)
const composerRef = ref<InstanceType<typeof PromptComposer> | null>(null)

const isLoggedIn = computed(() => Boolean(userStore.loginUser?.id))

const proofLayout = computed<PresetKey>(() => activePreset.value ?? 'blog')

const proofTitle = computed(() => {
  const preset = PRESETS.find((p) => p.key === activePreset.value)
  const text = prompt.value.trim()
  if (!text || (preset && text === preset.prompt)) {
    return preset?.sampleTitle ?? '你的网站，从这一句开始'
  }
  const firstClause = text.split(/[，。,.!！？?\n：:；;]/).find((s) => s.trim()) ?? text
  const clause = firstClause.trim()
  return clause.length > 20 ? `${clause.slice(0, 20)}…` : clause
})

const applyPreset = (key: PresetKey) => {
  const preset = PRESETS.find((p) => p.key === key)
  if (!preset) return
  activePreset.value = key
  prompt.value = preset.prompt
}

const handleSubmit = async () => {
  const text = prompt.value.trim()
  if (!text) {
    message.warning('先写下你想做的网站')
    composerRef.value?.focus()
    return
  }
  if (!isLoggedIn.value) {
    message.info('登录后即可开始生成')
    router.push(`/user/login?redirect=${encodeURIComponent('/')}`)
    return
  }
  submitting.value = true
  try {
    const res = await addApp({ initPrompt: text })
    if (res.data.code === 0 && res.data.data) {
      router.push(`/app/chat/${res.data.data}?auto=1&agent=${useAgent.value}`)
    } else {
      message.error(res.data.message || '创建失败，请稍后重试')
    }
  } catch (error: unknown) {
    message.error(`创建失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally {
    submitting.value = false
  }
}

const focusComposer = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  composerRef.value?.focus()
}

const mine = usePagedApps(listMyAppVoByPage)
const featured = usePagedApps(listGoodAppVoByPage)

onMounted(() => {
  if (isLoggedIn.value) mine.load()
  featured.load()
})
</script>

<template>
  <div class="home">
    <section class="page hero">
      <div class="hero-main">
        <h1 class="hero-title">
          <span class="line">一句话，</span>
          <span class="line">做出能<mark class="plate">上线</mark></span>
          <span class="line">的网站。</span>
        </h1>
        <p class="hero-lead">
          描述你想要的页面或应用，ZeroStack 会自动选择 HTML、多文件或 Vue 工程来实现。边生成边预览，满意了一键部署。
        </p>
        <PromptComposer
          ref="composerRef"
          v-model="prompt"
          v-model:agent="useAgent"
          :submitting="submitting"
          :active-preset="activePreset"
          @preset="applyPreset"
          @submit="handleSubmit"
        />
      </div>

      <ProofSheet class="hero-proof" :title="proofTitle" :layout="proofLayout" />
    </section>

    <RunStrip />

    <div class="page shelves">
      <AppShelf
        v-if="isLoggedIn"
        title="我的作品"
        :apps="mine.list.value"
        :total="mine.total.value"
        :page="mine.page.value"
        :page-size="mine.pageSize"
        :loading="mine.loading.value"
        :error="mine.error.value"
        @page-change="mine.goTo"
        @retry="mine.load"
      >
        <template #empty>
          <div class="empty-mine">
            <p class="empty-title">还没有作品。</p>
            <p class="empty-desc">在上面写下第一句话，几分钟后它就是一个能打开的网站。</p>
            <button type="button" class="btn btn--ink" @click="focusComposer">开始描述</button>
          </div>
        </template>
      </AppShelf>

      <AppShelf
        title="精选作品"
        show-author
        :apps="featured.list.value"
        :total="featured.total.value"
        :page="featured.page.value"
        :page-size="featured.pageSize"
        :loading="featured.loading.value"
        :error="featured.error.value"
        @page-change="featured.goTo"
        @retry="featured.load"
      >
        <template #empty>
          <p class="empty-quiet">暂时还没有精选作品。管理员挑选出的优秀作品会出现在这里。</p>
        </template>
      </AppShelf>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: clamp(40px, 6vw, 88px);
  align-items: start;
  min-height: calc(100svh - var(--header-h));
  padding-top: clamp(28px, 3.6vw, 44px);
  padding-bottom: 48px;
}

.hero-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-title {
  display: flex;
  flex-direction: column;
  font-size: clamp(48px, 6.4vw, 92px);
  line-height: 1.02;
  letter-spacing: 0.01em;
}

.plate {
  position: relative;
  isolation: isolate;
  padding: 0;
  background: none;
  color: inherit;
}

.plate::after {
  content: '';
  position: absolute;
  left: -0.06em;
  right: -0.08em;
  bottom: 0.06em;
  height: 0.46em;
  z-index: -1;
  background: var(--yellow);
  mix-blend-mode: multiply;
  animation: plate-in 900ms var(--ease-out) 200ms both;
}

@keyframes plate-in {
  from {
    transform: translate(0.12em, 0.1em);
    opacity: 0;
  }
}

.hero-lead {
  max-width: 36em;
  margin: 18px 0 22px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--ink-2);
}

.hero-proof {
  margin-top: 12px;
}

.shelves {
  display: flex;
  flex-direction: column;
  gap: 96px;
  padding-top: 96px;
}

.empty-mine {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 40px clamp(24px, 4vw, 48px);
  border-radius: var(--radius);
  background: var(--yellow);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1.1;
}

.empty-desc {
  margin-bottom: 10px;
  color: var(--ink-2);
}

.empty-quiet {
  padding: 28px 0;
  color: var(--ink-3);
}

@media (max-width: 1080px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .hero-proof {
    max-width: 440px;
    margin: 24px auto 0;
    width: 100%;
  }
}
</style>
