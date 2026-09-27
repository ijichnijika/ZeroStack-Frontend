import { ref } from 'vue'

type PagedFetcher = (params: API.AppQueryRequest) => Promise<{
  data: API.BaseResponsePageAppVO
}>

/**
 * 首页应用列表（我的 / 精选）的分页加载状态
 */
export function usePagedApps(fetcher: PagedFetcher, pageSize = 8) {
  const list = ref<API.AppVO[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref(false)

  const load = async () => {
    loading.value = true
    error.value = false
    try {
      const res = await fetcher({
        pageNum: page.value,
        pageSize,
        sortField: 'createTime',
        sortOrder: 'descend',
      })
      if (res.data.code === 0 && res.data.data) {
        list.value = res.data.data.records || []
        total.value = Number(res.data.data.totalRow) || 0
      } else {
        error.value = true
      }
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  const goTo = (p: number) => {
    page.value = p
    load()
  }

  return { list, total, page, pageSize, loading, error, load, goTo }
}
