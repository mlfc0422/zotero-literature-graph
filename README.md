# Zotero Puls

Zotero Puls 是一个 Zotero 作者—标签关系网插件。它把当前分类中的论文、第一作者和手动标签组织为二部关系图，帮助快速观察研究主题与作者之间的关联。

## 模板来源

本项目的 Zotero 插件脚手架、基础目录结构和开发配置参考了 [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)。图谱数据模型、窗口控制器、Cytoscape.js 渲染和 d3-force 物理模拟为本项目的定制实现。

## 功能

- 在 Zotero 文献列表工具栏打开“关系网”窗口。
- 仅读取当前选中普通分类的直接条目；不递归读取子分类，不包含附件、笔记或订阅源条目。
- 每篇论文使用第一作者和手动添加的 Zotero 标签；自动标签不纳入图谱。
- 同一作者—标签关系由多篇论文支持时，边权会累积。
- 可搜索节点、按最小边权筛选、缩放、平移与拖动节点。
- 点击节点可高亮直接关系、显示关联节点名称，并列出关联论文；双击论文可在 Zotero 主窗口中定位。
- 单击图谱空白处取消选中；双击空白处按当前分类刷新数据。
- Cytoscape.js 负责图谱渲染、缩放和状态交互；d3-force 负责持续受力、碰撞避让与拖动时的实时响应。

## 使用方法

1. 在 Zotero 左侧栏选择一个普通分类。
2. 点击文献列表工具栏的“关系网”按钮。
3. 在独立窗口中使用搜索框和关系权重滑块筛选图谱。
4. 拖动节点可调整位置；与其相连的节点会实时响应。
5. 点击节点查看关联论文，双击论文条目回到 Zotero 定位。

若未选择分类、分类为空，或分类中没有同时具有第一作者和手动标签的论文，窗口会显示相应提示。

## 项目结构

```text
addon/                 插件清单、本地化资源和图标
src/
  hooks.ts             Zotero 生命周期与工具栏按钮
  addon.ts             插件实例与内部 API
  modules/
    graphData.ts       分类读取与 GraphData 构建
    graphWindow.ts     图窗口、Cytoscape 渲染和 d3-force 模拟
  utils/               窗口与工具包辅助函数
test/                  图数据与启动测试
typings/               Zotero 全局类型补充
```

目前图谱功能集中在两个模块中，职责清晰，暂不需要为了目录层级而额外拆分。后续若增加导出、布局预设、作者消歧或多分类比较，可将 `modules/` 下的图谱相关文件迁移到独立的 `features/graph/` 目录。

## 开发

```bash
npm install
npm run build
npm run test:unit
npm run lint:check
```

构建后的 XPI 位于 `.scaffold/build/zotero-puls.xpi`。

## 兼容性

当前插件清单支持 Zotero 7 至 Zotero 9。

## 许可证

AGPL-3.0-or-later
