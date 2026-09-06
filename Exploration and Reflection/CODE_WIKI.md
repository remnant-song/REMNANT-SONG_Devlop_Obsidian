# Remnant Song Web — Code Wiki

> 本文档是 `remnant-song-web` 项目的完整代码知识库，涵盖项目架构、模块职责、关键函数、依赖关系与运行方式。
> 更新日期：2026-09-06

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [整体架构](#3-整体架构)
4. [目录结构](#4-目录结构)
5. [配置文件详解](#5-配置文件详解)
6. [核心模块说明](#6-核心模块说明)
   - [6.1 i18n 国际化](#61-i18n-国际化)
   - [6.2 内容加载器与 Content Collection](#62-内容加载器与-content-collection)
   - [6.3 博客系统](#63-博客系统)
   - [6.4 搜索系统](#64-搜索系统)
   - [6.5 布局与导航](#65-布局与导航)
   - [6.6 Vue Island 交互](#66-vue-island-交互)
   - [6.7 Markdown 渲染](#67-markdown-渲染)
   - [6.8 富媒体组件](#68-富媒体组件)
7. [关键函数与类型](#7-关键函数与类型)
8. [依赖关系图](#8-依赖关系图)
9. [项目运行方式](#9-项目运行方式)
10. [构建产物与部署](#10-构建产物与部署)
11. [已知约束与遗留事项](#11-已知约束与遗留事项)

---

## 1. 项目概述

**Remnant Song（残响之歌）** 是一个个人博客与创意空间网站，探索音乐、代码与视觉艺术的交汇。

项目经历了从 **Vue 3 + Vite SPA** 到 **Astro 静态站点** 的架构迁移，当前为 **Astro 7 + Vue 3 Islands** 架构：

- **静态页面**（博客列表、详情、404）：纯 Astro 渲染，0KB 客户端 JS
- **交互页面**（首页 WebGL 背景、传送门 GSAP 房间）：通过 Vue Island 按需加载
- **内容源**：独立的 Obsidian Vault 内容仓库，通过自定义 Content Loader 注入
- **国际化**：中文为默认路径（无前缀），英文使用 `/en/` 前缀，语言切换通过整页导航实现

---

## 2. 技术栈与依赖

### 2.1 运行时依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `astro` | ^7.3.1 | 静态站点生成框架（核心） |
| `@astrojs/vue` | ^7.0.2 | Vue Island 集成 |
| `@astrojs/mdx` | ^8.0.0 | MDX 富媒体内容支持 |
| `@astrojs/tailwind` | ^6.0.2 | Tailwind CSS 集成 |
| `@astrojs/sitemap` | ^3.7.4 | 自动生成 sitemap.xml |
| `@astrojs/rss` | ^4.0.19 | RSS Feed 生成 |
| `@astrojs/markdown-remark` | ^7.3.0 | Markdown remark 处理 |
| `vue` | ^3.5.34 | 交互岛组件 |
| `vue-i18n` | ^9.13.0 | Vue Island 内 i18n（语言切换按钮） |
| `pinia` | ^2.2.0 | Vue Island 状态管理 |
| `gsap` | ^3.12.0 | 传送门视差动画 |
| `three` | ^0.160.0 | 3D 渲染（预留） |
| `markdown-it` | ^15.0.0 | Markdown 渲染引擎（当前过渡方案） |
| `highlight.js` | ^11.11.1 | 代码语法高亮 |
| `@mdit/plugin-*` | 21 个插件 | Markdown 扩展（emoji、脚注、任务列表等） |
| `github-markdown-css` | ^5.9.0 | Markdown 主题样式 |
| `gray-matter` | ^4.0.3 | Frontmatter 解析（devDependency，被 loader 使用） |

### 2.2 开发依赖

| 依赖 | 用途 |
|------|------|
| `typescript` ~6.0.2 | 类型系统 |
| `vue-tsc` | Vue 类型检查 |
| `tailwindcss` / `postcss` / `autoprefixer` | 样式处理 |
| `vite` | 构建工具（由 Astro 内部使用） |
| `isomorphic-dompurify` | XSS 防护（预留） |

### 2.3 包管理器

- `pnpm@11.20.0`（在 `package.json` 的 `packageManager` 字段锁定）

---

## 3. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      浏览器 (Client)                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ 静态 HTML │  │ Vue Island   │  │ 内联 <script>        │   │
│  │ (Astro)  │  │ (按需 hydrate)│  │ (SearchBox 搜索)     │   │
│  └─────┬────┘  └──────┬───────┘  └──────────────────────┘   │
└────────┼──────────────┼──────────────────────────────────────┘
         │              │
         ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Astro 构建时 (Build-time)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages (.astro) → HTML                                │   │
│  │  ├─ index.astro        (首页)                          │   │
│  │  ├─ blog/*             (博客列表/详情/分页/分类)        │   │
│  │  ├─ portal.astro       (传送门)                        │   │
│  │  ├─ 404.astro          (404)                           │   │
│  │  ├─ en/*               (英文镜像)                      │   │
│  │  ├─ rss.xml.ts         (RSS)                           │   │
│  │  └─ search-index.json.ts (搜索索引)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Content Collection (posts)                           │   │
│  │   └─ postsLoader (读取内容仓 posts-index.json + .md)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              内容仓库 (Obsidian Vault)                        │
│   manifests/posts-index.json  (文章元数据清单)               │
│   **/*.md                     (Markdown 正文)                │
└─────────────────────────────────────────────────────────────┘
```

**核心设计原则：**

1. **静态优先**：所有页面在构建时生成 HTML，客户端零 JS 或极小 JS
2. **Island 架构**：仅在需要交互的区域挂载 Vue 组件
3. **内容与代码分离**：文章存储在独立内容仓，通过 `CONTENT_REPO_PATH` 环境变量注入
4. **双语静态镜像**：中文 `/blog` 与英文 `/en/blog` 各自独立渲染

---

## 4. 目录结构

```
remnant-song-web/
├── public/                     # 静态资源（直接复制到构建产物）
│   └── animeRoom/              # 传送门页面图片素材
├── src/
│   ├── assets/                 # 需打包处理的资源（SVG、图片）
│   ├── components/
│   │   ├── astro/              # Astro 组件（纯静态渲染）
│   │   │   ├── AssetGallery.astro
│   │   │   ├── AudioPlayer.astro
│   │   │   ├── BlogCard.astro
│   │   │   ├── Breadcrumbs.astro
│   │   │   ├── ModelViewer.astro
│   │   │   ├── NavBar.astro
│   │   │   ├── ScoreBlock.astro
│   │   │   └── SearchBox.astro
│   │   ├── common/             # 通用 Vue 子组件
│   │   │   ├── ArtTitle.vue        # SVG 标题书写动画
│   │   │   ├── FluidBackground.vue # WebGL 流体背景
│   │   │   └── RoomItem.vue        # 传送门社交链接物件
│   │   └── vue/                # Vue Island 包装组件
│   │       ├── HomeInteractive.vue
│   │       └── LanguageToggle.vue
│   ├── composables/            # Vue 组合式函数（预留）
│   ├── content/
│   │   ├── loaders/
│   │   │   └── posts.loader.ts # 自定义内容加载器
│   │   └── posts/              # 本地示例文章
│   │       └── task1.1.md
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── zh-CN.json
│   │   ├── index.ts            # vue-i18n 单例（Vue Island 用）
│   │   └── utils.ts            # Astro 静态翻译工具
│   ├── layouts/
│   │   ├── BaseLayout.astro    # 全站基础布局
│   │   └── BlogLayout.astro    # 博客页布局（含搜索框）
│   ├── pages/                  # 路由入口（Astro 文件即路由）
│   │   ├── index.astro         # 首页
│   │   ├── portal.astro        # 传送门
│   │   ├── 404.astro
│   │   ├── rss.xml.ts
│   │   ├── search-index.json.ts
│   │   ├── _app.ts             # Vue Island 应用入口
│   │   ├── blog/
│   │   │   ├── index.astro         # 博客列表（第1页，按分类分组）
│   │   │   ├── [page].astro        # 博客分页（第2+页）
│   │   │   ├── [...slug].astro     # 文章详情
│   │   │   └── category/[category]/[...page].astro  # 分类分页
│   │   └── en/                 # 英文镜像（结构与上同）
│   ├── stores/                 # Pinia stores（预留）
│   ├── styles/
│   │   ├── index.css           # 全局样式 + 设计令牌
│   │   ├── markdown.css        # Markdown 渲染样式
│   │   └── markdown-astro.css  # Astro 专用 Markdown 样式
│   ├── types/
│   │   └── vue-shims.d.ts
│   ├── utils/
│   │   └── markdown/
│   │       └── parser.ts       # markdown-it 渲染器
│   ├── views/
│   │   └── AnimeRoom.vue       # 传送门主视图
│   └── content.config.ts       # Astro Content Collection 配置
├── astro.config.mjs            # Astro 主配置
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .env.example                # 环境变量示例
├── package.json
└── pnpm-lock.yaml
```

---

## 5. 配置文件详解

### 5.1 `astro.config.mjs`

**核心配置项：**

| 配置 | 值 | 说明 |
|------|-----|------|
| `site` | `https://remnant-song.dev` | 站点 URL，用于 RSS/Sitemap/OG |
| `output` | `static` | 纯静态输出模式 |
| `integrations` | tailwind, vue, mdx, sitemap | 启用的集成 |
| `markdown.shikiConfig.theme` | `github-dark` | 代码高亮主题 |
| `markdown.remarkPlugins` | `[remarkGfm]` | GFM 扩展 |
| `markdown.rehypePlugins` | slug, autolink-headings, external-links | 标题锚点 + 外链安全 |
| `vite.resolve.alias` | `@ → /src` | 路径别名 |

**关键说明：**
- Vue 集成的 `appEntrypoint` 指向 `./src/pages/_app`，用于初始化 Pinia 和 vue-i18n
- `define: { __VUE_PROD_DEVTOOLS__: 'false' }` 用于 SSR 构建时消除 vue-i18n 的全局变量依赖

### 5.2 `tailwind.config.js`

- 通过 CSS 变量桥接设计令牌：`colors.text → var(--text)` 等
- `content` 扫描 `src/**/*.{vue,js,ts,jsx,tsx,astro,mdx}`
- 不引入额外插件，复用 `index.css` 中定义的 CSS 变量

### 5.3 `src/content.config.ts`

定义 `posts` 集合，使用 Zod schema 校验文章 Frontmatter，通过自定义 `postsLoader` 加载内容。

**文章 Schema 字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题（必填） |
| `date` | string | 发布日期 `YYYY-MM-DD`（必填） |
| `updated` | string? | 最后修改日期 |
| `excerpt` | string? | 摘要 |
| `tags` | string[] | 标签（默认 []） |
| `category` | string | 分类（默认 ''，优先于目录结构） |
| `draft` | boolean | 是否草稿（默认 false） |
| `hidden` | boolean | 是否隐藏（默认 false） |
| `pin` | number | 置顶权重（默认 0） |
| `cover` | string? | 封面图 |
| `author` | string? | 作者 |
| `audio` / `score` / `model` | string? | 富媒体资源 |
| `attachments` | Array? | 附件列表 |

### 5.4 `.env.example`

关键环境变量：

| 变量 | 说明 |
|------|------|
| `CONTENT_REPO_PATH` | 内容仓根目录路径（**必须**，否则使用默认本地路径） |
| `VITE_R2_BASE_URL` | R2 存储外链基础 URL |
| `VITE_POST_SOURCE` | 文章数据源：local / github |
| `VITE_GITHUB_*` | GitHub 仓库同步配置 |
| `VITE_GITEE_*` | Gitee 镜像仓库配置 |

---

## 6. 核心模块说明

### 6.1 i18n 国际化

项目采用**双轨 i18n** 方案：

#### 6.1.1 Astro 静态翻译（`src/i18n/utils.ts`）

用于所有 `.astro` 页面/组件的静态文本翻译，在构建时执行。

| 函数 | 签名 | 说明 |
|------|------|------|
| `getLocaleFromUrl` | `(pathname: string) => Locale` | 通过 URL 路径检测语言：`/en/*` → `en`，否则 `zh-CN` |
| `t` | `(locale, key, params?) => string` | 翻译函数，支持点分隔路径（如 `'nav.home'`）和 `{param}` 参数替换 |
| `altLocale` | `(l: Locale) => Locale` | 获取交替语言 |
| `localePrefix` | `(l: Locale) => string` | `zh-CN` → `''`，`en` → `'/en'` |
| `altLocalePrefix` | `(l: Locale) => string` | 语言切换按钮的目标前缀 |

**语言路由规则：**
- 中文（默认）：无前缀，如 `/blog`、`/portal`
- 英文：`/en/` 前缀，如 `/en/blog`、`/en/portal`
- 语言切换：纯 `<a>` 链接跳转整页导航

#### 6.1.2 vue-i18n（`src/i18n/index.ts`）

仅用于 Vue Island 组件内的响应式翻译。

| 导出 | 说明 |
|------|------|
| `i18n` (default) | `createI18n()` 单例，由 `_app.ts` 注册到 Vue app |
| `switchLanguage(lang)` | 切换语言并持久化到 localStorage |
| `getCurrentLanguage()` | 获取当前语言代码 |

**关键设计：单例模式** — `_app.ts` 直接复用 `src/i18n/index.ts` 的 i18n 实例，避免双实例导致语言切换失效。

**SSR 安全**：`getDefaultLanguage()` 和 `switchLanguage()` 均检查 `typeof window`，SSR 构建时回退默认值。

#### 6.1.3 翻译字典

`src/i18n/locales/zh-CN.json` 和 `en.json` 包含以下命名空间：
- `app`（站点标题）
- `nav`（导航：home/blog/portal）
- `home`（首页文案）
- `footer`（页脚）
- `notFound`（404 页面）
- `language`（切换按钮）
- `blog`（博客：标题、分页、搜索、分类等）

---

### 6.2 内容加载器与 Content Collection

#### `src/content/loaders/posts.loader.ts`

自定义 Astro Loader，从独立内容仓加载文章。

**加载流程：**

```
1. 读取 <CONTENT_REPO_PATH>/manifests/posts-index.json
   ↓  (文章元数据清单，含 slug/category/title/date/tags/filePath 等)
2. 遍历 manifest，逐篇读取 <CONTENT_REPO_PATH>/<filePath>
   ↓  (gray-matter 解析 Frontmatter + 正文)
3. store.set({ id, data, body, filePath })
   ↓  (注册到 Astro content layer)
4. 页面通过 getCollection('posts') 消费
```

**关键实现细节：**

- `CONTENT_REPO_ROOT`：优先读取 `process.env.CONTENT_REPO_PATH`，否则回退默认本地路径
- `id` 生成规则：`category/slug`（有分类时）或 `slug`（无分类时）
- Frontmatter 字段与 manifest 字段合并，以 Frontmatter 为准
- 加载失败仅 warn，不中断构建（保证部分文章可用）
- 日志使用 Astro Loader 的 `logger`，输出 `[posts-loader]` 前缀

---

### 6.3 博客系统

博客路由由以下文件构成（中英文各一套镜像）：

| 路由模式 | 文件 | 说明 |
|----------|------|------|
| `/blog` | `blog/index.astro` | 第 1 页，按分类分组展示 + 分类过滤标签 |
| `/blog/2`, `/blog/3`... | `blog/[page].astro` | 第 2+ 页，平铺列表 + Astro `paginate()` 分页 |
| `/blog/<category>/<slug>` | `blog/[...slug].astro` | 文章详情页，`renderMarkdown()` 渲染正文 |
| `/blog/category/<cat>` | `blog/category/[category]/[...page].astro` | 分类列表（手动分页） |

#### 6.3.1 列表页 `blog/index.astro`

- 通过 `getCollection('posts')` 获取所有文章
- 过滤 `!draft && !hidden`，按 `pin`（置顶）+ `date`（降序）排序
- 支持 `?category=` 查询参数过滤
- 按分类分组渲染，每个分类下展示 `BlogCard` 列表
- 顶部展示分类过滤标签（带文章计数）

#### 6.3.2 分页页 `blog/[page].astro`

- 使用 Astro 原生 `paginate(posts, { pageSize: 10 })`
- `getStaticPaths` 返回分页路径
- 渲染简洁平铺列表 + 上一页/下一页导航

#### 6.3.3 详情页 `blog/[...slug].astro`

- `getStaticPaths` 为每篇文章生成路径（`slug = post.id`）
- 使用 `renderMarkdown(post.body)` 将 Markdown 转为 HTML（当前过渡方案）
- 展示面包屑、标题、日期、作者、分类、标签
- `set:html={html}` 注入渲染后的 HTML

#### 6.3.4 分类页 `blog/category/[category]/[...page].astro`

- 手动实现分页（因 Astro `paginate()` 无法在 `getStaticPaths` 中按 category 预过滤）
- `[...page]` 捕获可选分页参数：第 1 页 `page=undefined`，第 2 页 `page="2"`
- `PAGE_SIZE = 10`

#### 6.3.5 BlogCard 组件

接收 `CollectionEntry<'posts'>`，渲染文章卡片：
- 标题、摘要（`line-clamp-2`）
- 日期、分类标签、最多 3 个标签
- URL 根据当前语言前缀生成：`/blog/<category>/<slug>` 或 `/en/blog/...`

---

### 6.4 搜索系统

由两部分组成：

#### 6.4.1 搜索索引端点 `src/pages/search-index.json.ts`

- 构建时生成 `/search-index.json`
- 内容：所有已发布文章的 `{ title, excerpt, url, category, tags }`
- 响应头 `Cache-Control: public, max-age=3600`

#### 6.4.2 搜索组件 `src/components/astro/SearchBox.astro`

- 输入框 + 下拉结果面板
- **纯 vanilla JS** 实现，无框架依赖
- 懒加载索引：`focus` 时首次 `fetch('/search-index.json')`
- 300ms 防抖
- 模糊匹配：标题 / 摘要 / 标签 / 分类（`includes` 子串匹配）
- 点击外部或 ESC 关闭结果面板
- HTML 转义防 XSS

---

### 6.5 布局与导航

#### 6.5.1 `BaseLayout.astro`

全站基础布局，提供：
- `<html lang>` 动态设置（根据 URL 检测语言）
- SEO 元信息：title、description、Open Graph、Canonical
- RSS 自动发现链接
- 注入 `<NavBar />` + `<main><slot /></main>` + `<footer>`
- 内联 `<script>` 将 locale 同步到 `localStorage`（供 vue-i18n 读取）

#### 6.5.2 `BlogLayout.astro`

在 `BaseLayout` 基础上：
- 限制内容宽度 `max-w-3xl`
- 顶部插入 `<SearchBox />` 搜索组件

#### 6.5.3 `NavBar.astro`

固定透明叠加导航栏：
- 三个导航项：首页、博客、传送门（根据当前语言生成前缀）
- 激活态检测：`Astro.url.pathname === item.path`
- 语言切换按钮：纯 `<a>` 链接，跳转至交替语言的同一路径

---

### 6.6 Vue Island 交互

Astro 的 Vue Island 机制允许仅在需要交互的区域挂载 Vue 组件，其余保持静态 HTML。

#### 6.6.1 应用入口 `src/pages/_app.ts`

```ts
export default (app: App) => {
  if (typeof window === 'undefined') return  // SSR 安全
  app.use(createPinia())
  app.use(i18n)  // 复用 src/i18n/index.ts 单例
}
```

#### 6.6.2 Island 组件清单

| 组件 | 文件 | client 指令 | 用途 |
|------|------|-------------|------|
| `HomeInteractive` | `components/vue/HomeInteractive.vue` | `client:load` | 首页 WebGL 流体背景 + SVG 标题动画 |
| `AnimeRoom` | `views/AnimeRoom.vue` | `client:idle` | 传送门 GSAP 视差房间 + 社交链接 |
| `LanguageToggle` | `components/vue/LanguageToggle.vue` | `client:only` | 语言切换按钮（已被 NavBar 纯链接替代，保留备用） |

**client 指令选择原则：**
- `client:load`：需要立即初始化（WebGL 上下文）
- `client:idle`：重交互，等浏览器空闲后加载
- `client:only`：仅客户端渲染，跳过 SSR（localStorage 依赖）

#### 6.6.3 `HomeInteractive.vue`

组合两个子组件：
- `FluidBackground.vue`：全屏 WebGL 流体背景（`fixed inset-0`，`z-index: -1`）
- `ArtTitle.vue`：SVG 蜡笔质感标题 + 逐字书写动画

#### 6.6.4 `AnimeRoom.vue`

传送门主视图，两层结构：
- **背景层**：`bgImg_v3.png`，固定不动
- **光线层**：`shine.png` 叠加，透明度可调
- **物件层**：社交链接 `RoomItem`，GSAP `quickTo` 实现鼠标视差（`ITEMS_MOVE = 40px`）

**社交链接数据：** Bilibili、GitHub、Douyin，均使用 `public/animeRoom/item/` 下的绝对路径图片。

---

### 6.7 Markdown 渲染

#### 当前方案：`src/utils/markdown/parser.ts`

基于 `markdown-it` + 21 个 `@mdit/plugin-*` 插件 + `highlight.js`。

**导出函数：**

| 函数 | 说明 |
|------|------|
| `renderMarkdown(raw)` | 渲染 Markdown 为 HTML 字符串 |
| `renderMarkdownInline(raw)` | 行内模式渲染（不包裹 `<p>`） |
| `getMarkdownIt()` | 获取 markdown-it 实例（供扩展） |

**核心配置：**
- `html: false`（禁止原始 HTML，防 XSS）
- `linkify: true`（自动链接 URL）
- `typographer: true`（智能排版）
- `highlight.js` 代码高亮

**已注册插件（按功能分组）：**

| 分组 | 插件 |
|------|------|
| 基础语法 | abbr, sub, sup, ins, mark, ruby, dl |
| 表情 | fullEmoji |
| 锚点/属性 | anchor, attrs |
| 内容增强 | alert, tasklist, footnote, container×5, align, stylize, spoiler |
| 图片增强 | figure, imgLazyload, imgMark, imgSize |

#### 过渡说明

`astro.config.mjs` 已配置 remark/rehype 管道（`remarkGfm` + `rehypeSlug` + `rehypeAutolinkHeadings` + `rehypeExternalLinks`），但博客详情页当前仍使用 `renderMarkdown()`（因自定义 loader 场景下 Astro `render()` 可能输出为空）。后续迁移后将移除 markdown-it 依赖。

---

### 6.8 富媒体组件

位于 `src/components/astro/`，用于 MDX 文章中嵌入多媒体：

| 组件 | Props | 状态 |
|------|-------|------|
| `AudioPlayer` | `src`, `title?`, `autoplay?` | 原生 `<audio>` 降级 |
| `ModelViewer` | `src`, `title?`, `poster?` | 占位，待接入 model-viewer/Three.js |
| `ScoreBlock` | `src?`, `inline?`, `title?` | 占位，待接入 vexflow/abcjs |
| `AssetGallery` | — | 资产画廊组件 |

---

## 7. 关键函数与类型

### 7.1 i18n 工具函数（`src/i18n/utils.ts`）

```ts
type Locale = 'zh-CN' | 'en'

function getLocaleFromUrl(pathname: string): Locale
function t(locale: Locale, key: string, params?: Record<string, string | number>): string
function altLocale(l: Locale): Locale
function localePrefix(l: Locale): string      // zh-CN → '', en → '/en'
function altLocalePrefix(l: Locale): string    // 语言切换目标前缀
```

### 7.2 vue-i18n 单例（`src/i18n/index.ts`）

```ts
const i18n: I18n                              // createI18n() 单例
function switchLanguage(lang: string): void
function getCurrentLanguage(): string
```

### 7.3 Content Loader（`src/content/loaders/posts.loader.ts`）

```ts
interface ManifestEntry {
  slug: string
  category: string
  title: string
  date: string
  updated: string
  excerpt: string
  tags: string[]
  draft: boolean
  hidden: boolean
  pin: number
  cover: string
  author: string
  filePath: string
}

const postsLoader: Loader = {
  name: 'remnant-song-posts',
  async load({ store, logger }) { ... }
}
```

### 7.4 Markdown 渲染（`src/utils/markdown/parser.ts`）

```ts
function renderMarkdown(raw: string): string
function renderMarkdownInline(raw: string): string
function getMarkdownIt(): MarkdownIt
```

---

## 8. 依赖关系图

### 8.1 页面依赖链

```
index.astro
  └─ BaseLayout.astro
       ├─ NavBar.astro → i18n/utils.ts
       └─ styles/index.css
  └─ HomeInteractive.vue (client:load)
       ├─ FluidBackground.vue
       └─ ArtTitle.vue

blog/index.astro
  └─ BlogLayout.astro
       ├─ BaseLayout.astro
       └─ SearchBox.astro → i18n/utils.ts
  ├─ BlogCard.astro → i18n/utils.ts
  └─ getCollection('posts') → postsLoader

blog/[...slug].astro
  └─ BlogLayout.astro
  ├─ Breadcrumbs.astro
  ├─ renderMarkdown() → markdown-it + plugins
  └─ styles/markdown.css + markdown-astro.css

blog/[page].astro
  └─ BlogLayout.astro
  ├─ BlogCard.astro
  └─ paginate() (Astro 原生)

blog/category/[category]/[...page].astro
  └─ BlogLayout.astro
  └─ BlogCard.astro
```

### 8.2 模块依赖关系

```
astro.config.mjs
  ├─ @astrojs/vue → src/pages/_app.ts → pinia + i18n/index.ts
  ├─ @astrojs/mdx
  ├─ @astrojs/tailwind → tailwind.config.js
  └─ @astrojs/sitemap

content.config.ts
  └─ posts.loader.ts → gray-matter + node:fs

i18n/utils.ts → locales/*.json
i18n/index.ts → locales/*.json + vue-i18n

utils/markdown/parser.ts
  └─ markdown-it + highlight.js + @mdit/plugin-* (21 个)
```

---

## 9. 项目运行方式

### 9.1 环境要求

- Node.js（推荐 18+）
- pnpm 11.20.0（由 `packageManager` 字段锁定）
- 内容仓库（Obsidian Vault），需设置 `CONTENT_REPO_PATH` 环境变量

### 9.2 安装依赖

```bash
pnpm install
```

### 9.3 环境变量配置

复制 `.env.example` 为 `.env` 并填入内容仓路径：

```bash
# Windows (PowerShell)
copy .env.example .env

# 编辑 .env，设置：
CONTENT_REPO_PATH=D:/obsidian/你的内容仓路径
```

### 9.4 开发模式

```bash
pnpm dev
# 或
pnpm astro:dev
```

默认启动在 `http://localhost:4321`。

> **注意**：Astro dev server 会缓存 content collection，修改内容仓文章后需重启 dev server。

### 9.5 生产构建

```bash
pnpm build
# 或
pnpm astro:build
```

产物输出到 `dist/` 目录。

### 9.6 预览构建产物

```bash
pnpm preview
# 或
pnpm astro:preview
```

### 9.7 可用脚本

| 脚本 | 命令 | 说明 |
|------|------|------|
| `dev` | `astro dev` | 启动开发服务器 |
| `build` | `astro build` | 生产构建 |
| `preview` | `astro preview` | 预览构建产物 |
| `astro:dev` | `astro dev` | 同上（别名） |
| `astro:build` | `astro build` | 同上（别名） |
| `astro:preview` | `astro preview` | 同上（别名） |

---

## 10. 构建产物与部署

### 10.1 产物结构

```
dist/
├── index.html              # 首页
├── portal/index.html       # 传送门
├── 404.html
├── blog/
│   ├── index.html          # 博客列表第1页
│   ├── 2/index.html        # 第2页
│   ├── <category>/<slug>/index.html  # 文章详情
│   └── category/<category>/index.html
├── en/                     # 英文镜像（结构同上）
├── rss.xml
├── sitemap-index.xml
├── search-index.json
├── animeRoom/              # public 目录静态资源
└── _astro/                 # 打包后的 JS/CSS 资源
```

### 10.2 部署

由于是纯静态站点（`output: 'static'`），可部署到任何静态托管平台：

- **Vercel / Netlify / Cloudflare Pages**：直接连接仓库，构建命令 `pnpm build`，输出目录 `dist`
- **Nginx**：将 `dist/` 内容拷贝到网站根目录
- **GitHub Pages**：需配置 `site` 为子路径

### 10.3 内容仓部署注意事项

当前 `postsLoader` 通过 Node.js `fs` 直接读取内容仓文件。生产环境构建时：
- 需确保构建机可访问内容仓（或在 CI 中 checkout 内容仓）
- 后续可改造为从构建制品（压缩包/对象存储）读取

---

## 11. 已知约束与遗留事项

### 11.1 i18n 限制

- vue-i18n 响应式**仅限 Vue Island 组件内**
- 静态 HTML 内容（导航栏、博客文章、页脚）**不会**在语言切换时实时更新，因为语言切换是整页导航
- 中英文博客内容当前共用同一套文章数据（未做文章级双语分离）

### 11.2 Markdown 渲染过渡

- 博客详情页当前使用 `markdown-it` 渲染（`renderMarkdown()`）
- Astro remark/rehype 管道已配置但未在详情页启用
- 待迁移后可移除 `markdown-it` 及 21 个 `@mdit/plugin-*` 依赖

### 11.3 内容仓路径

- `CONTENT_REPO_PATH` 默认为硬编码的本地路径 `D:/obsidian/REMNANT-SONG_Devlop_Obsidian`
- 生产环境必须通过环境变量覆盖

### 11.4 富媒体组件占位

- `ModelViewer`、`ScoreBlock` 当前为占位组件，尚未接入实际渲染库
- `AudioPlayer` 使用原生 `<audio>`，未做波形可视化等增强

### 11.5 废弃/预留目录

- `src/composables/`、`src/stores/`、`src/types/` 目前为空（`.gitkeep` 占位）
- `LanguageToggle.vue` 已被 NavBar 纯链接方案替代，但保留作为 client:only 备用方案

### 11.6 搜索索引规模

- 当前搜索为客户端全量加载 JSON 索引
- 若文章量超过 1000 篇，需考虑分片索引或服务端搜索

---

## 附录：术语表

| 术语 | 说明 |
|------|------|
| Astro Island | Astro 的岛屿架构，允许在静态 HTML 中嵌入可交互的 Vue/React 组件 |
| Content Collection | Astro 的内容管理系统，通过 schema + loader 管理结构化内容 |
| Content Loader | Astro 7 引入的自定义内容加载器，可从任意数据源加载内容 |
| Frontmatter | Markdown 文件头部的 YAML 元数据块 |
| Manifest | 内容仓中预生成的文章元数据清单（`posts-index.json`） |
| client:load / client:idle / client:only | Astro Island 的 hydration 指令，控制组件何时/是否在客户端激活 |
| Shiki | Astro 内置的代码语法高亮引擎 |
| GFM | GitHub Flavored Markdown，扩展 Markdown 语法（表格、任务列表等） |
