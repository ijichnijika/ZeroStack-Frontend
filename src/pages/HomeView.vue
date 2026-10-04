<script setup lang="ts">
/**
 * 平台首页视图
 * 聚合需求输入、多版式交互样张预览、历史/精选应用货架，并维护未登录上下文暂存。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { addApp, listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController'
import { usePagedApps } from '@/composables/usePagedApps'
import { useProofDemo } from '@/composables/useProofDemo'
import PromptComposer from '@/components/home/PromptComposer.vue'
import ProofSheet from '@/components/home/ProofSheet.vue'
import PressBed from '@/components/home/PressBed.vue'
import RunStrip from '@/components/home/RunStrip.vue'
import AppShelf from '@/components/home/AppShelf.vue'
import {
  PENDING_AGENT_KEY,
  PENDING_PROMPT_KEY,
  PRESETS,
  type PresetKey,
} from '@/components/home/presets'

const router = useRouter()
const userStore = useUserStore()

const prompt = ref('')
const useAgent = ref(false)
const submitting = ref(false)
// 未登录跳转前的过渡动效状态，不触发实际创建请求
const pressing = ref(false)
const locking = ref(false)
const busy = computed(() => submitting.value || pressing.value)
const printing = computed(() => busy.value && !locking.value)
const composing = ref(false)
const previewPreset = ref<PresetKey | null>(null)
const demo = useProofDemo()
const activePreset = ref<PresetKey | null>(null)
const userCustomDraft = ref('')
const composerRef = ref<InstanceType<typeof PromptComposer> | null>(null)

const isLoggedIn = computed(() => Boolean(userStore.loginUser?.id))
const hasDraft = computed(() => Boolean(userCustomDraft.value.trim() && activePreset.value))

// 根据输入文本关键词自动推导推荐版式；无匹配项时默认选用通用落地页版式
const LAYOUT_HINTS: [PresetKey, RegExp][] = [
  ['dashboard', /看板|数据|报表|统计|后台|管理系统|仪表/],
  ['portfolio', /作品|摄影|插画|相册|画廊|设计师/],
  ['todo', /待办|清单|任务|打卡|计划|备忘/],
  ['blog', /博客|文章|笔记|日记|专栏|写作/],
]

const guessLayout = (text: string): PresetKey =>
  LAYOUT_HINTS.find(([, re]) => re.test(text))?.[0] ?? 'product'

const proofLayout = computed<PresetKey>(
  () =>
    previewPreset.value ??
    activePreset.value ??
    demo.key.value ??
    (prompt.value.trim() ? guessLayout(prompt.value) : 'blog'),
)

const firstClause = (text: string) => {
  const clause = (text.split(/[，。,.!！？?\n：:；;]/).find((s) => s.trim()) ?? text).trim()
  const chars = Array.from(clause)
  return chars.length > 20 ? `${chars.slice(0, 20).join('')}…` : clause
}

const proofTitle = computed(() => {
  const preset = PRESETS.find((p) => p.key === activePreset.value)
  const text = prompt.value.trim()
  if (!text || (preset && text === preset.prompt)) {
    const shown = PRESETS.find((p) => p.key === (previewPreset.value ?? activePreset.value))
    if (shown) return shown.sampleTitle
    if (demo.running.value) return firstClause(demo.text.value)
    return '你的网站，从这一句开始'
  }
  return firstClause(text)
})

const handleFocusIn = (e: FocusEvent) => {
  composing.value = (e.target as HTMLElement).tagName === 'TEXTAREA'
  if (composing.value) demo.stop()
}

const handlePreview = (key: PresetKey | null) => {
  if (key) demo.stop()
  previewPreset.value = key
}

const applyPreset = (key: PresetKey) => {
  demo.stop()
  if (activePreset.value === key) {
    prompt.value = userCustomDraft.value
    activePreset.value = null
    userCustomDraft.value = ''
    return
  }
  const preset = PRESETS.find((p) => p.key === key)
  if (!preset) return
  if (!activePreset.value && prompt.value.trim()) {
    userCustomDraft.value = prompt.value
  }
  activePreset.value = key
  prompt.value = preset.prompt
}

const handleRestoreDraft = () => {
  prompt.value = userCustomDraft.value
  activePreset.value = null
  userCustomDraft.value = ''
}

const handlePromptUpdate = (val: string) => {
  demo.stop()
  prompt.value = val
  if (activePreset.value) {
    const preset = PRESETS.find((p) => p.key === activePreset.value)
    if (preset && val !== preset.prompt) {
      activePreset.value = null
      userCustomDraft.value = ''
    }
  }
}

// 预留未登录跳转前的动效展示时间（若开启减弱动态效果则直接跳过）
const pressBeat = (ms: number) =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Promise.resolve()
    : new Promise<void>((resolve) => setTimeout(resolve, ms))

// 跳转前将位移动画复位到对齐状态
const lockPlates = async () => {
  locking.value = true
  await pressBeat(320)
}

const handleSubmit = async () => {
  if (busy.value) return
  const text = prompt.value.trim()
  if (!text) {
    composerRef.value?.triggerInvalid()
    message.warning('先写下你想做的网站')
    composerRef.value?.focus()
    return
  }
  if (!isLoggedIn.value) {
    sessionStorage.setItem(PENDING_PROMPT_KEY, text)
    sessionStorage.setItem(PENDING_AGENT_KEY, String(useAgent.value))
    pressing.value = true
    await pressBeat(520)
    await lockPlates()
    router.push(`/user/login?redirect=${encodeURIComponent('/')}`)
    return
  }
  submitting.value = true
  try {
    const res = await addApp({ initPrompt: text })
    if (res.data.code === 0 && res.data.data) {
      sessionStorage.removeItem(PENDING_PROMPT_KEY)
      sessionStorage.removeItem(PENDING_AGENT_KEY)
      await pressBeat(700)
      await lockPlates()
      router.push(`/app/chat/${res.data.data}?agent=${useAgent.value}`)
    } else {
      message.error(res.data.message || '没能创建应用，请稍后再试。你写的内容还在。')
    }
  } catch {
    message.error('网络或服务暂时不可用，请稍后再试。你写的内容还在。')
  } finally {
    submitting.value = false
    pressing.value = false
    locking.value = false
  }
}

const focusComposer = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  composerRef.value?.focus()
}

const mine = usePagedApps(listMyAppVoByPage)
const featured = usePagedApps(listGoodAppVoByPage)

onMounted(() => {
  const pendingPrompt = sessionStorage.getItem(PENDING_PROMPT_KEY)
  const pendingAgent = sessionStorage.getItem(PENDING_AGENT_KEY)
  if (pendingPrompt) {
    prompt.value = pendingPrompt
    userCustomDraft.value = pendingPrompt
    if (pendingAgent !== null) {
      useAgent.value = pendingAgent === 'true'
    }
    sessionStorage.removeItem(PENDING_PROMPT_KEY)
    sessionStorage.removeItem(PENDING_AGENT_KEY)
    if (isLoggedIn.value) handleSubmit()
  }

  if (isLoggedIn.value) mine.load()
  featured.load()

  if (!prompt.value) demo.start()
})
</script>

<template>
  <div class="home">
    <div class="hero-bed">
      <PressBed :printing="printing" />
      <section class="page hero">
        <div class="hero-main">
          <h1 class="hero-title" :class="{ 'is-printing': printing, 'is-locking': locking }">
            <span class="line" data-ghost="一句话，">一句话，</span>
            <span class="line" data-ghost="做出能上线">做出能<mark class="plate">上线</mark></span>
            <span class="line" data-ghost="的网站。">的网站。</span>
          </h1>
          <p class="hero-lead">
            满意了一键部署，拿到能分享的地址。说清楚给谁用、要哪些页面，其余交给 ZeroStack，边生成边预览。
          </p>
          <p v-if="prompt.trim() || demo.running.value" class="proof-strip" aria-hidden="true">
            <span class="proof-strip-label">样张</span>
            <span class="proof-strip-title">{{ proofTitle }}</span>
          </p>
          <PromptComposer
            ref="composerRef"
            :model-value="prompt"
            v-model:agent="useAgent"
            :submitting="submitting"
            :needs-login="!isLoggedIn"
            :active-preset="activePreset"
            :has-draft="hasDraft"
            @update:model-value="handlePromptUpdate"
            @preset="applyPreset"
            @restore-draft="handleRestoreDraft"
            :demo-text="demo.running.value ? demo.text.value : null"
            :demo-preset="demo.key.value"
            @preview="handlePreview"
            @submit="handleSubmit"
            @focusin="handleFocusIn"
            @focusout="composing = false"
            @pointerenter="demo.stop()"
          />
        </div>

        <ProofSheet
          class="hero-proof"
          :title="proofTitle"
          :layout="proofLayout"
          :printing="printing"
          :composing="composing || demo.running.value"
        />
      </section>
    </div>

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

      <section class="closing">
        <p class="closing-line">下一张样，印你的。</p>
        <button type="button" class="btn btn--pink btn--lg" @click="focusComposer">
          写下第一句
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-bed {
  position: relative;
  overflow: clip;
}

.hero {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: clamp(40px, 6vw, 88px);
  align-items: start;
  padding-top: clamp(28px, 3.6vw, 44px);
  padding-bottom: 64px;
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

/* 标题多色图层入场与提交动效：平时保持重合，提交期间触发错位微移动效，结束后平滑复位 */
.line {
  position: relative;
  isolation: isolate;
  align-self: flex-start;
}

.line::before,
.line::after {
  content: attr(data-ghost);
  content: attr(data-ghost) / '';
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  white-space: nowrap;
  mix-blend-mode: multiply;
  pointer-events: none;
  opacity: 0;
}

.line::before {
  --off: translate(0.07em, -0.05em);

  color: var(--pink);
  animation: ghost-in 760ms var(--ease-out) 60ms backwards;
}

.line::after {
  --off: translate(-0.05em, 0.06em);

  color: var(--blue);
  animation: ghost-in 760ms var(--ease-out) 120ms backwards;
}

@keyframes ghost-in {
  from {
    transform: var(--off);
    opacity: 1;
  }

  80% {
    opacity: 1;
  }
}

.is-printing .line::before,
.is-printing .line::after {
  opacity: 1;
  transform: var(--off);
  animation: ghost-drift 1500ms var(--ease-in-out) infinite alternate;
}

/* 动效结束：图层复位回重合状态并隐去 */
.is-locking .line::before,
.is-locking .line::after {
  animation: ghost-in 320ms var(--ease-out) both;
}

@keyframes ghost-drift {
  from {
    transform: translate(0.015em, 0.015em);
  }
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
  animation: plate-in 900ms var(--ease-out) 520ms both;
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

.proof-strip {
  display: none;
}

.closing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 24px;
  border-top: 1.5px solid var(--ink);
}

.closing-line {
  font-family: var(--font-display);
  font-size: clamp(32px, 4.4vw, 56px);
  line-height: 1.05;
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

  /* 窄屏响应式：样张位于下方时，在输入框上方回显当前样张标题单行摘要 */
  .proof-strip {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: -4px 0 14px;
    overflow: hidden;
    white-space: nowrap;
  }

  .proof-strip-label {
    flex-shrink: 0;
    padding: 1px 6px;
    border: 1px solid var(--ink);
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    color: var(--ink);
  }

  .proof-strip-title {
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    isolation: isolate;
    font-family: var(--font-wide);
    font-size: 17px;
    font-weight: 900;
    font-stretch: 125%;
  }

  .proof-strip-title::after {
    content: '';
    position: absolute;
    inset: auto -4px 1px;
    height: 45%;
    z-index: -1;
    background: var(--yellow);
    mix-blend-mode: multiply;
  }

  .hero-proof {
    max-width: 440px;
    margin: 24px auto 0;
    width: 100%;
  }
}
</style>
