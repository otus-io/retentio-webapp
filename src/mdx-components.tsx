import { Heading } from '@/components/MDX/Heading'
import type { MDXComponents } from 'mdx/types'

function isExternalHref(href: string | undefined): boolean {
  if (!href) return false
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')
  )
}

const components: MDXComponents = {
  h1: (props) => <Heading level={1} {...props} />,
  h2: (props) => <Heading level={2} {...props} />,
  h3: (props) => <Heading level={3} {...props} />,
  h4: (props) => <Heading level={4} {...props} />,
  h5: (props) => <Heading level={5} {...props} />,
  h6: (props) => <Heading level={6} {...props} />,
  a: ({ href, target, rel, ...props }) =>
    isExternalHref(href)
      ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
      )
      : (
        <a href={href} target={target} rel={rel} {...props} />
      ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
