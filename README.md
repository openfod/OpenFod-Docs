# OpenFoD Docs

OpenFoD 项目文档站：用户使用文档 + 开发者文档。

生产地址：`https://www.openfod.org/docs/`

- 中文：`/docs/zh/`
- 英文：`/docs/en/`

视觉与交互参考 ProteinSeek Workbench Docs（Sphinx + 自研 GitHub Docs 风格主题 + 中英双语 + Ask AI）。**部署方式不同**：本仓库只产出静态 HTML，由 [OpenFod-Website](https://github.com/openfod/OpenFod-Website) 的 GitHub Pages 组装，不构建 Docker 镜像，也不使用 GHCR / Nginx。

## 本地预览

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
.\make.bat html
```

Linux / macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
make html
```

构建完成后打开 `build/html/zh/index.html` 或 `build/html/en/index.html`。`/docs/` 根跳转页在 `build/html/index.html`。

## 国际化

- 中文写在 `source/` 的 rst 中。
- 英文在 `source/locale/en/LC_MESSAGES/*.po`。
- 更新中文后运行 `make gettext` / `make.bat gettext`，再检查翻译。

## Ask AI

`make html` 会生成静态检索索引：`build/ai/index`（同时复制到 `build/html/ai/index`）。

本地若要接大模型，用环境变量启动 Node 服务，**不要把密钥提交进仓库**：

```powershell
$env:AI_INDEX_DIR = "build\ai\index"
node server\ai-search-server.mjs
```

生产环境的 `LLM_BASE_URL` / `LLM_APIKEY` / `LLM_MODEL` 只存在于 OpenFod-Website 的 GitHub Pages Environment secrets。

## 分支与发布

请在 `develop` 开发，合并到 `main` 后再发布。`develop` 分支持久保留。

推送到 `main` 后，本仓库会尝试触发 `openfod/OpenFod-Website` 的 Pages 工作流。Website 构建时检出本仓库 `main`，把 HTML 放到 `dist/docs/`。

跨仓触发需要在本仓库配置 `WEBSITE_DISPATCH_TOKEN`。若 OpenFod-Docs 为私有仓库，OpenFod-Website 还需要 `DOCS_CHECKOUT_TOKEN`。

## 常用命令

```bash
make html
make gettext
python -m sphinx -b linkcheck source build/linkcheck
```
