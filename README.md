# Zotero Puls

Zotero Puls 是一个用于查看 Zotero 作者—标签关系的插件。

## 安装

1. 下载 Release 中的 `zotero-puls.xpi`。
2. 在 Zotero 中打开“工具 → 插件”。
3. 将 XPI 文件拖入插件窗口并确认安装。

## 使用

1. 在 Zotero 左侧选择一个普通分类。
2. 点击文献列表工具栏中的“关系网”按钮。
3. 使用搜索框、最小关系权重滑块和“力平衡”滑块浏览图谱。
4. 拖动节点可调整布局；点击节点可查看关联论文。
5. 双击论文条目可回到 Zotero 定位该条目。
6. 单击图谱空白处取消选中；双击空白处刷新当前分类。

## 数据范围

- 只读取当前分类的直接普通条目。
- 不读取子分类、附件、笔记和订阅源条目。
- 每篇论文使用第一作者。
- 使用手动添加的 Zotero 标签；自动标签不纳入图谱。
- 同一作者与标签被多篇论文共同支持时，关系会显示更高权重。

## 兼容性

当前插件清单支持 Zotero 7 至 Zotero 9。

## 模板来源

本项目的基础 Zotero 插件脚手架参考了 [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)。

## 许可证

AGPL-3.0-or-later
