架构
====

OpenFoD-Godot 按层切开，依赖只允许单向流动。

::

   engine/OpenFoD.Engine/     游戏规则：tick、世界、命令。
                              零 Godot、零 IO、零 JSON、零环境变量、零精灵 ID。
   classic/OpenFoD.Classic/   原作二进制解码 + classic/data 读取。
                              零 Godot。依赖 Engine，绝不反向。
   classic/data/              表现与数值。一个事实只有一个权威。
   classic/pack/              Godot 调试场景与资源（设计权威）。
   client/                    Godot 4.7.2 Mono 表现层，刻意写薄。
   parity/                    过渡层。用同一份命令脚本驱动新旧引擎并 diff 快照。
   content/fixtures/          原作格式的自造替身，供测试使用。
   tools/                     离线 Python 考古。运行时绝不调用。
   scripts/checks/            门禁。本项目每一条规则都对应其中一个脚本。

为什么要重写
------------

旧工程能玩，但 ``Theater``、``GameSession`` 变成了上帝类，数十个常量在 C# 与 JSON 之间手抄。OpenFoD 的选择是：**格式知识与行为测试留下，规则与客户端重写**。

三条架构决策：

1. **按层提取重写** (ADR 0001)：解码器不可再考古一遍，所以原样迁移后再清理；规则层推倒重做。
2. **门禁先于游戏代码** (ADR 0002)：没有脚本守门的句子，不叫规则。
3. **一个事实一个权威** (ADR 0003)：数值在 ``classic/data``，运行时代码不得再藏一份副本，也不得写死开发者本机路径。

Engine 的禁区
-------------

``scripts/checks/architecture.py`` 会失败，如果 Engine 出现：

- Godot API
- 文件 IO
- 读取环境变量
- JSON
- 数据文件路径
- 精灵 ID

表现属于 ``client/``，磁盘格式属于 ``classic/``，规则属于 ``engine/``。
