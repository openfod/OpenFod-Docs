贡献约定
========

先让门禁红，再让代码绿。旧工程把规则写在散文里，三天内就被违反，包括它自己写明的两条。因此：**没有脚本检查的规则，不是规则。**

门禁
----

.. list-table::
   :header-rows: 1
   :widths: 55 45

   * - 规则
     - 脚本
   * - UTF-8、无 BOM、LF
     - ``encoding.py``
   * - 已发布代码不含开发者绝对路径
     - ``no_hardcoded_paths.py``
   * - Engine 不含 Godot / IO / 环境变量
     - ``architecture.py``
   * - 禁止可变 ``static`` 状态
     - ``architecture.py`` + ``CA2211``
   * - 文件体积只许下调
     - ``architecture.py`` + 预算表
   * - 环境变量必须被文档列出
     - ``doc_consistency.py``
   * - 没有 CI 就不得声称有 CI
     - ``doc_consistency.py``

豁免是计数且可审查的。预算只许降低，不许抬高。

提交前
------

1. ``dotnet test OpenFoD.sln``
2. 跑完 ``scripts/checks/``
3. 新的环境变量先写进游戏仓库的 ``docs/configuration.md``，再写读取代码
4. 不要把原作二进制、MP3、地图放进 git
5. 不要在 OpenFoD-Godot 或 OpenFod-Docs 里提交大模型地址、密钥、模型名

文档贡献
--------

文档源码在本仓库 ``source/``。中文写在 rst 里；英文通过 gettext 的 ``source/locale/en/`` 维护。改完中文后运行 ``make gettext``（Windows 用 ``make.bat gettext``），再检查英文翻译。

架构决策记录（ADR）在游戏仓库 ``docs/decisions/``：只追加，不改写已接受的记录。被取代的条目加一行 ``Status: superseded by NNNN``，正文保留。
