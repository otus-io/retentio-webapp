export default function HighlightedText({
  text = '',
  highlight = '',
}: {
  text: string,
  highlight: string
}) {
  if (!highlight.trim()) return <>{text}</>

  // 1. 将搜索词拆分为单字集合，去重并过滤空格
  // 比如 "配置" -> ["配", "置"]
  const chars = Array.from(new Set(highlight.trim().split(''))).filter((c) => c.trim())

  // 2. 构建正则：匹配集合中的任意字符
  // 结果类似 /[配置]/gi
  const regex = new RegExp(`([${chars.join('')}])`, 'gi')

  // 3. 同样使用捕获组拆分
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        // 验证当前分片是否属于我们需要高亮的字符集
        regex.test(part) ? (
          <mark key={i} className="text-white bg-accent">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ))}
    </>
  )
}
