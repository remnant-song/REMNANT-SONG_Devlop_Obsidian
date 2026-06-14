## 第一阶段任务清单：首页框架 + 骨干框架搭建

> 目标：完成高可扩展、高度自定义的工程骨架，实现**风格切换核心机制**与**首页占位框架**，无具体内容，但保留未来无缝接入各种华丽创意组件的全部能力。

### 任务概览

1. **工程基础设施强化**（路径别名、分包策略、环境变量）
2. **项目目录结构设计**（符合长期迭代的模块化分层）
3. **全局主题与风格切换核心系统**（Pinia + 动态样式/组件加载机制）
4. **基础布局与路由骨架**（预留风格相关动态布局）
5. **首页框架组件**（空骨架 + 挂载容器，支持后续 Canvas/WebGL/Three.js 等）
6. **风格切换演示模块**（验证切换能力，不干扰后续开发）
7. **创意留存板块占位**（页面路由与空壳，展示未来扩展点）
8. **GSAP 集成 & 动画工具预置**
9. **大资源分流工具函数**（Cloudflare R2 外链辅助）
10. **工程文档 & 扩展指南**（确保长期可维护性）

---

### 详细任务

#### 任务 1：工程基础设施强化
**描述**  
配置 Vite 与 TypeScript，确保未来分包、动态导入、资源加载不受限。  
**子项**  
- 设置 `@` 别名指向 `src`，配置 `vite.config.ts` 中的 `resolve.alias`  
- 开启 TypeScript 严格模式（`strict: true`）并配置 `paths` 映射  
- 配置 Vite 的 `build.rollupOptions.output.manualChunks`：  
  - 将 `vue`、`pinia`、`vue-router`、`gsap` 等基础库打包为 `vendor`  
  - 预留按风格拆分的动态导入规则（注释说明后续风格可独立分包）  
- 配置环境变量类型定义（`.env.d.ts`），支持 `VITE_R2_BASE_URL` 等未来外链配置  
- 安装必要依赖：`pinia`、`vue-router`、`gsap`、`tailwindcss`、`postcss`、`autoprefixer`  

**验收**  
- `npm run dev` 正常启动，TS 无报错  
- `vite.config.ts` 中包含手动分包配置，并有注释说明动态导入拆分位置  

---

#### 任务 2：项目目录结构设计
**描述**  
建立层次分明、高内聚低耦合的目录结构，符合“高自定义、高可扩展”要求。  
**结构**  
```
src/
├── assets/                # 静态资源（后续按风格分类存放）
│   ├── common/
│   └── themes/            # 风格专属资源预留
├── components/            # 可复用组件
│   ├── layout/            # 布局组件（BaseLayout, StyleBasedLayout.vue）
│   ├── style-switcher/    # 风格切换相关 UI 组件
│   └── common/            # 通用 UI 元件（占位、加载等）
├── views/                 # 页面视图
│   ├── home/              # 首页模块（预留不同风格的子组件）
│   │   ├── HomePage.vue
│   │   └── variants/      # 不同风格的首页实现（风格A/风格B占位）
│   └── archive/           # 创意留存板块
│       └── ArchivePage.vue
├── styles/                # 全局样式
│   ├── main.css           # Tailwind 入口 + 基础样式
│   ├── themes/            # 风格主题变量文件
│   │   ├── theme-default.css
│   │   └── theme-cyber.css (占位)
│   └── global.css         # 全局重置、动画、辅助类
├── store/                 # Pinia 状态管理
│   └── styleStore.ts      # 风格状态管理
├── router/                # 路由配置
│   └── index.ts
├── composables/           # 组合式函数
│   ├── useStyleManager.ts # 风格注册、切换、动态加载逻辑
│   └── useDynamicLoader.ts # 动态导入组件/资源的通用方法
├── utils/                 # 工具函数
│   ├── r2Helper.ts        # Cloudflare R2 外链生成函数
│   └── resourceLoader.ts  # 按需加载样式/脚本辅助
├── types/                 # 全局类型定义
│   ├── style.ts           # 风格相关接口
│   └── global.d.ts
└── App.vue / main.ts
```
**验收**  
- 上述目录结构已创建，每个关键目录附带 `README.md` 或注释说明用途  
- 未产生任何业务代码，仅占位文件（如 `HomePage.vue` 仅含基础 template）

---

#### 任务 3：全局主题与风格切换核心系统
**描述**  
实现可扩展的风格切换机制，支持未来任意多种视觉/交互差异极大的风格，保证一键切换时状态同步、资源按需加载。  

**子项**  
- **Pinia Store (`styleStore`)**  
  - state: `currentStyleId` (string), `availableStyles` (数组，存储风格元信息：id, name, 关联组件路径, 样式文件路径)  
  - actions: `setStyle(styleId)` – 触发切换流程  
  - getters: 当前风格对象  
- **动态加载核心 (`useStyleManager`)**  
  - 在 `setStyle` 时：  
    1. 动态加载对应风格的全局 CSS 文件（可选，若风格专属样式独立）  
    2. 更改 `body` 的 `data-theme` 属性，通过 CSS 变量切换基础配色  
    3. 通过 `defineAsyncComponent` 预注册风格相关的布局/页面组件映射（目前仅预留钩子）  
    4. 派发全局事件 `style-changed`，供任何组件响应（例如首页强制重绘 Three.js 场景）  
- **扩展注册机制**  
  - 提供 `registerStyle(styleConfig)` 函数，未来新增风格只需调用注册并实现对应组件即可  
- **持久化**  
  - 将 `currentStyleId` 存入 `localStorage`，初始化时读取并应用  

**验收**  
- 切换风格时控制台打印当前风格 ID，body 的 `data-theme` 正确变化  
- 在 `HomePage` 中通过 `styleStore` 获取当前风格，并展示不同占位文本（证明状态同步）  
- 未来新增风格只需调用 `registerStyle` + 实现组件，无需改动核心逻辑  

---

#### 任务 4：基础布局与路由骨架
**描述**  
搭建根布局组件，支持未来按风格动态切换布局结构。  

**子项**  
- 创建 `App.vue`：  
  - 引入 `styleStore`，监听 `currentStyleId` 变化  
  - 使用动态组件 `<component :is="layoutComponent">` 渲染布局（默认提供一个基础布局 `BaseLayout.vue`）  
  - 布局组件内部包含 `<router-view />` 用于渲染页面内容  
- 创建 `BaseLayout.vue`：  
  - 简单的 header（含风格切换入口占位）、main、footer  
  - 未来可被风格专属布局替换（如 `CyberLayout.vue`）  
- 配置 `router/index.ts`：  
  - 路由模式 `createWebHistory`  
  - 路由列表：  
    - `path: '/'` → 懒加载 `HomePage.vue`  
    - `path: '/archive'` → 懒加载 `ArchivePage.vue`  
    - 重定向其他路径至 `/`  

**验收**  
- 访问 `/` 和 `/archive` 能正确渲染对应页面组件  
- `BaseLayout` 显示正常，可放置测试用的风格切换按钮（后续任务）  

---

#### 任务 5：首页框架组件（无内容，仅骨架）
**描述**  
创建 `HomePage.vue`，不含具体视觉内容，但提供未来多种创意技术（Canvas/WebGL/Three.js/WebGPU）的挂载容器和高扩展性结构。  

**子项**  
- `HomePage.vue` 结构：  
  - 外层容器 `.home-page`（相对定位，宽高 100vh）  
  - 一个或多个 `ref` 容器：  
    - `<div ref="canvasContainer" class="canvas-container"></div>` – 供 Three.js / Canvas 渲染  
    - `<div class="content-overlay"></div>` – 供后续文字/UI 叠加  
  - 简单占位文本：“敬请期待”（不干扰未来设计）  
- 在 `onMounted` 中打印就绪日志，不执行任何实际渲染  
- 通过 `styleStore` 展示当前风格 ID，验证风格切换响应（仅文本变化）  

**验收**  
- 首页加载时无 console 错误，ref 容器已创建  
- 风格切换时页面不报错，当前风格 ID 显示会变化（证明响应性）  
- 没有任何实际 3D/Canvas 逻辑，但容器可随时被未来代码注入  

---

#### 任务 6：风格切换演示模块
**描述**  
提供一个简洁的切换 UI（测试用），方便后续开发时验证风格系统，也作为未来正式切换入口的原型。  

**子项**  
- 创建 `components/style-switcher/StyleSwitcher.vue`  
  - 从 `styleStore` 获取 `availableStyles`，渲染按钮列表  
  - 点击按钮调用 `setStyle`  
  - 提供简单的过渡动画（使用 GSAP 淡入淡出，仅演示动画能力）  
- 在 `BaseLayout.vue` 的 header 中引入该组件（仅开发阶段可见，可添加 `v-if="!isProduction"` 或通过环境变量控制）  

**验收**  
- 点击不同风格按钮，控制台输出切换过程，页面视觉（body data-theme）变化  
- 按钮显示风格名称，切换后高亮当前风格  
- GSAP 动画生效（如按钮点击时某个占位元素闪烁）  

---

#### 任务 7：GSAP 集成 & 动画工具预置
**描述**  
确保 GSAP 正常工作，并提供可复用的动画组合式函数，供未来华丽动效使用。  

**子项**  
- 在 `main.ts` 中全局导入 `gsap`，注册插件（若有需要）  
- 创建 `composables/useGsapTimeline.ts`：  
  - 提供 `useTimeline` 函数，封装常见动效场景（如入场、hover）  
  - 示例：`fadeInUp(el, delay)` 等（可空实现，仅导出方法）  
- 在 `HomePage.vue` 的 `onMounted` 中，使用 `gsap` 让占位文本做一个极简单的从不透明到透明（证明可用，但不产生实质内容）  

**验收**  
- 首页占位文本有一个淡入或微动效（如 0.5 秒内从不透明到透明）  
- 无运行时错误，GSAP 版本正确  
---

### 任务 8：国际化（i18n）核心集成

**描述**  
集成 `vue-i18n`（或轻量替代 `vue-i18n-next`），建立多语言切换机制，保证所有用户可见文本均通过语言文件管理，并预留动态加载语言包的能力（避免一次性加载所有语言资源）。

**子项**

1. **安装依赖**
    - `vue-i18n@9` (与 Vue3 兼容)
    - `@intlify/unplugin-vue-i18n`（可选，用于 Vite 按需编译语言文件）
2. **目录与文件结构**
    
```text
    src/
    ├── locales/
    │   ├── en.json          # 英文
    │   ├── zh-CN.json       # 简体中文
    │   └── index.ts         # 导出语言配置
    ├── i18n/
    │   ├── i18n.ts          # i18n 实例创建与初始化
    │   └── loadLocale.ts    # 动态加载语言包函数
```

    
3. **i18n 实例配置**
    - 默认语言：`'en'`（可根据浏览器语言 `navigator.language` 降级选择）
    - 回退语言：`'en'`
    - 动态加载语言包：利用 `setupI18n` 与 `setLocaleMessage` 按需加载
    - 持久化：将语言选择存入 `localStorage`，初始化时读取
        
4. **Pinia 语言状态管理（可选但推荐）**
    - 创建 `store/localeStore.ts`：
        - state: `locale` (string)
        - actions: `setLocale(locale: string)` – 调用 i18n 实例的 `global.locale` 并持久化
    - 与风格 Store 独立，但可在组件中同时响应两者变化
5. **动态加载语言包工具**
    - `i18n/loadLocale.ts`：
        - 根据语言标识动态 `import(`../../locales/${locale}.json`)`
        - 利用 Vite 的 `?url` 或直接导入 JSON
        - 调用 `i18n.global.setLocaleMessage` 注入
6. **语言切换 UI 组件**
    - 创建 `components/LocaleSwitcher.vue`（与风格切换器类似，可暂放于 `BaseLayout` 中，开发阶段可见）
    - 支持 `en` / `zh-CN`（后续可扩展更多）
    - 切换时调用 `localeStore.setLocale`，并重新加载相关语言包（若未加载）
7. **在首页与存档页使用多语言**
    - 将当前占位文本（如“敬请期待”）改为 i18n 键值：`t('home.placeholder')`
    - 在 `locales/en.json` 和 `locales/zh-CN.json` 中分别定义
    - 验证切换语言时文本即时变化
8. **扩展性设计**
    - 语言文件按页面/模块拆分（如 `home.json`, `archive.json`），在路由级动态加载，避免首屏体积膨胀
    - 提供 `useLocale` 组合式函数，封装 `t`、`locale`、`setLocale` 等，方便组件使用
    - 语言文件中的富文本（如包含 HTML 或特殊标记）使用 `v-html` 安全处理（需注意 XSS，但受控内容无问题）
9. **与风格切换的协同**
    - 确保语言切换不干扰风格的动态样式/组件加载
    - 在 `styleStore` 或全局事件中不依赖语言状态，反之亦然
    - 同时切换语言和风格时，页面不应报错或丢失任何状态
10. **开发体验**
    - 配置 Vite 别名 `@locales` 指向 `src/locales`，方便导入
    - 在 `tsconfig.json` 中支持 JSON 模块解析（默认已支持）
    - 提供 `scripts/auto-i18n.js`（可选）用于扫描未翻译的键，但不是必须

**验收标准**
- ✅ 语言切换后首页 /archive 页面的占位文本立即变为对应语言
- ✅ 刷新页面后语言选择保持（localStorage 持久化）
- ✅ 切换语言时未触发风格系统的副作用（控制台无错误，data-theme 不变）
- ✅ 动态加载语言包：初始请求中不包含所有语言文件，仅加载默认语言，切换时才加载新语言包
- ✅ `LocaleSwitcher.vue` 组件渲染正常，提供至少两种语言选项
- ✅ 无硬编码的中文或英文文本（所有展示文本均通过 `$t()` 或 `useI18n().t` 输出）
#### 任务 9：工程文档 & 扩展指南
**描述**  
编写清晰的架构文档，确保后续开发者（或自己）能快速理解扩展点并遵守高自由度原则。  

**子项**  
- 创建 `docs/ARCHITECTURE.md`，包含：  
  - 目录结构与职责说明  
  - 风格切换系统原理与新增风格步骤（附代码示例）  
  - 首页容器挂载规范（如何注入 Three.js/Canvas/WebGPU）  
  - 动态导入分包建议（风格专属资源）  
- 在关键代码文件（如 `useStyleManager.ts`、`HomePage.vue`）中添加 JSDoc 注释，描述扩展点  

**验收**  
- 文档清晰可读，包含至少一个“新增风格”的 step-by-step 示例  
- 代码注释覆盖核心接口和复杂逻辑，无模糊区域  

---

### 最终验收标准（Phase 1 完成标志）

1. **无实质内容**：首页无具体视觉作品（仅占位/容器），无 3D 模型、音频、视频等资源。  
2. **风格切换核心可用**：一键切换风格 → body 属性变化，状态持久化，且不破坏页面基本渲染。  
3. **路由与布局骨架完整**：`/` 和 `/archive` 页面可访问，布局组件支持动态替换（当前仅基础布局）。  
4. **工程化健全**：TypeScript 无报错，`vite build` 成功，分包策略明确，动态导入示例可运行。  
5. **扩展点清晰**：按文档说明，新增一个虚拟风格只需要 5 分钟配置，无需修改核心文件。  
6. **工具函数齐全**：R2 辅助函数、GSAP 预置、动态加载器框架均已存在但未实现复杂逻辑。  