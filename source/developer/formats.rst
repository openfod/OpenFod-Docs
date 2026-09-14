原作格式与离线工具
==================

原作安装不是单一资源包，而是小引擎加散落数据再加巨型资源 DLL。OpenFoD **读取规格、不提交原作文件**。

本地安装长什么样
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - 路径
     - 角色
   * - ``SANGGO.exe``
     - 原版主程序
   * - ``Res/res00.dll`` 等
     - PE 外壳的 RCDATA 图集
   * - ``Res/Bei*.lib`` 等
     - 北 / 南地形与单位精灵库
   * - ``Data/``
     - 字体、科技、武将表、音效索引
   * - ``Scns/``
     - ``.map`` + ``.scn`` + ``.int``
   * - ``Levs/``
     - 关卡 ``.TSK`` + ``.int`` + ``.dmo``

部分已钉死、可用 fixture 回归的不变量：

- 所有 ``.scn`` 长 1132 字节
- ``.map`` 大小 ``550 + width * height * 8``
- ``Storyman.tbl`` 为 393 条 × 3318 字节
- ``Science.inx`` 为 28 项科技

离线脚本
--------

``tools/`` 下是 Python 考古脚本，只描述磁盘布局，不把受版权保护的美术或音频拷进仓库。

.. code-block:: powershell

   $env:FOD_GAME_ROOT = "<含 Scns/ 与 Data/ 的目录>"
   py tools/run_all.py

默认产物写在各脚本自己的 ``out/``。完整分析笔记在游戏仓库 ``docs/analysis/``。
