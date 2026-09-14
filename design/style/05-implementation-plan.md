# 05 · Sphinx 实施方案（自建主题 `psdocs`）

## 1. 策略选择

| 选项 | 评估 | 结论 |
| --- | --- | --- |
| A. 在 Furo 之上通过 `_static` + `_templates` 覆盖 | 与 Furo 自带 CSS 选择器/变量冲突面广；需大量 `!important` 与逆向；难以彻底控制 DOM 类名 | ❌ 放弃 |
| B. **自建主题包 `psdocs`，继承自 Sphinx 官方 `basic` 主题** | DOM/类名/样式/JS 全由本项目掌控；`basic` 已处理 toctree、searchindex、genindex、域名引用等底层机制；零样式包袱 | ✅ 采用 |
| C. 完全从零（不继承 `basic`） | 需手写域索引、搜索页、404 等模板，工作量翻倍 | ❌ 过度 |
| D. 改用 `pydata-sphinx-theme` / `sphinx-book-theme` 等再覆盖 | 与方案 A 同类问题 | ❌ |

**结论**：方案 B —— 在仓库内新建 `theme/psdocs/`，作为标准 Sphinx 主题包；`theme.conf` 中声明 `inherit = basic`；通过 `html_theme_path` 注册。

### 为什么继承 `basic` 而不是从零

Sphinx 的 `basic` 主题（位于 Sphinx 安装目录下的 `themes/basic/`）提供以下「无样式」基础设施：

- `searchbox.html` / `search.html` / `searchindex.js` 加载逻辑
- `genindex.html` / `genindex-single.html` / `genindex-split.html`
- `domainindex.html`、`opensearch.xml`
- `globaltoc.html` / `localtoc.html` 等可复用 partial
- `static/basic.css`（仅极少量结构性样式，可被完全覆盖）
- `static/doctools.js`、`static/searchtools.js`、`static/language_data.js`

我们只关心视觉层与新增组件，继承 `basic` 后只需覆盖 `layout.html`、`page.html`、`search.html`，新增 partial 与静态资源，完全不影响这些底层能力。

## 2. 主题包目录结构

```
proteinseek-workbench-docs/
├─ theme/
│  └─ psdocs/
│     ├─ theme.conf                # 主题元数据（继承、选项）
│     ├─ layout.html               # 整体骨架：<html>/header/sidebar/toc/footer
│     ├─ page.html                 # 单页正文：breadcrumb/title/copy-md/body/pager
│     ├─ search.html               # 搜索结果页（覆盖 basic）
│     ├─ partials/
│     │  ├─ banner.html            # 顶部翻译提示条
│     │  ├─ header.html            # 顶栏：LOGO + 版本 + 搜索 + 语言 + GitHub + 暗色切换
│     │  ├─ sidebar.html           # 左栏：返回 Home + 折叠树
│     │  ├─ toc.html               # 右栏：In this article
│     │  ├─ breadcrumb.html        # 面包屑
│     │  ├─ pager.html             # Prev/Next 卡片
│     │  ├─ copy-markdown.html     # Copy as Markdown 分裂按钮
│     │  ├─ footer.html            # 页脚
│     │  └─ icon.html              # SVG sprite use 包装
│     └─ static/
│        ├─ css/
│        │  ├─ tokens.css          # 颜色/字体/间距/圆角变量
│        │  ├─ base.css            # 重置 + 字体 + 链接 + 标题
│        │  ├─ layout.css          # Grid 三栏 + 顶栏 + sidebar + TOC
│        │  ├─ components.css      # banner/breadcrumb/copy-md/pager/admonition/code/table
│        │  ├─ responsive.css      # 媒体查询
│        │  └─ dark.css            # 暗色覆盖（data-theme="dark"）
│        ├─ js/
│        │  └─ app.js              # banner/drawer/toc-highlight/copy-md/theme-toggle
│        └─ icons.svg              # Octicons 合并 sprite
└─ source/
   ├─ conf.py                       # 修改：注册 html_theme_path / html_theme
   └─ _static/                      # 项目级覆盖（如需）；首版可空
```

> 选择放在仓库根 `theme/` 下而非 `source/_themes/`，是为了与文档源解耦，将来若要发布为独立 PyPI 包仅需把 `theme/psdocs/` 单独 setup 即可。

## 3. `theme.conf` 设计

```ini
[theme]
inherit = basic
stylesheet = css/tokens.css, css/base.css, css/layout.css, css/components.css, css/responsive.css, css/dark.css
pygments_style = default
pygments_dark_style = monokai
sidebars = sidebar.html

[options]
brand_name        = ProteinSeek Docs
brand_short       = Docs
repo_url          = https://github.com/proteinseek/proteinseek-workbench-docs
versions          =
languages         =
banner_text       =
banner_link_label =
banner_link_url   =
show_copy_md      = true
show_dark_toggle  = true
default_theme     = auto
```

- `inherit = basic`：所有未覆盖模板回退至 Sphinx `basic`。
- `stylesheet` 字段是逗号分隔列表，Sphinx 会按顺序注入 `<link>`，无需在 `conf.py` 中重复声明 `html_css_files`。
- `sidebars` 强制使用我们自己的 sidebar partial（覆盖默认 `localtoc.html + relations.html + sourcelink.html + searchbox.html` 组合）。
- `[options]` 暴露给 `conf.py` 通过 `html_theme_options` 配置；模板里用 `{{ theme_brand_name }}` 取用。

## 4. `conf.py` 改动

```python
import os, sys
sys.path.insert(0, os.path.abspath('..'))   # 让 Sphinx 找到 theme/

# 移除：html_theme = "furo"
# 移除：html_css_files = ["custom.css"]
# 删除文件：source/_static/custom.css（旧覆盖）

html_theme = "psdocs"
html_theme_path = ["../theme"]
html_title = "ProteinSeek Workbench"
html_static_path = ["_static"]      # 仍保留项目级 static，主题 static 已由主题自动注入

html_theme_options = {
    "brand_name":  "ProteinSeek Docs",
    "brand_short": "Docs",
    "repo_url":    "https://github.com/proteinseek/proteinseek-workbench-docs",
    "versions": [
        {"label": "0.1.0", "url": "/", "current": True},
    ],
    "languages": [
        {"label": "简体中文", "code": "zh_CN", "current": True},
        {"label": "English",  "code": "en",    "url": ""},
    ],
    "banner_text":       "本文也提供 English 版本",
    "banner_link_label": "English",
    "banner_link_url":   "",
    "show_copy_md":      True,
    "show_dark_toggle":  True,
    "default_theme":     "auto",     # auto | light | dark
}
```

## 5. 关键模板设计

### 5.1 `layout.html`（骨架）

```jinja
<!DOCTYPE html>
<html lang="{{ language }}" data-theme="{{ theme_default_theme }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ title|striptags|e }}{{ titlesuffix }}</title>
  {{ metatags }}
  {%- block css %}
    {%- for css_file in css_files %}
      <link rel="stylesheet" href="{{ pathto(css_file, 1) }}">
    {%- endfor %}
  {%- endblock %}
  <script>
    // FOUC 防闪烁：在 CSS 应用前同步设定主题与 banner 状态
    (function(){
      try {
        var saved = localStorage.getItem('ps-theme');
        if (saved) document.documentElement.dataset.theme = saved;
        if (localStorage.getItem('ps-banner-dismissed') === '1')
          document.documentElement.dataset.bannerHidden = '1';
      } catch(e) {}
    })();
  </script>
</head>
<body>
  {% include "partials/banner.html" %}
  {% include "partials/header.html" %}

  <div class="ps-layout">
    <aside class="ps-sidebar">{% include "partials/sidebar.html" %}</aside>
    <main class="ps-main" id="main">{% block body %}{% endblock %}</main>
    <aside class="ps-toc">{% include "partials/toc.html" %}</aside>
  </div>

  {% include "partials/footer.html" %}

  {%- for js_file in script_files %}
    <script src="{{ pathto(js_file, 1) }}" defer></script>
  {%- endfor %}
</body>
</html>
```

### 5.2 `page.html`（继承 layout 的 body 块）

```jinja
{% extends "layout.html" %}
{% block body %}
  {% include "partials/breadcrumb.html" %}
  <div class="ps-titlebar">
    <div class="ps-titlebar__text">
      <h1>{{ title }}</h1>
      {% if meta and meta.get('subtitle') %}
        <p class="ps-subtitle">{{ meta.subtitle }}</p>
      {% endif %}
    </div>
    {% if theme_show_copy_md %}
      {% include "partials/copy-markdown.html" %}
    {% endif %}
  </div>

  <article class="ps-article">{{ body }}</article>

  {% include "partials/pager.html" %}
{% endblock %}
```

### 5.3 `partials/sidebar.html`

```jinja
<div class="ps-sidebar__brand">
  <a class="ps-sidebar__home" href="{{ pathto(master_doc) }}">
    {% include "partials/icon.html" %} {# name=arrow-left #}
    Home
  </a>
  {% if parents %}
    <div class="ps-sidebar__section">{{ parents[0].title }}</div>
  {% else %}
    <div class="ps-sidebar__section">{{ title|striptags }}</div>
  {% endif %}
</div>

<nav class="ps-tree" aria-label="侧栏导航">
  {{ toctree(maxdepth=2, collapse=False, includehidden=True, titles_only=True) }}
</nav>
```

> 折叠由 CSS 控制：Sphinx 输出的 `<ul class="current">` 默认展开当前分组；其余分组通过 `details/summary` 或纯 CSS `[aria-expanded]` 按钮在 `app.js` 中增强。

### 5.4 `partials/icon.html`

```jinja
{# usage: {% with name='copy', size=16 %}{% include 'partials/icon.html' %}{% endwith %} #}
<svg class="octicon octicon-{{ name }}" width="{{ size|default(16) }}" height="{{ size|default(16) }}" aria-hidden="true">
  <use href="{{ pathto('_static/icons.svg', 1) }}#{{ name }}"></use>
</svg>
```

## 6. CSS 资源加载顺序

由 `theme.conf` 的 `stylesheet` 决定，按顺序：

1. `tokens.css` —— `:root` 变量
2. `base.css` —— 字体、重置、标题、链接、滚动条
3. `layout.css` —— 三栏 grid + 顶栏 + sidebar + toc 定位
4. `components.css` —— 所有 `.ps-*` 组件
5. `responsive.css` —— 媒体查询
6. `dark.css` —— `[data-theme="dark"]` 覆盖

Sphinx 自动追加的 `pygments.css`（代码高亮）排在主题 stylesheet 之后，故我们在 `components.css` 中的代码块外层样式不会被覆盖。

## 7. JS 设计（`app.js`）

单文件、无依赖、defer 加载。模块化为以下函数：

```js
initBannerDismiss();   // 关闭按钮 → localStorage
initThemeToggle();     // 切换 light/dark/auto，写 localStorage
initSidebarDrawer();   // 移动端抽屉开关 + Esc + 焦点管理
initTocHighlight();    // IntersectionObserver 高亮 In this article
initCopyMarkdown();    // 主按钮 + 下拉，复制 article innerText
initAnchorLinks();     // 标题悬停显示 # 链接，点击复制锚链接
initSearchShortcut();  // Ctrl/Cmd+K 聚焦顶栏搜索
```

## 8. Copy as Markdown 首版实现

**方案 A（首版）**：JS 抓取 `<article class="ps-article">` 的 innerText + 简易规则转换（标题前缀 `#`、列表、代码块），写入剪贴板。

**方案 B（后续）**：编写极简 Sphinx 扩展，在 `build-finished` 钩子把每页源文件复制到 `_build/html/_sources/` 并以 `.md` 后缀提供；按钮 `fetch('./xxx.md')` 拿到原文复制。

首版优先 A，零构建期改动；B 在 M6 视需求引入。

## 9. 迁移与回归

### 9.1 一次性清理

- 删除 `source/_static/custom.css`（旧仅含 Furo 变量覆盖）
- 从 `requirements.txt` 移除 `furo`（保留 `myst-parser`、`sphinx-copybutton`、`sphinx-design`）
- `conf.py` 同步修改（见第 4 节）

### 9.2 兼容性

- 保留 `myst_parser`、`sphinx_copybutton`、`sphinx_design` 三个扩展；其样式在 `components.css` 中重写。
- `sphinx_copybutton` 注入的 `<button class="copybtn">` 不依赖主题，照旧工作；我们仅替换其图标与配色。
- `sphinx_design` 卡片/Tab 样式需要在 `components.css` 中重写一份与 GitHub 一致的版本。

### 9.3 回滚路径

- 主题包独立放在 `theme/psdocs/`，回滚仅需把 `conf.py` 中 `html_theme` 改回 `"furo"` 并恢复一行 `custom.css`，主题包文件保留不影响构建。

## 10. 落地顺序（建议）

1. **M2-1**：创建 `theme/psdocs/` 与 `theme.conf`、最小 `layout.html`、`page.html`，使 `make html` 能用 `psdocs` 主题构建出无样式但内容完整的页面。
2. **M2-2**：写入 `tokens.css` + `base.css`，全站字体与配色生效。
3. **M3-1**：实现 `header.html` + `sidebar.html`，桌面三栏 Grid 落位。
4. **M3-2**：实现 `toc.html` + `breadcrumb.html` + `pager.html`。
5. **M4-1**：实现 `banner.html` + `copy-markdown.html` + `app.js` 全部模块。
6. **M4-2**：`components.css` 重写 admonition、代码块、表格、`sphinx_design` 组件。
7. **M5**：`responsive.css` + 抽屉式 sidebar + 移动端全屏搜索 + 暗色模式。
8. **M6**：与参考截图逐屏对比，Lighthouse、a11y、回归。

## 11. 验收清单

- [ ] `make html` 成功，无 Sphinx warning
- [ ] 首页与 GitHub Docs 首屏并排截图差异 ≤ 视觉可接受范围
- [ ] 桌面 1440 / 平板 820 / 手机 390 三档截图收齐
- [ ] Lighthouse Accessibility ≥ 95，Performance ≥ 90
- [ ] 暗色模式按钮可在 light/dark/auto 间循环，且不破样式
- [ ] 移动端汉堡抽屉：打开 / 关闭 / Esc / 点遮罩关闭
- [ ] 全部 admonition 样式重写完毕
- [ ] 代码块复制按钮换为 Octicon 风格
- [ ] "Copy as Markdown" 主按钮可用，吐司提示正常
- [ ] 翻译 banner 关闭后刷新不再显示
- [ ] 搜索页 `/search.html` 能正常出结果（覆盖 basic 后保持功能）
- [ ] `conf.py` 不再依赖 `furo`，`requirements.txt` 已清理
