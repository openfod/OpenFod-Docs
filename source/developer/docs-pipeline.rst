文档站与发布流水线
==================

OpenFod-Docs 参考 ProteinSeek Workbench Docs 的 **Sphinx + 自研主题 + 中英双语 + Ask AI** 设计，但 **不使用 Docker / GHCR / Nginx**。静态 HTML 由 OpenFod-Website 的 GitHub Pages 工作流拉取并放到 ``/docs/``。

本地预览
--------

.. code-block:: powershell

   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   .\make.bat html

打开 ``build/html/zh/index.html`` 或 ``build/html/en/index.html``。

可选：本地 Ask AI 走 Node 服务（只用于本机，密钥不要提交）：

.. code-block:: powershell

   $env:AI_INDEX_DIR = "build/ai/index"
   $env:LLM_BASE_URL = "<本机测试用>"
   $env:LLM_APIKEY = "<本机测试用>"
   $env:LLM_MODEL = "<本机测试用>"
   node server/ai-search-server.mjs

生产环境禁止把上述三个值写入 OpenFod-Docs 或 OpenFoD-Godot。官网构建使用 OpenFod-Website 工作流的 Environment secrets：``LLM_BASE_URL``、``LLM_APIKEY``、``LLM_MODEL``。

GitHub Pages 上没有常驻 Node 进程。Ask AI 会先尝试同源 ``/docs/api/ai-qa/chat``；若不可用，则回退到已经随站点发布的静态检索索引（``/docs/ai/index/``）。构建阶段若存在上述密钥，还可以生成 FAQ 缓存，改善静态回答。

分支与自动发布
--------------

1. 在 ``OpenFod-Docs`` 的 ``develop`` 写文档、跑 ``make html``。
2. 合并到 ``OpenFod-Docs`` 的 ``main``。
3. ``main`` 上的 ``trigger-website`` 工作流调用 ``OpenFod-Website`` 的 Pages 工作流。
4. Website 在 ``main`` 构建时检出 Docs 的 ``main``，执行 ``make html``，把 ``build/html`` 复制到 ``dist/docs/``，再发布 GitHub Pages。

``OpenFod-Website`` 的 ``develop`` 同样会检出 Docs 的 ``develop`` 做集成构建，但 **不会** 发布 Pages。官网只在 Website 的 ``main`` 更新。

跨仓触发需要在 OpenFod-Docs 配置 secret ``WEBSITE_DISPATCH_TOKEN``（能够 ``workflow_dispatch`` ``openfod/OpenFod-Website`` 的 token）。Website 仓库本身读取 LLM 密钥，Docs 仓库不保存这些密钥。
