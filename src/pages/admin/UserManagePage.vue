<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { listUserVoByPage, addUser, updateUser, deleteUser } from '@/api/userController'
import { useAdminTable } from '@/composables/useAdminTable'
import { formatDate } from '@/utils/formatDate'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AdminSearchPanel from '@/components/admin/AdminSearchPanel.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import { ref } from 'vue'

// --- 列表查询与分页 ---
const searchParams = reactive<API.UserQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  userAccount: '',
  userName: '',
  userRole: undefined,
})

const { loading, dataList, total, fetchData, handleSearch, handleReset, handlePageChange } =
  useAdminTable<API.UserVO, API.UserQueryRequest>(
    searchParams,
    async (params) => {
      const res = await listUserVoByPage({ ...params })
      if (res.data?.code !== 0) {
        message.error(res.data?.message || '获取用户列表失败')
      }
      return { records: res.data?.data?.records, total: res.data?.data?.totalRow }
    },
    () => {
      searchParams.userAccount = ''
      searchParams.userName = ''
      searchParams.userRole = undefined
    },
  )

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 210 },
  { title: '账号', dataIndex: 'userAccount', key: 'userAccount' },
  { title: '用户名', dataIndex: 'userName', key: 'userName' },
  { title: '头像', dataIndex: 'userAvatar', key: 'userAvatar', width: 80 },
  { title: '简介', dataIndex: 'userProfile', key: 'userProfile', ellipsis: true },
  { title: '角色', dataIndex: 'userRole', key: 'userRole', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="user-manage-page">
    <!-- 页头：标题 + 新建按钮 -->
    <AdminPageHeader title="用户管理看板" subtitle="管理系统用户、角色分配以及状态监控">
      <a-button type="primary" size="large" class="action-btn" @click="openAddModal">
        <template #icon><PlusOutlined /></template>
        新建用户
      </a-button>
    </AdminPageHeader>

    <!-- 搜索筛选区域 -->
    <AdminSearchPanel>
      <a-form layout="inline" :model="searchParams">
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
    </AdminSearchPanel>

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
        <template #bodyCell="{ column, record }">
          <!-- 头像渲染 -->
          <template v-if="column.key === 'userAvatar'">
            <a-avatar :src="record.userAvatar" :size="32" style="border: 1px solid rgba(15, 23, 42, 0.08);">
              <template #icon><UserOutlined /></template>
            </a-avatar>
          </template>

          <!-- 角色渲染 -->
          <template v-else-if="column.key === 'userRole'">
            <a-tag v-if="record.userRole === 'admin'" color="blue" class="role-tag">管理员</a-tag>
            <a-tag v-else class="role-tag">普通用户</a-tag>
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
              <a-button type="link" size="small" class="edit-link" @click="openEditModal(record)">
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
      <AdminPagination
        :total="total"
        :current="searchParams.pageNum!"
        :page-size="searchParams.pageSize!"
        @change="handlePageChange"
        @update:current="searchParams.pageNum = $event"
        @update:page-size="searchParams.pageSize = $event"
      />
    </div>

    <!-- 新建/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitLoading"
      destroy-on-close
      width="520px"
      @ok="handleModalSubmit"
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

.table-container {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  color: #262626;
}

.glow-avatar-wrapper {
  padding: 2px;
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

@media (max-width: 768px) {
  .action-btn {
    width: 100%;
  }
}
</style>
