# 04 · 响应式设计

## 1. 断点

| 名称 | 范围 | 设备 |
| --- | --- | --- |
| `xl` 桌面宽 | ≥ 1280px | 桌面 / 大屏 |
| `lg` 桌面 | 1024–1279px | 小桌面 / 横屏平板 |
| `md` 平板 | 768–1023px | 平板竖屏 |
| `sm` 手机横 | 480–767px | 大手机 / 小平板 |
| `xs` 手机 | < 480px | 手机 |

CSS 变量统一：

```css
:root {
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}
```

## 2. 三态布局策略

### 2.1 桌面（≥ 1280px）—— 完整三栏

- 左 296 / 中 832 / 右 256，gap 32。
- 顶栏全功能：LOGO、版本、搜索（400 宽）、语言、GitHub。
- 翻译 banner 显示。
- 侧栏与 TOC 均粘性。

### 2.2 中桌面（1024–1279）—— 仍三栏，缩窄

- 中部宽度自适应（`minmax(0,1fr)`）。
- 左栏保持，右 TOC 仍显示但若整体不够宽则隐藏（媒体查询条件 `< 1180px` 隐藏右 TOC）。
- 顶栏搜索缩到 280。

### 2.3 平板（768–1023）—— 两栏

- 隐藏右侧 TOC。
- 左侧栏保留，宽度 280，可通过顶栏汉堡按钮收起为抽屉式（默认仍显示）。
- 正文内边距收为 24。
- 顶栏搜索缩到 240；版本按钮折叠为图标。
- "Copy as Markdown" 显示主按钮（隐藏 ▾ 下拉，或保留下拉但宽度缩小）。
- Prev/Next 卡片保持双列。

### 2.4 手机（< 768）—— 单栏

- 仅显示正文。
- 顶栏布局：`[☰] [Logo] ──── [🔍] [🌐]`
  - 左：汉堡菜单
  - 中：LOGO（仅图标 + 短文字 "Docs"）
  - 右：搜索图标（点击全屏展开搜索）+ 语言
- 左侧栏 → 抽屉式（从左滑入，宽 296，背景遮罩透明黑）。
- 右侧 TOC → 折叠在 H1 下方的 `<details>` 中（"In this article" 标题可点开 / 关闭）。
- 翻译 banner 字号缩到 12，过长省略；关闭按钮始终可见。
- "Copy as Markdown"：移到 H1 下方一行，按钮宽度自适应内容。
- Prev/Next 卡片：堆叠为单列（Next 在 Prev 上方？参照 GitHub：Next 在前，Prev 在后；本项目按 Prev 在上、Next 在下也可接受，最终以参考站为准）。
- 代码块：保持横向滚动，复制按钮缩小为 28×28。
- 表格：`overflow-x: auto` + 提示"左右滑动查看完整表格"（首次显示）。

### 2.5 极小（< 480）

- 正文内边距 16。
- 顶栏隐藏语言按钮（合并进汉堡菜单）。
- 字号不缩，保持正文 16，仅 H1 缩到 32。

## 3. 抽屉式侧栏交互

- 触发：点击顶栏 `☰`。
- 状态：在 `<html>` 上加 `data-drawer-open="true"`。
- 动画：`transform: translateX(-100%)` → `0`，`transition: 200ms ease-out`。
- 遮罩：`background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);` 点击关闭。
- 可达性：打开时 `aria-modal="true"`，并将焦点移入第一个链接；`Esc` 关闭。
- 滚动锁：打开时 `body { overflow: hidden; }`。

## 4. 移动端搜索全屏

- 点击顶栏放大镜 → 覆盖全屏：
  - 顶部一行：搜索输入 + 取消按钮
  - 下方：最近搜索 / 热门链接（可选）
- 提供 `Esc` 关闭。

## 5. 触控优化

- 所有可点击元素最小 44×44。
- hover 效果用 `@media (hover: hover)` 包裹，避免移动端 sticky hover。
- 长按选中文本时禁用浏览器原生菜单干扰复制按钮。

## 6. 字号与间距随屏幕缩放

| 元素 | 桌面 | 平板 | 手机 |
| --- | --- | --- | --- |
| H1 | 40/48 | 36/44 | 32/40 |
| H2 | 24/32 | 24/32 | 22/30 |
| 正文 | 16/24 | 16/24 | 16/24（不缩） |
| 容器水平 padding | 32 | 24 | 16 |
| 顶栏高度 | 64 | 56 | 56 |

## 7. 媒体查询样板

```css
/* mobile-first 写法 */
.ps-toc { display: none; }

@media (min-width: 1180px) {
  .ps-toc { display: block; }
}

@media (min-width: 1024px) {
  .ps-hamburger { display: none; }
  .ps-sidebar { position: sticky; }
}

@media (max-width: 1023px) {
  .ps-sidebar { position: fixed; transform: translateX(-100%); }
  [data-drawer-open="true"] .ps-sidebar { transform: translateX(0); }
}

@media (max-width: 767px) {
  .ps-pager { grid-template-columns: 1fr; }
  .ps-search--inline { display: none; }
  .ps-search--icon { display: inline-flex; }
}
```

## 8. 可访问性 / 性能注意

- 所有图标 SVG 设 `aria-hidden="true"`，相邻文本承担语义。
- 抽屉切换使用 `transform`，避免重排。
- 关键 CSS 在 `<head>` 内联（仅顶栏 + banner，避免 FOUC）。
- 图标合并为单一 sprite 或按需内联，避免多次请求。

## 9. 测试矩阵

| 场景 | 视口 | 期望 |
| --- | --- | --- |
| MacBook 13" | 1440×900 | 三栏全功能 |
| iPad 竖屏 | 820×1180 | 两栏，可抽屉 |
| iPhone 14 | 390×844 | 单栏，抽屉 + 全屏搜索 |
| iPhone SE | 375×667 | 单栏，H1 缩小 |
| 4K 显示器 | 3840×2160 | 1280 居中，两侧留白 |
