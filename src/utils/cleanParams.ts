/**
 * 查询参数过滤工具
 * 后端接口将空字符串视作具体过滤值而非忽略条件；此函数将所有空字符串字段置为 undefined，避免生成无效过滤条件。
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
