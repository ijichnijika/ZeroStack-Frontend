<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons-vue'
import { listUserVoByPage, addUser, updateUser, deleteUser } from '@/api/userController'

// --- 列表查询与分页 ---
const loading = ref(false)
const dataList = ref<API.UserVO[]>([])
const total = ref(0)

const searchParams = reactive<API.UserQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  userAccount: '',
  userName: '',
  userRole: undefined,
})

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 210,
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
    key: 'userAccount',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    key: 'userName',
  },
  {
    title: '头像',
    dataIndex: 'userAvatar',
    key: 'userAvatar',
    width: 80,
  },
  {
    title: '简介',
    dataIndex: 'userProfile',
    key: 'userProfile',
    ellipsis: true,
  },
  {
    title: '角色',
    dataIndex: 'userRole',
    key: 'userRole',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listUserVoByPage({
      ...searchParams,
    })
    if (res.data?.code === 0 && res.data?.data) {
      dataList.value = res.data.data.records || []
      total.value = Number(res.data.data.totalRow) || 0
    } else {
      message.error(res.data?.message || '获取用户列表失败')
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
  searchParams.userAccount = ''
  searchParams.userName = ''
  searchParams.userRole = undefined
  searchParams.pageNum = 1
  fetchData()
}

const handlePageChange = (page: number, pageSize: number) => {
  searchParams.pageNum = page
  searchParams.pageSize = pageSize
  fetchData()
}

// --- 删除用户 ---
const handleDelete = async (id: number) => {
  try {
    const res = await deleteUser({ id })
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

// --- 新增 & 编辑弹窗 ---
const modalVisible = ref(false)
const modalTitle = ref('新建用户')
const isEdit = ref(false)
const submitLoading = ref(false)

const formState = reactive({
  id: undefined as number | undefined,
  userAccount: '',
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: 'user',
})

const openAddModal = () => {
  modalTitle.value = '新建用户'
  isEdit.value = false
  formState.id = undefined
  formState.userAccount = ''
  formState.userName = ''
  formState.userAvatar = ''
  formState.userProfile = ''
  formState.userRole = 'user'
  modalVisible.value = true
}

const openEditModal = (record: API.UserVO) => {
  modalTitle.value = '修改用户信息'
  isEdit.value = true
  formState.id = record.id as number
  formState.userAccount = record.userAccount || ''
  formState.userName = record.userName || ''
  formState.userAvatar = record.userAvatar || ''
  formState.userProfile = record.userProfile || ''
  formState.userRole = record.userRole || 'user'
  modalVisible.value = true
}

const handleModalSubmit = async () => {
  if (isEdit.value && !formState.id) return

  submitLoading.value = true
  try {
    let res
    if (isEdit.value) {
      res = await updateUser({
        id: formState.id,
        userName: formState.userName,
        userAvatar: formState.userAvatar,
        userProfile: formState.userProfile,
        userRole: formState.userRole,
      })
    } else {
      res = await addUser({
        userAccount: formState.userAccount,
        userName: formState.userName,
        userAvatar: formState.userAvatar,
        userProfile: formState.userProfile,
        userRole: formState.userRole,
      })
    }

    if (res.data?.code === 0) {
      message.success(isEdit.value ? '修改成功' : '新建成功（默认密码为 12345678）')
      modalVisible.value = false
      fetchData()
    } else {
      message.error(res.data?.message || '操作失败')
    }
  } catch (error: any) {
    message.error(error.message || '网络异常')
  } finally {
    submitLoading.value = false
  }
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
  <div class="user-manage-page">
    <div class="page-header">
      <div class="header-left">
        <h2>用户管理看板</h2>
        <p class="subtitle">管理系统用户、角色分配以及状态监控</p>
      </div>
      <a-button type="primary" size="large" @click="openAddModal" class="action-btn">
        <template #icon><PlusOutlined /></template>
        新建用户
      </a-button>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-panel">
      <a-form layout="inline" :model="searchParams" class="search-form">
        <a-form-item label="账号">
          <a-input v-model:value="searchParams.userAccount" placeholder="请输入账号" allow-clear />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="searchParams.userName" placeholder="请输入用户名" allow-clear />
        </a-form-item>
        <a-form-item label="角色" style="min-width: 150px">
          <a-select v-model:value="searchParams.userRole" placeholder="请选择" allow-clear>
            <a-select-option value="user">普通用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
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
        :scroll="{ x: 1000 }"
        row-key="id"
        class="custom-table glass-table"
      >
        <!-- 头像渲染 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userAvatar'">
            <div class="glow-avatar-wrapper" style="padding: 2px;">
              <a-avatar :src="record.userAvatar" style="border: 2px solid #fff;">
                <template #icon><UserOutlined /></template>
              </a-avatar>
            </div>
          </template>

          <!-- 角色渲染 -->
          <template v-else-if="column.key === 'userRole'">
            <a-tag v-if="record.userRole === 'admin'" color="blue" class="role-tag">管理员</a-tag>
            <a-tag v-else color="gray" class="role-tag">普通用户</a-tag>
          </template>

          <!-- 简介渲染 -->
          <template v-else-if="column.key === 'userProfile'">
            <span>{{ record.userProfile || '暂无简介' }}</span>
          </template>

          <!-- 时间格式化 -->
          <template v-else-if="column.key === 'createTime'">
            <span>{{ formatDate(record.createTime) }}</span>
          </template>

          <!-- 操作栏 -->
          <template v-else-if="column.key === 'action'">
            <a-space size="middle">
              <a-button type="link" size="small" @click="openEditModal(record)" class="edit-link">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除该用户吗？此操作无法撤销"
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

    <!-- 新建/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitLoading"
      @ok="handleModalSubmit"
      destroy-on-close
      width="520px"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item v-if="!isEdit" label="账号" required>
          <a-input v-model:value="formState.userAccount" placeholder="请输入登录账号（不可更改）" />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="formState.userName" placeholder="请输入用户昵称" />
        </a-form-item>
        <a-form-item label="头像地址">
          <a-input v-model:value="formState.userAvatar" placeholder="请输入头像图片 URL" />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea v-model:value="formState.userProfile" placeholder="请输入个人简介" :rows="3" />
        </a-form-item>
        <a-form-item label="分配角色" required>
          <a-radio-group v-model:value="formState.userRole">
            <a-radio value="user">普通用户</a-radio>
            <a-radio value="admin">管理员</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.user-manage-page {
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

.action-btn {
  border-radius: 99px;
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  border: none;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.2);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(24, 144, 255, 0.3);
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

.role-tag {
  border-radius: 4px;
  font-weight: 500;
  padding: 2px 8px;
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

  .action-btn {
    width: 100%;
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
