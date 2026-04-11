// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/library',
        '/profile',
      ],
    },
    sitemap: 'https://retentio.vercel.app/sitemap.xml',
  }
}
