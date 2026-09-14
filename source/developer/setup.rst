开发环境
========

工具链
------

- .NET SDK（能构建 ``OpenFoD.sln``）
- Godot **4.7.2 Mono**，不要使用 4.5.1
- Python 3.10+，Windows 用 ``py`` 启动
- Git，工作分支约定见下方

克隆与构建
----------

.. code-block:: powershell

   git clone https://github.com/openfod/OpenFoD-Godot.git
   cd OpenFoD-Godot
   git checkout develop
   dotnet build OpenFoD.sln -warnaserror
   dotnet test  OpenFoD.sln

然后跑门禁：

.. code-block:: powershell

   py scripts/checks/encoding.py
   py scripts/checks/no_hardcoded_paths.py
   py scripts/checks/architecture.py
   py scripts/checks/doc_consistency.py

客户端额外需要 ``scripts/dev/mount-classic.ps1`` 建立的开发 junction。

原作文件（可选）
----------------

原作资源留在开发者本机，永不提交。测试若需要它们，会显式 skip，并带 ``RequiresOriginal`` 特征，因此“全绿”不会悄悄表示“其实没跑”。

常用变量：

.. list-table::
   :header-rows: 1
   :widths: 28 72

   * - 变量
     - 含义
   * - ``FOD_GAME_ROOT``
     - 未打包的原版安装目录，含 Scns 与 Data
   * - ``FOD_SKILLTABLE``
     - skilltable.tbl 的显式路径
   * - ``FOD_IMPORT_MAPS``
     - 设为 all 时导入全部 map（默认只导入少量）

完整列表见 :doc:`/reference/configuration` 。本机 Python 工具还可以写 gitignore 的 tools/local.json。

分支
----

``OpenFoD-Godot``、``OpenFod-Docs``、``OpenFod-Website`` 都持久保留 ``develop``。

- 日常开发在 ``develop``
- 需要发布时再合并到 ``main``
- ``OpenFod-Website`` 的 GitHub Pages 只监听 ``main``
