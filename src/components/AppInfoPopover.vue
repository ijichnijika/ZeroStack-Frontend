<script setup lang="ts">
import { computed } from 'vue'
import { UserOutlined, EditOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { getCodeGenTypeConfig } from '@/enums/codeGenType'
import { getDeployUrl } from '@/config/env'

const props = defineProps<{
  appInfo?: API.AppVO
  canManage: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

const typeConfig = computed(() => getCodeGenTypeConfig(props.appInfo?.codeGenType))
const fmt = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '—')
</script>

<template>
  <a-popover placement="bottomRight" trigger="click" :arrow="false">
    <template #content>
      <div class="info">
        <div class="info-creator">
          <a-avatar :size="32" :src="appInfo?.user?.userAvatar" class="creator-avatar">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <div>
            <p class="creator-name">{{ appInfo?.user?.userName || appInfo?.user?.userAccount || '未知作者' }}</p>
            <p class="creator-sub">创建于 {{ fmt(appInfo?.createTime) }}</p>
          </div>
        </div>
        <dl class="info-list">
          <div>
            <dt>生成类型</dt>
            <dd>
              <span v-if="typeConfig" class="tag" :class="`tag--${typeConfig.ink}`">{{ typeConfig.label }}</span>
              <span v-else>尚未生成</span>
            </dd>
          </div>
          <div>
            <dt>部署地址</dt>
            <dd>
              <a v-if="appInfo?.deployKey" :href="getDeployUrl(appInfo.deployKey)" target="_blank" rel="noopener">
                /{{ appInfo.deployKey }}
              </a>
              <span v-else>未部署</span>
            </dd>
          </div>
        </dl>
        <div v-if="canManage" class="info-actions">
          <button type="button" class="btn btn--quiet btn--sm" @click="emit('edit')">
            <EditOutlined />
            编辑信息
          </button>
          <a-popconfirm
            title="删除后无法恢复，确定删除这个应用吗？"
            ok-text="删除"
            cancel-text="取消"
            :ok-button-props="{ danger: true }"
            @confirm="emit('delete')"
          >
            <button type="button" class="btn btn--danger btn--sm">
              <DeleteOutlined />
              删除
            </button>
          </a-popconfirm>
        </div>
      </div>
    </template>
    <button type="button" class="btn btn--quiet btn--icon btn--sm" aria-label="应用详情" title="应用详情">
      <EllipsisOutlined />
    </button>
  </a-popover>
</template>

<style scoped>
.info {
  width: 268px;
  padding: 4px;
}

.info-creator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rule);
}

.creator-avatar {
  background: var(--pink);
  color: var(--ink);
}

.creator-name {
  font-weight: 700;
}

.creator-sub {
  font-size: 12px;
  color: var(--ink-3);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 14px 0 0;
}

.info-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.info-list dt {
  color: var(--ink-3);
}

.info-list dd {
  margin: 0;
  font-weight: 600;
}

.info-actions {
  display: flex;
  gap: 4px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--rule);
}
</style>
