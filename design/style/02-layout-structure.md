# 02 · 布局结构

## 1. 页面骨架（桌面 ≥ 1280px）

```
┌─────────────────────────────────────────────────────────────────────┐
│  Translation Banner  （可关闭，全宽，背景 --color-accent-subtle）   │
├─────────────────────────────────────────────────────────────────────┤
│  Header  64px                                                       │
│  [Logo+Brand] [Version ▾] ─── [Search / Ask Copilot] ─── [🌐 Lang] [GH] │
├──────────────┬──────────────────────────────────────┬───────────────┤
│              │  Breadcrumb                          │               │
│              │  H1 Title                            │               │
│  Left        │  Subtitle / 简介                     │  In this      │
│  Sidebar     │  ─────────────────────────────────── │  article      │
│  296px       │                                      │  256px        │
│  (导航树)    │  正文 Markdown / RST                 │  (锚点 TOC)   │
│              │                                      │               │
│              │  Prev / Next 卡片                    │               │
├──────────────┴──────────────────────────────────────┴───────────────┤
│  Footer  （© 版权 + 链接）                                          │
└─────────────────────────────────────────────────────────────────────┘
```

总宽度上限：`max-width: 1280px` 居中；超过 1280 时两侧留白。

## 2. 区域规格

### 2.1 翻译提示条（Translation Banner）

- 高度：40px
- 背景：`--color-accent-subtle`（`#E6F4F1`）
- 文本：`本文也提供 English 版本`（带链接） + 右侧 `×` 关闭按钮
- 交互：点击 `×` 后写入 `localStorage`，本会话不再展示
- 该 banner 仅在站点为多语言时显示；在 README/路由层判定是否存在英文对应页

### 2.2 顶部导航（Header）

| 区 | 内容 | 行为 |
| --- | --- | --- |
| 左 | `☰`（仅 < 1024px）+ Octicon `mark-github` + 文本 `ProteinSeek Docs` | LOGO 点击回首页 |
| 中-左 | 版本选择器 `Version: 0.1.0 ▾` | 下拉显示其他版本（占位） |
| 中 | 搜索输入框，占位符 `Search or ask Copilot`，前缀图标 + `Ctrl K` | 点击触发搜索面板；移动端展开全屏 |
| 右 | 🌐 语言切换、GitHub 仓库链接 | 跳转 |

- 高度：64px
- 背景：`--color-canvas-default`
- 底边：`1px solid --color-border-default`
- 粘性：`position: sticky; top: 0; z-index: 100`

### 2.3 左侧栏（Left Sidebar）

- 宽度：296px
- 背景：`--color-canvas-default`
- 顶部："← Home" 返回链接 + 当前 section 标题（如 `Get started`，加粗 18px）
- 主体：两级折叠树，复用 Sphinx `toctree`，结构：
  ```
  ▾ Start your journey
      About GitHub and Git           (当前项高亮：左 3px 实心条 + 加粗)
      Create an account
      ...
  ▸ Onboarding
  ▸ Using GitHub
  ```
- 折叠状态由 `details` / JS 控制；当前页所在分组默认展开。
- 滚动：独立纵向滚动（`overflow-y: auto`），跟随窗口高度。
- 当前项样式：背景 `--color-accent-subtle`，左侧 3px 品牌色条。

### 2.4 主体（Content）

- 宽度：`max-width: 832px`
- 内边距：上 32 / 左右 32 / 下 64
- 顺序：
  1. **Breadcrumb**：`Get started / Start your journey /`（字号 14，颜色 `--color-fg-muted`，链接可点击）
  2. **H1 标题**：40px / 600
  3. **Subtitle**：20px / 400，颜色 `--color-fg-muted`
  4. **工具条**：右上角 "Copy as Markdown ▾" 按钮（与首段并排，浮动右侧）
  5. **正文**：MyST/RST 渲染
  6. **Prev / Next 卡片**：底部两列，左 Prev / 右 Next，hover 抬起阴影

### 2.5 右侧 TOC（In this article）

- 宽度：256px
- 标题：`In this article`（14px / 600）
- 列表：当前页 H2/H3 锚点，最多两级
- 高亮：跟随滚动，当前可见小节左边 2px 品牌色实线 + 文字色变深
- 行为：`position: sticky; top: 96px`（避开顶栏 + 间距）
- 平板及以下隐藏

### 2.6 页脚（Footer）

- 极简：版权 © 年份 ProteinSeek Team · 文档源码（GitHub 链接） · 备案号（占位）
- 顶边线：`1px solid --color-border-muted`

## 3. 容器与间距规范

```
顶栏内边距：水平 24px
正文容器：水平 32px（桌面）/ 24px（平板）/ 16px（手机）
左侧栏左内边距：24px
右侧 TOC 左内边距：24px
区块间距：32px（H2 之前）/ 24px（H3 之前）/ 16px（段落间）
```

## 4. 网格定义（CSS Grid）

```css
.layout {
  display: grid;
  grid-template-columns:
    [left] 296px
    [main] minmax(0, 1fr)
    [right] 256px;
  gap: 32px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
```

平板（768–1279）：`grid-template-columns: 296px minmax(0,1fr);`
手机（< 768）：`grid-template-columns: 1fr;`（侧栏抽屉式）

## 5. Z-index 分层

| 层 | 用途 |
| --- | --- |
| 0  | 正文 |
| 10 | 右侧 TOC sticky |
| 20 | 左侧栏 sticky |
| 50 | 搜索弹层 |
| 90 | 移动端遮罩 |
| 100| 顶栏 |
| 110| Banner |
| 200| Toast / Dialog |
