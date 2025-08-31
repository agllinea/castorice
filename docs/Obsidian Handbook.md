# 标签

#Cheetsheet #Handbook #Language
通过<u>Colored Tags</u>插件，我们的标签将会自动获得不同的颜色。

# Markdown语法

## 标题


```markdown
# H1
## H2
...
###### H6
```

## Callout

Callout有多种图标颜色组合。他们也可以相互叠加；Callout标题文字也可以自定义。

> dfdsf
> sdfsdf

> [!note]+
> ```
> > [!note]+
> > ...
> ```

> [!summary]+
> ```
> > [!summary]+
> > ...
> ```

> [!info]+
> Here's a callout block.

> [!tip]+
> Here's a callout block.

> [!done]+
> Here's a callout block.

> [!faq]+
> Here's a callout block.

> [!caution]+
> Here's a callout block.

> [!failure]+
> Here's a callout block.

> [!error]+
> Here's a callout block.

> [!bug]+
> Here's a callout block.

> [!example]+
> Here's a callout block.

> [!quote]+
> Here's a callout block.

> [!question] Can callouts be nested?
> > [!todo] Yes!, they can.
> > > [!example]  You can even use multiple layers of nesting.

## Checkbox

在Markdown中，勾选框的格式也可以千奇百怪。


> [!NOTE] Title
> Contents

> 66
- [ ] Unchecked
- [x] Checked
- [>] Rescheduled
- [<] Scheduled
- [!] Important
- [-] Cancelled
- [/] In Progress
- [?] Question
- [*] Star
- [n] Note
- [l] Location
- [i] Information
- [I] Idea
- [S] Amount
- [p] Pro
- [c] Con
- [b] Bookmark
- ["] Quote
- [u] Up
- [d] Down
- [w] Win
- [k] Key
- [f] Fire

# 代码模块

在Markdown中，代码可以是`inline`的，也可以是：

```python
for i in range(1314):
	print(520)
```

## Typography










Obsidian

## Theme

### Minimal

The most popular Obsidian theme other than the default built-in.

## Community Plugins

| Name                     | Usage                                              |
| ------------------------ | -------------------------------------------------- |
| Better Export PDF        | Export Single Note as PDF, with Tags               |
| Commander                | Create personalized command and use it everywhere. |
| File Explorer Note Count |                                                    |
| floating toc             | Display TOC on the side of note.                   |
| Hide Folders             | Hide folders.                                      |
| Highlightr               | Highlight text with different colors.              |
| Homepage                 | Set a note as homepage.                            |
| Hover Editor             | Convert panel to floating window.                  |
| Iconize                  | Use more icons.                                    |
| Minimal Theme Settings   | Theme settings for Minimal.                        |
| Style Settings           | Personalize the theme of plugins.                  |
| Templater                | Improve duplicate note creation.                   |
| Webpage HTML Export      |                                                    |
# Markdown Syntax

```md
# Markdown Syntax
```

## Headings

```md
## Headings
```

### 3rd Header

```md
### 3rd Header
```

#### 4th Header

```md
#### 4th Header
```

##### 5th Header

```md
##### 5th Header
```

###### 6th Header

```md
###### 6th Header
```

## Callout

> [!note]+
> ```
> > [!note]+
> > ...
> ```

> [!summary]+
> ```
> > [!summary]+
> > ...
> ```

> [!info]+
> Here's a callout block.

> [!tip]+
> Here's a callout block.

> [!done]+
> Here's a callout block.

> [!faq]+
> Here's a callout block.

> [!caution]+
> Here's a callout block.

> [!failure]+
> Here's a callout block.

> [!error]+
> Here's a callout block.

> [!bug]+
> Here's a callout block.

> [!example]+
> Here's a callout block.

> [!quote]+
> Here's a callout block.

> [!question] Can callouts be nested?
> > [!todo] Yes!, they can.
> > > [!example]  You can even use multiple layers of nesting.

## Checkbox

- [ ] Unchecked
- [x] Checked
- [>] Rescheduled
- [<] Scheduled
- [!] Important
- [-] Cancelled
- [/] In Progress
- [?] Question
- [*] Star
- [n] Note
- [l] Location
- [i] Information
- [I] Idea
- [S] Amount
- [p] Pro
- [c] Con
- [b] Bookmark
- ["] Quote
- [u] Up
- [d] Down
- [w] Win
- [k] Key
- [f] Fire
- [0] Speech bubble 0
- [1] Speech bubble 1
- [2] Speech bubble 2
- [3] Speech bubble 3
- [4] Speech bubble 4
- [5] Speech bubble 5
- [6] Speech bubble 6
- [7] Speech bubble 7
- [8] Speech bubble 8
- [9] Speech bubble 9
# Codeblocks

```SQL
SELECT 
    t.NAME AS TableName,
    s.Name AS SchemaName,
    p.rows,
    SUM(a.total_pages) * 8 AS KB, 
    CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00 ), 2) AS NUMERIC(36, 2)) AS MB,
    CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00/ 1024.00 ), 2) AS NUMERIC(36, 2)) AS GB
FROM 
    sys.tables t
INNER JOIN      
    sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN 
    sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN 
    sys.allocation_units a ON p.partition_id = a.container_id
LEFT OUTER JOIN 
    sys.schemas s ON t.schema_id = s.schema_id
WHERE 
    t.NAME NOT LIKE 'dt%' 
    AND t.is_ms_shipped = 0
    AND i.OBJECT_ID > 255 
GROUP BY 
    t.Name, s.Name, p.Rows
ORDER BY 
    KB DESC, t.Name
```
# Tags

主题中普通标签颜色有九种——比如 #tag2 #TGA 颜色按标签位置确定。

同时，主题里面提供了一些特别标签，它们有着与一般标签不同的外观，如果你需要更多的特别标签，你可以打开css文件，按照这些标签的写法，替换关键词，自己制作属于自己的特别标签。




# Typography

## Emphasis

在笔记中，不可避到一些<mark style="background: #FFF3A3A6;">强调方式</mark>:
*斜体*
**加粗**
***加粗斜体***
`行内代码`
==高亮==
==*斜体高亮*==
==**加粗高亮**==
==***加粗斜体高亮***==
==高亮`行内代码`==
==~~隐藏文本~~==（`删除+高亮组合：==~~涂黑~~==`鼠标悬浮触发）
*~~隐藏文本~~*（`删除+斜体组合：*~~挖空~~*`鼠标悬浮触发）
*==~~隐藏文本~~==*（`删除+高亮+斜体组合：*==~~涂彩~~==*`鼠标点击触发）

## List

### Ordered / Unordered

1. 1314
2. 520
	1. 666
	2. 777
		- xswl
	- hahaha
- 0617
	1. 017
	2. 0617

### Checkbox

- [ ] Unchecked
- [x] Checked
- [>] Rescheduled
- [<] Scheduled
- [!] Important
- [-] Cancelled
- [/] In Progress
- [?] Question
- [*] Star
- [n] Note
- [l] Location
- [i] Information
- [I] Idea
- [S] Amount
- [p] Pro
- [c] Con
- [b] Bookmark
- ["] Quote
- [u] Up
- [d] Down
- [w] Win
- [k] Key
- [f] Fire
- [0] Speech bubble 0
- [1] Speech bubble 1
- [2] Speech bubble 2
- [3] Speech bubble 3
- [4] Speech bubble 4
- [5] Speech bubble 5
- [6] Speech bubble 6
- [7] Speech bubble 7
- [8] Speech bubble 8
- [9] Speech bubble 9

也可以在有序列中使用
1. [ ] aaa
	1. [x] xxx
		1. [!] 666
		2. [?] 666
2. [-] aaa

## Colorful Background

用法：`note-xxx-bg` 或者 `note-xxx-background`，当然，前者更方便。

```note-orange-bg
orange
```

```note-yellow-bg
yellow
```

```note-green-bg
green
```

```note-blue-bg
blue
```

```note-purple-bg
purple
```

```note-pink-bg
pink
```

```note-red-bg
red
```

```note-gray-bg
gray
```

```note-brown-bg
brown
```

## Colorful Text

用法: `note-color`

```note-orange
text
```

```note-yellow
text
```

```note-green
text
```

```note-blue
text
```

```note-purple
text
```

```note-pink
text
```

```note-red
text
```

```note-gray
text
```

```note-brown
text
```

# Image

插入的图片默认是居中显示，点击图片可以放大
![]($/himeko.png)

在图片`[]`内加上数字或者可以控制图片大小

![200]($/himeko.png)

## Right / Left Alignment

在图片`[]`内加入以下标签，可以控制图片居右还是居左，也以`|`为间隔同时控制大小
- `left`/`Left`/`LEFT`/`L`
- `right`/`Right`/`RIGHT`/`R`
![L|200]($/himeko.png)
![R|200]($/himeko.png)

## Inline Alignment

使用以下标签令图片在行内显示
- `inlineR`/`InlineR`/`INLINER`/`inlR`
- `inlineL`/`InlineL`/`INLINEL`/`inlL`

![inlL|100]($/himeko.png)An adventurous scientist who encountered the Astral Express as a young woman when it got stranded in her homeworld.
Years later, when Himeko finally repaired the Express and began her journey into the stars, she realized that this is only the beginning. On her journey to trailblaze new worlds, she would need many more companions...

![inlR|100]($/himeko.png)An adventurous scientist who encountered the Astral Express as a young woman when it got stranded in her homeworld.
Years later, when Himeko finally repaired the Express and began her journey into the stars, she realized that this is only the beginning. On her journey to trailblaze new worlds, she would need many more companions...

![inlL|150]($/himeko.png)![inlR|150]($/himeko.png)An adventurous scientist who encountered the Astral Express as a young woman when it got stranded in her homeworld.
Years later, when Himeko finally repaired the Express and began her journey into the stars, she realized that this is only the beginning. On her journey to trailblaze new worlds, she would need many more companions...

# Table

|Level|ATK|DEF|HP|SPD|CRIT Rate|CRIT DMG|Taunt|Energy|
|---|---|---|---|---|---|---|---|---|
|1|102.96|59.4|143|96|5%|50%|75|120|
|20|200.77|115.83|278|96|5%|50%|75|120|
|20+|241.96|139.59|335|96|5%|50%|75|120|
|40|386.1|222.75|535|96|5%|50%|75|120|
|40+|427.28|246.51|592|96|5%|50%|75|120|
|50|478.76|276.21|663|96|5%|50%|75|120|
|50+|519.95|299.97|720|96|5%|50%|75|120|
|60|571.43|329.67|791|96|5%|50%|75|120|
|60+|612.61|353.43|848|96|5%|50%|75|120|
|70|664.09|383.13|920|96|5%|50%|75|120|
|70+|705.28|406.89|977|96|5%|50%|75|120|
|80|756.76|436.59|1048|96|5%|50%|75|120|

|                           |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Character Details         | An adventurous scientist who encountered the Astral Express as a young woman when it got stranded in her homeworld.  <br>Years later, when Himeko finally repaired the Express and began her journey into the stars, she realized that this is only the beginning. On her journey to trailblaze new worlds, she would need many more companions...  <br>And while they may have different destinations, they all gaze at the same starry sky.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Character Story: Part I   | The girl is lost.  <br>  <br>She can't remember when she became lost. She just walked and walked, on and on into the dark night, chasing the sun and the moon, over and over again — until she falls.  <br>  <br>She remembers what she looked like as a college freshman, remembers her chosen major — interstellar travel dynamics — and now she's lying face down in the mud.  <br>  <br>She looks up to the stars, and just then sees meteors streaming down: one, two, three... And then more, smaller ones, flickering and flashing ever so finely before a magnificent blaze tore open the night.  <br>  <br>Her limbs drag her forward, leading her on to where the land meets the ocean. At the shoreline, the waters jostle against her like how the tide treats that stranded Express, alone and lost.  <br>  <br>She walks in and see the scenery outside beginning to change. The Express shows her a myriad of magnificent worlds. They are faraway, beyond her homeworld, yet also close enough to be a simple train ride.  <br>  <br>She tries to repair the Express. It starts up only briefly, but it is enough to skid across the sky of her home. She immediately sees the path home. From that altitude, the journey is so short, and even the ocean of her homeworld appears so insignificant.  <br>  <br>It asked her whether she'd like to travel together. She wonders what kind of journey that would be.  <br>  <br>_"A journey to the beginning."  <br>"Let's go then."_ Without hesitation, the girl replied, _"Just as you brought me home, so would I take you home, too."_  <br>* Unlocked at Character Level 20                                                                                                                                                            |
| Character Story: Part II  | Himeko has a suitcase.  <br>  <br>This suitcase is her treasure trove. Previously, she'd filled it with all kinds of train repair tools to fix up the Express. But now, it's packed with a molecular saw, an escaped satellite, and countless other contraptions — the embodiment of her whims and the proof of her resolute will.  <br>  <br>No travel companion is more faithful to her than this suitcase. Passengers come and go on the Express, and perhaps not even "the conductor" would be able to accompany her and the Express from start to finish.  <br>  <br>But she doesn't care. She didn't care when that pretentious blond man left without saying goodbye, just like how she didn't care about her distant homeworld and old friends.  <br>  <br>She knows that this journey is lonely. Even if she could get to know like-minded travel companions, even if they showed her generous grace, even if she could witness the end of a complete journey with those companions — that's all just a momentary fluke.  <br>  <br>She knows that this journey is lonely. Nobody can follow in the exact same footsteps as anyone else. Nobody can experience for someone else everything that happens along a journey. All she can rely on are her own two eyes and feet.  <br>  <br>That's why she stores inside her suitcase all the sights her eyes have witnessed, and all the footprints her feet have left behind.  <br>* Unlocked at Character Level 40                                                                                                                                                                                                                                                                                                                                   |
| Character Story: Part III | Himeko's memory is very good.  <br>  <br>The longer the journey gets, the more travel companions she accrues. She can still remember many of them.  <br>  <br>She remembers her awkward chit-chats with Pom-Pom, and how the first two passengers aboard the Express were Welt and his blond friend. She remembers how the taciturn Dan Heng defeated the monsters that can swallow stars with just one strike of his lance. She remembers how March 7th had awoken from her icy slumber, all the outfits she'd designed for March, and what March loves the most. She remembers how the Crew arrived at Herta Space Station, how she met Trailblazer, and how they'd embarked on a new journey once more.  <br>  <br>She remembers the specifications for every single component of the Express and how they're assembled. She remembers when to oil the Express's bearings and when each plant on the Express needs watering. She remembers Pom-Pom's non-negotiable bottom line, and that Welt has rather juvenile hobbies. She remembers that Dan Heng is always pulling all-nighters to organize the data bank, and how March 7th loves to sleep in. She remembers the personality, habits, hobbies, birthdays, and other anniversary days of everyone aboard the Express. And she remembers much, much more.  <br>  <br>The greatest pleasure for Himeko is that everyone can safely reach their destination on the Express.  <br>  <br>_"Traveling always has an end point. When it happens, I'll smile and say goodbye to everyone."_  <br>  <br>She always says that, and she'll definitely remember to do that.  <br>  <br>It's memory that has formed the road she came from, and memory that will eventually return her to the seas from whence she came.  <br>* Unlocked at Character Level 60 |
| Character Story: Part IV  | _"What a long journey."_ She says.  <br>  <br>_"I've been waiting for so, so long."_████ looks at her: _"It wasn't bad luck that has led you down this path, but wanderlust and curiosity."_  <br>  <br>_"Of course,"_ she smiles, _"But I've experienced far less than what you've been through."_  <br>  <br>_"No, I've never experienced the things you have."_ ████ shakes their head: _"There are as many routes as there are pairs of feet."_  <br>  <br>_"Right now, we may be standing in the same place, but we harbor different thoughts and views."_  <br>  <br>Together, they look up to the stars in silence, and just then saw meteors streaming down: one, two, three... And then more, smaller ones, flickering and flashing ever so finely before a magnificent blaze tore open the night.  <br>  <br>A quiet voice disturbs the still air once more: _"What do you see?"_  <br>  <br>_"The stars have finished their journey."_ She says.  <br>  <br>████ laughs: _"I, instead, see that their journey is only just beginning."_  <br>  <br>They do not speak again.  <br>  <br>_"Let's go back. They're waiting for me."_  <br>  <br>████ is silent, then asks: _"Has the journey so far made you happy?"_  <br>  <br>She picks up her suitcase and walks back in the direction of the Express without looking back.  <br>  <br>_"Same as always."_  <br>* Unlocked at Character Level 80                                                                                                                                                                                                                                                                                                                                                                                                |