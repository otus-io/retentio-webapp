// mdx.d.ts
// declare module '*.mdx' {
//   import type { ComponentType } from 'react'

//   // 定义具体的 Frontmatter 结构
//   export interface Frontmatter {
//     title: string
//     sort?: string | number
//     // 你可以根据 docsConfig 里的需求继续添加字段
//   }

//   // 声明默认导出是 React 组件
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const Component: ComponentType<any>
//   export default Component

//   // 声明命名导出 frontmatter
//   export const frontmatter: Frontmatter
// }
