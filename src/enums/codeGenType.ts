/**
 * 代码生成类型枚举
 */
export enum CodeGenTypeEnum {
  HTML = 'html',
  MULTI_FILE = 'multi_file',
  VUE_PROJECT = 'vue_project',
}

export type InkName = 'pink' | 'blue' | 'yellow'

/**
 * 代码生成类型配置
 * color 供 antd Tag 使用，ink 为站内专色
 */
export const CODE_GEN_TYPE_CONFIG = {
  [CodeGenTypeEnum.HTML]: {
    label: 'HTML 单页',
    value: CodeGenTypeEnum.HTML,
    color: 'magenta',
    ink: 'pink' as InkName,
  },
  [CodeGenTypeEnum.MULTI_FILE]: {
    label: '多文件站点',
    value: CodeGenTypeEnum.MULTI_FILE,
    color: 'blue',
    ink: 'blue' as InkName,
  },
  [CodeGenTypeEnum.VUE_PROJECT]: {
    label: 'Vue 工程',
    value: CodeGenTypeEnum.VUE_PROJECT,
    color: 'gold',
    ink: 'yellow' as InkName,
  },
}

export function getCodeGenTypeConfig(type?: string) {
  if (!type) return undefined
  return CODE_GEN_TYPE_CONFIG[type as CodeGenTypeEnum]
}
