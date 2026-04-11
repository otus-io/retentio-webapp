import React from 'react'

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading = ({ level, children, id, className = '', ...props }: HeadingProps) => {
  // 💡 修复点：定义一个具体的标题标签类型，替换掉找不到的 JSX.IntrinsicElements
  type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  // 将动态生成的字符串断言为具体的 HeadingTag 类型
  const Tag = `h${level}` as HeadingTag

  return (
    <Tag
      id={id}
      className={` scroll-mt-20 relative flex items-center ${className}`}
      {...props}
    >
      <span className="group hover:cursor-pointer">
        {children}
        {id && (
          <a
            href={`#${id}`}
            aria-label="Link to section"
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 no-underline"
          >
            #
          </a>
        )}
      </span>

    </Tag>
  )
}
