
---

> *2026-08-09 20:48:49*

你说得完全对。我被"博客系统"这个词绑架了，一直在设计一个完整的文章管理系统，而你的初衷只是：**把一段 Markdown 文字变成浏览器里的 HTML**。这是一个单文件、单路径、30 行代码就能完成的事情。

下面是修正后的 `task1.1.1.md`，把之前所有"文章元数据 / 文件名 / 排序 / 列表 / frontmatter / gray-matter / PostMeta"全部砍掉：

---
# 博客模块开发规划 v3（极致删减版）

> 最后更新：2026-08-09 | 作者：trae+glm-5.2
> 设计原则：每一次提交只做一件事，且那件事在浏览器里肉眼可见

---

## 核心原则（凌驾于所有子任务之上）

**当前唯一目标：把 `.md` 文件渲染成 HTML 并在浏览器看到。**

以下内容在本阶段**全部禁止讨论、禁止设计、禁止编码**：
- 文件名约定（`YYYY-MM-DD-slug.md`、`_` 前缀草稿）
- frontmatter 元数据（`title` / `date` / `tags` / `draft`）
- 文章列表页
- 上一篇 / 下一篇导航
- 标签、归档、RSS、sitemap、SEO
- PostMeta 接口、PostsIndex 结构、loaders 数据源切换
- GitHub 同步脚本、虚拟模块、环境变量 `VITE_BLOG_DATA_SOURCE`
- XSS 过滤（html: true 先不开）
- `gray-matter`、`highlight.js`、`xss`、`@tailwindcss/typography`

以上全部在"Markdown 渲染已经跑通"之后再逐一讨论是否有必要。

---

## Step 1：渲染一个 Markdown 文件（目标时长：15 分钟）

### 1.0 装依赖（1 个动作）

```powershell
pnpm add markdown-it
pnpm add -D @types/markdown-it
```

不装 `gray-matter`。不装 `highlight.js`。不装任何其他包。

### 1.1 放一篇示例 Markdown（1 个文件）

新建 `src/content/posts/hello-blog.md`（文件名随意，没有任何命名规则）：

### 1.2 写 Markdown 渲染函数（1 个文件，~15 行）

新建 `src/utils/markdown/parser.ts`：

```ts
/*
 * @Author: trae+glm-5.2
 * @Date: 2026-08-09
 * @Desc: Markdown 渲染器 —— 当前极简版，仅调用 markdown-it 做基础渲染
 */
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,   // 暂不开启，安全第一
  linkify: true,
})

export function renderMarkdown(raw: string): string {
  return md.render(raw)
}
```

### 1.3 写一个调试用的文章详情页（1 个文件）

新建 `src/views/blog/BlogPostView.vue`：

```vue
<!--
  @Author: trae+glm-5.2
  @Date: 2026-08-09
  @Desc: 博客文章详情页 —— Step 1 极简版，硬编码一篇 md，仅验证渲染链路
-->
<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown/parser'

/*
 * ponytail: 当前硬编码导入单篇 md 做验证。
 * 后续改为列表 + 动态 slug 时，这里只需改成 props.slug → 查找原文 → 渲染。
 */
import helloMd from '@/content/posts/hello-blog.md?raw'

const html = computed(() => renderMarkdown(helloMd))
</script>

<template>
  <article class="max-w-3xl mx-auto px-4 py-8">
    <div v-html="html" />
  </article>
</template>
```

### 1.4 加一条路由（修改 1 个已有文件）

在 `src/router/index.ts` 的 `routes` 数组中，`NotFound` 路由之前插入：

```ts
{
  path: '/blog',
  name: 'BlogPost',
  component: () => import('@/views/blog/BlogPostView.vue'),
  meta: { title: 'Blog' },
},
```

### 1.5 跑起来验证（人工检查 3 项）

```powershell
pnpm dev
```

打开 `http://localhost:5173/blog`，确认：

1. **页面不白屏**，能看到 H1 "你好，博客"
2. **关键语法渲染正常**：标题层级、列表、引用块、代码块、链接、表格
3. 修改 `hello-blog.md` 保存后浏览器自动热更新

**这三项全部通过 → Step 1 完成。无需其他验收。**

---

## Step 2（占位，等 Step 1 跑通后再细化）

- 把 `import helloMd from '@/content/posts/hello-blog.md?raw'` 改为根据 URL 参数动态导入
- 决定文件命名和路由规则（但此刻不设计）
- 决定是否需要 frontmatter（但此刻不设计）

---

## 关键约束（避免重蹈覆辙）

| 禁止 | 替代方案 |
|---|---|
| 建 `src/types/post.ts` 定义 PostMeta | 不需要。Step 1 不涉及任何数据结构 |
| 建 `src/composables/usePosts.ts` | 不需要。Step 1 只渲染一篇，一个 import + 一个函数调用 |
| 在 `.env` 加 `VITE_BLOG_DATA_SOURCE` | 不需要。Step 1 只有一种数据来源：硬编码 import |
| 装 `gray-matter` | 不需要。Step 1 的文章没有 frontmatter；如果有人在 md 里误写了 `---`，markdown-it 默认会渲染成 `<hr>`，肉眼可见地不对，届时再加 `matter(content).content` 剥掉 |
| 设计 `renderPost()` 流水线（frontmatter → md.render → image → sanitize） | 不需要。Step 1 只有一个函数：`renderMarkdown(raw) → html` |
| 写自校验 / 自测试脚本 | 不需要。浏览器 `http://localhost:5173/blog` 就是唯一的验收标准 |

---

这份文档现在**删除速度比新增速度快**：砍掉了 PostMeta / PostsIndex / loaders / composables / 虚拟模块 / 环境变量 / gray-matter / frontmatter / 文件名规则 / 同步脚本 / 验收框架 / 自校验脚本 / 六阶段规划 / 熔断表。

如果这份只有 1 个依赖、4 个文件（其中 2 个新建、1 个已有文件插 5 行路由）的规划你认了，下一轮我直接开始写代码。