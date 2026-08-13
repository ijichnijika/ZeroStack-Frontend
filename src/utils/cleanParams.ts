/**
 * 请求参数清理工具
 *
 * 为何单独提取：后端接口约定空字符串与 undefined 语义不同，
 * 空字符串会被当作实际过滤条件传入，导致查询结果为空。
 * 原本在 AppManagePage / ChatManagePage 的 fetchData 中
 * 各自用 Object.keys 手动循环清理，此处统一为泛型工具函数。
 */

/**
 * 将对象中所有值为空字符串的属性替换为 undefined
 *
 * @param params - 原始参数对象（不可变操作，返回新对象）
 * @returns 清理后的新对象
 *
 * @example
 * cleanEmptyStringParams({ name: '', age: 18 })
 * // => { name: undefined, age: 18 }
 */
export function cleanEmptyStringParams<T extends Record<string, unknown>>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, value === '' ? undefined : value]),
  ) as T
}
