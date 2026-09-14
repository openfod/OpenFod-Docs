# 03 · 组件设计

每个组件给出：用途 · 视觉规格 · DOM/类名约定 · 交互行为 · 在 `psdocs` 主题中的落地位置。

---

## 3.1 顶部翻译提示条 `.ps-banner`

- 用途：提示当前文章存在其他语言版本。
- DOM：
  ```html
  <div class="ps-banner" role="status">
    <span>本文也提供 <a href="...">English</a> 版本</span>
    <button class="ps-banner__close" aria-label="关闭">×</button>
  </div>
  ```
- 视觉：高 40，背景 `--color-accent-subtle`，文字 14/`--color-fg-default`，链接品牌色带下划线，`×` 16px。
- 行为：点击 `×` → `localStorage.setItem('ps-banner-dismissed','1')`，下次进入不再渲染（由 `layout.html` 中内联 head script 提前判断避免闪烁）。
- 主题落地：`theme/psdocs/partials/banner.html`，由 `layout.html` 在 `<body>` 起始处 include。

---

## 3.2 顶部导航 `.ps-header`

### 3.2.1 LOGO + 品牌
```html
<a class="ps-brand" href="/">
  <svg class="octicon octicon-mark-github" ...></svg>
  <span>ProteinSeek Docs</span>
</a>
```

### 3.2.2 版本选择器 `.ps-version`
- 按钮：`Version: 0.1.0 ▾`，灰底白字反色为 `--color-canvas-subtle`/`--color-fg-default`，圆角 6，高 32。
- 点击展开下拉菜单（绝对定位，宽 240），列出可选版本（暂仅一个，后续扩展）。

### 3.2.3 搜索 `.ps-search`
- 占位：`Search or ask Copilot`，前缀 Octicon `search`（移动端 `copilot` 图标），后缀键盘提示 `Ctrl K` 灰色 pill。
- 宽度：400（桌面）/ 占满（移动）。
- 高度：32。
- 边框：`--color-border-default`，hover 加深，focus 出现 3px 品牌色环。
- 行为：聚焦 / `Ctrl+K` → 打开搜索面板（首版直接调用 Sphinx 自带 `search.html`，叠加浮层样式）。

### 3.2.4 语言切换 `.ps-lang`
- 按钮：圆形 32×32，仅图标 `globe`。
- 下拉：中文（当前）/ English（占位）。

### 3.2.5 GitHub 链接 `.ps-gh`
- 仅图标 `mark-github`，跳转仓库地址。

### 3.2.6 移动端汉堡 `.ps-hamburger`
- < 1024px 显示，点击打开左侧抽屉。

---

## 3.3 左侧栏 `.ps-sidebar`

- 顶部返回区：`← Home` + 当前 Section 标题（18/600）。
- 树节点 DOM 约定：
  ```html
  <ul class="ps-tree">
    <li class="ps-tree__group is-open">
      <button class="ps-tree__toggle">
        <svg class="octicon octicon-chevron-down"></svg>
        <span>Start your journey</span>
      </button>
      <ul>
        <li><a class="is-current" href="...">About GitHub and Git</a></li>
        ...
      </ul>
    </li>
    <li class="ps-tree__group">
      <button class="ps-tree__toggle">
        <svg class="octicon octicon-chevron-right"></svg>
        <span>Onboarding</span>
      </button>
    </li>
  </ul>
  ```
- 高亮当前页：左 3px 实线 `--color-accent-fg`，背景 `--color-accent-subtle`，文字 600。
- hover：背景 `--color-canvas-subtle`。
- 主题落地：`partials/sidebar.html` 自实现，遍历 `toctree(maxdepth=2, collapse=False, includehidden=True)` 上下文，按需注入 `is-current` / `is-open` 类名；折叠由原生 `<details>/<summary>` 实现，无 JS 依赖。

---

## 3.4 面包屑 `.ps-breadcrumb`

```html
<nav class="ps-breadcrumb" aria-label="breadcrumb">
  <ol>
    <li><a href="...">Get started</a></li>
    <li><a href="...">Start your journey</a></li>
  </ol>
</nav>
```
- 字号 14，颜色 `--color-fg-muted`，分隔符使用 `/`（CSS `::after`）。
- 主题落地：`partials/breadcrumb.html`，根据 Sphinx 提供的 `parents` 上下文与 `pagename` 渲染。

---

## 3.5 H1 标题与副标题

- H1：`font-size: 40px; line-height: 48px; font-weight: 600;`，下边距 8。
- Subtitle：`font-size: 20px; color: var(--color-fg-muted);`，下边距 24。
- 副标题取自 Sphinx 文档第一段或 `:subtitle:` 元信息（自定义指令）。

---

## 3.6 Copy as Markdown 按钮 `.ps-copy-md`

- 视觉：胶囊形分裂按钮 —— 左边主体 "Copy as Markdown"，右侧 `▾` 触发下拉。
- 高 32，圆角 6，边框 `--color-border-default`，背景 `--color-canvas-default`，hover 背景 `--color-canvas-subtle`。
- 主按钮图标前缀：Octicon `copy`。
- 下拉菜单选项：
  - `Copy page as Markdown`
  - `View page as Markdown`（新窗口打开 .md 源）
  - `Open in ChatGPT`（占位，可隐藏）
- 行为：
  - 主按钮：将当前页 HTML 主体转为 Markdown 写入剪贴板（可使用极简实现：抓取 `<article>` innerText，或在构建期生成同名 `.md` 文件，按钮直接 fetch）。
  - Toast：复制成功提示 "Copied!"，2s 自动消失。
- 位置：浮于 H1 同行右侧（桌面）；< 768px 移到正文上方一行单独占据。

---

## 3.7 右侧 "In this article" `.ps-toc`

- 标题 `In this article`（14/600）。
- 列表项 14/`--color-fg-muted`，hover/active 转为 `--color-fg-default`。
- 高亮当前小节：左 2px 实线 `--color-accent-fg`，文字加深加粗。
- 实现：使用 `IntersectionObserver` 监听 H2/H3，更新 `aria-current`。
- 数据来源：复用 Sphinx `{{ toc }}` 上下文（页内目录）。

---

## 3.8 Prev / Next 卡片 `.ps-pager`

```html
<nav class="ps-pager">
  <a class="ps-pager__card" data-dir="prev" href="...">
    <span class="ps-pager__label">← Previous</span>
    <span class="ps-pager__title">页面标题</span>
  </a>
  <a class="ps-pager__card" data-dir="next" href="...">
    <span class="ps-pager__label">Next →</span>
    <span class="ps-pager__title">页面标题</span>
  </a>
</nav>
```
- 双列网格，gap 16；卡片：圆角 6，边框 `--color-border-default`，内边距 16，hover 升起 `box-shadow: var(--shadow-md)` + 边框变 `--color-accent-fg`。
- label 14/`--color-fg-muted`；title 16/600/`--color-accent-fg`。
- 单页只有一侧时占满整行。
- 主题落地：`partials/pager.html`，使用 Sphinx 上下文中的 `prev` / `next` 对象。

---

## 3.9 Callouts / Admonitions

复用 `sphinx_design` + MyST 的 admonition；在 CSS 中重写：

| Sphinx 类型 | GitHub 风格 | 颜色 | 图标 |
| --- | --- | --- | --- |
| `note` | Note | 蓝/品牌色 | `info` |
| `tip` | Tip | 绿 | `light-bulb` |
| `important` | Important | 紫 | `report` |
| `warning` | Warning | 橙 | `alert` |
| `caution`/`danger` | Caution | 红 | `stop` |

- DOM：左侧 4px 实线带语义色，背景 `--color-canvas-subtle`，圆角 6，内边距 16；首行：图标 + 类型名加粗。

---

## 3.10 代码块 `.highlight` 重写

- 字体：`var(--font-mono)`，14/22。
- 背景：`--color-canvas-subtle`，边框 `--color-border-default`，圆角 6。
- 顶栏：可选语言标签 + 右上角复制按钮（`sphinx_copybutton` 已提供，仅改样式：图标改用 Octicon `copy`，hover 变品牌色）。
- 行内代码 `code`：背景 `rgba(175,184,193,0.2)`，圆角 4，内边距 `2px 6px`。

---

## 3.11 表格

- 边框：`--color-border-default`，圆角整体 6（`overflow:hidden`）。
- 表头：`--color-canvas-subtle`，字重 600。
- 行 hover：`--color-canvas-subtle`。
- 移动端：横向滚动 `overflow-x: auto`。

---

## 3.12 链接 / 锚点

- 默认无下划线，颜色 `--color-accent-fg`，hover 加下划线。
- 标题悬停显示 Octicon `link` 锚点（GitHub 风格），点击复制锚链接到剪贴板。

---

## 3.13 搜索弹层（首版可降级）

- 触发：聚焦输入或 `Ctrl+K`。
- 视觉：浮层卡片，宽 640，居中靠上 96px；包含输入框、结果列表、底部快捷键提示。
- 数据：先复用 Sphinx 自带的 `searchindex.js`；后续可接入 Algolia DocSearch。
- 降级：首版直接跳转 `search.html?q=...`，浮层留接口。

---

## 3.14 Footer `.ps-footer`

- 文本：`© 2026 ProteinSeek Team` · `文档源码` · `备案号`
- 字号 14，颜色 `--color-fg-muted`，居中。
