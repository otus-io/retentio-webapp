import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  outputFileTracingIncludes: {
    '/guide/*': ['./content/**/*'],
  },
  async redirects() {
    return [
      {
        source: '/guide/getting-started',
        destination: '/guide/key-concepts/overview',
        permanent: true,
      },
      {
        source: '/guide/key-concepts',
        destination: '/guide/key-concepts/overview',
        permanent: true,
      },
      {
        source: '/guide/key-concepts/summary',
        destination: '/guide/key-concepts/overview',
        permanent: true,
      },
      {
        source: '/guide/getting-started/field-image-and-audio',
        destination: '/guide/key-concepts/facts',
        permanent: true,
      },
      {
        source: '/guide/getting-started/:path*',
        destination: '/guide/key-concepts/:path*',
        permanent: true,
      },
      {
        source: '/guide/studying',
        destination: '/guide/get-started/start-studying',
        permanent: true,
      },
      {
        source: '/guide/studying/:path*',
        destination: '/guide/get-started/:path*',
        permanent: true,
      },
      {
        source: '/guide/get-started/how-to-start',
        destination: '/guide/get-started/create-your-deck',
        permanent: true,
      },
      {
        source: '/guide/get-started/show-answer',
        destination: '/guide/get-started/start-studying',
        permanent: true,
      },
      {
        source: '/guide/get-started/hard-or-easy',
        destination: '/guide/get-started/start-studying',
        permanent: true,
      },
      {
        source: '/guide/get-started/study',
        destination: '/guide/get-started/start-studying',
        permanent: true,
      },
      {
        source: '/guide/key-concepts/login-registration',
        destination: '/guide/get-started/login-registration',
        permanent: true,
      },
      {
        source: '/guide/adding-editing/:path*',
        destination: '/guide/get-started/create-your-deck',
        permanent: true,
      },
      {
        source: '/guide/importing/:path*',
        destination: '/guide/get-started/:path*',
        permanent: true,
      },
      {
        source: '/guide/get-started/importing-from-the-web',
        destination: '/guide/get-started/import-an-existing-deck',
        permanent: true,
      },
      {
        source: '/guide/profile/:path*',
        destination: '/guide',
        permanent: true,
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin({

})

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [
      'remark-frontmatter',
      'remark-mdx-frontmatter',
      'remark-gfm',
    ],
    rehypePlugins: [
      ['rehype-slug'],
      // ['rehype-autolink-headings', { behavior: 'wrap' }],
    ],
  },
})



export default withNextIntl(withMDX(nextConfig))
