环境变量
========

游戏仓库
--------

下列变量由 OpenFoD-Godot 读取，权威列表在游戏仓库 ``docs/configuration.md``，并由 ``doc_consistency.py`` 守门。

.. list-table::
   :header-rows: 1
   :widths: 28 18 54

   * - 变量
     - 默认
     - 含义
   * - ``FOD_GAME_ROOT``
     - 未设置
     - 未打包的原版安装目录
   * - ``FOD_SKILLTABLE``
     - 未设置
     - ``skilltable.tbl`` 路径
   * - ``FOD_REFERENCE_ROOT``
     - 未设置
     - 提取来源工程路径，仅开发用
   * - ``FOD_IMPORT_MAPS``
     - 有限导入
     - 设为 ``all`` 时导入全部地图

文档与官网
----------

文档仓库 **不提交** 大模型参数。本地预览 Ask AI 可以使用 ``LLM_*`` 或 ``AI_QA_*``。生产环境只在 OpenFod-Website 的 GitHub Pages Environment 里配置：

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - 变量
     - 用途
   * - ``LLM_BASE_URL``
     - OpenAI 兼容接口根地址
   * - ``LLM_APIKEY``
     - 接口密钥
   * - ``LLM_MODEL``
     - 模型名

本地文档预览还可以使用 ``AI_INDEX_DIR``、``AI_QA_PORT``、``AI_QA_DOCS_URL_PREFIX``。不要把这些值写进游戏仓库。
