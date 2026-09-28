import assert from "node:assert/strict";
import test from "node:test";
import { parseStarRailMission } from "./sr-wikitext-parser.js";
import { titleFromInput } from "./sr-bwiki-client.js";

test("递归保留折叠、选项和选项内的嵌套选项", () => {
  const source = `{{任务
|任务名称=嵌套测试
|任务流程=*第一步
}}
==剧情内容==
{{折叠|标题=外层内容|内容=
{{剧情选项
|选项1=[[某页面|选择 A]]
|剧情1=*甲：第一句
{{剧情选项|选项1=内层选项|剧情1=*乙：内层回复}}
|选项2=选择 B
}}
|折叠=是}}`;

  const result = parseStarRailMission(source, { title: "嵌套测试" });
  assert.equal(result.mission.name, "嵌套测试");
  assert.deepEqual(result.mission.objectives, ["第一步"]);

  const fold = result.content[0];
  assert.equal(fold.type, "fold");
  assert.equal(fold.title, "外层内容");
  assert.equal(fold.collapsed, true);

  const outerChoice = fold.content[0];
  assert.equal(outerChoice.type, "choice");
  assert.equal(outerChoice.options[0].text, "选择 A");
  assert.deepEqual(outerChoice.options[1].content, []);
  assert.deepEqual(outerChoice.options[0].content[0], {
    type: "dialogue",
    speaker: "甲",
    text: "第一句",
  });

  const innerChoice = outerChoice.options[0].content[1];
  assert.equal(innerChoice.type, "choice");
  assert.equal(innerChoice.options[0].text, "内层选项");
  assert.deepEqual(innerChoice.options[0].content[0], {
    type: "dialogue",
    speaker: "乙",
    text: "内层回复",
  });
});

test("将短信模板转换为消息和消息选项", () => {
  const source = `{{任务|任务名称=短信测试}}
==剧情内容==
{{角色对话|模板开始|群聊|副标题}}
{{角色对话|左|三月七|文本|在吗？}}
{{短信选项|选项1=在。|剧情1={{角色对话|右|开拓者|文本|在。}}}}
{{短信警告|信息发送失败}}
{{角色对话|模板结束}}`;
  const result = parseStarRailMission(source);
  assert.deepEqual(result.content.map((node) => node.type), [
    "message-thread-start",
    "message",
    "choice",
    "message-system",
    "message-thread-end",
  ]);
  assert.equal(result.content[2].presentation, "message");
  assert.equal(result.content[2].options[0].content[0].text, "在。");
});

test("任务名称中的注释模板只保留显示文本", () => {
  const source = `{{任务|任务名称={{梗|显示名称|梗典故|很长的注释}}}}
==剧情内容==`;
  assert.equal(parseStarRailMission(source).mission.name, "显示名称");
});

test("保留 tabber 的各个条件分支", () => {
  const source = `{{任务|任务名称=分页测试}}
==剧情内容==
<tabber>
女开拓者「星」=
*三月七：星分支
|-|
男开拓者「穹」=
*三月七：穹分支
|-|对局胜利=
{{剧情选项|选项1=我赢了！}}
</tabber>`;
  const tabs = parseStarRailMission(source).content[0];
  assert.equal(tabs.type, "tabs");
  assert.equal(tabs.tabs[0].title, "女开拓者「星」");
  assert.equal(tabs.tabs[0].content[0].text, "星分支");
  assert.equal(tabs.tabs[1].title, "男开拓者「穹」");
  assert.equal(tabs.tabs[1].content[0].text, "穹分支");
  assert.equal(tabs.tabs[2].title, "对局胜利");
  assert.equal(tabs.tabs[2].content[0].options[0].text, "我赢了！");
});

test("选项剧情里的 tabber 不会被竖线拆断", () => {
  const source = `{{任务|任务名称=嵌套分页}}
==剧情内容==
{{剧情选项
|选项1=开始
|剧情1=<tabber>
|-|胜利=
{{剧情选项|选项1=我赢了}}
|-|失败=
{{剧情选项|选项1=我输了}}
</tabber>
|选项2=离开
}}`;
  const outerChoice = parseStarRailMission(source).content[0];
  const tabs = outerChoice.options[0].content[0];
  assert.equal(tabs.type, "tabs");
  assert.equal(tabs.tabs.length, 2);
  assert.equal(tabs.tabs[0].content[0].options[0].text, "我赢了");
  assert.equal(tabs.tabs[1].content[0].options[0].text, "我输了");
});

test("从 BWiki URL 保留子页面标题", () => {
  assert.equal(
    titleFromInput("https://wiki.biligame.com/sr/%E5%91%BD%E8%BF%90/%E9%A9%BB%E8%B6%B3%E6%A2%A6%E5%9B%BD%E4%B9%8B%E5%A4%9C"),
    "命运/驻足梦国之夜",
  );
});

test("识别缩进模板与消息内的折叠内容", () => {
  const source = `{{任务|任务名称=缩进测试}}
==剧情内容==
  {{剧情选项|选项1=缩进选项}}
{{角色对话|左|群友|文本|{{折叠|标题=视频|内容=*播音员：新闻内容|折叠=是}}|是}}`;
  const result = parseStarRailMission(source);
  assert.equal(result.content[0].type, "choice");
  assert.equal(result.content[1].type, "message");
  assert.equal(result.content[1].content[0].type, "fold");
  assert.equal(result.content[1].content[0].content[0].speaker, "播音员");
});

test("提示模板分别保留正文和地点", () => {
  const source = `{{任务|任务名称=提示测试}}
==剧情内容==
{{提示|蓝色|宽度=100%|提示正文|任务地点}}`;
  assert.deepEqual(parseStarRailMission(source).content[0], {
    type: "note",
    tone: "蓝色",
    text: "提示正文",
    context: "任务地点",
  });
});
