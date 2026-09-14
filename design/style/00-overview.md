# 设计方案总览：GitHub Docs 风格化改造

> 目标：将当前基于 Sphinx + Furo 主题的 `ProteinSeek Workbench` 文档站点，改造为高度接近 [docs.github.com](https://docs.github.com/en/get-started/start-your-journey/about-github-and-git) 的视觉与交互体验，且在桌面 / 平板 / 手机端均保持一致的体验。
>
> **方案演进**：早期版本计划在 Furo 主题之上叠加 `_static/_templates` 覆盖，但与 Furo 自带样式冲突面广、维护成本高，已改为 **自建轻量 Sphinx 主题 `psdocs`**（继承自 Sphinx 官方 `basic` 主题）。所有模板、CSS、JS、图标均由本仓库掌控，详见 `05-implementation-plan.md`。

## 1. 文档目录

本设计方案按主题拆分为多个文档，建议按顺序阅读：

| 序号 | 文件 | 主题 |
| --- | --- | --- |
| 00 | `00-overview.md` | 总览、目标、范围、技术选型 |
| 01 | `01-visual-design.md` | 视觉系统（字体、配色、圆角、阴影、图标） |
| 02 | `02-layout-structure.md` | 整体页面骨架、三栏布局、信息架构 |
| 03 | `03-components.md` | 组件清单（顶栏、侧栏、面包屑、In this article、Prev/Next、Callout、代码块、Copy as Markdown 等） |
| 04 | `04-responsive.md` | 响应式断点、桌面 / 平板 / 手机三态适配方案 |
| 05 | `05-implementation-plan.md` | Sphinx 落地方案（自建主题包 `psdocs`）、文件结构、迁移步骤、验收清单 |

## 2. 参考来源

主参考：

- 列表页：<https://docs.github.com/en>
- 内容页：<https://docs.github.com/en/get-started/start-your-journey/about-github-and-git>

辅助参考（GitHub 设计体系）：

- Primer Design System：<https://primer.style/>
- Primer CSS 变量：<https://primer.style/primitives/>
- Octicons 图标库：<https://primer.style/octicons/>

## 3. 现状基线

| 项 | 现状 |
| --- | --- |
| 主题 | Furo（`html_theme = "furo"`），将被替换 |
| 已启用扩展 | `myst_parser`、`sphinx_copybutton`、`sphinx_design` |
| 自定义 CSS | `source/_static/custom.css`（仅覆盖品牌主色 `#0f766e`），将废弃 |
| 语言 | `zh_CN` |
| 站点标题 | "ProteinSeek Workbench 使用文档" |
| 已有结构 | 顶部 LOGO、左侧导航、主体内容、右侧目录（Furo 默认三栏） |

## 4. 设计目标（验收基线）

1. **视觉一致性**：字体、配色、圆角、间距、图标风格在桌面端首屏对比 GitHub Docs 截图，差异肉眼难辨。
2. **结构一致性**：复刻
   - 顶部导航条（LOGO + 版本选择器 + 搜索 + 语言切换）
   - 顶部"也提供 XXX 语言"提示条（dismissible banner）
   - 左侧两级折叠侧栏
   - 中部正文 + 面包屑 + 标题 + "Copy as Markdown" 按钮 + Prev/Next 文章卡
   - 右侧 "In this article" 锚点目录
   - 底部页脚
3. **交互一致性**：搜索框（带"Search or ask Copilot"提示样式占位符）、Copy as Markdown 复制按钮（含下拉箭头）、侧栏折叠、移动端汉堡菜单、回到顶部、锚点高亮跟随滚动。
4. **响应式**：
   - ≥ 1280px（桌面）：三栏布局，全功能
   - 768–1279px（平板）：隐藏右侧 TOC，保留左侧栏（可折叠）
   - < 768px（手机）：仅显示正文，顶栏汉堡菜单展开侧栏，搜索独立全屏
5. **可维护性**：构建独立的 Sphinx 主题包 `psdocs`，继承自 Sphinx 官方 `basic` 主题；所有模板与样式均由本项目掌控，不再与第三方主题样式打架。CSS 变量化，便于后续微调与暗色模式。
6. **无障碍**：语义化 HTML，颜色对比度 ≥ WCAG AA，键盘可达。

## 5. 不在范围内

- 不实现 Copilot 真实问答能力（仅在搜索框 UI 上保留 "Search or ask Copilot" 占位符样式）。
- 不引入 React/Vue 等前端框架，所有定制使用原生 CSS + 少量原生 JS。
- 不替换 Sphinx 为其他文档框架（如 Docusaurus、Nextra）。
- 不发布主题到 PyPI（首版仅作为本仓库内部主题，路径加载）。

## 6. 技术路线摘要

- **基底**：在仓库内新增 `theme/psdocs/` 目录，作为一个标准 Sphinx 主题包（包含 `theme.conf` + Jinja2 模板 + 静态资源），通过 `html_theme_path` 注册并 `html_theme = "psdocs"` 启用。父主题设为 Sphinx 自带 `basic`，复用其 `toctree`、`searchindex`、`genindex` 等机制，避免重造轮子。
- **模板**：自实现 `layout.html`、`page.html`、`search.html` 等；并把组件拆到 `partials/`（header、sidebar、breadcrumb、toc、pager、banner、copy-markdown、icon）。
- **样式**：`theme/psdocs/static/css/` 下按 `tokens / base / layout / components / responsive / dark` 拆分，由 `theme.conf` 的 `stylesheet` 字段声明，无需用户改 `conf.py`。
- **脚本**：`theme/psdocs/static/js/app.js` 处理 banner 关闭、移动端抽屉、TOC 滚动高亮、Copy as Markdown、暗色切换。
- **图标**：内嵌 Octicons SVG（MIT 协议），合成 `icons.svg` sprite 一次加载。
- **字体**：与 GitHub 一致的系统字体栈，详见 `01-visual-design.md`。
- **`conf.py` 改动**：移除 `furo` 与旧 `custom.css`，添加 `html_theme_path = ["../theme"]` 与 `html_theme = "psdocs"`，通过 `html_theme_options` 暴露品牌名 / 仓库链接 / 版本号 / 语言切换列表等。

## 7. 里程碑

| 阶段 | 产出 |
| --- | --- |
| M1 设计冻结 | `design/` 下 6 篇方案评审通过 |
| M2 主题骨架 | `theme/psdocs/` 创建，`theme.conf` + `layout.html` + tokens/base CSS，桌面端可渲染 |
| M3 三栏布局 | header / sidebar / content / right TOC 完整接入 Sphinx toctree 与页内目录 |
| M4 组件 | Copy as Markdown、面包屑、Prev/Next、Banner、Admonition、代码块、表格、搜索 |
| M5 响应式 | 平板 / 手机适配、移动端抽屉、全屏搜索、暗色模式 |
| M6 验收 | 与参考截图逐屏对比、Lighthouse a11y ≥ 95、回归测试 |
