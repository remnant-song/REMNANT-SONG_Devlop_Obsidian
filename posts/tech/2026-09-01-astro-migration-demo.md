---
title: 示例文章：Astro 迁移进行中
date: 2026-09-01
updated: 2026-09-06
excerpt: 这是一篇示例文章，用于验证 Astro 内容系统从独立内容仓加载文章的能力。
tags:
  - astro
  - migration
  - demo
category: tech
draft: false
pin: 0
author: Remnant Song
---

## 概述

这篇文章用于验证 Astro 内容系统的以下能力：

1. **内容仓独立**：Markdown 文件存放在独立内容仓库 `REMNANT-SONG_Devlop_Obsidian` 中
2. **Manifest 驱动**：通过 `posts-index.json` 发现文章，按需读取正文
3. **构建期校验**：Zod Schema 在 `astro build` 时校验 Frontmatter 字段
4. **静态渲染**：文章正文由 Astro 原生渲染，不再依赖运行时 `markdown-it`

## 代码块测试

```typescript
// 这是一个 TypeScript 代码块，用于测试 Shiki 高亮
export function hello(name: string): string {
  return `Hello, ${name}!`
}
```

## 任务列表

- [x] 阶段 0：基线确认
- [x] 阶段 1：建立内容制品与同步机制
- [x] 阶段 2：搭建 Astro 骨架
- [ ] 阶段 3：迁移博客内容系统
- [ ] 阶段 4：迁移博客页面

## 引用

> 这不是一次"全部推倒重写"，而是分层迁移 —— ASTRO_MIGRATION_PLAN.md

---

*本文由 Astro Content Loader 自动加载，Frontmatter 经 Zod Schema 校验。*