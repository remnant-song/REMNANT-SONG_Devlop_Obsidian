/*
 * @Author: trae+deepseek-v4-pro
 * @Date: 2026-09-05
 * @Desc: 内容校验脚本
 *   - 校验 posts/ 下所有 .md 文件的 Frontmatter 是否合法
 *   - 使用 frontmatter.schema.json 定义的字段约束
 *   - 用于内容仓 CI 中阻止非法内容进入制品
 *
 * 用法: node scripts/validate-content.js
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_DIR = path.join(ROOT, 'posts')
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'frontmatter.schema.json')

// 允许的 Frontmatter 字段（与 schema 保持同步）
const ALLOWED_FIELDS = new Set([
  'title', 'date', 'updated', 'excerpt', 'tags', 'category',
  'draft', 'hidden', 'pin', 'cover', 'author',
  'audio', 'score', 'model', 'attachments',
])

/** 递归扫描 .md 文件 */
function scanMarkdownFiles(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

/** 将 Date 或字符串统一转为 YYYY-MM-DD 格式 */
function formatDate(d) {
  if (typeof d === 'string') return d.slice(0, 10)
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d)
}

function main() {
  const files = scanMarkdownFiles(POSTS_DIR)
  console.log(`[validate] 校验 ${files.length} 篇文章...`)

  let errors = 0
  let warnings = 0

  for (const filePath of files) {
    const relative = path.relative(ROOT, filePath)
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)

      // 检查必需字段
      if (!data.title) {
        console.warn(`[validate] WARN: ${relative} — 缺少 title`)
        warnings++
      }
      if (!data.date) {
        console.warn(`[validate] WARN: ${relative} — 缺少 date`)
        warnings++
      }

      // 检查日期格式（gray-matter 可能将 YAML 日期解析为 Date 对象）
      if (data.date) {
        const dateStr = formatDate(data.date)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          console.error(`[validate] ERR: ${relative} — date 格式错误: ${data.date}`)
          errors++
        }
      }
      if (data.updated) {
        const updatedStr = formatDate(data.updated)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedStr)) {
          console.error(`[validate] ERR: ${relative} — updated 格式错误: ${data.updated}`)
          errors++
        }
      }

      // 检查 tags 类型
      if (data.tags !== undefined && !Array.isArray(data.tags)) {
        console.error(`[validate] ERR: ${relative} — tags 必须是数组`)
        errors++
      }

      // 检查未识别的字段
      for (const key of Object.keys(data)) {
        if (!ALLOWED_FIELDS.has(key)) {
          console.warn(`[validate] WARN: ${relative} — 未知字段 "${key}"（可能拼写错误）`)
          warnings++
        }
      }
    } catch (err) {
      console.error(`[validate] ERR: ${relative} — 文件读取失败: ${err.message}`)
      errors++
    }
  }

  console.log(`[validate] 完成 — ${errors} 个错误, ${warnings} 个警告`)
  if (errors > 0) {
    console.log('[validate] 存在错误，请修正后再生成 Manifest')
    process.exit(1)
  }
}

main()