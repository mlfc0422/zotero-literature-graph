# Zotero Puls

Zotero Puls 是一个多功能插件。

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

## AI 生成英文标签

在文献列表中右键单击一篇普通文献，选择“AI 生成标签”。插件会将标题和 Abstract 发送给你配置的服务，返回英文标签建议。你可以在预览窗口中勾选、删除或补充标签。

确认写入前会显示替换提示：现有手动标签会被替换，Zotero 自动标签不会受影响。

在 Zotero 的“设置 → Zotero Puls”中选择服务商、模型、填写对应 API Key，并配置默认标签数和自定义提示词。DeepSeek 的模型列表提供固定的 V4 Flash 与 V4 Pro；选择 OpenAI 后，点击“获取可用模型”会使用该 API Key 读取可访问的模型，并由你选择其一。OpenAI 套餐使用 Responses API 与严格 JSON Schema 输出；DeepSeek 套餐使用 Chat Completions 兼容接口。

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
