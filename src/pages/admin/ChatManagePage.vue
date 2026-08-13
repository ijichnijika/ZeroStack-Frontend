<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController'
import { useAdminTable } from '@/composables/useAdminTable'
import { formatDate } from '@/utils/formatDate'
import { cleanEmptyStringParams } from '@/utils/cleanParams'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminSearchPanel from '@/components/admin/AdminSearchPanel.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'

// --- 列表查询与分页 ---
const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  id: undefined,
  appId: undefined,
  userId: undefined,
  messageType: undefined,
  message: undefined,
})

const { loading, dataList, total, fetchData, handleSearch, handleReset, handlePageChange } =
  useAdminTable<API.ChatHistory, API.ChatHistoryQueryRequest>(
    searchParams,
    async (params) => {
      const res = await listAllChatHistoryByPageForAdmin(cleanEmptyStringParams(params))
      if (res.data?.code !== 0) {
        message.error(res.data?.message || '获取对话列表失败')
      }
      return { records: res.data?.data?.records, total: res.data?.data?.totalRow }
    },
    () => {
      searchParams.id = undefined
      searchParams.appId = undefined
      searchParams.userId = undefined
      searchParams.messageType = undefined
      searchParams.message = undefined
    },
  )

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 180, ellipsis: true },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 150 },
  { title: '应用ID', dataIndex: 'appId', key: 'appId', width: 150 },
  { title: '消息类型', dataIndex: 'messageType', key: 'messageType', width: 100 },
  { title: '消息内容', dataIndex: 'message', key: 'message', width: 300, ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
]

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="chat-manage-page">
    <!-- 页头 -->
    <AdminPageHeader title="对话管理看板" subtitle="管理系统内所有对话记录" />

    <!-- 搜索筛选区域 -->
    <AdminSearchPanel>
      <a-form layout="inline" :model="searchParams">
        <a-form-item label="对话ID">
          <a-input v-model:value="searchParams.id" placeholder="请输入对话ID" allow-clear />
        </a-form-item>
        <a-form-item label="用户ID">
          <a-input v-model:value="searchParams.userId" placeholder="请输入用户ID" allow-clear />
        </a-form-item>
        <a-form-item label="应用ID">
          <a-input v-model:value="searchParams.appId" placeholder="请输入应用ID" allow-clear />
        </a-form-item>
        <a-form-item label="消息类型">
          <a-select v-model:value="searchParams.messageType" placeholder="请选择消息类型" style="width: 160px" allow-clear>
            <a-select-option value="user">User</a-select-option>
            <a-select-option value="ai">AI</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="消息内容">
          <a-input v-model:value="searchParams.message" placeholder="请输入消息内容" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </AdminSearchPanel>

    <!-- 数据表格 -->
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        class="custom-table glass-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            <span>{{ formatDate(record.createTime) }}</span>
          </template>
        </template>
      </a-table>

      <!-- 分页组件 -->
      <AdminPagination
        :total="total"
        :current="searchParams.pageNum!"
        :page-size="searchParams.pageSize!"
        @change="handlePageChange"
        @update:current="searchParams.pageNum = $event"
        @update:page-size="searchParams.pageSize = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-manage-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.table-container {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  color: #262626;
}
</style>
