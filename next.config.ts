import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  outputFileTracingIncludes: {
    '/guide/*': ['./content/**/*'],
  },
}

const withNextIntl = createNextIntlPlugin({

})

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // 加入这两个插件，注意顺序
    remarkPlugins: [
      'remark-frontmatter',
      'remark-mdx-frontmatter',
    ],
    rehypePlugins: [
      ['rehype-slug'],
      // ['rehype-autolink-headings', { behavior: 'wrap' }],
    ],
  },
})



export default withNextIntl(withMDX(nextConfig))
