
---

## 对设想的评价：**完全采纳，比我原方案优秀得多**

你的三步走是真正符合 Ponytail 精神的"每一步都能看到结果"，而我原方案的排序问题在于：

| 对比维度 | 原方案六阶段 | 你的三步走 |
|---|---|---|
| 首次浏览器看到文章 | Day 3 上午 | Step 1 半天内 |
| 首次写代码时需处理的系统复杂度 | 同步脚本 + 虚拟模块 + GitHub API（3 件事同时） | 仅 `import.meta.glob` + markdown-it（1 件事） |
| 回滚成本 | 大（同步脚本和虚拟模块撤掉会牵扯整个数据层） | 极低（环境变量切回 `local-glob` 即可） |
| 调试体验 | 脚本/网络问题会阻塞 UI 开发 | Step 1 完全不碰网络，先把渲染效果调顺 |

原方案[[task1.1]]相当于"先铺水管再开龙头"，你的方案是"先接个矿泉水瓶让水流出来，再一步步铺正式水管"。后者才是 lazy dev 的正确姿势。所以我**完全按你的三步走重排所有任务**，保留我原方案中每个子任务的技术细节（文件名、代码骨架、ponytail 标记注释约定），但全部挂到"Step 1 → Step 2 → Step 3"这个主干下。

下面是 `docs/task1.1.md` 的完整重写版内容
# 博客模块开发规划 v2（三步走递增）

> 最后更新：2026-08-09 | 作者：trae+glm-5.2
> 状态：规划文档，待确认后进入编码
> 设计原则：每一步都是端到端可验收的完整闭环，任何一步都可单独回滚

---

## 0. 三步走总览与数据源切换契约

### 0.1 三步走完之后的最终形态与你的设想对应

| 阶段 | 你的设想描述 | 规划中的对应能力 | 完成后浏览器可验证 |
|---|---|---|---|
| **Step 1** | 开发环境中本地某处/项目内某处存 md，`localhost:5173/` 调试渲染 | 文章放 `src/content/posts/`（随主仓库提交），Vite 用 `import.meta.glob` 直接读取，markdown-it 渲染，最小页面壳 | `http://localhost:5173/blog` 列表可点 → 详情页完整渲染基础语法 |
| **Step 2** | 开发期改为同步 GitHub 仓库 md 再渲染（本地不再读项目内 md） | 建独立 GitHub 文章仓库；写同步脚本从 GitHub Contents API 拉到 `.cache/posts/`；通过 Vite 虚拟模块注入数据；同时补齐 XSS / 代码高亮 / 图片路径 / `::note` 容器 | **删除 `src/content/posts/` 目录**后重开 dev，`/blog` 渲染结果与 Step 1 肉眼一致 |
| **Step 3** | 公网部署并保证博客功能可用 | Vercel 上线 + Deploy Hook Webhook 自动触发；RSS / sitemap / SEO；样式响应式；文档 | 线上域名访问博客正常；文章仓库 push 新 md 后 3 分钟内线上更新 |

### 0.2 关键前置设计约束（不变部分）

以下规则在三步中**始终不变**，切换数据源时页面层 / 纯函数层零修改：

#### 文件命名强约束
- 每篇文章文件名：`YYYY-MM-DD-slug.md`
- `slug` 仅允许 `[a-z0-9-]+`（建议全小写、单词间 `-`）
- **草稿标记**：文件名前缀加 `_`，如 `_2026-08-09-unfinished.md`（非 debug 模式不进入列表）
- **日期提取**：前 10 位 `YYYY-MM-DD`；**slug 提取**：`YYYY-MM-DD-` 之后到 `.md` 之前
- **标题提取**：正文第一个 `# ` 一级标题；找不到时兜底 `slug.replace(/-/g, ' ')` 首字母大写

#### PostMeta 接口契约（三步期间冻结）
```ts
export interface PostMeta {
  slug: string
  fileName: string           // 含 .md
  dateStr: string            // YYYY-MM-DD
  title: string
  tags: string[]             // Step 1/2 固定空数组（无 frontmatter）
  excerpt: string            // Step 1: 粗截断；Step 2 后再精确
  draft: boolean
  srcPath: string            // 来源路径（随 Step 变：glob key / cache path）
  rawContent: string         // 原文，详情页渲染用
}
export interface PostsIndex {
  all: PostMeta[]                          // 日期倒序，不含草稿（debug 除外）
  bySlug: Record<string, PostMeta>
  tags: Record<string, PostMeta[]>         // 当前固定空对象
}
```
> **ponytail：冻结 PostMeta 字段签名的原因** — 它是"页面层 ↔ 数据层"的唯一契约；只要签名不变，Step 1 写好的列表页/详情页在 Step 2/3 期间一行不改。将来补 frontmatter 时 tags/excerpt 填上即可，不影响调用方。

#### 数据源切换开关（环境变量）
`.env` 中 `VITE_BLOG_DATA_SOURCE` 取值：
- `local-glob`（Step 1）→ 读 `src/content/posts/`
- `cache-fs`（Step 2/3）→ 读 `.cache/posts-index.json`（同步脚本产物）

代码中单点切换位置：`src/utils/markdown/loaders.ts` 的 `loadPosts()`。将来加新数据源只改这一个文件。

---

## Step 1：本地文件直接渲染（最简闭环，预计 0.5 ~ 1 天）

> **进入条件**：无。**验收目标**：Step 1.5 清单全部打勾。
> **刻意不做**（全部推迟到 Step 2）：GitHub 同步、XSS 过滤、代码高亮、图片路径处理、自定义组件、RSS、SEO、@tailwindcss/typography。
> **为什么推迟**：Step 1 唯一目标是"最快看到渲染结果"；加固和增强在数据源验证通过后再补，避免渲染 bug 和网络/安全 bug 叠加导致排查困难。

### 子任务 1.0：前置准备（一次性基础工作）

#### 1.0.1 安装依赖
```bash
pnpm add -D markdown-it gray-matter
pnpm add -D @types/markdown-it
```
- `markdown-it`：唯一必须的渲染器。
- `gray-matter`：占坑，Step 1 仅调用 `matter(content).content` **剥掉可能误写的 frontmatter 块**（否则 `---...---` 会原样出现在文章正文顶部造成困惑）。
- **Windows 注意（经验 230905）**：如果 pnpm add 触发 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`，先执行 `Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml` 后重新 `pnpm install` 再 add。

#### 1.0.2 目录 + 示例文章落地
新增以下目录 / 文件（全部提交进主仓库 git）：
```text
remnant-song-web/
├── src/
│   ├── content/                 # Step 1 临时文章目录（Step 2 完成后删除）
│   │   └── posts/
│   │       └── 2026-08-09-hello-blog.md
│   ├── views/blog/
│   │   └── .gitkeep
│   └── utils/markdown/
│       └── .gitkeep
└── .env                         # 已有文件，追加 1.0.3 内容
```

#### 1.0.3 环境变量 + 类型声明
`.env` 末尾追加：
```env
# ============================
# Blog Module
# ============================
# Step 1: local-glob | Step 2+: cache-fs
VITE_BLOG_DATA_SOURCE=local-glob
```

`.env.d.ts` 补全 `VITE_BLOG_DATA_SOURCE` 类型（确保 strict 模式下无隐式 any）：
```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_R2_BASE_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_BLOG_DATA_SOURCE: 'local-glob' | 'cache-fs'
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

---

### 子任务 1.1：类型层

#### 新建 `src/types/post.ts`
导出上面 0.2 节冻结的 `PostMeta` / `PostsIndex` 两个接口。
```ts
/*
 * @Author: trae+glm-5.2
 * @Date: 2026-08-09
 * @Desc: 博客文章元数据 & 索引结构类型定义
 *   该接口在 Step 1~3 期间冻结，仅允许扩展字段不允许重命名/改类型，
 *   确保切换数据源时页面层（usePosts 调用方）零改动。
 */
export interface PostMeta {
  /** URL slug，即路由参数 /blog/:slug */
  slug: string
  /** 原始文件名，含 .md 后缀 */
  fileName: string
  /** 发布日期，ISO YYYY-MM-DD 格式 */
  dateStr: string
  /** 文章标题，来自正文第一个 H1 或 slug 兜底 */
  title: string
  /** 标签列表，Step 1/2 无 frontmatter 时固定空数组 */
  tags: string[]
  /** 摘要，Step 1 为纯文本粗截断，后续可由 frontmatter 指定 */
  excerpt: string
  /** 是否草稿（文件名 _ 前缀或未通过命名校验的文章） */
  draft: boolean
  /** 原始文件在当前加载器中的路径（glob key 或 .cache 绝对路径） */
  srcPath: string
  /** Markdown 原文，详情页渲染直接消费 */
  rawContent: string
}

/**
 * 文章索引：内存中一份全量派生数据结构
 * - all：列表页直接消费（已按日期倒序 + 草稿过滤）
 * - bySlug：详情页按 slug O(1) 查找
 * - tags：Step 1 固定空对象，frontmatter 上线后再填
 */
export interface PostsIndex {
  all: PostMeta[]
  bySlug: Record<string, PostMeta>
  tags: Record<string, PostMeta[]>
}
```

**验收**：保存后跑 `pnpm exec vue-tsc --noEmit`（或等 IDE 报红）无类型错误。

---

### 子任务 1.2：纯函数工具层（Node/Browser 两侧通用，零副作用）

> **通用层约束（强制执行）**：`src/utils/markdown/` 下的文件 **不允许 import vite / vue / document / window**。保证同步脚本（Node）、RSS 生成脚本（Node）、页面渲染（Browser）三者共用同一份逻辑，避免"列表里标题是 A、详情页标题是 B"的一致性 bug（经验 1308517 踩过的坑）。

#### 1.2.1 新建 `src/utils/markdown/meta.ts`
四个纯函数：

| 函数签名 | 职责 | 失败兜底 |
|---|---|---|
| `parsePostFileName(fileName: string): Omit<PostMeta, 'title' \| 'tags' \| 'excerpt' \| 'srcPath' \| 'rawContent'>` | 从文件名正则解析 slug/dateStr/draft | 不匹配正则 → draft=true + dateStr=今天 + slug=filename 去 md |
| `extractTitleFromMarkdown(content: string, fallbackSlug: string): string` | 从 md 正文取首个 `# ` 行作为标题 | 没找到 → fallbackSlug 转空格+首字母大写 |
| `extractExcerptFromMarkdown(content: string, len = 180): string` | 去掉 H1 后的前几段纯文本（去 md 标记），截断到 len | 空字符串兜底 |
| `buildPostsIndex(entries: {fileName, content, srcPath}[]): PostsIndex` | 调上述三个函数，排序，过滤草稿，生成 all/bySlug/tags | bySlug slug 冲突时 warn + 后者覆盖前者；`VITE_DEBUG=true` 时保留草稿并在 title 前标 `[草稿]` |

**关键点（经验 1308517 避免踩坑）**：buildPostsIndex 的过滤和排序**必须是确定性的纯函数**，不能依赖运行时环境（比如 `new Date()` 判断"未来日期文章"，那会让 Node 端生成 RSS 时结果和浏览器不一致）。草稿过滤只看 `draft===true && !DEBUG` 两个布尔，dateStr 一律保留字面量不做 Date 解析。

#### 1.2.2 新建 `src/utils/markdown/parser.ts`
最小 markdown-it 配置，只暴露一个函数：
```ts
import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'

/*
 * @Author: trae+glm-5.2
 * @Date: 2026-08-09
 * @Desc: Step 1 极简 Markdown 渲染器
 *   - 故意禁用 html: false，避免 Step 1 没 XSS 过滤时有人写 <script> 造成安全事故
 *   - 启用 linkify: true 自动识别 URL
 *   - 代码高亮 / 锚点 / 自定义容器 / 图片路径改写 全部推迟到 Step 2 插件形式追加，
 *     这里保留 TODO 注释，升级时不破坏函数签名。
 * ponytail: 已知上限 — 无代码高亮、无行号、无 XSS 白名单，仅用于 Step 1 本地肉眼验证渲染。
 */

const md = new MarkdownIt({
  html: false,     // Step 2 启用后配合 sanitize
  linkify: true,
  breaks: false,
  typographer: false,
})

// TODO(Step 2): 在此追加插件
// md.use(require('markdown-it-highlightjs'))
// md.use(require('markdown-it-anchor'))
// md.use(require('./custom-containers').default)

export function renderMarkdownSimple(rawContent: string): string {
  const { content } = matter(rawContent) // 剥掉误写的 --- frontmatter ---
  return md.render(content)
}
```

**验收**：写一个 Node 自校验脚本 `scripts/self-check-step1.mjs`（简单 30 行），跑 `node scripts/self-check-step1.mjs`，断言：
1. parsePostFileName 对 `_2026-08-09-draft.md` → draft=true, dateStr='2026-08-09', slug='draft'
2. parsePostFileName 对 `garbage.md`（不匹配正则）→ draft=true, dateStr=今天日期
3. buildPostsIndex 输入两篇文章（不同日期）→ all 数组按日期倒序，bySlug 能正确命中，tags 为空对象

---

### 子任务 1.3：数据接入层（Vite 开发期加载 md 原文 + 生成索引）

#### 1.3.1 新建 `src/utils/markdown/loaders.ts`
两个加载器（一个实现、一个占位）+ 环境变量路由：
- `loadPostsFromGlob()` — Step 1 真实现：`import.meta.glob('@/content/posts/**/*.md', { as: 'raw', eager: true })`。**必须 eager=true**，否则首屏 SSR-like 场景下 import 异步拿不到数据，列表页为空（这是 Step 1 最容易踩的坑）。
- `loadPostsFromCache()` — Step 2 占位，当前直接 `throw new Error('未实现')`，这样如果 `.env` 切错变量，不会静默"0 篇文章"而是当场报错，便于排查。
- `loadPosts()` — 读 `import.meta.env.VITE_BLOG_DATA_SOURCE` 分发到两个加载器之一。

#### 1.3.2 新建 `src/composables/usePosts.ts`
消费 `loadPosts()` 的结果（模块级单例，computed 包装，bySlug / getPrevNext 辅助方法各一）。

getPrevNext 规则：`all[i+1]` 是更老的"上一篇"，`all[i-1]` 是更新的"下一篇"；头尾 null。

---

### 子任务 1.4：页面与路由（出 UI）

#### 1.4.1 路由骨架（修改 `src/router/index.ts`，在 404 通配之前插入）
```ts
{
  path: '/blog',
  name: 'BlogList',
  component: () => import('@/views/blog/BlogListView.vue'),
  meta: { title: 'Blog' },
  children: [
    // /blog 精确匹配 —— 列表页
    {
      path: '',
      name: 'BlogListHome',
      component: () => import('@/views/blog/BlogListHome.vue'),
    },
    // /blog/:slug —— 详情页，放 children 最后避免先匹配其他字符串
    {
      path: ':slug',
      name: 'BlogPost',
      component: () => import('@/views/blog/BlogPostView.vue'),
      props: true, // slug 作为 props 传入，模板更干净
    },
  ],
},
```
- 标签页 `/blog/tag/:tag`、归档页 `/blog/archive`：Step 1 不建，等 tags 真正有数据（frontmatter 上线）时再加路由和页面，避免维护空壳。
- `DefaultLayout.vue` 的 `navItems` 数组同步增加 `{ key: 'blog', path: '/blog' }`，并在 i18n 的 `nav.blog` 补上中英文 key（`nav.blog=Blog` / `nav.blog=博客`）。

#### 1.4.2 三个页面组件
| 文件 | 职责 | 关键简化 |
|---|---|---|
| `BlogListView.vue` | 父容器：`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8` + `<router-view/>` | 不写布局逻辑，只包一层通用容器宽度，和全站设计令牌一致 |
| `BlogListHome.vue` | 列表页：循环 `usePosts().all` → 卡片（title / dateStr / excerpt），点击 `router.push({name:'BlogPost', params:{slug}})` | 不加分页；空状态显示 i18n 文案；卡片 hover 仅 `var(--accent-bg)` 背景（不写硬编码色值） |
| `BlogPostView.vue` | 详情页：props.slug → bySlug(slug) 拿 meta，找不到则 `router.push('/404')`；正文调 `renderMarkdownSimple(meta.rawContent)` → `v-html` 渲染 | 不加 @tailwindcss/typography；先自己手写简单 CSS 覆盖 `.article h1/h2/pre/code/blockquote/table`；底部暂不加 prev/next |

---

### 子任务 1.5：Step 1 验收清单（**必须全部手工通过，否则不进 Step 2**）

> 验收原则：模拟一个真正的读者/作者在自己电脑上的操作流程。

1. `pnpm dev` 启动，浏览器控制台 **零报错、零 Vue warning**。
2. 访问 `http://localhost:5173/blog` → 列表页展示 **1 篇卡片**：标题"你好，博客" + 日期 2026-08-09 + 摘要非空。
3. 点击卡片 → 路由跳 `/blog/hello-blog` → 详情页肉眼确认所有 md 语法元素正常：
   - H1/H2/H3 三级标题有层级字号差
   - 无序列表/有序列表/嵌套列表 左侧有缩进和符号
   - 引用块 左侧有竖线/背景色区分
   - 行内代码 有 `code` 背景色和等宽字体
   - 代码块 `<pre>` 有灰色背景 + 不折行 + 横向滚动条（用鼠标拖一下）
   - 超链接 下划线 + hover 颜色变化
   - 表格 有边框和交替行样式
   - `<hr>` 水平分割线 渲染为细横线
4. 修改 `src/content/posts/2026-08-09-hello-blog.md`：在正文任意位置加一行 `**这是 HMR 测试**` → 保存 → 浏览器**自动刷新或热更新**（无需手动 F5）且看到新文字。
5. 复制第一篇 md，改名为 `2026-08-10-second-article.md`，H1 改成 "#第二篇文章" → 列表页立刻显示 **2 篇**，且"第二篇文章"排在上面（日期倒序正确）。
6. 把第二篇文件名改成 `_2026-08-10-draft.md` → 列表页立刻只剩 1 篇（草稿过滤生效）。设置 `.env` 中 `VITE_DEBUG=true` 重启 dev → 列表页出现 2 篇，草稿标题前有 `[草稿]` 前缀。

---

## Step 2：开发期切换到 GitHub 仓库同步（预计 1 ~ 2 天）

> **进入条件**：Step 1.5 全 6 项验收通过。
> **验收目标**：Step 2.5 清单全部打勾。**删除 `src/content/posts/` 后 dev 仍然渲染正常**（这是证明数据源切换成功的唯一铁证）。

### 子任务 2.0：前置 — 创建 GitHub 文章仓库

1. 手动在 GitHub 建**公开**仓库，建议名 `remnant-song-blog-posts`（你想自定义也行，只需和环境变量对齐）。
2. 把 Step 1 期间 `src/content/posts/` 下所有 md 文件**原样搬到**新仓库的 `posts/` 子目录下（保留文件名）。
3. 新建 `posts/assets/` 空目录（放一张示例图，比如 `posts/assets/2026-08-09-hello-blog/cover.png`，正文改一下 `![封面](./assets/2026-08-09-hello-blog/cover.png)`）。
4. 提交 push 到 main 分支。记下：
   - `owner/repo`（如 `your-name/remnant-song-blog-posts`）
   - 分支名 `main`

### 子任务 2.1：同步脚本（`scripts/sync-posts.mjs` — 先只做 dev-remote 模式）

Step 2 先只做 **dev-remote**（GitHub Contents API 拉取）。`dev-local`（拷贝同级本地仓库）和 `prod-git`（sparse checkout）推迟到 Step 3。为什么？dev-remote 不依赖本机装 git，也不要求手动 clone 文章仓库 — 最少配置最快验证通路。

脚本输入：
- 环境变量：`VITE_BLOG_POSTS_REPO`、`VITE_BLOG_POSTS_BRANCH`（默认 main）、`VITE_BLOG_POSTS_DIR`（默认 `posts`）、`GITHUB_TOKEN`（可选，提 rate limit 到 5000/小时）

脚本输出：
- `.cache/posts/*.md` — 所有 md 文件
- `.cache/posts/assets/**` — 所有图片资源
- `.cache/posts-index.json` — 序列化后的 `PostsIndex` 对象

核心逻辑：
1. 递归 GET `https://api.github.com/repos/{repo}/contents/{path}?ref={branch}`（Header 带 token 或不带）
2. `type==='file'` 且 `.md` / 图片后缀 → GET `download_url` → `fs.writeFile` 到 `.cache/posts/<相对 path>`
3. `type==='dir'` → 递归
4. 所有 md 文件下完后，**直接在 Node 里 require `meta.ts` 编译产物**（或把 meta 函数另写一份 mjs 版本供脚本调用，**禁止在脚本里重写解析逻辑** — 经验 1308517 的前后端渲染不一致教训）→ buildPostsIndex → 写 `.cache/posts-index.json`

`.gitignore` 追加：`.cache/`。

### 子任务 2.2：Vite 虚拟模块插件（替换 `import.meta.glob`）

> 为什么不继续用 `import.meta.glob('.cache/posts/**/*.md')`？因为 `.cache/` 在 `.gitignore` 里，新同事 clone 项目第一次跑 `pnpm dev` 时如果 `.cache` 还没生成，会导致 Vite 启动直接报错找不到 glob 目标目录，体验很差。虚拟模块更可控。

新建 `scripts/vite-plugin-posts.mjs`（ESM，由 `vite.config.ts` 里 `import('./scripts/vite-plugin-posts.mjs').then(m => m.default)` 动态 import 后加入 plugins 数组）。插件要干的事：

| Vite 钩子 | 做什么 |
|---|---|
| `buildStart` + `configureServer` | 调 `syncPosts('dev-remote')`（开发期）或 `syncPosts('prod')`（构建期，Step 3 实现）；失败时打印详细错误但**不 throw**（否则 Vite 起不来，开发卡死）— 失败时尝试读已有 `.cache/posts-index.json` 做降级 |
| `resolveId('virtual:posts')` | 返回 `'\0virtual:posts'`（rollup 约定的虚拟模块前缀，避免和真实文件冲突） |
| `load('\0virtual:posts')` | 读 `.cache/posts-index.json`，拼成 `export const postsIndex = {...};` 字符串；同步模块级 postContents 映射（slug → rawContent 字符串）|
| `configureServer(server)` | `server.watch.add('.cache/posts/**/*.md')`；on change 时先 `syncPosts('dev-remote')` 再 `server.moduleGraph.invalidateModule(虚拟模块)` + `server.ws.send({type:'full-reload'})` → 浏览器自动刷新 |

**配套改动：**
- `src/utils/markdown/loaders.ts` 的 `loadPostsFromCache()` 实现为 `import postsIndex, { postContents } from 'virtual:posts'`（rawContent 这里要 merge 回 PostMeta）。
- `.env.d.ts` 新增：
  ```ts
  declare module 'virtual:posts' {
    import type { PostsIndex, PostMeta } from '@/types/post'
    export const postsIndex: PostsIndex
    export const postContents: Record<string, PostMeta['rawContent']>
  }
  ```
- `.env` 切 `VITE_BLOG_DATA_SOURCE=cache-fs`。

### 子任务 2.3：补齐 Markdown 渲染增强（原方案任务 2.1 ~ 2.5）

按以下**严格顺序**逐个启用，每启用一个就在详情页肉眼确认效果：

| 顺序 | 插件 / 功能 | 装什么依赖 | 关键点 |
|---|---|---|---|
| 1 | 代码高亮 | `pnpm add markdown-it-highlightjs highlight.js` + `@types/markdown-it-highlightjs -D` | 选 highlight.js 不选 Shiki：同步调用无构建期网络下载；Shiki 等 Step 3 上线后有需要再换 |
| 2 | XSS 过滤 | `pnpm add xss` | 新建 `sanitize.ts`：白名单允许标准 md 标签 + `data-md-*` 属性；强制 `a[rel=noopener noreferrer]`；禁止 `href=javascript:`；`img[onerror]` 等事件处理器全剥 |
| 3 | 图片路径改写 | 不装依赖，改 `renderer.rules.image` | 相对路径前缀 `/blog/assets/`；`vite-plugin-posts.mjs` 加 `writeBundle` 钩子，把 `.cache/posts/assets/**` 拷到 `dist/blog/assets/`（保持相对结构） |
| 4 | `::note` 自定义容器 | 不装依赖，markdown-it `block.ruler.before('fence')` 自写规则 | 输出 `<div class="md-note md-note--tip" data-md-container="note">...</div>`；class 前缀统一 `md-*`，为将来风格切换留钩子；同时在 `xss` 白名单中放行这些 class 所在的 div |

最终把渲染流水线固化为 `src/utils/markdown/index.ts` 的 `renderPost()`：
```
原始 rawContent
  → matter(content).content                 剥 frontmatter
  → md.render(highlight.js + note 容器)     markdown-it 渲染 + 插件
  → resolveImagePaths(html, articleSlug)    img src 前缀改写
  → sanitizeHtml(html)                      XSS 过滤
  → 返回 html
```
> **顺序绝不能乱**：图片路径改写必须在 XSS 过滤之前，否则 `src` 被安全清洗后我们拿不到原始相对路径做前缀拼接。

### 子任务 2.4：Step 1 页面层增强（在不修改核心渲染逻辑的前提下补交互）

- BlogPostView 底部加 prev/next 导航（usePosts.getPrevNext）。
- 手写两个小交互：① 代码块复制按钮（onMounted querySelectorAll `pre>code` 插 button）；② 图片点击 Lightbox（onMounted 给 `.article img` 绑 click 弹全屏 mask + img）。
- 这两项 ponytail：不装 viewerjs / vue-clipboard 新依赖，手写 30 行以内够用。

### 子任务 2.5：Step 2 验收清单

1. **关键操作**：在文件管理器中**永久删除 `src/content/posts/` 整个目录**（并提交 git，确保真的没有退路）。
2. `.env` 检查：`VITE_BLOG_DATA_SOURCE=cache-fs`、`VITE_BLOG_POSTS_REPO`、`VITE_BLOG_POSTS_BRANCH` 填正确。
3. `pnpm dev` 启动，控制台能看到 `[sync-posts] 从 GitHub 下载 N 个 md 文件，M 个 assets 文件` 日志，无红色错误。
4. 浏览器访问 `/blog` 和 `/blog/hello-blog`，**渲染结果肉眼和 Step 1 完全一致**，新增变化仅限：代码块彩色高亮、`::note` 块有样式、代码块右上角有"复制"按钮、点击图片可弹大图。
5. 向文章仓库 push 一篇新 md（如 `2026-08-11-third.md`，带 H1）→ 本机停止 dev → 再 `pnpm dev` → 列表页自动出现 3 篇（证明 dev-remote 通路真实从 GitHub 拉数据，不是吃旧缓存）。
6. XSS 验证：在文章仓库某篇文章里写 `<img src=x onerror=alert(1)>`（**先设 `_` 草稿避免线上别人看到**）→ dev 打开 → 图片能显示（src=x 保留）但 `onerror` 属性被剥，F12 Console 无 alert（sanitize 生效）。

---

## Step 3：公网部署 + 自动化（预计 1 ~ 2 天）

> **进入条件**：Step 2.5 全 6 项验收通过。
> **验收目标**：Step 3.6 清单全部打勾 — 线上可用 + 自动化闭环。

### 子任务 3.1：同步脚本补齐 prod + dev-local 模式

`scripts/sync-posts.mjs` 扩展三个模式的优先级回退链：

```
syncPosts(mode)
  ├─ mode === 'prod'
  │   ├─ 优先：git clone --depth=1 --filter=blob:none --sparse（带 token 注入 URL）
  │   │          → sparse-checkout set posts
  │   │          → 拷贝 .tmp-repo/posts/* → .cache/posts
  │   │          → rm -rf .tmp-repo
  │   ├─ 失败 fallback：走 dev-remote（GitHub Contents API）
  │   └─ 再失败 fallback：读 .cache/posts-index.json（上一次缓存）
  │       ├─ 若 .cache 也空 → process.exit(1)（禁止空博客上线）
  │       └─ 否则打印 warning 继续
  ├─ mode === 'dev-local'
  │   └─ fs.cp(VITE_BLOG_LOCAL_POSTS_PATH → .cache/posts, recursive:true)
  └─ mode === 'dev-remote'（Step 2 已实现）
      └─ GitHub API 递归下载
```

**缓存策略**（避免每次构建重复下载）：
- 每次 prod/dev-remote 下载成功后，先 `GET /repos/{repo}/git/refs/heads/{branch}` 拿 commit sha，写 `.cache/posts-commit-sha.txt`。
- 下次 sync 时若 sha 未变、且 `.cache/posts/` 非空 → `console.log('[sync-posts] commit sha 未变，跳过下载')` 直接 return，节省构建时间。

### 子任务 3.2：构建命令串 + RSS + sitemap

`package.json` 脚本段修改：
```json
"scripts": {
  "dev": "vite",
  "prebuild": "node scripts/sync-posts.mjs prod",
  "build": "vue-tsc -b && vite build",
  "postbuild": "node scripts/generate-rss.mjs && node scripts/generate-sitemap.mjs"
}
```
（开发期 dev 不跑 prebuild，因为 vite-plugin-posts 的 configureServer 已经同步了；prod build 必须跑 prebuild 保证虚拟模块输入准备好。）

两个 postbuild 脚本：
- **`scripts/generate-rss.mjs`**：读 `.cache/posts-index.json` + 每篇文章用 `renderPost()`（复用同一套渲染函数，保证 feed HTML 和站点正文一致，经验 1308517）→ 生成标准 RSS 2.0 XML → 写 `dist/blog/feed.xml`。
- **`scripts/generate-sitemap.mjs`**：合并硬编码的 `/`、`/blog` + postsIndex.all 中每篇 `/blog/${slug}` → 生成标准 sitemap XML → 写 `dist/sitemap.xml`。

SEO 元信息：
- 不装 `@vueuse/head`（Ponytail 省依赖），新建 `src/composables/useSeoMeta.ts`，手写 document.title 动态设置 + `document.querySelector('meta[name=description]')` 替换内容 + og:* 标签（没有就 appendChild）。
- BlogListHome 调一次（title=Blog, description=文章列表），BlogPostView 调一次（title=post.title, description=post.excerpt, og:url=/blog/${slug}）。

### 子任务 3.3：Vercel 部署（手动点 UI，不写额外代码也能走通）

1. **Vercel 面板** → Add New → Project → Import 你的主项目 Git 仓库。
2. Framework Preset 自动识别为 **Vite**，保持默认。
3. **Environment Variables** 面板填入：
   - `GITHUB_TOKEN`：你的 GitHub PAT（至少 `public_repo` scope；**注意不加 VITE_ 前缀**，否则会打进客户端 bundle 泄漏）
   - `VITE_BLOG_POSTS_REPO`
   - `VITE_BLOG_POSTS_BRANCH`（默认 main）
   - `VITE_BLOG_POSTS_DIR`（默认 posts）
   - `VITE_BLOG_DATA_SOURCE=cache-fs`
4. 点 **Deploy**。等 2~3 分钟，构建成功后访问分配的 `*.vercel.app` 域名 → `/blog` 可看文章。

（根 `vercel.json` 可以不写，Vite + Vercel 默认配置就够用；将来要自定义缓存规则 / cleanUrls 再补。）

### 子任务 3.4：文章仓库 Push 自动触发主站重建（Deploy Hook Webhook）

1. **Vercel 项目 → Settings → Git → Deploy Hooks**：
   - Name：`blog-posts-updated`
   - Branch：`main`
   - Create → 复制生成的 URL：`https://api.vercel.com/v1/integrations/deploy/<hook_id>`
2. **GitHub 文章仓库 → Settings → Webhooks → Add webhook**：
   - Payload URL = 上面的 Deploy Hook URL
   - Content type = `application/json`
   - Which events = **Just the push event**
   - Add webhook
3. 验证：向文章仓库 push 一篇小改动（比如示例文章改标题）→ 切到 Vercel 面板 → Deployments 能看到一条新的构建被触发（Trigger = "Deploy Hook"）→ 3 分钟后线上出现新内容。

### 子任务 3.5：样式打磨 + 响应式 + 文档

- `pnpm add -D @tailwindcss/typography` → `tailwind.config.js` plugins 加入 → 全局样式把 `--tw-prose-*` 系列变量绑定到项目现有 CSS 令牌（`--text` / `--text-h` / `--accent` / `--code-bg` 等）。替换 BlogPostView 里手写的简单 CSS，用 `<article class="prose">` 驱动。
- 响应式检查：BlogListHome 卡片 `grid-cols-1 md:grid-cols-2`；BlogPostView `max-w-[72ch] mx-auto`；图片 `.prose img { max-width:100%; height:auto; border-radius: 0.5rem; }`；代码块 `.prose pre { overflow-x:auto; white-space: pre; }`。
- **文档 6.1（非技术作者用）**：写到**文章仓库**的 README.md，中文写明：文件名格式、H1 必写、草稿加 `_`、图片放到 `assets/<slug>/`、`::note` 语法、push 后约 3 分钟上线。
- **文档 6.2（开发者用）**：追加到主项目 `README.md` 的 "Blog Development" 章节：Step 1/2/3 切换方式、环境变量含义、如何本地预览、Vercel 部署步骤。

### 子任务 3.6：Step 3 最终验收（线上黄金路径）

1. 线上 `https://你的域名/blog`：列表正常；点卡片进详情；prev/next 导航存在；代码块有高亮和复制；图片点一下弹大图。
2. `https://你的域名/blog/feed.xml`：浏览器打开是合法 XML，`<item>` 数量和列表页文章数一致，用 Feedly 试订阅能拉到最新文章。
3. `https://你的域名/sitemap.xml`：包含 `/` `/blog` 和每篇 `/blog/:slug` 全量 URL。
4. **自动化验证**：文章仓库 push 一篇新 md（`_` 前缀草稿 push 后再改回正式名，避免线上出现废稿）→ 观察 Vercel Deployments 自动启动 → 3 分钟后线上列表出现新文章。
5. **移动端**：Chrome DevTools 模拟 iPhone 宽度 → 列表单列；代码块能横向滚动不折行；图片不溢出屏幕；表格能横向滑动。
6. **回滚演练**（可选但强烈建议跑一次）：在 Vercel 部署列表里 Rollback 到上一个版本 → 确认线上内容回退到 push 前的状态 → 再重新 Deploy Latest → 内容恢复；验证有问题时能秒回退。

---

## 附录 A：每一步都可执行的"急救开关"（出问题时不翻代码）

| 症状 | 立刻操作 | 说明 |
|---|---|---|
| Step 2/3 开发期 `pnpm dev` 报同步错误，想临时写一篇文章调样式 | `.env` 改 `VITE_BLOG_DATA_SOURCE=local-glob` + 新建 `src/content/posts/` 丢一篇 md 进去 | 秒退到 Step 1 模式，UI 层零改动 |
| Step 3 线上构建报 GitHub API 403 rate limit | Vercel 环境变量补 `GITHUB_TOKEN`（PAT，public_repo scope 即可）→ 点 Redeploy | 匿名 60 次/小时很容易耗尽，生产必须填 token |
| 某篇文章渲染后出现 XSS 弹窗（sanitize 白名单漏了） | 立刻把那篇文章文件名加 `_` 前缀 push 到文章仓库 → 3 分钟后线上变草稿不再对外显示 | 热修复，不用停服；本地补白名单后再正常发布 |
| Step 2 启用 highlight.js 后代码块样式错乱 | 先 `//` 注释掉 `md.use(markdownItHighlightjs)` 一行 → 回到无高亮 | highlight.js 主题 CSS 未正确引入时最常见；先关插件再排查 CSS import 路径 |
| Deploy Hook 被恶意刷，Vercel 构建额度耗尽 | GitHub Webhook 面板临时 Disable Webhook | 临时方案；真要长期防护加 Cloudflare Worker 签名校验 |

---

## 附录 B：已知风险、熔断策略与教训来源

| 风险 | 来源经验 | 处理方式 |
|---|---|---|
| pnpm 装依赖后虚拟仓库路径不一致 → 构建报错 | 230905 | Step 1 装包前先 `node -v`、`pnpm -v` 记录版本；不一致时先 `rm -rf node_modules pnpm-lock.yaml && pnpm install` 再 add |
| Markdown 渲染页面空白无报错 → 难以定位 | 230905 | Step 1 写 BlogPostView 时，v-html 前必须先用 `console.log({meta, html})` 打两个变量，确保 meta 和 html 都非 undefined；控制台空就先查变量不查模板 |
| 前后端（浏览器渲染 vs RSS 生成脚本）Markdown 输出不一致 | 1308517 | **强制两侧只通过 `renderPost()` 这一个入口**，RSS 生成脚本绝不重写 HTML 拼接；每次改 parser 插件顺序时，Node 自校验脚本同时断言 `renderPost(同一段md)` 的 HTML 哈希值不变 |
| `.cache/posts/` 文件变化后 Vite 无限重启 → CPU 100% | 方案原风险 6 节 | vite-plugin-posts 的 `server.watch.add` 只监听 `**/*.md`，**排除 assets/**；同步脚本写文件前 `fs.stat` 比 mtime + content hash，内容未变就跳过 `writeFile` |
| Shiki 构建期下载 ONIGURUMA WASM / 主题 JSON 超时 | 方案原风险 | Step 2 选 highlight.js（纯 JS、同步、无网络），不选 Shiki；Shiki 留作 Step 3 之后的可选升级项，上线稳定了再说 |
| buildPostsIndex 在 Node vs Browser 中日期排序结果不同 | 1308517 同类问题（不同环境结果漂移） | **严格按 dateStr 字符串字典序排序**（`localeCompare`，不转 `new Date()`）— 任何时区任何环境，同一字符串的字典序绝对一致 |

---

## 下一步：如果本规划确认无误

**下一轮实际编码严格按 Step 1.0.1 → 1.0.2 → 1.0.3 → 1.1 → 1.2（含自校验脚本）→ 1.3 → 1.4 顺序落地**，期间每完成一个子任务立刻跑对应子任务的"验收"小断言，确保不把错误带到下一步。

Step 1 全部代码写完后，由你手工按 1.5 清单做浏览器验证；全部打勾我们再进 Step 2。
```

---

上面的内容是对 `docs/task1.1.md` 的完整覆盖版（替换原有的六阶段结构，变成三步走），你可以手动复制到文件中保存，或告诉我"帮我写入"我就实际改文件。

关于"不予采纳"的部分，我没有任何要驳回的 — 你的递增路径完全正确，是比我原方案更好的排序。唯一两处我建议注意的小补充（文档内已写明）：
1. Step 1 中**不要启用 `html:true`**，先禁内嵌 HTML，避免 XSS 问题提前介入；等 Step 2 的 `xss` 库和白名单就位后再开。
2. 代码高亮 **Step 2 先用 highlight.js（同步、无构建期网络），不要一开始就上 Shiki**（经验里多项目遇到过 Shiki 在 Windows/Vercel 下载 WASM 超时的问题），等上线稳定再考虑升级。