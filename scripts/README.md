# 崩坏：星穹铁道任务数据

脚本从 BWiki 的 MediaWiki API 读取页面的原始 wikitext，不依赖渲染后的 HTML。
每次抓取会在项目根目录的 `data` 中生成两份文件：

- `<任务名>.wiki`：未经转换的源文本，方便日后重新解析。
- `<任务名>.json`：适合程序消费的任务元数据和剧情节点。

## 使用

传入普通页面、编辑页面 URL 或页面标题都可以：

```powershell
npm run fetch:sr -- "https://wiki.biligame.com/sr/index.php?title=星星是冰冷的玩具&action=edit"
npm run fetch:sr -- "星星是冰冷的玩具"
```

不传参数时会抓取示例任务“星星是冰冷的玩具”。

抓取 `E:\repo\3799\scripts\mission_sr.json` 中的全部历史页面：

```powershell
npm run fetch:sr-history
```

结果按任务组写入 `data/sr-missions`。脚本逐页请求、支持中断续跑，并在
`data/sr-fetch-report.json` 中记录每页的模板和节点统计。需要无视已有文件重新获取时追加 `-- --refresh`。

从 BWiki 动态查询开拓任务、开拓续闻和同行任务，生成完整任务索引：

```powershell
npm run fetch:mission-index
```

生成结果为 `data/missions.json`，结构为“任务类别 → 地点 → 系列任务 → children”。
`data/mission-index-report.json` 会记录数量以及无法归类、多重归属等异常。
每个实际任务条目包含 `sourceFile` 和 `dataFile`，路径相对于 `data` 目录。

按照最新索引抓取全部任务源文本和 JSON：

```powershell
npm run fetch:missions -- --refresh
```

文件按 `data/missions/<任务类别>/<地点>/<系列任务>/` 分层保存。同一页面链接只抓取一次，
所有重复索引引用会指向同一组文件。抓取检查结果写入 `data/mission-fetch-report.json`。

如需从 3799 的旧手写清单生成旧版地点索引，可运行 `npm run generate:missions:legacy`；
结果写入 `data/missions.legacy.json`，不会覆盖在线索引。

解析器的嵌套结构测试可单独运行：

```powershell
npm run test:sr-parser
```

## JSON 内容节点

`content` 保留剧情的先后顺序，常见节点包括：

- `section`：任务阶段标题。
- `objective-description`：阶段描述和地点。
- `dialogue`：说话人和台词。
- `narration`：动作、场景等旁白。
- `choice`：选项数组；每个选项拥有自己的递归 `content`，不会依赖 HTML 中并行数组的位置。
- `fold`：可折叠内容；内部也是递归 `content`。
- `tabs`：性别、胜负等分页分支；每个分页拥有递归 `content`。
- `message-thread-start`、`message`、`message-system`、`message-thread-end`：短信或群聊结构。
- `image`、`event`、`notice`、`note`、`spoiler`、`annotation`：图片、事件及各种提示内容。
- `divider`、`text`、`list-item`：其余顺序内容。
- `template`：暂未专门适配的模板，仍保留名称和参数，避免静默丢数据。

解析器位于 `sr-wikitext-parser.js`，不依赖浏览器 DOM 或第三方包。
