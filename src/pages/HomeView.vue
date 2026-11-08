<script setup lang="ts">
/**
 * 平台首页视图
 * 聚合需求输入、多版式交互样张预览、历史/精选应用货架，并维护未登录上下文暂存。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { addApp, listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController'
import { optimizePrompt, type PromptOptimizationVO } from '@/api/promptController'
import { usePagedApps } from '@/composables/usePagedApps'
import { usePointerDrift } from '@/composables/usePointerDrift'
import PromptComposer from '@/components/home/PromptComposer.vue'
import ProofSheet from '@/components/home/ProofSheet.vue'
import AppShelf from '@/components/home/AppShelf.vue'
import {
  PENDING_AGENT_KEY,
  PENDING_ACTION_KEY,
  PENDING_PROMPT_KEY,
  PRESETS,
  type PresetKey,
} from '@/components/home/presets'

const router = useRouter()
const userStore = useUserStore()

const prompt = ref('')
const useAgent = ref(false)
const submitting = ref(false)
const optimizing = ref(false)
const optimization = ref<PromptOptimizationVO | null>(null)
let optimizationController: AbortController | null = null
// 未登录跳转前的过渡动效状态，不触发实际创建请求
const pressing = ref(false)
const locking = ref(false)
const busy = computed(() => submitting.value || pressing.value)
const printing = computed(() => busy.value && !locking.value)
const composing = ref(false)
const previewPreset = ref<PresetKey | null>(null)
const activePreset = ref<PresetKey | null>(null)
const userCustomDraft = ref('')
const composerRef = ref<InstanceType<typeof PromptComposer> | null>(null)

const isLoggedIn = computed(() => Boolean(userStore.loginUser?.id))
const hasDraft = computed(() => Boolean(userCustomDraft.value.trim() && activePreset.value))

// 标题按孔版印刷分版绘制：墨版承载文字，黄/蓝/粉专色版为同字副本，只做套印动效
const TITLE_LINES = ['一句话，', '做出能上线的网站。'] as const
const titleRef = ref<HTMLElement | null>(null)

const STEPS = [
  { title: '描述想法', desc: '用一句话说出你想要的网站。', tone: 'yellow' },
  { title: '生成与调整', desc: '边生成边预览，随时继续修改。', tone: 'pink' },
  { title: '分享网站', desc: '满意后一键上线，获得专属链接。', tone: 'blue' },
] as const

usePointerDrift(titleRef, ({ vx, vy }) => {
  titleRef.value?.style.setProperty('--px', vx.toFixed(3))
  titleRef.value?.style.setProperty('--py', vy.toFixed(3))
})

// 首屏入场期间推迟样张套印，与标题印刷节奏衔接；结束后恢复即时响应
const intro = ref(true)
const introTimer = setTimeout(() => {
  intro.value = false
}, 2000)
onBeforeUnmount(() => clearTimeout(introTimer))

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
    (prompt.value.trim() ? guessLayout(prompt.value) : 'portfolio'),
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
    return '你的网站，从这一句开始'
  }
  return firstClause(text)
})

const handleFocusIn = (e: FocusEvent) => {
  composing.value = (e.target as HTMLElement).tagName === 'TEXTAREA'
}

const handlePreview = (key: PresetKey | null) => {
  previewPreset.value = key
}

const applyPreset = (key: PresetKey) => {
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
  prompt.value = val
  if (activePreset.value) {
    const preset = PRESETS.find((p) => p.key === activePreset.value)
    if (preset && val !== preset.prompt) {
      activePreset.value = null
      userCustomDraft.value = ''
    }
  }
}

const savePendingPrompt = (action: 'create' | 'optimize') => {
  sessionStorage.setItem(PENDING_PROMPT_KEY, prompt.value)
  sessionStorage.setItem(PENDING_AGENT_KEY, String(useAgent.value))
  sessionStorage.setItem(PENDING_ACTION_KEY, action)
}

const cancelOptimization = () => {
  optimizationController?.abort()
  optimizationController = null
  optimizing.value = false
  optimization.value = null
}

const handleOptimize = async () => {
  if (optimizing.value || busy.value) return
  const text = prompt.value.trim()
  if (!text) {
    composerRef.value?.triggerInvalid()
    message.warning('先写下你想做的网站')
    composerRef.value?.focus()
    return
  }
  if (prompt.value.length > 5000) {
    message.warning('请将需求控制在 5000 字以内')
    return
  }
  if (!isLoggedIn.value) {
    savePendingPrompt('optimize')
    router.push(`/user/login?redirect=${encodeURIComponent('/')}`)
    return
  }
  const controller = new AbortController()
  optimizationController = controller
  optimizing.value = true
  optimization.value = null
  try {
    const res = await optimizePrompt({ prompt: text, mode: 'create' }, controller.signal)
    if (controller.signal.aborted) return
    if (res.data.code === 0 && res.data.data) {
      optimization.value = res.data.data
    } else {
      // 会话过期时请求封装会跳转登录，保留当前输入及操作意图。
      if (res.data.code === 40100) savePendingPrompt('optimize')
      message.error(res.data.message || '没能优化提示词，请稍后再试。你写的内容还在。')
    }
  } catch {
    if (!controller.signal.aborted) {
      message.error('网络或服务暂时不可用，请稍后再试。你写的内容还在。')
    }
  } finally {
    // 取消后可能已开始下一次请求，旧请求不能清除新请求的加载状态。
    if (optimizationController === controller) {
      optimizationController = null
      optimizing.value = false
    }
  }
}

const applyOptimization = () => {
  const text = optimization.value?.optimizedPrompt.trim()
  if (!text || text.length > 5000 || busy.value || optimizing.value) return
  handlePromptUpdate(text)
  optimization.value = null
  composerRef.value?.focus()
  message.success('已放回输入框。再改改也行，满意了再点“生成”。')
}

onBeforeUnmount(cancelOptimization)

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
  if (busy.value || optimizing.value) return
  const text = prompt.value.trim()
  if (!text) {
    composerRef.value?.triggerInvalid()
    message.warning('先写下你想做的网站')
    composerRef.value?.focus()
    return
  }
  if (!isLoggedIn.value) {
    savePendingPrompt('create')
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
      sessionStorage.removeItem(PENDING_ACTION_KEY)
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
  const pendingAction = sessionStorage.getItem(PENDING_ACTION_KEY)
  if (pendingPrompt) {
    prompt.value = pendingPrompt
    userCustomDraft.value = pendingPrompt
    if (pendingAgent !== null) {
      useAgent.value = pendingAgent === 'true'
    }
    sessionStorage.removeItem(PENDING_PROMPT_KEY)
    sessionStorage.removeItem(PENDING_AGENT_KEY)
    sessionStorage.removeItem(PENDING_ACTION_KEY)
    if (isLoggedIn.value && pendingAction !== 'optimize') handleSubmit()
  }

  if (isLoggedIn.value) mine.load()
  featured.load()
})
</script>

<template>
  <div class="home">
    <div class="hero-bed">
      <section class="page hero" :class="{ 'is-intro': intro }">
        <header class="hero-heading">
          <h1
            ref="titleRef"
            class="hero-title"
            :class="{ 'is-printing': printing, 'is-locking': locking }"
          >
            <span
              v-for="(line, i) in TITLE_LINES"
              :key="line"
              class="title-line"
              :style="{ '--i': i }"
            >
              <span class="drum drum--yellow" aria-hidden="true">{{ line }}</span>
              <span class="drum drum--blue" aria-hidden="true">{{ line }}</span>
              <span class="drum drum--pink" aria-hidden="true">{{ line }}</span>
              <span class="key">{{ line }}</span>
            </span>
          </h1>
          <p class="hero-lead">把想法写下来，边生成边预览。继续修改，满意后一键上线。</p>
        </header>
        <div class="hero-main">
          <p v-if="prompt.trim()" class="proof-strip" aria-hidden="true">
            <span class="proof-strip-label">样张</span>
            <span class="proof-strip-title">{{ proofTitle }}</span>
          </p>
          <PromptComposer
            ref="composerRef"
            :model-value="prompt"
            v-model:agent="useAgent"
            :submitting="busy"
            :optimizing="optimizing"
            :optimization="optimization"
            :needs-login="!isLoggedIn"
            :active-preset="activePreset"
            :has-draft="hasDraft"
            @update:model-value="handlePromptUpdate"
            @preset="applyPreset"
            @restore-draft="handleRestoreDraft"
            @preview="handlePreview"
            @submit="handleSubmit"
            @optimize="handleOptimize"
            @apply-optimization="applyOptimization"
            @cancel-optimization="cancelOptimization"
            @focusin="handleFocusIn"
            @focusout="composing = false"
          />
        </div>

        <div class="hero-side">
          <ProofSheet
            :title="proofTitle"
            :layout="proofLayout"
            :printing="printing"
            :composing="composing"
          />
        </div>
      </section>
      <div class="hero-bottom page">
        <ol class="steps">
          <li v-for="(step, i) in STEPS" :key="step.title" class="step">
            <span class="step-no" :class="`tone-${step.tone}`">
              <span class="step-digits">0{{ i + 1 }}</span>
            </span>
            <span class="step-copy">
              <strong>{{ step.title }}</strong>
              <span>{{ step.desc }}</span>
            </span>
            <svg
              v-if="i < STEPS.length - 1"
              class="step-arrow"
              viewBox="0 0 44 14"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="1"
                y1="7"
                x2="36"
                y2="7"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-dasharray="3 3"
              />
              <path
                d="M33 2.5 L40 7 L33 11.5"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </li>
        </ol>
        <a class="explore-link" href="#home-works">
          精选作品
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M10 3v13m-5-5 5 5 5-5" />
          </svg>
        </a>
      </div>
    </div>

    <div id="home-works" class="page shelves">
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
            <p class="empty-desc">从上面写下一个想法开始，你创建的网站会保存在这里。</p>
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
/* 样张背后的色块会越出栏宽，横向裁掉避免出现横向滚动条 */
.home {
  overflow-x: clip;
}

.hero-bed {
  position: relative;
  min-height: calc(100svh - var(--header-h));
  display: flex;
  flex-direction: column;
}

.hero {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.06fr);
  column-gap: clamp(28px, 3.6vw, 52px);
  row-gap: clamp(22px, 3.4vh, 34px);
  align-items: start;
  align-content: center;
  padding-top: clamp(14px, 2.6vh, 30px);
  padding-bottom: 12px;
}

/* 标题按左栏宽度定字号（cqi）：黄油体字宽约 0.75em，第二行九个字不超出一栏 */
.hero-heading {
  grid-area: 1 / 1;
  min-width: 0;
  container-type: inline-size;
}

.hero-main {
  grid-area: 2 / 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-title {
  --px: 0;
  --py: 0;

  font-size: clamp(32px, 14.5cqi, 88px);
  line-height: 1.02;
  letter-spacing: -0.02em;
}

/* flow-root 阻止墨版的负外边距折叠出去，保证专色版与墨版逐像素同位 */
.title-line {
  position: relative;
  isolation: isolate;
  display: flow-root;
  width: fit-content;
  white-space: nowrap;
}

/* 墨版：像墨辊一样自左向右滚过整行；上下留出余量，避免裁掉字形 */
.key {
  display: block;
  margin-block: -0.12em;
  padding-block: 0.12em;
  animation: key-roll 860ms var(--ease-in-out) backwards;
  animation-delay: calc(380ms + var(--i) * 150ms);
}

/* 专色版：与墨版同字同位、正片叠底，入场时从错位处汇入套准，粉版留一丝套印误差 */
.drum {
  position: absolute;
  inset: 0;
  z-index: -1;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
}

.drum--yellow {
  color: var(--yellow);
  opacity: 0;
  animation: drum-yellow 1300ms var(--ease-out) both;
  animation-delay: calc(var(--i) * 150ms);
}

.drum--blue {
  color: var(--blue);
  opacity: 0;
  animation: drum-blue 1300ms var(--ease-out) both;
  animation-delay: calc(90ms + var(--i) * 150ms);
}

.drum--pink {
  color: var(--pink);
  translate: calc(0.026em + var(--px) * 4px) calc(0.022em + var(--py) * 3px);
  animation: drum-pink 1150ms var(--ease-out) both;
  animation-delay: calc(170ms + var(--i) * 150ms);
}

/* 生成中：三块专色版随滚筒来回错位；跳转前全部归位套准 */
.hero-title.is-printing .drum {
  opacity: 1;
  animation: drum-run 420ms var(--ease-in-out) infinite alternate;
}

.hero-title.is-printing .drum--yellow {
  --dx: -0.06em;
  --dy: 0.05em;
}

.hero-title.is-printing .drum--blue {
  --dx: 0.06em;
  --dy: -0.04em;

  animation-delay: -140ms;
}

.hero-title.is-printing .drum--pink {
  --dx: 0.03em;
  --dy: 0.06em;

  animation-delay: -280ms;
}

.hero-title.is-locking .drum {
  opacity: 0;
  translate: 0 0;
  animation: none;
  transition:
    opacity 200ms var(--ease-out),
    translate 140ms var(--ease-out);
}

@keyframes key-roll {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes drum-yellow {
  0% {
    opacity: 0;
    transform: translate(-0.18em, 0.16em);
  }

  30% {
    opacity: 1;
  }

  70% {
    opacity: 1;
    transform: none;
  }

  100% {
    opacity: 0;
    transform: none;
  }
}

@keyframes drum-blue {
  0% {
    opacity: 0;
    transform: translate(0.2em, -0.12em);
  }

  30% {
    opacity: 1;
  }

  70% {
    opacity: 1;
    transform: none;
  }

  100% {
    opacity: 0;
    transform: none;
  }
}

@keyframes drum-pink {
  0% {
    opacity: 0;
    transform: translate(0.1em, 0.24em);
  }

  35% {
    opacity: 1;
  }

  100% {
    opacity: 1;
    transform: none;
  }
}

@keyframes drum-run {
  from {
    transform: translate(var(--dx), var(--dy));
  }

  to {
    transform: translate(calc(var(--dx) * -0.5), calc(var(--dy) * 0.4));
  }
}

.hero-lead {
  max-width: 32em;
  margin-top: clamp(16px, 2.4vh, 24px);
  font-size: clamp(16px, 1.25vw, 18px);
  line-height: 1.6;
  color: var(--ink);
}

/* 样张跨标题与输入两行，和左栏整体居中对齐 */
.hero-side {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  min-width: 0;
}

/* 墨版印完后，导语、输入区、样张依次落版 */
.hero-lead,
.hero-main,
.hero-side,
.hero-bottom > * {
  animation: rise 820ms var(--ease-out) backwards;
}

.hero-lead {
  animation-delay: 640ms;
}

.hero-main {
  animation-delay: 720ms;
}

.hero-side {
  animation-delay: 820ms;
}

.hero-bottom > * {
  animation-delay: 1000ms;
}

.hero.is-intro .hero-side {
  --proof-delay: 1000ms;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
}

.hero-main :deep(.composer-input) {
  min-height: 150px;
}

.hero-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding-block: 14px 30px;
  color: var(--ink-3);
  font-size: 12px;
}

.steps {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 18px;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.step-arrow {
  width: 44px;
  height: 14px;
  margin-inline: auto;
  flex-shrink: 0;
  color: var(--ink-2);
}

.step-no {
  position: relative;
  isolation: isolate;
  flex-shrink: 0;
  font-family: var(--font-wide);
  font-weight: 900;
  font-stretch: 88%;
  font-size: 46px;
  letter-spacing: -0.05em;
  line-height: 0.92;
  color: var(--ink);
}

.step-digits {
  display: inline-block;
  transform: skewX(-10deg);
}

.step-no::after {
  content: '';
  position: absolute;
  left: -5px;
  right: -7px;
  bottom: 1px;
  height: 36%;
  z-index: -1;
  transform: skewX(-12deg);
  mix-blend-mode: multiply;
}

.step-no.tone-yellow::after {
  background: var(--yellow);
}

.step-no.tone-pink::after {
  background: var(--pink);
}

.step-no.tone-blue::after {
  background: var(--blue);
}

.step-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.step-copy strong {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}

.step-copy span {
  font-size: 13px;
  color: var(--ink-2);
}

.explore-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  color: var(--ink-2);
}

.explore-link svg {
  width: 18px;
  height: 18px;
  transition: transform 320ms var(--ease-out);
}

.explore-link:hover svg {
  transform: translateY(3px);
}

.shelves {
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding-top: 48px;
  padding-bottom: 32px;
  scroll-margin-top: calc(var(--header-h) + 24px);
  border-top: 1px solid var(--rule);
}

.empty-mine {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 28px 32px;
  border-radius: var(--radius);
  background: var(--paper-2);
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
  padding: 28px 24px;
  border: 1.5px dashed var(--ink-4);
  border-radius: var(--radius);
  color: var(--ink-3);
}

.proof-strip {
  display: none;
}

@media (max-width: 1080px) {
  .hero {
    column-gap: 40px;
  }
}

@media (max-width: 900px) {
  .hero-title {
    font-size: clamp(32px, 11cqi, 64px);
  }

  .hero {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .hero-side {
    grid-area: 3 / 1;
    max-width: 440px;
    margin: 0 auto;
    width: 100%;
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
}

@media (max-width: 560px) {
  .hero {
    gap: 24px;
    padding-top: 28px;
    padding-bottom: 44px;
  }

  .hero-main :deep(.composer-input) {
    min-height: 120px;
  }

  .hero-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .steps {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .step-arrow {
    display: none;
  }

  .step-no {
    width: 52px;
    font-size: 36px;
  }

  .explore-link {
    align-self: center;
  }

  .hero-side {
    padding-top: 0;
  }

  .hero-lead {
    margin-top: 14px;
    font-size: 15px;
  }

  .shelves {
    gap: 44px;
  }
}

/* 减弱动态效果：全局已把动画时长压到近零，这里再去掉入场延迟，内容直接出现 */
@media (prefers-reduced-motion: reduce) {
  .key,
  .drum,
  .hero-lead,
  .hero-main,
  .hero-side,
  .hero-bottom > * {
    animation-delay: 0ms !important;
  }

  .hero.is-intro .hero-side {
    --proof-delay: 0ms;
  }
}
</style>
