OpenFoD 项目文档
================

欢迎阅读 OpenFoD 项目文档。OpenFoD 是开源重铸的《傲世三国》（Fate of the Dragon）：用现代引擎把城内内政、武将招揽与三层战事重新做可玩、可改、可传。

本站分成两部分：面向玩家的 **用户使用文档**，以及面向贡献者的 **开发者文档**。编译产物会发布到 `https://www.openfod.org/docs/`。

.. grid:: 1 1 2 2
   :gutter: 2
   :class-container: ps-overview-grid

   .. grid-item-card:: 项目概览
      :link: overview
      :link-type: doc

      OpenFoD 是什么、和 2001 年原作的关系，以及当前仓库怎么分工。

   .. grid-item-card:: 快速开始
      :link: quickstart
      :link-type: doc

      玩家如何取得可运行构建，开发者如何在本地拉起 Godot 客户端。

   .. grid-item-card:: 用户使用文档
      :link: user-guide/index
      :link-type: doc

      安装、城内内政、野外作战、武将招揽，以及魏蜀吴三条开局。

   .. grid-item-card:: 开发者文档
      :link: developer/index
      :link-type: doc

      引擎分层、工程门禁、parity 对照，以及文档站如何自动发布到官网。

.. tip::

   原作商业数据不会随 OpenFoD 分发。拥有正版《傲世三国》/ Fate of the Dragon 资源的开发者，可以用环境变量指向本地安装，供格式解码与对照测试使用。

.. toctree::
   :maxdepth: 2
   :caption: 开始使用
   :hidden:

   overview
   quickstart

.. toctree::
   :maxdepth: 2
   :caption: 用户使用文档
   :hidden:

   user-guide/index

.. toctree::
   :maxdepth: 2
   :caption: 开发者文档
   :hidden:

   developer/index

.. toctree::
   :maxdepth: 2
   :caption: 参考资料
   :hidden:

   reference/index
   changelog
