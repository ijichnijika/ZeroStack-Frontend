import { ref, reactive } from 'vue'

/**
 * Admin 管理页分页查询通用 Composable
 *
 * 为何提取：三个管理页（AppManagePage / ChatManagePage / UserManagePage）
 * 的分页查询模式完全一致——相同的 loading/dataList/total 状态、
 * 相同的 handleSearch / handleReset / handlePageChange 触发器。
 * 将这个骨架抽离后，各页面只需关注自己的「搜索参数」和「数据获取函数」即可。
 *
 * @template TRecord - 列表数据项的类型
 * @template TParams - 查询参数对象的类型，必须包含 pageNum 和 pageSize
 *
 * @example
 * ```ts
 * const { loading, dataList, total, handleSearch, handleReset, handlePageChange, fetchData } =
 *   useAdminTable<API.UserVO, API.UserQueryRequest>(
 *     searchParams,
 *     async (params) => {
 *       const res = await listUserVoByPage(params)
 *       return { records: res.data.data?.records, total: res.data.data?.totalRow }
 *     },
 *     () => {
 *       searchParams.userAccount = ''
 *       searchParams.userName = ''
 *       searchParams.userRole = undefined
 *     }
 *   )
 * ```
 */

/** 数据获取函数的标准返回格式 */
export interface FetchResult<T> {
  records: T[] | undefined
  total: number | string | undefined
}

/**
 * @param searchParams - 响应式的查询参数对象（reactive），内部会修改 pageNum/pageSize
 * @param fetcher - 实际调用接口的函数，入参为当前 searchParams，返回 FetchResult
 * @param resetFields - 重置搜索条件的回调，由各页面自行定义需要清空哪些字段
 */
export function useAdminTable<
  TRecord,
  TParams extends { pageNum?: number; pageSize?: number },
>(
  searchParams: TParams,
  fetcher: (params: TParams) => Promise<FetchResult<TRecord>>,
  resetFields: () => void,
) {
  const loading = ref(false)
  const dataList = ref<TRecord[]>([])
  const total = ref(0)

  /**
   * 发起一次数据查询
   * 错误由 fetcher 内部处理（展示 message），此处只维护 loading 状态
   */
  const fetchData = async () => {
    loading.value = true
    try {
      const result = await fetcher(searchParams)
      dataList.value = (result.records ?? []) as TRecord[]
      total.value = Number(result.total) || 0
    } finally {
      loading.value = false
    }
  }

  /** 点击「查询」：回到第一页后重新加载 */
  const handleSearch = () => {
    searchParams.pageNum = 1
    fetchData()
  }

  /** 点击「重置」：清空字段、回到第一页后重新加载 */
  const handleReset = () => {
    resetFields()
    searchParams.pageNum = 1
    fetchData()
  }

  /** 分页变化时同步参数并重新加载 */
  const handlePageChange = (page: number, pageSize: number) => {
    searchParams.pageNum = page
    searchParams.pageSize = pageSize
    fetchData()
  }

  return {
    loading,
    dataList,
    total,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
  }
}
