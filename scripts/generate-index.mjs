// scripts/generate-index.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join, relative } from 'path'
import matter from 'gray-matter'

/**
 * Slugify a heading string (matches github-slugger / rehype-slug behavior).
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/\s+/g, '-')
}

const contentDirectory = join(process.cwd(), 'src/content')
const outputDirectory = join(process.cwd(), 'public/search-index')

function collectMdxFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectMdxFiles(fullPath))
    } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

function generateSearchIndex() {
  if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory, { recursive: true })
  }

  const localeDirs = readdirSync(contentDirectory).filter((name) =>
    statSync(join(contentDirectory, name)).isDirectory())

  for (const locale of localeDirs) {
    const localeDir = join(contentDirectory, locale)
    const mdxFiles = collectMdxFiles(localeDir)

    const index = mdxFiles.map((fullPath) => {
      const fileContents = readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const slug = relative(localeDir, fullPath).replace(/\.mdx?$/, '').replace(/\\/g, '/')

      const headingRegex = /^(#{1,6})\s+(.+)$/gm
      const headings = []
      let match
      while ((match = headingRegex.exec(content)) !== null) {
        const text = match[2]
        headings.push({ text, id: slugify(text) })
      }

      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        headings,
      }
    })

    const outputPath = join(outputDirectory, `${locale}.json`)
    writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf8')
    console.log(`✅ [${locale}] ${index.length} entries -> ${outputPath}`)
  }
}

generateSearchIndex()
