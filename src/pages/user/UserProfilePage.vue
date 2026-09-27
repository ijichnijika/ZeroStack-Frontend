<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { UserOutlined, EditOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import PageHead from '@/components/PageHead.vue'

const userStore = useUserStore()
const user = computed(() => userStore.loginUser)
const isAdmin = computed(() => user.value?.userRole === 'admin')
const joined = computed(() => (user.value?.createTime ? dayjs(user.value.createTime).format('YYYY 年 M 月 D 日') : '—'))
</script>

<template>
  <div class="page">
    <PageHead title="个人中心" subtitle="你的账号信息。">
      <router-link to="/user/settings" class="btn btn--ink">
        <EditOutlined />
        修改资料
      </router-link>
    </PageHead>

    <div class="profile">
      <section class="card-face" aria-label="个人名片">
        <span class="face-screen halftone" aria-hidden="true"></span>
        <a-avatar :size="112" :src="user?.userAvatar" class="face-avatar">
          <template #icon><UserOutlined /></template>
        </a-avatar>
        <h2 class="face-name">{{ user?.userName || '还没有昵称' }}</h2>
        <span class="tag" :class="isAdmin ? 'tag--blue' : 'tag--ink'">{{ isAdmin ? '管理员' : '普通用户' }}</span>
      </section>

      <dl class="facts">
        <div class="fact">
          <dt>账号</dt>
          <dd>{{ user?.userAccount || '—' }}</dd>
        </div>
        <div class="fact">
          <dt>简介</dt>
          <dd :class="{ 'is-empty': !user?.userProfile }">
            {{ user?.userProfile || '还没有写简介。在“修改资料”里介绍一下自己吧。' }}
          </dd>
        </div>
        <div class="fact">
          <dt>注册时间</dt>
          <dd class="tabular">{{ joined }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.profile {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 72px);
  align-items: start;
}

.card-face {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 32px 28px 30px;
  border-radius: var(--radius);
  background: var(--pink);
}

.face-screen {
  position: absolute;
  right: -30px;
  top: -20px;
  width: 190px;
  height: 150px;
  color: var(--blue);
  mix-blend-mode: multiply;
  z-index: -1;
}

.face-avatar {
  border: 3px solid var(--ink);
  background: var(--yellow);
  color: var(--ink);
  font-size: 44px;
}

.face-name {
  margin-top: 8px;
  font-size: 38px;
  word-break: break-all;
}

.facts {
  margin: 0;
}

.fact {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--rule);
}

.fact:first-child {
  padding-top: 4px;
}

.fact dt {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-3);
}

.fact dd {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.fact dd.is-empty {
  color: var(--ink-3);
}

@media (max-width: 760px) {
  .profile {
    grid-template-columns: 1fr;
  }

  .fact {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
