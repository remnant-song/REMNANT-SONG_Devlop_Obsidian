
---

> *2026-08-09 14:49:57*


好。基于你锁定的三项选择（**双仓库 / 暂不引入 frontmatter / markdown-it**），下面给出一份逐步可执行的细化规划。每个任务都标注了**前置依赖、动作拆解、验收标准、风险/扩展点**，确保将来补回 frontmatter、切换到单仓库或加新插件时不需要推翻重做。

---

## 一、开工前的关键设计约束（先定，否则每一步都会反复）

在动手前先把几个"双仓库 + 无 frontmatter"场景下必须拍板的规则明确下来（这些都是可在项目里改成常量/配置的，暂不写代码，只是对齐预期）：

### 1.1 文章仓库约定（独立仓库，建议名 `remnant-song-blog-posts`）

```text
remnant-song-blog-posts/
├── posts/                    # 文章主目录（构建时仅拉这个目录，避免 README/LICENCE 污染）
│   ├── 2026-08-09-hello.md
│   ├── 2026-08-10-about.md
│   └── assets/               # 文章引用的图片，与主仓库文章同级
│       └── 2026-08-09-hello/
│           └── cover.png
└── README.md                 # 写给非技术作者的写作规范（第 6 阶段再写）
```

- **文件命名强约束**：`YYYY-MM-DD-slug.md`，slug 只允许 `[a-z0-9-]+`（这会是将来路由 /blog/:slug 的唯一来源，没有 frontmatter 可兜底）。
- **日期提取**：从文件名前缀前 10 位 `YYYY-MM-DD` 解析为文章日期。
- **slug 提取**：文件名去掉日期前缀和 `.md`，即 `YYYY-MM-DD-` 之后的部分。
- **标题提取**：解析 markdown 正文**第一个 `#` 一级标题**作为标题；找不到则用 slug 转大写（首字母大写 + `-` 转空格）做兜底。
- **排序键**：文件名日期倒序（天然就是字典序同构，无需解析 Date 对象即可正确排序，性能好且省代码）。
- **草稿机制**：不用 frontmatter 的 `draft: true`，改用目录约定 — 文件名前缀加 `_` 即视为草稿，如 `_2026-08-09-draft.md`（构建时过滤掉 `_` 开头的）；将来补 frontmatter 时再升级。

> **ponytail：无 frontmatter 不是永久阉割，而是把"元数据来源"这一层做成可替换适配器。** 现在实现 `parsePostMetaFromFilename(mdContent, fileName)`，将来换实现成 `parsePostMetaFromFrontmatter(mdContent)` 即可，调用方不变。

### 1.2 主项目里的文章缓存目录（`.cache/posts/`）

- 开发期同步脚本 / 构建前同步脚本把文章仓库 `posts/` 内容**全量下载到主项目根的 `.cache/posts/`** 下。
- `.cache/` 加到 `.gitignore`（它是构建产物，不提交）。
- Vite 的 `server.watch` 监听 `.cache/posts/**/*.md` 变化（第二阶段用到，实现本地同步后热更新）。

### 1.3 同步策略：开发期 vs 生产期

| 场景 | 方案 | 为什么 |
|---|---|---|
| **开发期本地调试** | 手动 clone 文章仓库到 `../remnant-song-blog-posts/`，主项目启动时通过 `scripts/sync-posts.mjs dev` 把 `../remnant-song-blog-posts/posts/` 同步（硬链接或拷贝）到 `.cache/posts/` | 本地写 md 后即时预览，不走网络，零 token 配置 |
| **开发期远端预览**（别人 PR 或 CI） | `scripts/sync-posts.mjs dev` 若没找到本地目录 → 退化到 GitHub API 下载 `defaultBranch:main` 的 `posts/` 目录树（用 `GITHUB_TOKEN` 或匿名 60 次/时限制） | 本地没克隆文章仓库时也能跑起来 |
| **生产构建 (vercel / pnpm build)** | 构建脚本 `prebuild` 自动执行 `scripts/sync-posts.mjs prod`，优先 git shallow clone `--depth=1`（比 GitHub Contents API 快、无单文件 1MB 限制）；失败回退 GitHub API；再失败用 `.cache` 缓存（网络抖动容错） | 构建可重复、不依赖开发期的手工 clone |

### 1.4 环境变量（需要加到 `.env` 和 `.env.d.ts`，这一步放到任务 1.2 一起做）

| 变量 | 示例 | 用途 |
|---|---|---|
| `VITE_BLOG_POSTS_REPO` | `your-name/remnant-song-blog-posts` | 文章仓库 `<owner>/<name>` |
| `VITE_BLOG_POSTS_BRANCH` | `main` | 远端分支名 |
| `VITE_BLOG_POSTS_DIR` | `posts` | 仓库内文章子目录（将来改结构只需改这里） |
| `VITE_BLOG_LOCAL_POSTS_PATH` | `../remnant-song-blog-posts/posts` | 本地开发期文章仓库相对路径 |
| `GITHUB_TOKEN`（纯服务端，不要加 `VITE_`） | `ghp_xxx` | 构建时拉取私有仓库或提升 API rate limit；生产环境变量里配 |

---

## 二、阶段化详细步骤清单（每一阶段都可独立验收）

---

### 第零阶段收尾：目录与脚手架约定
> **前置依赖**：无。**预计工作量**：最小。

#### 任务 0.3（补完）：博客模块目录结构落地

- 在现有项目中补齐以下空目录 / `.gitkeep`，不写业务代码：
  ```text
  src/
  ├── views/blog/               # 博客页面（3.x 阶段写）
  │   └── .gitkeep
  ├── utils/markdown/           # markdown 解析、元数据提取
  │   └── .gitkeep
  ├── composables/              # 已经有 .gitkeep
  ├── types/                    # 类型定义（PostMeta 等）
  │   └── .gitkeep
  scripts/                      # 构建脚本（同步文章、生成 RSS），放到根目录
  └── .gitkeep
  .cache/                       # 同步产物目录
  └── .gitkeep
  ```
- `.gitignore` 追加：`.cache/`、`scripts/*.log`。
- **验收**：`git status` 里看到 `.gitkeep` 提交，`.cache` 目录 untracked 不出现。

#### 任务 0.4（双仓库版）：创建文章仓库 + 第一篇示例 md
- 在 GitHub 手动创建公开仓库 `remnant-song-blog-posts`，结构按 1.1 约定。
- 提交第一篇文章 `posts/2026-08-09-hello-blog.md`，内容含：
  ```markdown
  # 你好，博客

  这是第一篇示例文章。

  ## 小标题

  - 列表项 1
  - 列表项 2

  ```js
  console.log('hello')
  ```

- **验收**：浏览器访问文章仓库能看到 `posts/` 下的 md 文件。

---

### 第一阶段：内容获取与处理（文章从磁盘 → 内存数据结构）
> **前置依赖**：0.3 / 0.4 完成。**预计工作量**：中等。核心是脚本 + 纯函数，不涉及 UI。

#### 任务 1.0：安装依赖
- `pnpm add -D markdown-it gray-matter isomorphic-dompurify`
  - `gray-matter` 虽然现在不解析 frontmatter，但**先装上占坑**，等以后启用时零迁移；当前解析器里先不用它，只调 `matter(string).content` 剥掉 frontmatter（防止文章仓库有人提前写了 frontmatter 导致渲染异常）。
  - `isomorphic-dompurify`（或更轻的 `xss` 包二选一，推荐 `xss`，因为 isomorphic-dompurify 需要 canvas 原生依赖，构建在 Windows/CI 上容易爆）— 规划文档 2.6 XSS 过滤。
- `pnpm add -D @types/markdown-it`
- **验收**：`package.json` devDependencies 新增以上条目，`pnpm dev` 依然启动不报错。

#### 任务 1.1：类型定义（`src/types/post.ts`）
- 定义 `PostMeta` 接口：
  ```ts
  interface PostMeta {
    slug: string               // YYYY-MM-DD-slug 去掉日期
    fileName: string           // 原始文件名，含 .md
    dateStr: string            // YYYY-MM-DD，从文件名提取
    title: string              // 从正文第一个 H1 提取，兜底 slug 格式化
    tags: string[]             // 暂时空数组，将来 frontmatter 填
    excerpt: string            // 暂时空字符串 / 正文前 N 字截断，将来 frontmatter 填
    draft: boolean             // 文件名以 _ 开头 = true
    srcPath: string            // .cache/posts/xxx.md 绝对或相对路径
  }
  ```
- 定义 `PostsIndex`：`{ all: PostMeta[], bySlug: Record<string, PostMeta>, tags: Record<string, PostMeta[]> }`。
- **验收**：TS 类型检查通过；构造一个 mock PostMeta 对象 `tsc -b` 零错误。

#### 任务 1.2：同步脚本（`scripts/sync-posts.mjs`，ESM 脚本）
这是双仓库方案的**唯一核心复杂度点**，必须先写好。分三个子模式：

1. **`dev-local` 模式**（默认，开发期首选）：
   - 读取 `VITE_BLOG_LOCAL_POSTS_PATH` → 判断路径是否存在 → 若存在，`cp -rL`（或 `fs.cp(recursive:true)`）把该目录拷贝到 `.cache/posts/`。
   - 打印日志：`[sync-posts] 使用本地文章源：../remnant-song-blog-posts/posts，共 N 个文件`。

2. **`dev-remote` 模式**（本地路径不存在时自动 fallback）：
   - 用 `fetch` 调 GitHub Contents API：`GET https://api.github.com/repos/{owner}/{repo}/contents/{dir}?ref={branch}`。
   - 遍历返回数组，对 `type === 'file'` 且 `.md` 结尾的项再逐条 `GET download_url` 下载内容，写入 `.cache/posts/`。
   - `type === 'dir'`（如 `assets/`）递归同样处理。
   - 有 `GITHUB_TOKEN` 就在 Header 加 `Authorization: Bearer ${token}`，否则匿名。
   - 失败（403 rate limit / 网络不通）打印 warning 并尝试复用 `.cache/posts/` 上一次的内容（容错）。

3. **`prod` 模式**（`prebuild` 钩子调用）：
   - 优先尝试 `git clone --depth=1 --branch=${branch} --filter=blob:none --sparse <https://x-access-token:${GITHUB_TOKEN}@>github.com/${repo}.git .tmp-repo`，然后 `sparse-checkout set ${dir}`，再 `cp .tmp-repo/${dir}/* .cache/posts/`，最后 `rm -rf .tmp-repo`。
   - git 命令失败（Windows CI 没装 git / token 不对）回退到 dev-remote 的 GitHub API 流程。
   - 最终必须保证 `.cache/posts/` 至少有文章，否则 `process.exit(1)`（构建失败防静默发版空博客）。

- 所有模式：同步完成后生成 `.cache/posts-index.json`（内容是 `PostsIndex` 结构），方便下一阶段的 composable 一次性读取，不用运行时再扫文件。
- **验收标准**：
  - `node scripts/sync-posts.mjs dev-local` 在你手动 clone 文章仓库到 `../` 后成功拷贝到 `.cache/posts/`。
  - 删掉本地文章路径后，`node scripts/sync-posts.mjs dev-remote` 能匿名拉到 `posts/` 的 md（60 次/时限额足够调试）。
  - 三种模式任一成功后 `.cache/posts-index.json` 内容结构正确。

#### 任务 1.3：纯函数工具层（`src/utils/markdown/`）

这一层只导出纯函数，**不依赖 Vite / 浏览器 / DOM**，方便在 Node 脚本（同步、生成 RSS）和浏览器（渲染、列表过滤）两侧复用：

1. **`parsePostFileName(fileName: string): Omit<PostMeta, 'title'|'tags'|'excerpt'|'srcPath'>`**
   - 用正则 `/^(_?)(\d{4}-\d{2}-\d{2})-(.+)\.md$/` 匹配：`_` 前缀 → draft，日期 → dateStr，剩余 → slug。
   - 不匹配 → 返回 `draft: true` 兜底（未知格式文章不发布，保护线上），`dateStr` 用当前日期，`slug` 用文件名去掉 `.md`。

2. **`extractTitleFromMarkdown(content: string): string`**
   - 正则 `/^#\s+(.+)$/m` 取第一行 H1。
   - 没取到 → `slug.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())`。

3. **`extractExcerptFromMarkdown(content: string, len = 180): string`**（先实现，虽然现在无 frontmatter）
   - 剥掉 `# H1` 后的前几段纯文本（去 markdown 标记），截断到 `len` 字，加 `...`。

4. **`buildPostsIndex(fileEntries: {fileName: string, content: string, srcPath: string}[]): PostsIndex`**
   - 调上述三个函数 + 日期倒序排序（`dateStr.localeCompare` 字典序即倒序正确，因为 `YYYY-MM-DD` 是 ISO 格式）。
   - `bySlug` key 用 `slug`，冲突时打印 warning，后出现的覆盖前的（或追加 `-2`，简单起见先覆盖）。
   - `tags` 聚合暂时空（`{}`），等 frontmatter 启用时此处只加 2 行。
   - 过滤 `draft === true`：`all` 和 `bySlug` 里都不含草稿，但 debug 模式（`import.meta.env.VITE_DEBUG === 'true'`）在开发期可显示草稿（列表页加 `[草稿]` 前缀）。

5. **ponytail 点**：目前 `buildPostsIndex` 的排序是 `sort((a,b) => b.dateStr.localeCompare(a.dateStr))`，如果两篇文章同一天，再按 slug 字典序；将来 frontmatter 支持 `weight/pin` 置顶时，只需改为 `sort((a,b) => (b.weight||0) - (a.weight||0) || b.dateStr.localeCompare(a.dateStr))`，调用方无感知。

- **验收**：写一个 Node 自校验脚本（`scripts/self-check-posts.mjs`），用示例数据跑 `buildPostsIndex`，`assert` 排序、草稿过滤、bySlug 查找都符合预期；这个脚本以后可当 CI 健康检查用。

#### 任务 1.4：在 Vite 开发期注入 `PostsIndex`（`src/composables/usePosts.ts`）

- 开发期 & 构建期统一通过 **Vite 插件 + 虚拟模块** 暴露数据，而不是在每个组件里 `import.meta.glob`：
  - 新建 `vite.config.ts` 的插件（先占位，名字叫 `vite-plugin-posts`，放在 `scripts/` 下），插件干两件事：
    1. **开发期 `configureServer`**：启动时跑 `sync-posts.mjs dev-local`（fallback dev-remote），然后读 `.cache/posts-index.json` 作为虚拟模块的内容。
    2. **构建期 `buildStart`**：同样先跑 `sync-posts.mjs prod`（其实可和 `prebuild` 脚本二选一，推荐两者都有，`prebuild` 是保险 — Vercel 偶尔会跳过 vite 插件的 `buildStart` 执行）。
  - 虚拟模块 ID：`virtual:posts`，导出 `const postsIndex: PostsIndex`。
  - `.env.d.ts` 追加模块声明 `declare module 'virtual:posts' { export const postsIndex: import('@/types/post').PostsIndex }`。
- `usePosts()` composable 只做两件事：`import { postsIndex } from 'virtual:posts'`，然后返回 `useMemo` 过的 `all / bySlug(slug) / getPrevNext(slug)`（上一篇/下一篇在 3.4 再实现，先占位返回 `{prev:null, next:null}`）。
- **为什么不用 `import.meta.glob`**：规划文档 1.1 说的 `import.meta.glob` 方案在"纯本地 md"场景下最省事，但你选了双仓库，构建产物来自 `.cache/`，用 virtual module 更干净 — 而且开发期同步后虚拟模块能热更新，组件无需感知数据从哪来。
- **验收**：启动 `pnpm dev`，在 HomeView 临时 `console.log(usePosts().all)` 能看到文章数组（日志打完立刻删，不改现有视图，留到第三阶段）。

---

### 第二阶段：Markdown 渲染 + 安全 + 图片路径 + 自定义组件占位
> **前置依赖**：1.4 完成（能拿到 post content）。**预计工作量**：中等。

#### 任务 2.1：markdown-it 基础配置（`src/utils/markdown/parser.ts`）

- 导出单例 `md = new MarkdownIt({ html: true, linkify: true, breaks: false })`：
  - `html: true` — 对应规划 2.3 内嵌 HTML 支持（配合下游 XSS 过滤）。
  - `linkify: true` — 自动识别 URL 生成链接。
- **未来插件预留钩子**（先写注释 + 占位 `plugins` 数组，将来逐个启用）：
  ```ts
  // ponytail: 以下插件逐个启用，当前先注释，保持 minimal working set
  // md.use(anchor)                  // 2.2 标题锚点
  // md.use(shiki)                   // 2.1 代码高亮 Shiki，比 highlight.js 好看
  // md.use(copyButton)              // 2.2 代码块复制按钮（自定义 renderer rule）
  ```
- 导出 `renderMarkdown(content: string): string`：内部先过 `gray-matter` 剥 frontmatter（即使当前不用，防止文章里写了导致渲染出 `---`），再过 `md.render`。

#### 任务 2.2：XSS 安全过滤（`src/utils/markdown/sanitize.ts`）

- 用 `xss` 库，配置白名单：
  - 允许所有标准 markdown 生成的标签（`h1~h6 / p / ul / ol / li / a / img / blockquote / code / pre / table / thead / tbody / tr / th / td / hr / br / em / strong / del / sup / sub`）。
  - `a` 标签允许 `href / title / target`，强制 `rel="noopener noreferrer"`，`href` 禁止 `javascript:` 协议。
  - `img` 标签允许 `src / alt / title`，`src` 允许 `http(s)://`、相对路径、`data:image/`。
  - **自定义组件占位容器**：允许 `data-*` 属性（`::note` 将来会转成 `<div data-md-note="tip">...</div>`），所以白名单里放行 `data-md-*`。
- 过滤函数签名 `sanitizeHtml(html: string): string`。
- **验收**：自校验断言 `<script>alert(1)</script>` 渲染后被剥离，`<img src=x onerror=alert(1)>` 的 `onerror` 被剥但 `src` 保留。

#### 任务 2.3：图片路径转换（`src/utils/markdown/image-path.ts`）

这是双仓库/相对路径坑最多的一步，先定规则：

| md 中写的 src | 解析后输出到哪里 | 构建后访问路径 |
|---|---|---|
| `./assets/2026-08-09-hello/cover.png`（相对 md 文件） | 同步脚本 1.2 已拷贝到 `.cache/posts/assets/...` → Vite 构建时把 `.cache/posts/assets/**` 拷贝到 `dist/blog/assets/` | `/blog/assets/2026-08-09-hello/cover.png` |
| `/images/logo.png`（绝对路径，文章仓库根） | 同步脚本拷到 `.cache/posts/images/logo.png` → `dist/blog/images/logo.png` | `/blog/images/logo.png` |
| `https://...`（外部 URL） | 原样保留 | 原样 |

- 做法：markdown-it 的 `renderer.rules.image` 重写，在 `sanitizeHtml` 之前先替换 `href`：
  - 对相对路径（非 `/` 开头、非 `http(s)://`、非 `data:`）：前缀拼接 `/blog/assets/`（或按上面分类，但先简单粗暴统一前缀 + 将来再细分），同时写一个 Vite 插件在 `generateBundle` 时把 `.cache/posts/**/*.{png,jpg,gif,svg,webp,mp3,wav}` 全拷进 `dist/blog/` 对应子目录（保持相对结构）。
- ponytail：先用 Vite 插件的 `writeBundle` 一步 `fs.cp` 全量拷贝 assets，不做按需 / hash 命名 — 等文章多了图片重复时再升级到 import.meta.URL + rollup asset emit。

#### 任务 2.4：自定义组件注入骨架（`src/utils/markdown/custom-containers.ts`）

规划文档 2.5 要求预留接口。先只实现一个最小可验证的：

- Markdown 语法：
  ```markdown
  ::note tip
  这是提示内容，**支持 markdown**。
  ::
  ```
- 用 markdown-it 的 `block ruler.before('fence')` 自定义块级规则，把三行 `::note <type>` + body + `::` 渲染为：
  ```html
  <div class="md-note md-note--tip" data-md-container="note">
    <div class="md-note__body">这是提示内容，<strong>支持 markdown</strong>。</div>
  </div>
  ```
- class 命名统一前缀 `md-*`（对应规划 6.3 "预留样式钩子"），将来风格切换只写 CSS 覆盖。
- 音频播放器、乐谱占位：**先不实现组件本身**，但在 `custom-containers.ts` 里预留两个禁用的空规则（注释掉），接口签名与 `::note` 相同 — 将来启用时解注释 + 加 Vue 组件即可，不影响 parser 签名。
- XSS 白名单里已放行 `data-md-*`，所以 `data-md-container="note"` 能保留。

#### 任务 2.5：渲染流水线串接（`src/utils/markdown/index.ts`）

- 唯一导出：`async renderPost(content: string): { html: string }`
- 内部调用顺序：`stripFrontmatter → md.render → resolveImagePaths → sanitizeHtml`
- 顺序很重要：**图片路径替换必须在 XSS 过滤之前**（否则 `img.src` 被改成安全字符串后我们拿不到原始值）。
- ponytail：暂时同步函数，等接入 Shiki（Shiki 是异步加载主题）再改为 async；调用方从一开始就按 async 写，避免后续改签名。

- **验收**：自校验 Node 脚本给一段含 `::note` + 相对路径图片 + `<script>` 的 markdown，断言输出 HTML 里 `<script>` 被剥、图片路径变 `/blog/assets/...`、`::note` 变成 `div.md-note`。

---

### 第三阶段：页面与路由
> **前置依赖**：2.5 完成（有了渲染函数）。**预计工作量**：中大，出 UI。

#### 任务 3.1：路由骨架（`src/router/index.ts`，在 404 通配之前插入）

按规划 3.1~3.5 加路由，**全部懒加载**，标题走 i18n：

```ts
{
  path: '/blog',
  name: 'BlogList',
  component: () => import('@/views/blog/BlogListView.vue'),
  meta: { title: 'Blog' },       // i18n 占位，实际用 t('nav.blog')
  children: [
    {
      path: '',                 // /blog 列表页（父级 path 已匹配）
      name: 'BlogListHome',
      component: () => import('@/views/blog/BlogListHome.vue'),
    },
    {
      path: 'tag/:tag',          // /blog/tag/vue
      name: 'BlogTagFilter',
      component: () => import('@/views/blog/BlogTagFilterView.vue'),
      props: true,
    },
    {
      path: 'archive',           // /blog/archive（先占路由，第 6 阶段再做 UI）
      name: 'BlogArchive',
      component: () => import('@/views/blog/BlogArchiveView.vue'),
    },
    {
      path: ':slug',             // /blog/hello-blog（放最后，避免匹配 tag/archive）
      name: 'BlogPost',
      component: () => import('@/views/blog/BlogPostView.vue'),
      props: true,
    },
  ],
}
```

- 路由顺序：**父级 `/blog` → 精确 `/blog` → `/blog/tag/:tag` → `/blog/archive` → `/blog/:slug`**，防止 `:slug` 先匹配到 `tag` 字符串。
- **扩展点**：规划文档说也支持 `/blog/[year]/[month]/[slug]`，当前只做短的那个，将来再加一条路由（同一个组件，props 里 year/month 可选），不破坏现有 URL。

#### 任务 3.2：列表页（`BlogListHome.vue` + `BlogPostCard.vue`）

- BlogListHome：从 `usePosts().all` 拿到排好序的数组；初期规划说"前 N 篇或加载更多"，先做 **N=50 全量显示**（你无 frontmatter，文章数少，不值得加分页）；ponytail 注释说明"升级分页需替换 `visiblePosts` computed 为 `currentPage → slice`"。
- BlogPostCard：显示 `title / dateStr / excerpt / tags[]`（tags 暂时空数组时隐藏）；卡片点击 `router.push({ name: 'BlogPost', params: { slug } })`。
- 空状态：`all.length === 0` 时显示 "暂无文章，等待同步中…"（带 i18n key）。
- 样式：只用 Tailwind utility + 引用 CSS 变量（`var(--accent)` 等），避免硬编码颜色 / 字体（对应规划 6.2 风格切换预留）。

#### 任务 3.3：详情页（`BlogPostView.vue`）
- 接收 `slug` props → `usePosts().bySlug(slug)` 取 PostMeta；`undefined` 时走 404（`router.push({ name: 'NotFound' })`）。
- 拿到 `.cache/posts/${fileName}` 原文后，调 `renderPost(content)` 拿到 HTML，用 `v-html` 渲染到 `<article class="prose">`。
- `prose` 是 `@tailwindcss/typography` 预留 class（任务 5.1 会装），**先加 class，没装之前只是无样式不报错**。

#### 任务 3.4：上一篇 / 下一篇（在 `usePosts.ts` 实现 `getPrevNext(slug)`）
- 取 `all` 数组里当前 slug 的下标 `i`：`prev = all[i+1]`（更老），`next = all[i-1]`（更新），头尾返回 null。
- BlogPostView 底部渲染两个 link：`< 上一篇 | 下一篇 >`，无对应则置灰禁用。

#### 任务 3.5：标签页（标签列表 + 标签筛选）
- **标签数据目前是空数组**（无 frontmatter），所以这一步先完成**组件骨架**：
  - `BlogTagFilterView.vue`：渲染 "标签筛选页占位，后续启用 frontmatter 后显示 `<tag>` 下的文章"。
  - 不用做标签列表总览页（空集合没意义），先占路由；frontmatter 上线时再补。
- ponytail 注释标注数据来源切换点：`// TODO: 启用 frontmatter 后，把 usePosts().tags[tag] 作为列表源`。

#### 任务 3.6：RSS Feed（`scripts/generate-rss.mjs`，build 后执行）
- 读取 `.cache/posts-index.json` + 每篇文章原文 `renderPost` 后的 HTML，生成标准 RSS 2.0 XML：
  - `<channel><title>{app_title} Blog</title><link>/blog</link>...`
  - 每篇文章 `<item><title>...<link>/blog/{slug}<description><![CDATA[ {html} ]]></description><pubDate>RFC822</pubDate></item>`
- 输出到 `public/blog/feed.xml`（Vite build 时会原样 copy 到 `dist/blog/feed.xml`，对应规划 3.6 的路径）。
- **接入**：`package.json` 增加 `"postbuild": "node scripts/generate-rss.mjs"`。
- Atom：暂不做，RSS 2.0 覆盖 99% 阅读器，将来再加一条脚本即可。

#### 任务 3.7：SEO 元信息
- 选型：已装 `@vueuse/head`？查当前 package.json 没有 — 用原生 `document.title` + `<meta>` 动态增删即可（规划文档建议的 `@vueuse/head` 要装包，ponytail：先手写一个轻 composable `useSeoMeta({title, description, ogImage, ogUrl})`，内部 querySelector `meta[name=description]` / `meta[property=og:*]`，没有就 append；将来换 `@vueuse/head` 时只替换这个 composable）。
- BlogPostView：页面 title = `{post.title} | {app_title}`，description = `excerpt || '由 {app_title} 撰写的文章'`，og:url = `/blog/{slug}`。
- BlogListHome：title = `Blog | {app_title}`，description = `{app_title} 的博客文章列表`。
- sitemap：先手写静态版（`public/sitemap.xml` 包含 `/`、`/blog`，每篇文章 URL 先空）；第 3.6 步的 RSS 脚本旁边再加个 `generate-sitemap.mjs` 追加 post URL，用同一套输入。

#### 任务 3.8：交互细节（复制按钮 + Lightbox）
- **代码块复制按钮**：BlogPostView `onMounted` 里 `querySelectorAll('pre > code')`，给每个 `pre` 插一个绝对定位 `<button class="md-code-copy">复制</button>`；点击调 `navigator.clipboard.writeText(code.textContent)`，成功后按钮文字变 "已复制" 2s。
- **Lightbox 图片放大**：BlogPostView `onMounted` 里 `querySelectorAll('.prose img')` 注册 click，弹出全局 `div#md-lightbox`（z-100、全屏黑半透明、点击关闭），img src 取原图。ponytail：先不装 `viewerjs`/`photoswipe`，手写 30 行实现基础功能够用，将来需要轮播/缩放再升级。
- **代码块横向滚动**：在 `@tailwindcss/typography` 的 `.prose pre` 上天然支持 `overflow-x: auto`（任务 5.1 装插件后覆盖默认样式，当前先在全局样式层加一条兜底：`.prose pre { overflow-x: auto; white-space: pre; word-wrap: normal; }`）。

---

### 第四阶段：自动化 + 构建缓存
> **前置依赖**：3.6 完成（构建流水线完整）。**预计工作量**：小到中（主要是配置）。

#### 任务 4.1：构建命令串联
- `package.json` 修改：
  ```json
  "prebuild": "node scripts/sync-posts.mjs prod",
  "build": "vue-tsc -b && vite build",
  "postbuild": "node scripts/generate-rss.mjs && node scripts/generate-sitemap.mjs"
  ```
- `sync-posts.mjs prod` 必须把文章数据准备好，下游才能生成虚拟模块 / RSS。
- 错误处理：`sync-posts.mjs` 三通道（git → API → cache）都失败则 `process.exit(1)`，避免构建空博客。

#### 任务 4.2：Vercel 配置（写在根 `vercel.json`，作为文档存在，真正的部署在 Vercel UI 里点）
- vercel.json 内容：
  ```json
  {
    "buildCommand": "pnpm build",
    "outputDirectory": "dist",
    "framework": "vite",
    "cleanUrls": true,
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- Vercel 项目设置里加环境变量：
  - `GITHUB_TOKEN`（Personal Access Token，public_repo scope 即可，防止 rate limit）
  - `VITE_BLOG_POSTS_REPO` = `your-name/remnant-song-blog-posts`
  - `VITE_BLOG_POSTS_BRANCH` = `main`
- Vercel 关联主项目仓库 → push 即构建（对应规划 5.2）。

#### 任务 4.3：文章仓库 Push 触发主站重建（Deploy Hook）
- Vercel 项目 → Settings → Git → Deploy Hooks → 新建，名字 "blog-posts-updated"，分支 `main`，拿到一个 URL：`https://api.vercel.com/v1/integrations/deploy/xxxx`。
- 文章仓库仓库 → Settings → Webhooks → 新建：
  - Payload URL = 上面的 Deploy Hook URL
  - Content type = `application/json`
  - 事件 = `Just the push event`
- 这样文章仓库 push 新 md，Vercel 会跑一遍主项目的 build（`prebuild` 从文章仓库拉最新 → 构建 → 上线）。
- ponytail：Deploy Hook 公开 URL 被刷可能导致反复构建，但 Vercel 有 1 小时免费构建限额，免费用户够；真被刷时再加 Cloudflare Worker 做密钥签名校验。

#### 任务 4.4：构建缓存（避重下未变更文章）
- `sync-posts.mjs prod` 在每次同步前先拉文章仓库的 `GET /repos/{owner}/{repo}/git/refs/heads/{branch}`，拿到 commit sha，写进 `.cache/posts-commit-sha.txt`。
- 下次 sync：若 sha 没变，**跳过下载**，打印 `[sync-posts] 文章仓库无变更（sha={sha}），复用缓存`；sha 变了才重下。
- Vercel / GitHub Actions 的持久缓存：配置 `vercel.json`（或 GitHub Actions workflow）缓存 `.cache/` 目录（key 用 `pnpm-lock.yaml hash + posts-sha`），构建完 `.cache/` 保存到下次构建。
- ponytail：commit-sha 粒度已够（比按文件 hash 快 10 倍），除非文章仓库特别大（> 1GB 图片）否则不用按文件级增量。

---

### 第五阶段：样式基础
> **前置依赖**：3.2 出了列表/详情 UI 壳。**预计工作量**：小，主要装插件 + 调 CSS 变量。

#### 任务 5.1：`@tailwindcss/typography`
- `pnpm add -D @tailwindcss/typography`
- `tailwind.config.js` plugins 加 `require('@tailwindcss/typography')`
- 全局样式层追加：`.prose { --tw-prose-body: var(--text); --tw-prose-headings: var(--text-h); --tw-prose-links: var(--accent); --tw-prose-code-bg: var(--code-bg); --tw-prose-quote-border: var(--accent-border); ... }` — 把 `.prose` 的所有色板都绑到现有 CSS 变量上（对应规划 6.2，将来切主题只改变量不改 prose 内部）。
- 补充 `.prose pre` 样式：`white-space: pre; overflow-x: auto;`（移动端不折行，规划 4.3）。

#### 任务 5.2：设计令牌扩展（补充博客专用变量）
- 在 `styles/index.css` 的 `:root` 追加**博客层变量**（在品牌令牌之下，不覆盖品牌令牌）：
  ```css
  --blog-content-width: 72ch;
  --blog-gap-y: 2rem;
  --blog-card-border: var(--border);
  --blog-card-bg: transparent;
  --blog-card-hover-bg: var(--accent-bg);
  --blog-h1-size: 2rem;
  --blog-h2-size: 1.5rem;
  ```
  然后 Tailwind config 里通过 `theme.extend.spacing['blog-gap']: 'var(--blog-gap-y)'` 等方式绑定。
- 这些变量目前值和默认一致，但将来 3D/创意风格模块上线时，改一个变量就能把博客整体拉宽 / 变紧凑 / 换卡片风格（对应规划 6.3）。

#### 任务 5.3：响应式兜底
- BlogListView 的卡片：`grid grid-cols-1 md:grid-cols-2 gap-blog-gap`，移动端单列。
- BlogPostView 的 article：`max-w-[var(--blog-content-width)] mx-auto px-4`。
- 图片：`.prose img { max-width: 100%; height: auto; border-radius: 0.5rem; }`（防止溢出）。
- 代码块已在 3.8 加了 `overflow-x: auto`。

---

### 第六阶段：文档与开发者体验
> **前置依赖**：第 1~5 阶段全线跑通。**预计工作量**：小。

#### 任务 6.1：非技术作者文档（放文章仓库 README.md）
用中文逐项写清楚：
- 新建文章：在 `posts/` 下复制现有一篇，改文件名（严格 `YYYY-MM-DD-slug.md`）。
- 标题写法：正文第一行必须是 `# 你的标题`，因为系统以此作为页面 `<title>`。
- 草稿：文件名加 `_` 前缀，如 `_2026-08-10-unfinished.md`，线上不显示。
- 图片：放到 `posts/assets/<你的文章slug>/` 下，正文里用 `![说明](./assets/<slug>/xxx.png)`。
- 提示框：`::note tip / warn / danger` 的用法。
- 提交后多久上线：push 后约 2~3 分钟（Vercel 构建时间），可看文章仓库 Webhook 日志。

#### 任务 6.2：本地开发文档（主项目 README.md 追加"博客本地预览"章节）
- 克隆文章仓库到 `../remnant-song-blog-posts/`（和主项目同级）。
- `pnpm install` → `pnpm run sync:posts dev-local`（或直接 `pnpm dev`，会自动先跑 sync）。
- 预览博客列表：`http://localhost:5173/blog`。
- 草稿模式：设置 `VITE_DEBUG=true` 跑 `pnpm dev` 可以看到草稿文章（标题前标 [草稿]）。

#### 任务 6.3（可选 / 按你原规划）：ESLint + Prettier
- 当前项目还没配置（package.json 里没看到）。按 Ponytail 原则**能省则省**，除非你要和别人协作再装。
- 如果要装：`pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue prettier eslint-config-prettier`，配置文件直接用 `eslint-plugin-vue` 的 `vue3-recommended` preset，不折腾自定义规则。

---

## 三、推荐的实际执行顺序（按 1 天工作节奏排）

上面按"阶段"排列，但实际动手时建议**按"最短可验证链路"重排**（Ponytail 核心原则：每 30 分钟至少看到一个 working output）：

1. **Day 1 上午** — 0.3（目录）+ 0.4（建文章仓库 + 写 1 篇 md）+ 1.0（装依赖）+ 1.1（类型定义）
2. **Day 1 下午** — 1.2（sync-posts.mjs，跑通 dev-local 一个模式先，prod 和 remote 模式第二天补）+ 1.3（4 个纯函数 + self-check）
3. **Day 2 上午** — 1.4（virtual:posts 插件 + usePosts，在 HomeView 打 `console.log` 验证） → 2.1（markdown-it 单例） → 2.2（XSS） → 2.5（串 render 流水线）
4. **Day 2 下午** — 2.3（图片路径转换，先写死前缀，Vite 拷贝插件）+ 2.4（`::note` 容器）
5. **Day 3 上午** — 3.1（路由骨架） + 3.2（列表页） + 3.3（详情页） → 此时第一次可以在浏览器看到完整文章页
6. **Day 3 下午** — 3.4（上/下篇）+ 3.8（复制按钮 + Lightbox）+ 5.1（typography 插件 + 变量绑定） → 文章页体验可用
7. **Day 4 上午** — 3.6（RSS）+ 3.7（SEO + sitemap） + 4.1（build 串命令，本地先 `pnpm build` 验证）
8. **Day 4 下午** — 4.2（Vercel 上线） + 4.3（文章仓库 Webhook Deploy Hook） + 4.4（sha 缓存）
9. **Day 5** — 3.5（标签页占位，虽然空）+ 5.2/5.3（响应式、令牌补全）+ 6.1/6.2（文档） → 交付

---

## 四、关键风险清单 & 熔断点（开工前值得再过一遍）

| 风险 | 触发条件 | 熔断策略 |
|---|---|---|
| 双仓库同步脚本在 CI 环境 git clone 失败 | Windows runner / Vercel 默认 git 可能加了奇怪的 `core.autocrlf` | prod 模式 git 失败必须立刻 fallback GitHub API，不能阻塞 build |
| 文件名解析正则漏配（含中文 slug、驼峰文件名） | 非技术作者写了 `2026-08-09-你好.md` | parsePostFileName 失败时 draft=true + 日志 warn 明确指出"无效文件名"，保护线上不出错但给作者可排查的信息 |
| 第一版无 frontmatter → 后期补 frontmatter 文章要全部重写 frontmatter | 当文章数 > 20 篇时批量补成本高 | 在同步脚本里加**可选的 auto-frontmatter 生成模式**：根据当前 H1 / 文件名生成 frontmatter 并写回文章仓库（只在开发期 `--write-frontmatter` flag 开启），将来迁移一键完成 |
| Shiki 在构建时下载主题 / 语言 JSON 导致 Vercel 冷构建超时（> 10s） | 使用 Shiki 而非 highlight.js | 任务 2.1 先不启用 Shiki，先用 highlight.js 的 `markdown-it-highlightjs`（同步，无网络），跑通后再升级；Shiki 时预下载 JSON 到 `node_modules/.cache` 避免每次拉 |
| `.cache/posts/` 被 Vite HMR 监听后无限重启（因为 sync 脚本每次都重写文件） | 开发期 HMR watcher 配太宽 | vite 插件的 `server.watch.add` 仅监听 `.cache/posts/**/*.md`，忽略 `posts-index.json` 和 assets（图片拷贝不触发重载）；同步脚本写文件时用 `mtime` 判断内容未变则不写（避免触发 change） |

---

## 五、可以立刻开始的实际第一步（如果规划确认）

按 Ponytail 懒惰优先级，**第一个要写的代码块既不是目录也不是脚本，而是最"纯"的、最容易自校验的部分**：

> **优先开工顺序：任务 1.1（类型 `PostMeta`）→ 1.3（4 个纯函数 + self-check）→ 1.2 同步脚本的 dev-local 模式 → 0.3（目录 / .gitignore）**。

原因：纯函数先写，**不依赖任何文件系统/网络/Vite**，写完就能跑 self-check 断言通过，是最低成本的"先把逻辑正确性钉住"。把类型和纯函数先签入代码仓库，后面写同步脚本 / 虚拟模块的人（或我下一步）都有明确的契约可对接，不用来回改签名。

等你确认"按这份规划执行"或对某个阶段需要进一步细化后，我就按上面的顺序进入编码阶段。需要我再对哪一阶段拆得更细（比如 1.2 的 GitHub API 具体分页、或者 4.3 Deploy Hook 的具体 Webhook 安全签名），告诉我即可。