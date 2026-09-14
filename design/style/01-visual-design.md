# 01 · 视觉设计系统

本节定义 GitHub Docs 风格的视觉令牌（Design Tokens），所有数值将以 CSS 自定义属性形式落到 `_static/css/tokens.css`。

## 1. 字体

GitHub 全站使用系统字体栈，不加载 Web Font，加载快且各平台原生观感一致。

```css
:root {
  /* 正文 */
  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
    Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";

  /* 等宽（代码） */
  --font-mono:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;

  /* 中文回落 */
  --font-cjk:
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    "Source Han Sans SC", "Noto Sans CJK SC";
}

body {
  font-family: var(--font-sans), var(--font-cjk);
}
```

### 字号 / 行高

| Token | 值 | 用途 |
| --- | --- | --- |
| `--fs-12` | 12px / 18px | 元信息、Banner |
| `--fs-14` | 14px / 20px | 侧栏导航、面包屑 |
| `--fs-16` | 16px / 24px | 正文基础字号 |
| `--fs-20` | 20px / 28px | 标题 H4 |
| `--fs-24` | 24px / 32px | 标题 H3 |
| `--fs-32` | 32px / 40px | 标题 H2 |
| `--fs-40` | 40px / 48px | 页面 H1 |

字重：正文 `400`，强调 `500`，标题 `600`，LOGO/品牌 `700`。

## 2. 颜色（Light Mode 优先）

GitHub Docs 主体使用 Primer 浅色调色板，本项目保留品牌主色 `#0f766e`（青绿）替换 GitHub 的蓝。

```css
:root {
  /* 中性色（来自 Primer Light） */
  --color-fg-default:  #1F2328;
  --color-fg-muted:    #59636E;
  --color-fg-subtle:   #6E7781;
  --color-fg-onEmphasis:#FFFFFF;

  --color-canvas-default: #FFFFFF;
  --color-canvas-subtle:  #F6F8FA;
  --color-canvas-inset:   #EFF2F5;

  --color-border-default: #D1D9E0;
  --color-border-muted:   #D1D9E0B3;

  /* 品牌（替换 GitHub 蓝 #0969DA） */
  --color-accent-fg:     #0F766E;
  --color-accent-emphasis:#0F766E;
  --color-accent-subtle: #E6F4F1;

  /* 语义色 */
  --color-success-fg:  #1A7F37;
  --color-attention-fg:#9A6700;
  --color-danger-fg:   #D1242F;
  --color-done-fg:     #8250DF;

  /* 阴影 */
  --shadow-sm: 0 1px 0 rgba(31,35,40,0.04);
  --shadow-md: 0 3px 6px rgba(140,149,159,0.15);
  --shadow-lg: 0 8px 24px rgba(140,149,159,0.2);
}
```

### Dark Mode（次优先）

由自建主题 `psdocs` 提供切换按钮（位于顶栏右侧）+ `prefers-color-scheme` 自动跟随；通过在 `<html>` 上写 `data-theme="dark"` 切换。下表给出与 Primer Dark 对齐的覆盖值（详见实现文档）。

| Token | Light | Dark |
| --- | --- | --- |
| `--color-fg-default` | `#1F2328` | `#F0F6FC` |
| `--color-canvas-default` | `#FFFFFF` | `#0D1117` |
| `--color-canvas-subtle` | `#F6F8FA` | `#161B22` |
| `--color-border-default` | `#D1D9E0` | `#30363D` |
| `--color-accent-fg` | `#0F766E` | `#2DD4BF` |

## 3. 间距 / 圆角 / 边框

8pt 网格制，对齐 Primer：

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;

  --radius-1: 4px;
  --radius-2: 6px;   /* 默认按钮 / 输入框 */
  --radius-3: 8px;   /* 卡片 */
  --radius-pill: 999px;

  --border-1: 1px solid var(--color-border-default);
}
```

## 4. 图标

- **图标库**：[Octicons](https://primer.style/octicons/)（MIT），按需以内联 SVG 方式引入。
- **尺寸**：16 / 20 / 24 三档，默认 16。
- **颜色**：继承 `currentColor`，便于 hover/active 状态切换。
- **使用清单**：
  - `mark-github` —— 顶栏 LOGO 旁
  - `search` —— 搜索框前缀
  - `copilot` —— "Search or ask Copilot" 占位前缀
  - `globe` —— 语言切换
  - `chevron-down` / `chevron-right` —— 折叠箭头
  - `link` —— 标题悬停锚点
  - `copy` —— 代码块复制 / Copy as Markdown
  - `info` / `alert` / `light-bulb` / `report` —— Callout 图标（note / warning / tip / important）
  - `arrow-left` / `arrow-right` —— Prev/Next 卡

将 Octicons SVG 集中放在 `source/_static/icons/`，模板中通过 `{% include %}` 嵌入；或者构建期复制到 `_build/html/_static/icons/`，运行时由 JS 注入。

## 5. 可视化效果细节

- **悬停**：链接默认无下划线，hover 时显示下划线（`text-decoration-thickness: 1px`）。
- **焦点**：所有可交互元素具备 `:focus-visible` 蓝色外环 `0 0 0 3px rgba(15,118,110,0.3)`。
- **过渡**：常用 `transition: 80ms cubic-bezier(0.33,1,0.68,1)`，颜色与背景。
- **滚动条**：使用 GitHub 风格滚动条（macOS 原生，不强制）。

## 6. Logo / 品牌

- 顶栏左侧：`Octicons mark-github` + 文本 `ProteinSeek Docs`（字重 600，字号 14，字色 `--color-fg-default`）。
- 侧栏顶部 brand 区域：项目名 + 版本号小徽章（pill，背景 `--color-canvas-subtle`，前景 `--color-fg-muted`）。

## 7. 验收对照表

| 项目 | 参考站 | 本站目标 |
| --- | --- | --- |
| 正文字号 | 16px | 16px |
| 链接色 | `#0969DA` | `#0F766E`（品牌色） |
| H2 字号 | 24–28px | 24px / 行高 32 |
| 卡片圆角 | 6px | 6px |
| 按钮高度 | 32px | 32px |
| 顶栏高度 | 64px | 64px |
| 侧栏宽度 | 296px | 296px |
| 右侧 TOC 宽度 | 256px | 256px |
| 正文最大宽度 | 768–896px | 832px |
