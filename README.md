# Castorice

《崩坏：星穹铁道》任务资料抓取与剧本编排工具。

## 本地剧本编辑器

编辑器是放在 `editor` 目录中的独立本地工具，不使用也不改动项目原有的 React 应用页面。

运行：

```powershell
npm run editor
```

Vite 会启动本地服务并自动打开浏览器。编辑器只允许读取 `data/missions`，用户创建的剧本以 JSON 文件保存到 `screenplays`，两者不会互相覆盖。

编辑器支持：

- 搜索并浏览 311 个只读任务页面；
- 递归展示折叠内容、每个选项各自的回应，以及条件分支中的嵌套节点；
- 整个任务、多个节点或单个节点复制到剧本；
- 拖动、按钮排序、复制和删除剧本节点；
- 对话、叙述、章节、短信等常见节点的可视化编辑；
- 选项、折叠内容与条件分支的递归可视化编辑；
- 任意节点切换到完整 JSON 编辑；
- 剧本标题、说明和文件名独立设置；
- 停止输入约 650ms 后自动保存。

剧本 JSON 的基本结构：

```json
{
  "schemaVersion": 1,
  "title": "剧本标题",
  "description": "",
  "createdAt": "...",
  "updatedAt": "...",
  "blocks": [
    {
      "id": "...",
      "source": {
        "mission": "混乱行至深处",
        "dataFile": "missions/.../混乱行至深处.json",
        "contentIndex": 1
      },
      "node": {
        "type": "dialogue",
        "speaker": "卡芙卡",
        "text": "..."
      }
    }
  ]
}
```

`source` 仅用于记录内容来源；复制到剧本后，`node` 是独立副本，可以自由修改。

## 更新任务资料

```powershell
npm run fetch:mission-index
npm run fetch:missions -- --refresh
```

详细抓取说明见 [`scripts/README.md`](scripts/README.md)。

## 检查项目

```powershell
npm run test:sr-parser
npm run lint
npm run build
```
