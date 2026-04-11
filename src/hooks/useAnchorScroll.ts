'use client'
// import { useEffect } from 'react'

export default function useAnchorScroll() {
  // useEffect(() => {
  //   const hash = window.location.hash
  //   if (!hash) return

  //   // MDX 内容现在在 SSR HTML 中，浏览器原生 hash 滚动通常已经生效。
  //   // 这里作为补偿：等一帧让布局稳定后再尝试一次滚动，
  //   // 处理图片加载等导致的布局偏移。
  //   const raf = requestAnimationFrame(() => {
  //     const element = document.querySelector(hash)
  //     if (element) {
  //       element.scrollIntoView({ behavior: 'instant' })
  //     }
  //   })

  //   return () => cancelAnimationFrame(raf)
  // }, [])

  return null
}
