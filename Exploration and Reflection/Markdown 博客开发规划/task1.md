
---

> *2026-08-09 14:30:38*


---

## 一、当前项目状态盘点

对照规划文档的"第零阶段"逐项核验：

| 任务 | 状态 | 证据 |
|---|---|---|
| 0.1 Vue3 + Vite + Router + Pinia | ✅ 已完成 | [package.json](file:///d:/personal%20project/remnant-song-web/package.json)、[router/index.ts](file:///d:/personal%20project/remnant-song-web/src/router/index.ts) |
| 0.2 Tailwind + Header/Footer/容器 | ✅ 已完成 | [tailwind.config.js](file:///d:/personal%20project/remnant-song-web/tailwind.config.js)、[DefaultLayout.vue](file:///d:/personal%20project/remnant-song-web/src/layouts/DefaultLayout.vue) |
| 0.3 博客相关目录结构约定 | ⚠️ 部分完成 | `src/utils/`、`src/composables/`、`src/types/` 仍是空 `.gitkeep`，没有博客模块归属约定 |
| 0.4 GitHub 文章仓库 + 示例文章 | ❌ 未开始 | 仓库未建立，第一篇 frontmatter 示例文章未撰写 |

另外检查 [styles/index.css](file:///d:/personal%20project/remnant-song-web/src/styles/index.css) 发现**设计令牌体系已经完备**（`--text` / `--bg` / `--accent` / `--mono` 等 CSS 变量 + 暗色模式），任务 5.2（设计令牌抽象）其实已被前置做好，后续博客样式可直接复用。

memory 文件夹尚不存在，说明这是博客模块的首次规划讨论，没有需要遵循的早期决策。

---

## 二、第一步该做什么

按 Ponytail 原则（最小可验证增量优先于铺面铺线），我建议把"第零阶段剩余的 0.3 + 0.4"与"第一阶段任务 1.1 + 1.3"合并成一个**端到端最小通路**来交付：

> **目标：把一篇 Markdown 文章从"文件 → 读取 → 解析 frontmatter → 在页面上看到标题列表"这条链路跑通。**

理由：先把数据通路验证了，再去做渲染（第二阶段）、路由（第三阶段）才有意义；如果先铺一堆目录和抽象，后期发现通路走不通还要返工。

### 具体动作清单（建议顺序）

1. **决策分叉（需你拍板，见第三节）** — 文章仓库放哪、是否引入 gray-matter
2. **建立本地文章目录约定** — 推荐 `src/content/posts/`（开发期 `import.meta.glob` 可直接读取，无需构建脚本）
3. **写第一篇示例文章** — `2026-08-09-hello-blog.md`，含完整 frontmatter（title / date / tags / excerpt / draft）
4. **添加 frontmatter 类型定义** — 在 [src/types/](file:///d:/personal%20project/remnant-song-web/src/types) 新建 `post.ts`
5. **新增 frontmatter 解析函数** — 放 `src/utils/markdown/frontmatter.ts`，使用 gray-matter
6. **新增 composable `usePosts`** — 放 [src/composables/](file:///d:/personal%20project/remnant-song-web/src/composables)，用 `import.meta.glob` 读取所有 `.md` 文件，输出已排序、已过滤草稿的文章列表
7. **临时验证通路** — 在 [HomeView.vue](file:///d:/personal%20project/remnant-song-web/src/views/HomeView.vue) 列出文章标题（仅用于验证，下一阶段会迁到 `/blog` 列表页）

完成上面 7 步后，进入第二阶段（markdown-it + 代码高亮）才有抓手。

---

## 三、需要你先拍板的三个分叉点

这些决策影响后续所有任务，必须先定：

### 分叉 1：文章仓库形态（影响任务 1.2、4.x）

| 方案                                          | 优点                   | 缺点                           |
| ------------------------------------------- | -------------------- | ---------------------------- |
| **A. 单仓库** — 文章放在主项目 `src/content/posts/` 内 | 推送即更新，零同步成本，CI 简单    | 文章与代码耦合，非技术人员改文章需 clone 整个项目 |
| **B. 双仓库** — 独立 GitHub 文章仓库，构建时拉取           | 文章/代码解耦，非技术人员只接触文章仓库 | 多一层同步逻辑（任务 1.2、4.1、4.3 必须做）  |

**我的建议：先走 A，将来流量大了再迁 B。** 规划文档里"双仓库 + Webhook + Vercel Deploy Hooks"是真正的复杂度爆炸点，在文章数 < 50 篇时完全不值得。

### 分叉 2：frontmatter 解析方案（影响任务 1.3）

- **gray-matter**（业界标准，约 50KB，依赖少）— 推荐
- 手写 YAML 解析 — 不引入依赖，但 frontmatter 边界场景多（多行字符串、转义、嵌套），迟早会踩坑

**我的建议：用 gray-matter**。它能在 Vite 构建时被打包，开发期 `import.meta.glob` + `?raw` 拿到原文后交给它解析即可。

### 分叉 3：Markdown 解析器（影响任务 2.1，但需提前定，因为目录结构要为它留位）

- **markdown-it** — 插件生态最丰富，自定义渲染器最灵活，符合规划文档 2.5 的"自定义组件注入"需求
- **unified/remark** — 更现代，但学习曲线和包体积都更大

**我的建议：markdown-it + Shiki（代码高亮，比 highlight.js 漂亮且支持 VSCode 主题）**。

---

## 四、最小可执行下一步

请你先就上面**三个分叉**给出选择（或直接说"按你建议来"），我会立刻进入实际开发：

- 如果选 A + gray-matter + markdown-it：我会先创建 `src/content/posts/2026-08-09-hello-blog.md`、`src/types/post.ts`、`src/utils/markdown/frontmatter.ts`、`src/composables/usePosts.ts`，并在 HomeView 临时挂载列表验证通路。
- 文件改动遵循你的 `@Author/@Date/@Desc` 块注释约定，不删除任何已有注释，旧逻辑保持不动只增不改。

待你拍板。