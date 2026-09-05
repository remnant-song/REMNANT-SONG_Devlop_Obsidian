## 1. 目标与结论

当前项目已经具备以下特征：

- 站点本质上是纯静态站点。
- 博客内容来自独立的内容仓库（已分离），构建期可被收集。
- 主要问题不在于“能否继续跑”，而在于当前实现仍以 `Vue SPA` 为底座，导致：
  - 博客内容被放进客户端路由和运行时渲染链路，首屏加载慢、SEO 不友好。
  - 列表页和详情页对文章集重复全量获取，且本地 `eager + raw` 会把全部 Markdown 正文打入前端包体。
  - 文章搜索、增量更新等功能难以在 SPA 架构下优雅实现。
- 未来架构需要明确保持“内容仓库”和“网站代码仓库”分离（已实现）。
- 文章新增和修改频率较高，构建与发布链路需要支持增量化。
- 网站除博客外，仍需承载乐谱、音频、3D 模型等高自由度内容能力。

结合现有代码、目标与本次讨论，最终推荐采用：

**`Astro + TypeScript + 独立内容仓库 + MD/MDX + Vue Islands`**

这不是一次“全部推倒重写”，而是分层迁移：

1. **内容层**：内容已独立于网站仓，需建立内容制品与同步链路。
2. **站点底座**：用 Astro 接管页面、路由、内容渲染、SEO 等。
3. **交互层**：保留 Vue 用于首页动效、3D 房间、WebGL 等创意区域。
4. **构建层**：围绕内容制品和变更清单构建增量发布能力。
5. **下线旧 SPA**：清理旧博客逻辑和客户端运行时渲染链路。

---

## 2. 当前项目现状

### 2.1 已有优势

- 内容已与网站代码分离至独立仓库，**双仓结构已经存在**。
- 已有 Frontmatter 解析逻辑，可映射为 Astro Schema。
- 当前是纯前端项目，无真实后端依赖，部署模型与 Astro 静态输出一致。
- 部分页面交互性强，但范围集中（如首页、3D 房间），适合保留为 Vue Islands。
- 大部分创意组件（ArtTitle、FluidBackground、AnimeRoom）基于 Vue + GSAP/Three.js，可在 Astro 中复用。

### 2.2 当前痛点

- 博客是 `vue-router` 驱动的 SPA 页面，不是原生静态内容页。
- Markdown 通过运行时 `markdown-it` 渲染，首屏和 SEO 受客户端链路影响。
- 本地文章加载依赖 `import.meta.glob` + 自定义查找逻辑，内容模型松散。
- 列表页 `loadAllPosts()` 和详情页 `findPost()` 均全量拉取文章集，性能浪费严重。
- 本地 `eager + raw` 导致 Markdown 正文随 JS 包体加载，文章越多首屏越重。
- 文章搜索、增量更新等功能难以在现有架构下优雅实现。
- 乐谱、音频、3D 模型等富媒体能力没有独立的内容扩展层与资源策略。

### 2.3 当前关键模块

- 路由层：`src/router/index.ts`
- 博客列表：`src/views/blog/BlogListView.vue`
- 博客详情：`src/views/blog/BlogPostView.vue`
- Markdown 加载：`src/utils/markdown/loader.ts`
- Markdown 渲染：`src/utils/markdown/parser.ts`
- Frontmatter 解析：`src/utils/markdown/frontmatter.ts`
- 交互页面：`src/views/HomeView.vue`、`src/views/AnimeRoom.vue`

---

## 3. 目标架构

### 3.1 双仓结构（已存在）

```text
Repo A: remnant-song-content  （独立内容仓）
  posts/
    ...md
    ...mdx
  assets/
    audio/
    scores/
    models/
    images/
  manifests/
    posts-index.json
    tags.json
    categories.json
  schemas/
    frontmatter.schema.json
  scripts/
    validate-content.*
    build-content-manifest.*

Repo B: remnant-song-web      （网站仓）
  src/
    content/
      loaders/
      schemas/
    layouts/
    pages/
    components/
      astro/
      vue/
    styles/
  astro.config.mjs
  scripts/
    sync-content.*
    build-changed-pages.*
```

### 3.2 网站仓目标目录

```text
src/
  content/
    config.ts
    loaders/
      content-source.ts
      content-manifest.ts
  layouts/
    BaseLayout.astro
    BlogLayout.astro
  pages/
    index.astro
    portal.astro
    blog/
      index.astro
      [...slug].astro
  components/
    astro/
      BlogCard.astro
      CategoryFilter.astro
      Breadcrumbs.astro
    vue/
      ArtTitle.vue
      FluidBackground.vue
      AnimeRoom.vue
  styles/
    global.css
    markdown.css
public/
  ...
```

### 3.3 分层原则

- **内容层**：文章、Frontmatter、富媒体元数据全部位于独立内容仓库（已分离）。
- **数据层**：网站仓通过内容 Manifest、内容快照或版本化制品接入内容。
- **Schema 层**：统一进入 `src/content/config.ts` 或 `src/content/schemas/*`。
- **页面层**：博客列表、详情、归档、分类页全部静态生成。
- **交互层**：仅对首页动效、Portal 动画等保留客户端激活（Vue Islands）。
- **媒体层**：音频、乐谱、3D 模型优先走对象存储或 CDN，不直接塞进网站仓。
- **构建层**：Astro 负责站点渲染；内容同步和增量发布由独立脚本与 CI 编排。

### 3.4 双仓职责边界

- **内容仓**：只负责 Markdown/MDX 正文、Frontmatter 校验、内容索引与制品生成。
- **网站仓**：只负责页面模板、Astro/Vue 组件、SEO、RSS、Sitemap、搜索、样式系统、内容消费逻辑与部署逻辑。

**这条边界已建立，需长期保持稳定，避免把页面模板或业务逻辑重新塞回内容仓。**

### 3.5 内容接入方式

当前内容已独立，推荐接入方式如下（优先级）：

1. **构建期拉取内容制品**：内容仓在 CI 中产出版本化内容包（含 Manifest），网站仓构建时按版本号或变更清单拉取。
2. **本地开发联调**：允许通过 Git 子模块或本地映射目录联调（仅开发环境）。
3. **不建议运行时远程拉文**：这会破坏纯静态的可预测性与构建一致性。

---

## 4. 迁移策略

采用“分阶段替换底座”的策略，保留现有交互组件，逐步迁移。

1. **确认内容接入与制品协议**（利用已有双仓）
2. **建 Astro 骨架**
3. **迁移内容系统与博客渲染**
4. **迁移静态页面**
5. **嵌入 Vue 交互岛**
6. **建立增量构建与增量发布链路**
7. **删除旧 SPA 基础设施**

这样做的原因：

- 风险低，博客可先获得 SEO 和静态化收益。
- 内容和站点代码的职责边界已清晰。
- 视觉资产和交互组件可逐步复用。
- 可以把“高频内容更新”与“低频框架改动”拆成两类流水线。
- 每个阶段都可以独立验证与回滚。

---

## 5. 分阶段执行计划

### 阶段 0：基线确认

目标：冻结现状，明确迁移边界。

任务：

- 盘点现有路由与页面职责。
- 盘点所有博客文章、分类层级、Frontmatter 字段。
- 盘点当前 Markdown 插件里哪些是必须保留，哪些可以下线。
- 盘点哪些页面需要客户端交互，哪些页面应完全静态化。
- 盘点哪些内容资源属于文章仓，哪些资源应进入对象存储。
- 确认部署平台与目标输出模式为纯静态。

产出：

- 页面清单
- 文章字段清单
- Markdown 能力清单
- 富媒体资源清单
- 迁移排除项清单

完成标准：

- 可以明确回答“哪些页面会变成 Astro 页面，哪些组件继续用 Vue”。
- 可以明确回答“哪些内容归内容仓，哪些资源走 CDN / 对象存储”。

---

### 阶段 1：建立内容制品与同步机制

目标：确保网站仓能稳定、高效地消费独立内容仓的内容。

任务：

- 确认内容仓已有目录结构、Frontmatter Schema 与校验脚本。
- 在内容仓中设计并产出版本化内容 Manifest，例如：
  - `posts-index.json`（包含所有文章的元数据，不含正文）
  - `categories.json`
  - `tags.json`
  - `changed-slugs.json`（用于增量构建）
- 在网站仓中编写内容加载器（`src/content/loaders/`），支持从内容制品（压缩包或对象存储）读取数据。
- 约定内容仓向网站仓输出的制品格式（压缩包、Release 资产或对象存储版本目录）。
- 建立本地开发联调方案（如 Git 子模块或软链接）。

建议：

- 大体积媒体资源（音频、模型、高分辨率图片）优先外链到对象存储，正文中保留引用。
- Manifest 只包含元数据，正文在构建时按需读取。

完成标准：

- 网站仓可以在不依赖 Git 子模块的情况下，从内容制品读取文章元数据。
- 内容仓可独立校验并产出制品。

---

### 阶段 2：搭建 Astro 骨架

目标：在不影响现有站点的前提下，建立新底座。

任务：

- 安装 Astro、TypeScript、MDX、Vue 集成。
- 新建 `astro.config.mjs`。
- 建立 `src/pages`、`src/layouts`、`src/content` 目录。
- 接入 Tailwind 或复用现有 CSS 变量体系。
- 迁移全局样式入口，建立 Astro 版本的 `global.css`。
- 配置 Sitemap、RSS、Markdown 基础能力。
- 建立内容加载器，支持从内容制品或本地内容快照读取文章。

建议：

- 先保留现有 `src/components/common/*.vue`，后续按需迁入 `components/vue/`。
- 样式令牌优先复用，避免第一阶段同时重做视觉系统。

完成标准：

- `astro dev` 可运行。
- 首页与一个占位博客页可访问。

---

### 阶段 3：迁移博客内容系统

目标：把博客从“运行时解析”改为“构建时内容建模”。

任务：

- 让 Astro 内容层消费外部内容仓产出的快照或内容包。
- 编写 `src/content/config.ts`，用 Schema 定义文章字段。
- 统一 Frontmatter 字段，例如：
  - `title`
  - `date`
  - `updated`
  - `excerpt`
  - `tags`
  - `draft`
  - `cover`
  - `author`
  - `category`
- 为富媒体内容增加可扩展字段，例如：
  - `audio`
  - `score`
  - `model`
  - `attachments`
  - `embedBlocks`
- 把当前“通过目录推断分类”的逻辑升级为：
  - 优先使用 Frontmatter；
  - 目录结构作为兜底。
- 用 Astro 内容 API 替代 `loader.ts` 与 `frontmatter.ts` 的主要职责。

建议：

- 尽量在本阶段完成文章元数据规范化，减少后续页面层补丁逻辑。
- 将 `visibility` 语义收敛为 Astro 更容易维护的字段，如 `draft` 与 `hidden`。
- 将媒体字段设计成可扩展对象，而不是写死单一 URL 字段。

完成标准：

- 所有文章能被 `getCollection('posts')` 正常读取。
- 非法 Frontmatter 会在构建期报错，而不是到运行时报错。
- 新增媒体类型时不需要重写内容模型主结构。

---

### 阶段 4：迁移博客页面

目标：输出真正的静态博客页面。

任务：

- 实现博客列表页：`src/pages/blog/index.astro`
- 实现文章详情页：`src/pages/blog/[...slug].astro`
- 实现分类过滤页，可选两种方式：
  - 查询参数过滤
  - 独立分类页 `/blog/category/[name]`
- 增加归档、标签页，可作为第二优先级。
- 迁移面包屑、上一篇/下一篇、目录、阅读信息。
- 接入 RSS、Sitemap、Canonical、Open Graph 元信息。
- 聚合页尽量基于内容 Manifest 生成，方便后续按变更范围重建。

建议：

- 不再使用客户端 `v-html` 作为主渲染方式。
- 尽量使用 Astro 对 Markdown/MDX 的原生渲染输出。

完成标准：

- 博客列表和文章详情全部为静态生成。
- 页面在无 JavaScript 条件下仍可正常阅读。
- 文章详情页、分类页、标签页的生成范围可以被显式计算。

---

### 阶段 5：迁移 Markdown 能力与富媒体扩展

目标：保留必要能力，去掉不必要的运行时复杂度。

任务：

- 逐项审视当前 `markdown-it` 插件：
  - 必保留：锚点、代码高亮、脚注、容器、任务列表
  - 可评估：emoji、ruby、spoiler、imgMark、align
- 将必须保留的能力迁到 Astro 的 `remark/rehype` 管道。
- 统一代码高亮方案，例如 `shiki`。
- 将 Markdown 样式与站点视觉系统对齐。
- 对确实需要交互的 Markdown 能力单独设计方案。
- 为高自由度内容建立组件协议，例如：
  - `ScoreBlock` 用于乐谱展示
  - `AudioPlayer` 用于音频播放
  - `ModelViewer` 用于 3D 模型展示
  - `AssetGallery` 用于图集与附件
- 优先通过 MDX 组件或内容块映射承载复杂内容，而不是把逻辑写死在文章解析器里。

重点决策：

- `spoiler` 这类交互功能不能再依赖页面运行时补绑事件，应改造成原生 HTML 可降级方案或小型客户端组件岛。
- 音频、乐谱、3D 模型的渲染能力要以可插拔组件注册表实现，避免每新增一种内容类型都改动核心渲染链路。

完成标准：

- 文章在 Astro 中呈现效果与当前站点核心能力一致。
- 不再依赖 `parser.ts` 的运行时渲染链路。
- 新增一种富媒体块时，只需要新增 Schema 与组件映射。

---

### 阶段 6：迁移静态页面与布局

目标：让站点主体脱离 SPA 外壳。

任务：

- 将 `DefaultLayout.vue` 重构为 `BaseLayout.astro`
- 将首页迁为 `index.astro`
- 头部、底部、导航、SEO 元信息统一进 Astro Layout
- i18n 如继续保留，优先选择：
  - 先只保留单语言；
  - 或采用 Astro i18n 路由模式逐步升级

建议：

- i18n 不要与 Astro 迁移强绑定。
- 如果当前多语言并未真正上线，建议先单语言完成迁移，再扩展国际化。

完成标准：

- 首页、博客页、404 页都运行在 Astro 页面体系中。

---

### 阶段 7：保留并改造强交互页面

目标：把高交互内容收缩到局部客户端岛，而不是整个站点都走 SPA。

任务：

- 评估 `AnimeRoom.vue`、`ArtTitle.vue`、`FluidBackground.vue` 的运行方式。
- 能直接复用的 Vue 组件通过 Astro Vue 集成接入。
- 仅对需要交互的组件使用：
  - `client:load`
  - `client:visible`
  - `client:idle`
- 对 `three`、`gsap` 等重交互依赖做懒加载与页面隔离。

**补充说明（本次讨论新增）**：

- Astro 不会限制 Vue 组件的 GSAP、Three.js、WebGL 能力，只需将初始化逻辑放入 `onMounted` 等客户端生命周期。
- 对于高交互页面（如 3D 房间），可整体用一个大 Vue 组件包裹，避免拆分过碎。
- 页面切换动画和全局状态管理（Pinia）需要重新设计，不再默认跨页面共享。

建议：

- `portal` 页可以作为独立高交互页面保留。
- 首页如只是少量视觉动效，可局部组件化，而不是整页客户端化。

完成标准：

- 站点大部分页面无客户端框架负担。
- 只有门户动效等局部页面加载必要 JS。

---

### 阶段 8：建立增量构建与增量发布

目标：在保持纯静态部署的前提下，尽量避免“改一篇文章就全站重建”。

任务：

- 在内容仓构建 `changed-slugs.json`、`changed-categories.json` 等变更清单。
- 在网站仓中根据变更清单识别受影响页面，例如：
  - 当前文章详情页
  - 对应分类页
  - 标签页
  - 首页最新文章区
  - RSS
  - 搜索索引
- 为聚合页建立最小重建规则，避免无差别刷新所有归档页。
- 优先选择支持对象级上传或增量部署的静态托管方案。
- 对搜索索引、RSS、站点地图做独立产物化，允许单独刷新。

建议：

- 若部署平台只能整站原子发布，则“避免全量重建”的上限有限，这时至少要做到：
  - 缓存依赖与内容制品
  - 精简聚合页数量
  - 减少每次构建需要重新计算的内容
- 若希望真正按页面增量发布，优先考虑对象存储 + CDN 的发布模式。

完成标准：

- 新增或修改单篇文章时，受影响范围可以被准确计算。
- 流水线可以区分“全站构建”和“内容增量发布”两类任务。

---

### 阶段 9：下线旧基础设施

目标：完成技术债回收。

任务：

- 删除 `vue-router` 页面级路由职责。
- 删除旧博客相关 `views/blog/*`。
- 删除 `utils/markdown/loader.ts`、`parser.ts`、`frontmatter.ts` 中已废弃逻辑。
- 删除仅服务于旧 SPA 的入口代码。
- 清理不再需要的依赖。

重点清理对象：

- `vue-router`
- 运行时 Markdown 解析链路
- 远程 GitHub 文章加载逻辑（如果存在）

完成标准：

- 构建入口只保留 Astro。
- 不存在博客依赖旧 SPA 逻辑的残留链路。

---

## 6. 文件迁移映射

| 当前文件 | 目标位置 | 处理建议 |
|---|---|---|
| `src/views/blog/BlogListView.vue` | `src/pages/blog/index.astro` | 重写为 Astro 页面 |
| `src/views/blog/BlogPostView.vue` | `src/pages/blog/[...slug].astro` | 重写为 Astro 页面 |
| `src/utils/markdown/loader.ts` | `src/content/loaders/*` | 改为读取外部内容仓制品 |
| `src/utils/markdown/frontmatter.ts` | 内容仓 Schema + `src/content/config.ts` | 以双端校验替代 |
| `src/utils/markdown/parser.ts` | `astro.config.mjs` 的 remark/rehype + MDX 组件映射 | 大部分替代，少量能力重构 |
| `src/layouts/DefaultLayout.vue` | `src/layouts/BaseLayout.astro` | 重写 |
| `src/views/HomeView.vue` | `src/pages/index.astro` | 页面重构，组件可复用 |
| `src/views/AnimeRoom.vue` | `src/components/vue/AnimeRoom.vue` 或 `src/pages/portal.astro` | 作为客户端岛保留 |
| `src/components/common/*` | `src/components/vue/*` 或 `src/components/astro/*` | 按交互性拆分 |
| `src/router/index.ts` | 删除 | 路由交给 Astro 文件系统 |
| `src/main.ts` / `src/App.vue` | 删除 | Astro 不需要 SPA 入口 |
| `src/content/posts/*` | **已迁移至独立内容仓，无需移动** | 直接使用外部内容源 |

---

## 7. 依赖调整建议

### 7.1 新增

- `astro`
- `@astrojs/vue`
- `@astrojs/mdx`
- `@astrojs/rss`
- `@astrojs/sitemap`
- `zod`

可选：

- `shiki`
- `pagefind`
- `@astrojs/tailwind`
- `@google/model-viewer` 或等价 3D 展示组件
- 音频波形、乐谱渲染相关库（按实际需求接入）

### 7.2 逐步下线

- `vue-router`
- `gray-matter`（若完全交给 Astro 内容系统）
- `markdown-it`
- `highlight.js`
- 大部分 `@mdit/plugin-*`

### 7.3 暂时保留

- `vue`
- `gsap`
- `three`
- `tailwindcss`
- `vue-i18n`（若仍有 Vue 岛组件依赖）

---

## 8. 风险与应对

### 风险 1：Markdown 能力迁移不完全

应对：先对文章语法做抽样统计，只保留高频能力，低频语法逐步清理。

### 风险 2：Portal/动效页迁移后体积回升

应对：让交互页独立路由隔离，所有重交互组件按页面和可见性懒激活。

### 风险 3：内容仓高频变更仍触发大范围构建

应对：将内容更新影响范围显式建模；使用对象存储或支持增量部署的平台；将文章详情页、聚合页、搜索索引拆成独立产物。

### 风险 4：远程内容接入与纯静态目标冲突

应对：改为构建期同步，完全移除运行时远程文章源。

### 风险 5：富媒体内容让内容模型失控

应对：使用可扩展块模型或 MDX 组件协议；为媒体类型建立单独 Schema 与渲染组件；大资源统一走对象存储。

### 风险 6：一次性重构过大

应对：每个阶段独立可运行；先完成博客，再处理门户交互页。

---

## 9. 推荐实施顺序

1. **阶段 0**：基线确认
2. **阶段 1**：建立内容制品与同步机制（利用已有双仓）
3. **阶段 2**：建 Astro 骨架
4. **阶段 3**：迁内容模型
5. **阶段 4**：迁博客列表与详情
6. **阶段 5**：接 SEO、RSS、Sitemap
7. **阶段 6**：迁首页与布局
8. **阶段 8**：建增量构建与增量发布（可提前）
9. **阶段 7**：迁 Portal 交互页（可在博客稳定后并行）
10. **阶段 9**：删除旧 SPA 逻辑

---

## 10. 验收标准

迁移完成后，应满足：

- 博客页面全部为静态生成页面。
- 内容仓与网站仓长期独立，彼此职责清晰。
- 文章内容无需客户端运行时解析即可显示。
- 关闭 JavaScript 后，博客仍可正常访问与阅读。
- 首页与 Portal 的交互仅在需要时加载客户端 JS。
- 构建产物不再依赖 `vue-router`。
- 内容模型具备构建期校验能力。
- 能稳定生成 RSS、Sitemap、404 页面。
- 高自由度内容可以通过可插拔组件和外部媒体资源扩展。
- 内容增量发布链路可以识别并限制受影响页面范围。

---

## 11. 建议结论

对于当前项目，**最合适的不是“把所有 Vue 都删掉”，而是**：

- 用 **Astro** 接管站点结构、页面系统和静态渲染能力。
- 用 **独立内容仓**（已存在）承载文章与媒体内容，通过制品化接入。
- 用 **Vue** 只承载少量高交互页面或组件（首页动效、3D 房间等）。
- 把当前博客运行时渲染链路彻底迁到构建期。
- 把内容更新链路设计成制品化、可缓存、可增量发布。

如果以投入产出比来看，最值得优先做的三件事是：

1. 确认内容制品协议并接入 Astro（利用已有双仓）。
2. 迁移博客页面与 SEO（获得最直接的静态化收益）。
3. 建设富媒体扩展层与 Portal 动画页面（保留创意自由度）。

这条路线可以最快获得：

- 更好的 SEO
- 更轻的页面负载
- 更清晰的内容模型
- 内容与代码解耦（已经实现）
- 更适合高频文章更新的发布链路
- 更低的长期维护成本
- 同时保留 Vue 生态下的创意展示能力
