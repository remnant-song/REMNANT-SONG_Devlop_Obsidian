# Markdown 博客撰写规范

> 本文档阐述本项目（残响之歌）适配的 Markdown 博客文章应该如何撰写，涵盖文件位置、Frontmatter 属性、可见性控制、标签分类、Markdown 语法支持、富媒体嵌入等。

---

## 目录

1. [文章存储与文件位置](#1-文章存储与文件位置)
2. [Frontmatter 属性详解](#2-frontmatter-属性详解)
3. [可见性控制（draft / hidden / pin）](#3-可见性控制draft--hidden--pin)
4. [分类与目录结构](#4-分类与目录结构)
5. [标签（tags）](#5-标签tags)
6. [Markdown 语法支持](#6-markdown-语法支持)
7. [富媒体嵌入](#7-富媒体嵌入)
8. [图片引用](#8-图片引用)
9. [MDX 与组件嵌入](#9-mdx-与组件嵌入)
10. [完整文章模板](#10-完整文章模板)
11. [常见问题与注意事项](#11-常见问题与注意事项)

---

## 1. 文章存储与文件位置

### 1.1 内容仓库

所有文章存储在**独立的内容仓库**（Obsidian Vault）中，通过环境变量 `CONTENT_REPO_PATH` 指定路径。

```
CONTENT_REPO_PATH/
├── manifests/
│   └── posts-index.json      # 文章元数据清单（由同步脚本生成）
├── 知识库/                    # 分类目录（可嵌套）
│   ├── 文章A.md
│   └── 子分类/
│       └── 文章B.md
└── Exploration and Reflection/
    └── 首屏/
        └── 色彩海洋/
            └── Threejs制作大海效果.md
```

### 1.2 文件命名

- 扩展名：`.md`
- 文件名即文章 slug，建议使用语义化名称
- 支持中文、英文、数字
- 无需在文件名中包含日期（日期由 Frontmatter 控制）

**示例：**
```
Threejs制作大海效果.md
What is Json.md
```

### 1.3 元数据清单

`manifests/posts-index.json` 是文章元数据的清单，结构如下：

```json
[
  {
    "slug": "Threejs制作大海效果",
    "category": "Exploration and Reflection/首屏/色彩海洋",
    "title": "Three.js 制作大海效果",
    "date": "2024-03-15",
    "updated": "",
    "excerpt": "使用 Three.js 实现海浪效果...",
    "tags": ["Three.js", "WebGL"],
    "draft": false,
    "hidden": false,
    "pin": 0,
    "cover": "",
    "author": "",
    "filePath": "Exploration and Reflection/首屏/色彩海洋/Threejs制作大海效果.md"
  }
]
```

> **注意**：`filePath` 决定了文章在文件树中的位置，`category` 决定了分类归属。

---

## 2. Frontmatter 属性详解

每篇文章的开头需要包含 YAML Frontmatter（`---` 包裹）。以下是所有支持的属性：

### 2.1 必填属性

| 属性 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `title` | string | 文章标题 | `title: "Three.js 制作大海效果"` |
| `date` | string | 发布日期，格式 `YYYY-MM-DD` | `date: "2024-03-15"` |

### 2.2 可选属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `updated` | string | — | 最后修改日期，格式 `YYYY-MM-DD` |
| `excerpt` | string | — | 文章摘要，用于列表页展示 |
| `tags` | string[] | `[]` | 标签列表 |
| `category` | string | `""` | 分类，优先于目录结构 |
| `draft` | boolean | `false` | 是否为草稿 |
| `hidden` | boolean | `false` | 是否隐藏 |
| `pin` | number | `0` | 置顶权重，数字越大越靠前 |
| `cover` | string | — | 封面图 URL |
| `author` | string | — | 作者名 |

### 2.3 富媒体属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `audio` | string | 音频资源 URL（用于 AudioPlayer 组件） |
| `score` | string | 乐谱资源 URL（用于 ScoreBlock 组件） |
| `model` | string | 3D 模型资源 URL（用于 ModelViewer 组件） |
| `attachments` | array | 附件列表，每项含 `name`、`url`、`type?` |

### 2.4 Frontmatter 示例

```yaml
---
title: "Three.js 制作大海效果"
date: "2024-03-15"
updated: "2024-03-20"
excerpt: "使用 Three.js 的顶点着色器实现海浪动画效果"
tags: ["Three.js", "WebGL", "着色器"]
category: "Exploration and Reflection/首屏/色彩海洋"
draft: false
hidden: false
pin: 5
cover: "https://example.com/cover.jpg"
author: "作者名"
---
```

---

## 3. 可见性控制（draft / hidden / pin）

本项目通过三个属性控制文章的可见性和排序：

### 3.1 `draft`（草稿）

```yaml
draft: true
```

- **效果**：文章完全不展示，不出现在任何列表、搜索、RSS 中
- **用途**：正在撰写、未完成的文章
- **不可通过 URL 直接访问**（构建时被过滤）

### 3.2 `hidden`（隐藏）

```yaml
hidden: true
```

- **效果**：文章不出现在列表页、文件树、搜索结果中
- **可通过直接 URL 访问**（知道链接的人可以查看）
- **用途**：已发布但不想在列表中展示的文章（如私密分享、测试页）

### 3.3 `pin`（置顶）

```yaml
pin: 10
```

- **效果**：文章在列表中置顶，`pin` 值越大越靠前
- `pin: 0` 为默认值（不置顶）
- `pin: 1` ~ `pin: 99` 按数值降序排列
- **用途**：重要文章、公告、常驻内容

### 3.4 组合效果

| `draft` | `hidden` | `pin` | 列表展示 | 搜索可见 | 直接访问 |
|---------|----------|-------|----------|----------|----------|
| false | false | 0 | ✅ | ✅ | ✅ |
| false | false | 5 | ✅（置顶） | ✅ | ✅ |
| false | true | 0 | ❌ | ❌ | ✅ |
| true | * | * | ❌ | ❌ | ❌ |

---

## 4. 分类与目录结构

### 4.1 分类的优先级

文章的分类归属遵循以下优先级：

1. **Frontmatter `category` 字段**（最高优先级）
2. **文件所在目录结构**（fallback）

### 4.2 多级分类

`category` 支持多级，用 `/` 分隔：

```yaml
category: "Exploration and Reflection/首屏/色彩海洋"
```

这会在文件树中展示为：
```
📁 Exploration and Reflection
└── 📁 首屏
    └── 📁 色彩海洋
        └── Three.js 制作大海效果
```

### 4.3 分类页路由

每个分类都有独立的分类页：
- 中文：`/blog/category/<分类名>`
- 英文：`/en/blog/category/<分类名>`

分类页同样支持文件树展示和分页。

### 4.4 未分类

如果 `category` 为空且无目录结构，文章归类为 `uncategorized`（未分类）。

---

## 5. 标签（tags）

### 5.1 标签定义

```yaml
tags: ["Three.js", "WebGL", "着色器"]
```

- 标签为字符串数组
- 支持中英文
- 用于文章卡片展示和未来的标签筛选功能

### 5.2 标签展示

- 文章卡片中最多展示 3 个标签
- 标签以圆角标签形式显示在卡片底部

### 5.3 标签 vs 分类

| 维度 | 分类（category） | 标签（tags） |
|------|------------------|--------------|
| 数量 | 1 个 | 多个 |
| 层级 | 支持多级 | 扁平 |
| 用途 | 内容组织、文件树结构 | 关键词标记、横向关联 |
| 路由 | 有独立分类页 | 暂无独立页（规划中） |

---

## 6. Markdown 语法支持

本项目使用 **Astro 原生 Markdown 渲染**（remark/rehype 管道），支持以下语法：

### 6.1 基础语法

所有标准 Markdown 语法均支持：

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体**、*斜体*、~~删除线~~

> 引用块

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

[链接文字](https://example.com)

![图片描述](图片URL)

`行内代码`
```

### 6.2 GFM 扩展（GitHub Flavored Markdown）

通过 `remark-gfm` 插件支持：

**表格：**
```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |
```

**任务列表：**
```markdown
- [x] 已完成任务
- [ ] 未完成任务
```

**删除线：**
```markdown
~~这段文字被删除~~
```

**脚注：**
```markdown
这里有一个脚注[^1]。

[^1]: 这是脚注内容。
```

### 6.3 代码块

代码块使用 **Shiki** 高亮，主题为 `github-dark`：

````markdown
```javascript
function hello() {
  console.log("Hello, world!")
}
```
````

支持的语言：JavaScript、TypeScript、Python、Go、Rust、CSS、HTML、JSON、YAML、Bash 等 190+ 种。

### 6.4 标题锚点

所有标题自动生成锚点 ID（通过 `rehype-slug`），可用于页内跳转：

```markdown
## 我的标题

[跳转到我的标题](#我的标题)
```

### 6.5 外部链接安全

外部链接自动添加 `target="_blank"` 和 `rel="noopener noreferrer"`（通过 `rehype-external-links`），无需手动设置。

### 6.6 不支持的语法

以下语法**不支持**（来自旧 markdown-it 插件，已随迁移移除）：

- ❌ `:emoji:` 表情缩写
- ❌ `:::tip` 自定义容器
- ❌ `> [!NOTE]` 警示框
- ❌ `H~2~O` 下标 / `x^2^` 上标
- ❌ `==高亮==` 标记
- ❌ `++插入++` 文本
- ❌ `{ruby}^(拼音)` 注音
- ❌ `!!剧透!!` 折叠内容

> 如需上述功能，可使用 MDX 嵌入自定义组件实现。

---

## 7. 富媒体嵌入

本项目支持通过 Frontmatter 属性和 MDX 组件嵌入富媒体内容。

### 7.1 封面图

```yaml
cover: "https://example.com/cover.jpg"
```

封面图用于文章卡片和详情页顶部（当前版本在卡片中预留了展示位）。

### 7.2 音频

在 Frontmatter 中声明音频资源：

```yaml
audio: "https://example.com/audio.mp3"
```

在 MDX 文章中使用 `AudioPlayer` 组件：

```mdx
import { AudioPlayer } from '@/components/astro/AudioPlayer.astro'

<AudioPlayer src="https://example.com/audio.mp3" title="背景音乐" />
```

### 7.3 乐谱

```yaml
score: "https://example.com/score.xml"
```

```mdx
import { ScoreBlock } from '@/components/astro/ScoreBlock.astro'

<ScoreBlock src="https://example.com/score.xml" title="乐谱标题" />
```

### 7.4 3D 模型

```yaml
model: "https://example.com/model.glb"
```

```mdx
import { ModelViewer } from '@/components/astro/ModelViewer.astro'

<ModelViewer src="https://example.com/model.glb" title="3D 模型" />
```

### 7.5 附件

```yaml
attachments:
  - name: "示例代码.zip"
    url: "https://example.com/code.zip"
    type: "application/zip"
  - name: "设计稿.png"
    url: "https://example.com/design.png"
```

---

## 8. 图片引用

### 8.1 基本用法

```markdown
![图片描述](图片URL)
```

### 8.2 图片来源

| 来源 | 示例 | 说明 |
|------|------|------|
| 外部 URL | `![图](https://example.com/img.jpg)` | 直接引用外部图片 |
| 内容仓资源 | `![图](./assets/xxx.jpg)` | 相对于文章文件的路径 |
| 站点 public | `![图](/animeRoom/bg.jpg)` | 项目 `public/` 目录下的资源 |

### 8.3 图片标题

使用标准 Markdown 标题语法：

```markdown
![图片描述](图片URL "图片标题")
```

---

## 9. MDX 与组件嵌入

对于需要复杂交互或自定义布局的文章，可以使用 `.mdx` 格式（需将文件扩展名改为 `.mdx`）。

### 9.1 嵌入 Astro 组件

```mdx
---
title: "带交互的文章"
date: "2024-03-15"
---

这是一篇普通的 Markdown 文章。

## 嵌入交互组件

下面嵌入一个音频播放器：

import AudioPlayer from '@/components/astro/AudioPlayer.astro'

<AudioPlayer src="/audio/demo.mp3" title="示例音频" />

继续普通 Markdown 内容...
```

### 9.2 可用组件

| 组件 | 路径 | 用途 |
|------|------|------|
| `AudioPlayer` | `@/components/astro/AudioPlayer.astro` | 音频播放 |
| `ModelViewer` | `@/components/astro/ModelViewer.astro` | 3D 模型展示 |
| `ScoreBlock` | `@/components/astro/ScoreBlock.astro` | 乐谱展示 |
| `AssetGallery` | `@/components/astro/AssetGallery.astro` | 资产画廊 |

---

## 10. 完整文章模板

### 10.1 基础模板（.md）

```markdown
---
title: "文章标题"
date: "2024-03-15"
excerpt: "文章摘要，一句话概括"
tags: ["标签1", "标签2"]
category: "分类/子分类"
draft: false
hidden: false
pin: 0
---

## 正文从这里开始

这是文章正文，支持标准 Markdown 和 GFM 语法。

### 小节标题

- 列表项
- 列表项

```js
const code = "支持代码高亮"
```

> 引用块

| 表格 | 示例 |
|------|------|
| A    | B    |
```

### 10.2 富媒体模板（.mdx）

```markdown
---
title: "富媒体文章"
date: "2024-03-15"
excerpt: "包含音频、3D 模型等富媒体内容"
tags: ["Three.js", "音频"]
category: "创意空间"
cover: "https://example.com/cover.jpg"
audio: "https://example.com/bgm.mp3"
---

import AudioPlayer from '@/components/astro/AudioPlayer.astro'
import ModelViewer from '@/components/astro/ModelViewer.astro'

## 背景音乐

<AudioPlayer src="https://example.com/bgm.mp3" title="背景音乐" />

## 3D 模型

<ModelViewer src="https://example.com/model.glb" title="交互模型" />

更多内容...
```

---

## 11. 常见问题与注意事项

### 11.1 文章不显示？

检查以下几点：

1. **`draft: true`** → 草稿不展示，改为 `false`
2. **`date` 格式错误** → 必须为 `YYYY-MM-DD`，如 `2024-03-15`
3. **文章不在 manifests/posts-index.json 中** → 重新生成清单
4. **`CONTENT_REPO_PATH` 未设置** → 检查 `.env` 文件

### 11.2 分类不生效？

- 确保 `category` 字段格式正确（多级用 `/` 分隔）
- 如果 `category` 为空，会 fallback 到文件目录结构

### 11.3 图片不显示？

- 检查图片 URL 是否可访问
- 内容仓内的相对路径图片确保路径正确
- 外部图片确保 URL 完整且可跨域访问

### 11.4 代码高亮不生效？

- 确保代码块指定了语言：```` ```javascript ````
- 支持的语言列表参考 Shiki 文档

### 11.5 标题锚点跳转失败？

- 中文标题的锚点 ID 为标题文本（如 `#我的标题`）
- 避免使用特殊字符作为标题

### 11.6 写作规范建议

1. **首行必须是 Frontmatter**，用 `---` 包裹
2. **`title` 和 `date` 必填**，否则构建校验失败
3. **`excerpt` 建议填写**，列表页展示更友好
4. **标签数量控制在 3-5 个**，过多影响卡片展示
5. **分类使用多级结构**，便于文件树组织
6. **避免在 Markdown 中使用原始 HTML**（虽支持但不推荐）
7. **图片必须有 `alt` 描述**，利于无障碍和 SEO

---

## 附录：字段速查表

```yaml
---
# ===== 必填 =====
title: "文章标题"              # string
date: "2024-03-15"             # string, YYYY-MM-DD

# ===== 可选：内容信息 =====
updated: "2024-03-20"          # string, YYYY-MM-DD
excerpt: "文章摘要"            # string
tags: ["标签1", "标签2"]       # string[]
category: "分类/子分类"        # string
author: "作者"                 # string

# ===== 可选：可见性 =====
draft: false                   # boolean, 草稿不展示
hidden: false                  # boolean, 列表隐藏但可直链访问
pin: 0                         # number, 置顶权重(0=不置顶)

# ===== 可选：媒体 =====
cover: "https://..."           # string, 封面图
audio: "https://..."           # string, 音频
score: "https://..."           # string, 乐谱
model: "https://..."           # string, 3D模型
attachments:                   # array, 附件
  - name: "文件名"
    url: "https://..."
    type: "mime/type"
---
```
