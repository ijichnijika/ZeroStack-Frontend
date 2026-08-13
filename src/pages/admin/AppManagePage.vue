<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, StarOutlined, AppstoreOutlined, UserOutlined } from '@ant-design/icons-vue'
import { listAppVoByPageByAdmin, deleteAppByAdmin, updateAppByAdmin } from '@/api/appController'
import { useAdminTable } from '@/composables/useAdminTable'
import { formatDate } from '@/utils/formatDate'
import { cleanEmptyStringParams } from '@/utils/cleanParams'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminSearchPanel from '@/components/admin/AdminSearchPanel.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'

const router = useRouter()

// --- 列表查询与分页 ---
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

const { loading, dataList, total, fetchData, handleSearch, handleReset, handlePageChange } =
  useAdminTable<API.AppVO, API.AppQueryRequest>(
    searchParams,
    async (params) => {
      // 清理空字符串，防止后端将 '' 当作实际过滤条件
      const res = await listAppVoByPageByAdmin(cleanEmptyStringParams(params))
      if (res.data?.code !== 0) {
        message.error(res.data?.message || '获取应用列表失败')
      }
      return { records: res.data?.data?.records, total: res.data?.data?.totalRow }
    },
    () => {
      searchParams.appName = undefined
      searchParams.id = undefined
      searchParams.initPrompt = undefined
      searchParams.codeGenType = undefined
      searchParams.deployKey = undefined
      searchParams.userId = undefined
    },
  )

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 180, ellipsis: true },
  { title: '封面', dataIndex: 'cover', key: 'cover', width: 80 },
  { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 250, ellipsis: true },
  { title: '创建者', key: 'creator', width: 150, ellipsis: true },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
  { title: '操作', key: 'action', width: 250 },
]

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

// --- 设为精选（priority=99 为后端约定的精选标志位） ---
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
  router.push(`/app/edit/${id}`)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="app-manage-page">
    <!-- 页头：仅标题，无操作按钮 -->
    <AdminPageHeader title="应用管理看板" subtitle="管理系统内所有应用资源及精选推荐" />

    <!-- 搜索筛选区域 -->
    <AdminSearchPanel>
      <a-form layout="inline" :model="searchParams">
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
              <a-button type="link" size="small" class="edit-link" @click="handleEdit(record.id)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>

              <a-button
                v-if="record.priority !== 99"
                type="link"
                size="small"
                class="feature-link"
                @click="handleSetFeature(record.id)"
              >
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
.app-manage-page {
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

.edit-link {
  color: #1890ff;
}

.edit-link:hover {
  color: #40a9ff;
}

/* 精选按钮使用醒目的金色，与编辑/删除区分 */
.feature-link {
  color: #faad14;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  color: #ff7875;
}
</style>
