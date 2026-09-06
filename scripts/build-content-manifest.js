/*
 * @Author: trae+deepseek-v4-pro
 * @Date: 2026-09-05
 * @Desc: 内容仓 Manifest 生成脚本
 *   - 扫描 posts/ 目录下所有 .md 文件
 *   - 解析 Frontmatter 元数据（不含正文）
 *   - 生成 posts-index.json / categories.json / tags.json / changed-slugs.json
 *   - 用于网站仓构建时按制品消费内容，避免运行时远程拉取
 *
 * 用法: node scripts/build-content-manifest.js
 * 输出: manifests/ 目录下的制品文件
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
/*
 * @Modify: 2026-09-06, Bug 修复 — 扫描整个 Obsidian Vault
 *   之前仅扫描 posts/ 子目录，导致 vault 中其他目录的文章
 *   （dream/、Exploration and Reflection/ 等）无法被索引。
 *   现在扫描 vault 根目录下所有 .md 文件，
 *   排除 non-article 目录（common/scripts/manifests/schemas 等）。
 */
const POSTS_DIR = ROOT
/** 不参与文章索引的目录（模板、脚本、配置等） */
const EXCLUDED_DIRS = new Set([
  'common', 'scripts', 'manifests', 'schemas',
  'node_modules', '.git', '.obsidian', 'posts',
  '.trash',
])
const MANIFESTS_DIR = path.join(ROOT, 'manifests')

// ============================================================
// 工具函数
// ============================================================

/** 递归扫描目录下所有 .md 文件，排除 non-article 目录 */
function scanMarkdownFiles(dir, depth = 0) {
  const results = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // 跳过以 . 开头的隐藏目录和排除目录
      if (entry.name.startsWith('.')) continue
      if (depth === 0 && EXCLUDED_DIRS.has(entry.name)) continue
      results.push(...scanMarkdownFiles(fullPath, depth + 1))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * 从文件路径提取 slug 和 category
 * 例如: posts/tech/2024-01-01-hello.md → slug=2024-01-01-hello, category=tech
 */
function parsePath(filePath) {
  const relative = path.relative(POSTS_DIR, filePath)
  const parts = relative.split(path.sep)
  const fileName = parts[parts.length - 1]
  const slug = fileName.replace(/\.md$/, '')
  const category = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
  return { slug, category }
}

/** 格式化日期为 YYYY-MM-DD */
function formatDate(d) {
  if (typeof d === 'string') return d.slice(0, 10)
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return ''
}

// ============================================================
// 主逻辑
// ============================================================

function main() {
  console.log('[manifest] 开始扫描文章目录...')
  const files = scanMarkdownFiles(POSTS_DIR)
  console.log(`[manifest] 发现 ${files.length} 个 .md 文件`)

  if (files.length === 0) {
    console.log('[manifest] 无文章，生成空 Manifest')
    writeEmptyManifests()
    return
  }

  /** @type {Array<{slug: string, category: string, title: string, date: string, updated: string, excerpt: string, tags: string[], draft: boolean, hidden: boolean, pin: number, cover: string, author: string, filePath: string}>} */
  const posts = []
  const categorySet = new Set()
  const tagMap = new Map() // tag → count

  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)
      const { slug, category } = parsePath(filePath)

      const post = {
        slug,
        // 优先使用 Frontmatter 中的 category，目录结构作为兜底
        category: data.category || category || '',
        title: data.title || slug.replace(/-/g, ' '),
        date: data.date ? formatDate(data.date) : '',
        updated: data.updated ? formatDate(data.updated) : '',
        excerpt: data.excerpt || '',
        tags: Array.isArray(data.tags) ? data.tags.filter(t => typeof t === 'string') : [],
        draft: data.draft === true,
        hidden: data.hidden === true,
        pin: typeof data.pin === 'number' ? data.pin : 0,
        cover: data.cover || '',
        author: data.author || '',
        // 保留相对路径，供网站仓按需读取正文
        filePath: path.relative(ROOT, filePath).replace(/\\/g, '/'),
      }

      posts.push(post)
      categorySet.add(post.category || 'uncategorized')
      for (const tag of post.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      }
    } catch (err) {
      console.warn(`[manifest] 解析失败: ${filePath}`, err.message)
    }
  }

  // 按日期降序 + pin 排序
  posts.sort((a, b) => {
    if (a.pin !== b.pin) return b.pin - a.pin
    return b.date.localeCompare(a.date)
  })

  // 确保输出目录存在
  fs.mkdirSync(MANIFESTS_DIR, { recursive: true })

  // 1. posts-index.json — 全部文章元数据（不含正文）
  const indexPath = path.join(MANIFESTS_DIR, 'posts-index.json')
  fs.writeFileSync(indexPath, JSON.stringify(posts, null, 2), 'utf-8')
  console.log(`[manifest] posts-index.json 已生成 (${posts.length} 篇)`)

  // 2. categories.json — 分类及文章数
  const categories = Array.from(categorySet)
    .map(name => {
      const count = posts.filter(p => (p.category || 'uncategorized') === name).length
      return { name, count }
    })
    .sort((a, b) => b.count - a.count)
  const catPath = path.join(MANIFESTS_DIR, 'categories.json')
  fs.writeFileSync(catPath, JSON.stringify(categories, null, 2), 'utf-8')
  console.log(`[manifest] categories.json 已生成 (${categories.length} 个分类)`)

  // 3. tags.json — 标签及文章数
  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const tagPath = path.join(MANIFESTS_DIR, 'tags.json')
  fs.writeFileSync(tagPath, JSON.stringify(tags, null, 2), 'utf-8')
  console.log(`[manifest] tags.json 已生成 (${tags.length} 个标签)`)

  // 4. changed-slugs.json — 变更清单（用于增量构建）
  //    首次运行时为空，后续可通过 git diff 或内容仓 CI 更新
  const changedPath = path.join(MANIFESTS_DIR, 'changed-slugs.json')
  const existingChanged = fs.existsSync(changedPath)
    ? JSON.parse(fs.readFileSync(changedPath, 'utf-8'))
    : []
  fs.writeFileSync(changedPath, JSON.stringify(existingChanged, null, 2), 'utf-8')
  console.log(`[manifest] changed-slugs.json 已保留 (${existingChanged.length} 个变更项)`)

  console.log('[manifest] 完成')
}

/** 无文章时生成空 Manifest */
function writeEmptyManifests() {
  fs.mkdirSync(MANIFESTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(MANIFESTS_DIR, 'posts-index.json'), '[]', 'utf-8')
  fs.writeFileSync(path.join(MANIFESTS_DIR, 'categories.json'), '[]', 'utf-8')
  fs.writeFileSync(path.join(MANIFESTS_DIR, 'tags.json'), '[]', 'utf-8')
  fs.writeFileSync(path.join(MANIFESTS_DIR, 'changed-slugs.json'), '[]', 'utf-8')
}

main()