# Zotero Puls

Zotero Puls 是一个面向 Zotero 7/8 的作者—标签关系可视化插件。

## 使用方式

1. 在 Zotero 左侧选择一个普通分类。
2. 点击文献列表工具栏中的“关系网”按钮。
3. 在独立窗口中拖动、缩放或搜索作者与标签。
4. 点击节点查看关联论文；双击论文可回到 Zotero 中定位。

插件只分析当前分类的直接条目，不递归读取子分类。作者节点与标签节点之间的边权表示支持该关系的论文数量。

## 开发

```bash
npm install
npm run build
npm run test:unit
npm run lint:check
```

构建生成的 XPI 位于 `.scaffold/build/`。

## 许可

AGPL-3.0-or-later
