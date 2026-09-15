from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from markupsafe import Markup

# -- Project information -----------------------------------------------------

project = "OpenFoD"
author = "OpenFoD Community"
copyright = f"{datetime.now(timezone.utc).year}, {author}"
release = "0.1.0"

_LANGUAGE_ALIASES = {
    "zh": "zh_CN",
    "zh-CN": "zh_CN",
    "zh_CN": "zh_CN",
    "en": "en",
    "en-US": "en",
}
language = _LANGUAGE_ALIASES.get(os.environ.get("DOCS_LANGUAGE", "zh_CN"), "zh_CN")
_LANGUAGE_CODE = "en" if language.startswith("en") else "zh"
_LANGUAGE_LABELS = {
    "zh": {"label": "中文", "html_lang": "zh-CN", "sphinx_language": "zh_CN"},
    "en": {"label": "English", "html_lang": "en", "sphinx_language": "en"},
}
_UI_TEXT = {
    "zh": {
        "breadcrumb": "面包屑",
        "copy_markdown": "Copy as Markdown",
        "documentation_source": "文档源码",
        "home": "首页",
        "back_to_site": "返回首页",
        "in_this_article": "本文目录",
        "language": "语言",
        "language_menu": "选择语言",
        "next": "下一篇",
        "open_sidebar": "打开侧栏",
        "page_toc": "本页目录",
        "prev_next": "上一/下一篇",
        "previous": "上一篇",
        "ai_search": "AI 搜索",
        "ai_search_empty": "请先输入要查询的问题。",
        "ai_search_error": "AI 搜索服务暂不可用，请稍后重试。",
        "ai_search_loading": "正在根据文档生成回答...",
        "ai_search_no_sources": "未在当前文档中找到可靠来源。",
        "ai_search_retention_notice": "Ask AI 只会检索本站已经发布的文档片段。",
        "ai_search_sources": "参考来源",
        "ai_label": "AI",
        "ask_ai": "Ask AI",
        "close_search": "关闭搜索",
        "search_or_ask": "Search or ask",
        "search_or_ask_ai": "Search or ask AI",
        "search_docs": "搜索文档",
        "search_placeholder": "Search",
        "sidebar": "侧栏导航",
    },
    "en": {
        "breadcrumb": "Breadcrumb",
        "copy_markdown": "Copy as Markdown",
        "documentation_source": "Documentation source",
        "home": "Home",
        "back_to_site": "Back to homepage",
        "in_this_article": "In this article",
        "language": "Language",
        "language_menu": "Select language",
        "next": "Next",
        "open_sidebar": "Open sidebar",
        "page_toc": "Page contents",
        "prev_next": "Previous/next article",
        "previous": "Previous",
        "ai_search": "AI Search",
        "ai_search_empty": "Enter a question first.",
        "ai_search_error": "AI Search is unavailable. Try again later.",
        "ai_search_loading": "Generating an answer from the docs...",
        "ai_search_no_sources": "No reliable source was found in the current docs.",
        "ai_search_retention_notice": "Ask AI only searches published documentation.",
        "ai_search_sources": "Sources",
        "ai_label": "AI",
        "ask_ai": "Ask AI",
        "close_search": "Close search",
        "search_or_ask": "Search or ask",
        "search_or_ask_ai": "Search or ask AI",
        "search_docs": "Search docs",
        "search_placeholder": "Search",
        "sidebar": "Sidebar navigation",
    },
}
_SEARCH_EXAMPLES = {
    "zh": [
        "如何安装并运行 OpenFoD？",
        "城内内政和野外作战怎么切换？",
        "开发者如何搭建 Godot 与 .NET 环境？",
        "parity 对照是怎么工作的？",
        "文档更新后如何部署到官网？",
    ],
    "en": [
        "How do I install and run OpenFoD?",
        "How do city governance and field battles switch?",
        "How do developers set up Godot and .NET?",
        "How does the parity oracle work?",
        "How do docs updates deploy to the website?",
    ],
}


def _format_toc_section_count(section_count: int) -> str:
    if _LANGUAGE_CODE == "en":
        return f"This article has {section_count} section" if section_count == 1 else f"This article has {section_count} sections"
    return f"本文共 {section_count} 节"


def _build_toc_intro_context(context: dict[str, object]) -> None:
    raw_toc = str(context.get("toc") or "").strip()
    fallback_title = str(context.get("title") or "")
    next_page = context.get("next")
    intro = {
        "title": fallback_title,
        "section_count": 0,
        "section_count_display": _format_toc_section_count(0),
        "next": next_page,
    }

    context["ps_toc_intro"] = intro
    context["ps_toc_html"] = Markup(raw_toc)

    if not raw_toc:
        return

    try:
        wrapper = ET.fromstring(f"<div>{raw_toc}</div>")
    except ET.ParseError:
        return

    root_ul = wrapper.find("ul")
    if root_ul is None:
        return

    root_li = root_ul.find("li")
    if root_li is None:
        return

    title_link = root_li.find("a")
    if title_link is not None:
        toc_title = "".join(title_link.itertext()).strip()
        if toc_title:
            intro["title"] = toc_title

    child_ul = root_li.find("ul")
    if child_ul is None:
        context["ps_toc_html"] = Markup("")
        return

    section_count = len(child_ul.findall("li"))
    intro["section_count"] = section_count
    intro["section_count_display"] = _format_toc_section_count(section_count)
    context["ps_toc_html"] = Markup(ET.tostring(child_ul, encoding="unicode", method="html"))


def setup(app):
    app.connect("html-page-context", lambda app, pagename, templatename, context, doctree: _build_toc_intro_context(context))
    return {
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }


# -- General configuration ---------------------------------------------------

extensions = [
    "myst_parser",
    "sphinx_copybutton",
    "sphinx_design",
]

templates_path = ["_templates"]
exclude_patterns = ["Thumbs.db", ".DS_Store"]
locale_dirs = ["locale/"]
gettext_compact = True
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# -- HTML output: in-repo psdocs theme ---------------------------------------

_THEME_DIR = Path(__file__).resolve().parent.parent / "theme"
html_theme_path = [str(_THEME_DIR)]
html_theme = "psdocs"

html_title = "OpenFoD Documentation" if _LANGUAGE_CODE == "en" else "OpenFoD 项目文档"
html_short_title = "OpenFoD Docs"
html_baseurl = f"https://www.openfod.org/docs/{_LANGUAGE_CODE}/"
html_favicon = "_static/favicon.png"
html_static_path = ["_static"]
html_show_sphinx = False
html_show_sourcelink = False
html_show_search_summary = False
_BREADCRUMB_SECTIONS = {
    "zh": {
        "overview": {"title": "开始使用"},
        "quickstart": {"title": "开始使用"},
        "user-guide/index": {"title": "用户使用文档"},
        "user-guide/install": {"title": "用户使用文档"},
        "user-guide/city": {"title": "用户使用文档"},
        "user-guide/combat": {"title": "用户使用文档"},
        "user-guide/officers": {"title": "用户使用文档"},
        "user-guide/factions": {"title": "用户使用文档"},
        "developer/index": {"title": "开发者文档"},
        "developer/architecture": {"title": "开发者文档"},
        "developer/setup": {"title": "开发者文档"},
        "developer/contributing": {"title": "开发者文档"},
        "developer/parity": {"title": "开发者文档"},
        "developer/formats": {"title": "开发者文档"},
        "developer/docs-pipeline": {"title": "开发者文档"},
        "reference/index": {"title": "参考资料"},
        "reference/glossary": {"title": "参考资料"},
        "reference/configuration": {"title": "参考资料"},
        "changelog": {"title": "参考资料"},
    },
    "en": {
        "overview": {"title": "Get started"},
        "quickstart": {"title": "Get started"},
        "user-guide/index": {"title": "User guide"},
        "user-guide/install": {"title": "User guide"},
        "user-guide/city": {"title": "User guide"},
        "user-guide/combat": {"title": "User guide"},
        "user-guide/officers": {"title": "User guide"},
        "user-guide/factions": {"title": "User guide"},
        "developer/index": {"title": "Developer guide"},
        "developer/architecture": {"title": "Developer guide"},
        "developer/setup": {"title": "Developer guide"},
        "developer/contributing": {"title": "Developer guide"},
        "developer/parity": {"title": "Developer guide"},
        "developer/formats": {"title": "Developer guide"},
        "developer/docs-pipeline": {"title": "Developer guide"},
        "reference/index": {"title": "Reference"},
        "reference/glossary": {"title": "Reference"},
        "reference/configuration": {"title": "Reference"},
        "changelog": {"title": "Reference"},
    },
}
html_context = {
    "asset_version": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"),
    "breadcrumb_sections": _BREADCRUMB_SECTIONS[_LANGUAGE_CODE],
    "ps_current_language": _LANGUAGE_LABELS[_LANGUAGE_CODE] | {"code": _LANGUAGE_CODE},
    "ps_languages": [
        _LANGUAGE_LABELS["zh"] | {"code": "zh"},
        _LANGUAGE_LABELS["en"] | {"code": "en"},
    ],
    "ps_search_examples": _SEARCH_EXAMPLES[_LANGUAGE_CODE],
    "ps_ui": _UI_TEXT[_LANGUAGE_CODE],
}

html_js_files = ["js/app.js"]

html_theme_options = {
    "brand_name": "OpenFoD Docs",
    "brand_short": "Docs",
    "sidebar_title": "OpenFoD",
    "repo_url": "https://github.com/openfod/OpenFod-Docs",
    "site_home_url": "https://www.openfod.org",
    "show_copy_md": "true",
    "banner_text": "",
    "banner_link_label": "",
    "banner_link_url": "",
}

html_sidebars: dict[str, list[str]] = {"**": []}

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "substitution",
    "tasklist",
]

copybutton_prompt_text = r">>> |\.\.\. |\$ |PS> "
copybutton_prompt_is_regexp = True
