# Zotero Puls

Zotero Puls 是一款面向文献整理与探索的 Zotero 插件，提供作者—标签关系网、AI 英文标签建议和 EasyScholar 期刊信息查询。

## 安装

1. 从 GitHub Releases 下载最新版 `zotero-puls.xpi`。
2. 在 Zotero 中打开“工具 → 插件”。
3. 将 XPI 文件拖入插件窗口并确认安装。
4. 完全重启 Zotero。

当前插件支持 Zotero 7–9。

## 作者—标签关系网

1. 在 Zotero 左侧选择一个普通分类。
2. 点击文献列表工具栏中的“关系网”按钮。
3. 使用节点搜索、最小关系权重和力平衡滑块浏览图谱。

图谱仅读取当前分类中的直接普通条目，不递归读取子分类，并排除附件、笔记和订阅源条目。每篇论文使用第一作者和手动添加的 Zotero 标签；自动标签不纳入图谱。

- 拖动节点可调整布局，其他节点会实时响应。
- 缩放或拖动空白区域可浏览图谱。
- 点击节点可高亮一跳关系并查看关联论文。
- 双击论文可返回 Zotero 并定位原条目。
- 单击空白处取消选择，双击空白处刷新当前分类。
- 关系权重表示同一作者—标签组合由多少篇论文共同支持。

## AI 生成英文标签

在文献列表中右键单击一篇普通文献，选择“AI 生成标签”。插件会把论文标题和 Abstract 发送给所选服务，并返回英文标签建议。

生成结果不会直接写入：你可以先勾选、删除或手动补充标签。确认后，插件会替换该文献现有的手动标签，并保留 Zotero 自动标签。

在“设置 → Zotero Puls”中可以配置：

- DeepSeek 或 OpenAI 服务；
- API Key 和模型；
- 最大标签数量；
- 自定义提示词。

DeepSeek 使用预设模型列表；OpenAI 可通过“获取可用模型”读取当前 API Key 可访问的文本模型。API Key 和其他设置仅保存在本机 Zotero 配置中。

## EasyScholar 期刊信息

在“设置 → Zotero Puls”中填写 EasyScholar Secret Key，并选择需要写入的信息字段。字段按以下类别整理：

- 常用分区；
- 指标与预警；
- 国内核心与收录；
- 国际学术排名；
- 高校与机构榜单；
- EasyScholar 自定义数据集。

将鼠标移到分类标题或具体字段上，可查看简短说明。所有配置会自动保存。

启用“新增文献时自动查询”后，插件会在普通文献加入 Zotero 时自动查询。也可以在文献列表中右键单击一篇普通文献，选择“更新 EasyScholar 信息”主动刷新。

查询结果不会覆盖“其他”字段原有内容，而是在末尾维护一个独立的 `[EasyScholar] ... [/EasyScholar]` 区块。查询依赖文献中的期刊名或会议名；EasyScholar 接口限制为每秒最多 2 次请求。

## 隐私说明

- 关系网数据仅在本机处理。
- AI 标签功能会把当前论文的标题和 Abstract 发送给所选 AI 服务。
- EasyScholar 功能会把期刊名或会议名发送给 EasyScholar。
- API Key、Secret Key 和插件设置仅保存在本机 Zotero 配置中。

## 模板来源

本项目的基础 Zotero 插件脚手架参考了 [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)。

## 许可证

AGPL-3.0-or-later
