<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, StarOutlined, AppstoreOutlined, UserOutlined } from '@ant-design/icons-vue'
import { listAppVoByPageByAdmin, deleteAppByAdmin, updateAppByAdmin } from '@/api/appController'

const router = useRouter()

// --- 列表查询与分页 ---
const loading = ref(false)
const dataList = ref<API.AppVO[]>([])
const total = ref(0)

const searchParams = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  appName: undefined,
  id: undefined,
  initPrompt: undefined,
  codeGenType: undefined,
  deployKey: undefined,
  userId: undefined,
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
    title: '封面',
    dataIndex: 'cover',
    key: 'cover',
    width: 80,
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
    key: 'appName',
    width: 250,
    ellipsis: true,
  },
  {
    title: '创建者',
    key: 'creator',
    width: 150,
    ellipsis: true,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
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
    const res = await listAppVoByPageByAdmin(params)
    if (res.data?.code === 0 && res.data?.data) {
      dataList.value = res.data.data.records || []
      total.value = Number(res.data.data.totalRow) || 0
    } else {
      message.error(res.data?.message || '获取应用列表失败')
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
  searchParams.appName = undefined
  searchParams.id = undefined
  searchParams.initPrompt = undefined
  searchParams.codeGenType = undefined
  searchParams.deployKey = undefined
  searchParams.userId = undefined
  searchParams.pageNum = 1
  fetchData()
}

const handlePageChange = (page: number, pageSize: number) => {
  searchParams.pageNum = page
  searchParams.pageSize = pageSize
  fetchData()
}

// --- 删除应用 ---
const handleDelete = async (id: number) => {
  try {
    const res = await deleteAppByAdmin({ id })
    if (res.data?.code === 0) {
      message.success('删除成功')
      fetchData()
    } else {
      message.error(res.data?.message || '删除失败')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常')
  }
}

// --- 设为精选 ---
const handleSetFeature = async (id: number) => {
  try {
    const res = await updateAppByAdmin({ id, priority: 99 })
    if (res.data?.code === 0) {
      message.success('设置精选成功')
      fetchData()
    } else {
      message.error(res.data?.message || '设置精选失败')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常')
  }
}

// --- 编辑跳转 ---
const handleEdit = (id: number) => {
  // 当前页面跳转到应用信息修改页进行编辑
  router.push(`/app/edit/${id}`)
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
  <div class="app-manage-page">
    <div class="page-header">
      <div class="header-left">
        <h2>应用管理看板</h2>
        <p class="subtitle">管理系统内所有应用资源及精选推荐</p>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-panel">
      <a-form layout="inline" :model="searchParams" class="search-form">
        <a-form-item label="应用ID">
          <a-input v-model:value="searchParams.id" placeholder="请输入应用ID" allow-clear />
        </a-form-item>
        <a-form-item label="应用名称">
          <a-input v-model:value="searchParams.appName" placeholder="请输入应用名称" allow-clear />
        </a-form-item>
        <a-form-item label="创建者ID">
          <a-input v-model:value="searchParams.userId" placeholder="请输入创建者ID" allow-clear />
        </a-form-item>
        <a-form-item label="提示词">
          <a-input v-model:value="searchParams.initPrompt" placeholder="请输入提示词" allow-clear />
        </a-form-item>
        <a-form-item label="生成类型">
          <a-select v-model:value="searchParams.codeGenType" placeholder="请选择生成类型" style="width: 160px" allow-clear>
            <a-select-option value="html">原生 HTML 模式</a-select-option>
            <a-select-option value="multi_file">原生多文件模式</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="部署Key">
          <a-input v-model:value="searchParams.deployKey" placeholder="请输入部署Key" allow-clear />
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
          <template v-if="column.key === 'cover'">
            <a-avatar v-if="record.cover" :src="record.cover" shape="square" />
            <a-avatar v-else shape="square">
              <template #icon><AppstoreOutlined /></template>
            </a-avatar>
          </template>

          <template v-else-if="column.key === 'creator'">
            <a-space>
              <a-avatar size="small" :src="record.user?.userAvatar">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span>{{ record.user?.userName || record.user?.userAccount || '未知' }}</span>
            </a-space>
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span>{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space size="middle">
              <a-button type="link" size="small" @click="handleEdit(record.id)" class="edit-link">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              
              <a-button v-if="record.priority !== 99" type="link" size="small" @click="handleSetFeature(record.id)" style="color: #faad14;">
                <template #icon><StarOutlined /></template>
                精选
              </a-button>

              <a-popconfirm
                title="确定要删除该应用吗？此操作无法撤销"
                ok-text="确定"
                cancel-text="取消"
                placement="topRight"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger size="small" class="delete-link">
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
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
.app-manage-page {
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

.edit-link {
  color: #1890ff;
}

.edit-link:hover {
  color: #40a9ff;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  color: #ff7875;
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
