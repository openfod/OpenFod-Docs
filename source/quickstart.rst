快速开始
========

按你的身份选一条最短路径。玩家走发布包；要改代码则走开发者环境。

玩家：运行游戏
--------------

1. 打开 `OpenFoD 组织主页 <https://github.com/openfod>`_ ，进入游戏仓库的 Releases。
2. 下载当前平台的构建（Windows / Linux / macOS，以实际发布为准）。
3. 解压后启动客户端。不需要安装 2001 年原作也能进入社区内容与调试场景。
4. 若你拥有正版原作资源，并想对照经典数据，把未打包的安装目录告诉开发者文档中的 ``FOD_GAME_ROOT`` ——普通游玩不必设置。

当前重铸仍在进行中。没有 Release 时，请使用下面的开发者步骤从源码运行，或关注官网 `www.openfod.org <https://www.openfod.org/>`_ 的发布说明。

开发者：从源码运行
------------------

在 ``OpenFoD-Godot`` 仓库根目录：

.. code-block:: powershell

   dotnet build OpenFoD.sln -warnaserror
   dotnet test  OpenFoD.sln
   py scripts/checks/encoding.py
   py scripts/checks/no_hardcoded_paths.py
   py scripts/checks/architecture.py
   py scripts/checks/doc_consistency.py

客户端还需要：

- Godot **4.7.2 Mono** (不要用 4.5.1)
- 由 ``scripts/dev/mount-classic.ps1`` 创建的开发 junction

Windows 上请用 ``py`` 启动 Python，避免微软商店占位的 ``python`` 命令。

下一步
------

- 玩家继续阅读 :doc:`user-guide/index`。
- 开发者继续阅读 :doc:`developer/setup`。
