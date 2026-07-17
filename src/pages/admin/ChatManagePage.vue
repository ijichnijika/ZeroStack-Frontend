<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController'

// --- 列表查询与分页 ---
const loading = ref(false)
const dataList = ref<API.ChatHistory[]>([])
const total = ref(0)

const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  id: undefined,
  appId: undefined,
  userId: undefined,
  messageType: undefined,
  message: undefined,
})

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 180,
    ellipsis: true,
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    key: 'userId',
    width: 150,
  },
  {
    title: '应用ID',
    dataIndex: 'appId',
    key: 'appId',
    width: 150,
  },
  {
    title: '消息类型',
    dataIndex: 'messageType',
    key: 'messageType',
    width: 100,
  },
  {
    title: '消息内容',
    dataIndex: 'message',
    key: 'message',
    width: 300,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150,
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = { ...searchParams }
    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        params[key] = undefined
      }
    })
    const res = await listAllChatHistoryByPageForAdmin(params)
    if (res.data?.code === 0 && res.data?.data) {
      dataList.value = res.data.data.records || []
      total.value = Number(res.data.data.totalRow) || 0
    } else {
      message.error(res.data?.message || '获取对话列表失败')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchParams.id = undefined
  searchParams.appId = undefined
  searchParams.userId = undefined
  searchParams.messageType = undefined
  searchParams.message = undefined
  searchParams.pageNum = 1
  fetchData()
}

const handlePageChange = (page: number, pageSize: number) => {
  searchParams.pageNum = page
  searchParams.pageSize = pageSize
  fetchData()
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="chat-manage-page">
    <div class="page-header">
      <div class="header-left">
        <h2>对话管理看板</h2>
        <p class="subtitle">管理系统内所有对话记录</p>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-panel">
      <a-form layout="inline" :model="searchParams" class="search-form">
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
    </div>

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
      <div class="pagination-wrapper">
        <a-pagination
          v-model:current="searchParams.pageNum"
          v-model:pageSize="searchParams.pageSize"
          :total="total"
          :show-total="(totalNum: number) => `共 ${totalNum} 条记录`"
          show-size-changer
          show-quick-jumper
          @change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-manage-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  padding-bottom: 16px;
}

.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 0;
}

.search-panel {
  background: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
}

.search-form :deep(.ant-form-item) {
  margin-bottom: 12px;
  margin-right: 24px;
}

.search-form :deep(.ant-input),
.search-form :deep(.ant-select-selector) {
  background: rgba(255, 255, 255, 0.45) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.search-form :deep(.ant-input:hover),
.search-form :deep(.ant-select-selector:hover) {
  border-color: #1890ff !important;
}

.table-container {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  color: #262626;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 10;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .search-form :deep(.ant-form-item) {
    margin-right: 0;
    width: 100%;
    margin-bottom: 16px;
  }
  
  .search-form :deep(.ant-form-item-control-input) {
    width: 100%;
  }
}
</style>
