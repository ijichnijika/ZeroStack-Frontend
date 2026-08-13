/**
 * 通用日期格式化工具
 *
 * 为何单独提取：原本 formatDate 函数在三个 Admin 管理页（AppManagePage、
 * ChatManagePage、UserManagePage）中各自重复定义，逻辑完全一致。
 * 集中到此处便于后续统一修改格式（如切换 dayjs 或调整 locale）。
 */

/**
 * 将日期字符串格式化为本地时间字符串
 *
 * @param dateStr - ISO 格式的日期字符串（如 "2024-01-01T00:00:00"），可为 undefined
 * @returns 格式化后的本地时间字符串，若入参为空则返回 '-'
 *
 * @example
 * formatDate('2024-06-01T10:30:00') // => "2024/6/1 10:30:00"
 * formatDate(undefined)             // => "-"
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}
