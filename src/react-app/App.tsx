import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

type Character = {
  id: string;
  name: string;
  en: string;
  epithet: string;
  path: string;
  element: string;
  city: string;
  image: string;
  accent: string;
  track: string;
  duration: string;
  quote: string;
  bio: string;
  tags: string[];
  color: string;
};

type ScriptEntry = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  duration: string;
  cast: string[];
  excerpt: string;
  markdown: string;
};

const characters: Character[] = [
  {
    id: "castorice", name: "遐蝶", en: "CASTORICE", epithet: "冥河的女儿", path: "记忆", element: "量子",
    city: "斯缇科西亚", image: "/assets/characters/castorice.webp", accent: "幽紫", track: "蝶栖于枯枝", duration: "03:47",
    quote: "生命与死亡，不过是一段旅途。", bio: "她从覆盖白雪的艾多尼亚出发，掌心所触皆归于静寂。于是她学会隔着一只蝴蝶的距离，珍重每一个仍在呼吸的瞬间。",
    tags: ["黄金裔", "死亡火种", "忆灵·死龙"], color: "#a98bff",
  },
  {
    id: "aglaea", name: "阿格莱雅", en: "AGLAEA", epithet: "织金者", path: "记忆", element: "雷",
    city: "奥赫玛", image: "/assets/characters/aglaea.webp", accent: "灿金", track: "金线穿过黎明", duration: "04:12",
    quote: "命运不是等待，而是被双手重新织就。", bio: "奥赫玛的衣匠与黄金裔的领袖。她将破碎的未来织进金线，也把所有未说出口的牺牲藏在从容的微笑之后。",
    tags: ["浪漫", "秩序", "衣匠"], color: "#e6bc69",
  },
  {
    id: "tribbie", name: "缇宝", en: "TRIBBIE", epithet: "三相之使", path: "同谐", element: "量子",
    city: "雅努萨波利斯", image: "/assets/characters/tribbie.webp", accent: "绯红", track: "门径与三声笑", duration: "02:58",
    quote: "如果一扇门关上，那就从另外两扇回来。", bio: "她们是使者，是信使，也是旅途本身。三个声音共享同一份勇气，为失联的世界重新打开门扉。",
    tags: ["三相", "门径", "信使"], color: "#f080a6",
  },
  {
    id: "mydei", name: "万敌", en: "MYDEI", epithet: "不死的王子", path: "毁灭", element: "虚数",
    city: "悬锋城", image: "/assets/characters/mydei.webp", accent: "血金", track: "王冠拒绝低首", duration: "03:31",
    quote: "若王座只属于胜者，我便胜过死亡。", bio: "浸在战火中的王子，以一次又一次归来回应命运。他的骄傲不是装饰，而是让故土继续存在的最后一道城墙。",
    tags: ["王权", "不死", "纷争"], color: "#d77a57",
  },
  {
    id: "anaxa", name: "那刻夏", en: "ANAXA", epithet: "七贤者之一", path: "智识", element: "风",
    city: "神悟树庭", image: "/assets/characters/anaxa.webp", accent: "墨绿", track: "不可证之真理", duration: "03:09",
    quote: "所谓神谕，只是尚未被反驳的命题。", bio: "他用怀疑刺穿神谕，用知识重写法则。在真理面前，那刻夏从不祈祷——他只提出下一个问题。",
    tags: ["学者", "理性", "神悟树庭"], color: "#62b5a0",
  },
  {
    id: "hyacine", name: "风堇", en: "HYACINE", epithet: "暮光的医者", path: "记忆", element: "风",
    city: "神谕圣地", image: "/assets/characters/hyacine.webp", accent: "天青", track: "云端仍有晴日", duration: "03:24",
    quote: "先抬头吧，伤口会在看见天空后慢慢愈合。", bio: "她把天空的颜色带进病房，也把温柔留给每一次告别。医者能做的不只是延续生命，还有守住人们相信明天的理由。",
    tags: ["医者", "晨昏之眼", "小伊卡"], color: "#7fcde0",
  },
  {
    id: "cipher", name: "赛飞儿", en: "CIPHER", epithet: "诡计的疾影", path: "虚无", element: "量子",
    city: "多里安", image: "/assets/characters/cipher.webp", accent: "琥珀", track: "猫步越过钟摆", duration: "02:46",
    quote: "秘密不会消失，它只是换了一个主人。", bio: "最快的脚步与最慢的真心。她从城市的阴影中偷走答案，却总会留下一枚无人能够复制的笑。",
    tags: ["盗贼", "诡计", "疾影"], color: "#dca65f",
  },
  {
    id: "phainon", name: "白厄", en: "PHAINON", epithet: "逐火的无名英雄", path: "毁灭", element: "物理",
    city: "哀丽秘榭", image: "/assets/characters/phainon.webp", accent: "星蓝", track: "无名者的晨光", duration: "04:36",
    quote: "即使无人记得，也要把火送到明天。", bio: "背负所有人的愿望走向最后一程。他不需要丰碑；每一个被晨光照亮的名字，都会成为他曾经存在的证明。",
    tags: ["救世", "负世", "逐火"], color: "#79aefb",
  },
];

const scripts: ScriptEntry[] = [
  {
    id: "butterfly-by-the-river", index: "I", title: "冥河边的第一只蝶", subtitle: "遐蝶角色短篇 · 原创示例", duration: "约 8 分钟", cast: ["遐蝶", "白厄", "摆渡人"],
    excerpt: "在所有钟声停止以后，一只不该活着的蝴蝶落在了枯枝上。",
    markdown: `# 冥河边的第一只蝶

> **场景**：斯缇科西亚，未被记录的河岸。夜色没有尽头，水面漂着倒写的星。

## 第一幕 · 枯枝

**摆渡人**：请不要再向前了。活人的影子，会惊醒河底的名字。

**遐蝶**：我不是来叫醒他们。我只是想知道……遗忘究竟是什么声音。

*风穿过白色的花。远处传来羽翼摩擦般的沙沙声。*

**白厄**：也许没有声音。也许遗忘只是某一天，我们不再因为想起而疼痛。

**遐蝶**：那不是遗忘。那是我们终于学会，带着缺口继续生活。

---

## 第二幕 · 蝶

水面升起一点微光。它很小，像一句没能说出口的告别。

| 记录 | 状态 |
| --- | --- |
| 河水温度 | 7°C |
| 星辉折射 | 不稳定 |
| 生命反应 | **1** |

一只紫色的蝶落在遐蝶面前。她没有伸手，只把掌心停在离它很近的地方。

**遐蝶**：看。我们之间还留着一段距离。

**白厄**：遗憾吗？

**遐蝶**：不。距离让它能够活着，也让我能够记住它曾经来过。

> 旁白：那一夜，没有人渡河。只有一只蝶，替所有无名者飞向了黎明。`,
  },
  {
    id: "okhema-sleepless", index: "II", title: "奥赫玛，无眠之夜", subtitle: "群像对话 · 原创示例", duration: "约 12 分钟", cast: ["阿格莱雅", "缇宝", "万敌", "那刻夏"],
    excerpt: "当城中最后一盏灯也没有熄灭，所有人都知道黎明带来的不会只是太阳。",
    markdown: `# 奥赫玛，无眠之夜

> **时间**：逐火之旅启程前夜  
> **地点**：奥赫玛最高处的织室

## 人物

- **阿格莱雅**：正在修补一件没有主人名字的披风。
- **缇宝**：同时守着三扇门。
- **万敌**：拒绝坐下。
- **那刻夏**：拒绝承认自己在担心。

## 对话记录

**缇宝**：第一扇门外是军队，第二扇门外是市民，第三扇门外——

**万敌**：是敌人？

**缇宝**：是送宵夜的。你看，英雄也不能饿着肚子拯救世界。

**那刻夏**：严格来说，低血糖会显著降低决策质量。她的结论虽然轻率，方向却正确。

**阿格莱雅**：那么今晚的第一个共识已经产生：先吃东西。

---

窗外，金线横跨整座城市。每一根线都系着一个普通人的愿望。

**万敌**：你真打算把这些都背上？

**阿格莱雅**：不。愿望不是负担，是坐标。只要它们还亮着，我们就不会在黑潮里迷路。

**那刻夏**：诗意的表达。缺乏可验证性。

**缇宝**：可你已经看了那道光十七分钟。

*短暂的沉默。然后，四个人一起笑了。*

> 档案备注：这是奥赫玛在漫长战争中，最像一个普通夜晚的十七分钟。`,
  },
  {
    id: "thirteenth-seat", index: "III", title: "黄金裔的第十三席", subtitle: "档案悬疑篇 · 原创示例", duration: "约 10 分钟", cast: ["赛飞儿", "风堇", "？？？"],
    excerpt: "圆桌上有十二把椅子，可落在地面的影子，却清楚地数出了十三道。",
    markdown: `# 黄金裔的第十三席

## 失窃记录 / 07-Σ

**保密等级**：暮光  
**完整度**：83%  
**异常项**：无法确认第十三位记录者

---

**风堇**：你确定门一直锁着？

**赛飞儿**：确定。因为钥匙一直在我这里。

**风堇**：这句话从一个盗贼嘴里说出来，完全不能让人放心。

**赛飞儿**：纠正一下，是前盗贼。至少在接下来的五分钟里。

桌面的灰尘里，有人写下了一行字：

> 当十二束火照亮长夜，第十三道影子将替黎明保守秘密。

## 勘验结果

1. 房间没有被打开过。
2. 字迹属于尚未抵达奥赫玛的人。
3. 第十三把椅子只在没有人注视时出现。

**风堇**：小伊卡说，椅子上有体温。

**赛飞儿**：那就说明我们的客人还没走远。

*记录在此中断。最后一帧影像中，赛飞儿正朝镜头背后招手。*

## 附录

下一位阅读本档案的人，请不要回头。`,
  },
];

function ThemeButton({ theme, toggle }: { theme: string; toggle: () => void }) {
  return <button className="icon-button theme-button" onClick={toggle} aria-label="切换明暗主题"><span>{theme === "dark" ? "☼" : "☾"}</span><em>{theme === "dark" ? "浅色" : "深色"}</em></button>;
}

function MusicButton({ muted, toggle, character }: { muted: boolean; toggle: () => void; character: Character }) {
  return <button
    className={`music-toggle ${muted ? "is-muted" : "is-playing"}`}
    onClick={toggle}
    aria-label={muted ? `开启音乐：${character.track}` : `静音：${character.track}`}
    aria-pressed={!muted}
    title={muted ? "开启概念音乐" : `正在播放 · ${character.track}`}
    style={{ "--music-accent": character.color } as React.CSSProperties}
  >
    <span className="music-disc" aria-hidden="true"><i>✦</i></span>
    <span className="music-note" aria-hidden="true">♪</span>
    <span className="music-waves" aria-hidden="true"><i /><i /><i /></span>
    <span className="music-slash" aria-hidden="true" />
    <em className="music-label">MUSIC</em>
  </button>;
}

function Header({ theme, toggleTheme, muted, toggleMuted, character }: { theme: string; toggleTheme: () => void; muted: boolean; toggleMuted: () => void; character: Character }) {
  return <header className="site-header">
    <Link className="brand" to="/" aria-label="回到蝶影剧场首页"><span className="brand-mark">◇</span><span><strong>蝶影剧场</strong><small>MEMORIA · 13</small></span></Link>
    <div className="header-actions"><ThemeButton theme={theme} toggle={toggleTheme} /><MusicButton muted={muted} toggle={toggleMuted} character={character} /></div>
  </header>;
}

function ScriptCard({ script, compact = false }: { script: ScriptEntry; compact?: boolean }) {
  return <Link className={`script-card ${compact ? "compact" : ""}`} to={`/scripts/${script.id}`}>
    <span className="script-index">{script.index}</span>
    <div><small>{script.subtitle}</small><h3>{script.title}</h3><p>{script.excerpt}</p><div className="script-meta"><span>{script.duration}</span><span>{script.cast.length} 位角色</span></div></div>
    <span className="read-more">阅读剧本 ↗</span>
  </Link>;
}

function CharacterArchiveContent({ character, index, onSelect }: { character: Character; index: number; onSelect: (character: Character) => void }) {
  const previous = characters[(index - 1 + characters.length) % characters.length];
  const next = characters[(index + 1) % characters.length];
  const chapters = [
    {
      id: "origin",
      index: "01",
      label: "起源记录",
      title: `自${character.city}而来的无名书简`,
      paragraphs: [
        `${character.name}的记录始于一页没有日期的纸。档案员只能从纸面残留的${character.accent}色微光，以及反复出现的地名“${character.city}”，推断它曾被带着穿过漫长的夜。纸页边缘没有烧灼，也没有风化，像是时间在触碰它之前迟疑了一瞬。`,
        `${character.bio} 这段被写进公开档案的文字并不完整。在更早的抄本中，她的名字旁还留有数处被刻意擦除的注脚：一次没有见证者的告别、一条通往旧城的路，以及一项至今无人愿意再次执行的约定。`,
      ],
    },
    {
      id: "journey",
      index: "02",
      label: "行旅纪要",
      title: "在逐火道路上留下的四个坐标",
      paragraphs: [
        `第一处坐标位于城门之外。守卫声称${character.name}从未经过那里，但当天所有计时器都慢了七秒。第二处坐标是一座废弃驿站，桌上留下半杯尚有余温的水，以及用${character.element}刻出的细小记号。`,
        `第三处坐标没有地点，只有一句转述：“${character.quote}” 记录者将它归入命途“${character.path}”的观测样本，却始终无法解释，为何每位读到这句话的人都会想起不同的故乡。第四处坐标仍然空白——档案部认为，它应当留给旅程最终抵达的地方。`,
      ],
    },
    {
      id: "memory",
      index: "03",
      label: "记忆侧写",
      title: "她与众人之间，隔着一只蝶的距离",
      paragraphs: [
        `熟悉${character.name}的人很少用“${character.epithet}”称呼她。那是史书需要的名字，不是同行者会说出口的名字。对他们而言，她更像一段安静的间奏：不争夺叙述的中心，却会记住每个人在故事边缘遗落的细节。`,
        `档案中保存着三种彼此矛盾的评价。有人说她冷静得近乎残酷，有人说她比任何人都更珍惜短暂的生命，还有人坚持自己从未真正见过她。三份证词都被判定为真实，因为记忆从来不是一面平整的镜子。`,
      ],
    },
    {
      id: "observation",
      index: "04",
      label: "观测附录",
      title: "关于未完成命运的最后一页",
      paragraphs: [
        `观测编号 0${index + 1} 的结论仍处于开放状态。已确认的项目只有三项：${character.path}的轨迹仍在延伸，${character.element}反应会在她靠近时变得稳定，而那些被认为已经终结的故事，偶尔会在她身后重新出现一行文字。`,
        `因此，本档案没有使用“结案”印章。最后一页只压着一枚透明书签，上面写着：如果${character.name}再次回到${character.city}，请不要询问她带回了什么。先为她留一盏灯，再让故事自己决定从哪里继续。`,
      ],
    },
  ];

  return <section className="character-record" id="character-record" style={{ "--record-accent": character.color } as React.CSSProperties}>
    <header className="record-intro">
      <div><small>MEMORIA / EXPANDED RECORD</small><h2>角色详细档案</h2></div>
      <p>以下内容为非官方概念文本，用于展示长篇角色资料、章节导航与单页阅读结构。</p>
      <div className="record-facts"><span><small>PATH</small>{character.path}</span><span><small>TYPE</small>{character.element}</span><span><small>ORIGIN</small>{character.city}</span><span><small>KEYWORD</small>{character.tags.join(" · ")}</span></div>
    </header>
    <div className="record-reading-layout">
      <aside className="record-toc">
        <small>CONTENTS / 目录</small>
        <ol>{chapters.map((chapter) => <li key={chapter.id}><a href={`#record-${character.id}-${chapter.id}`}><span>{chapter.index}</span>{chapter.label}</a></li>)}</ol>
        <blockquote>“{character.quote}”</blockquote>
      </aside>
      <article className="record-chapters">
        {chapters.map((chapter) => <section key={chapter.id} id={`record-${character.id}-${chapter.id}`}>
          <div className="record-chapter-number">{chapter.index}</div>
          <div><small>{chapter.label} / {character.en}</small><h3>{chapter.title}</h3>{chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>
        </section>)}
      </article>
    </div>
    <nav className="record-pagination" aria-label="切换相邻角色">
      <button onClick={() => onSelect(previous)}><small>← PREVIOUS RECORD</small><strong>{previous.name}</strong><span>{previous.en} · {previous.epithet}</span></button>
      <button onClick={() => onSelect(next)}><small>NEXT RECORD →</small><strong>{next.name}</strong><span>{next.en} · {next.epithet}</span></button>
    </nav>
    <Footer />
  </section>;
}

function HomeStage({ onPlay }: { onPlay: (character: Character) => void }) {
  const [selected, setSelected] = useState(characters[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const selectedIndex = characters.findIndex((character) => character.id === selected.id);
  const selectCharacter = (character: Character) => {
    setSelected(character);
    onPlay(character);
  };
  const selectFromRecord = (character: Character) => {
    selectCharacter(character);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openDetail = () => {
    onPlay(selected);
    setDetailOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeDetail = () => {
    setDetailOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    if (!detailOpen) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeDetail(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [detailOpen]);
  return <main className={`stage-view ${detailOpen ? "is-detail-open" : ""}`}>
    <section className="stage-hero" style={{ "--stage-accent": selected.color } as React.CSSProperties}>
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <div className="butterfly-field" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span><span>◇</span><span>◇</span></div>
      <div className="hero-copy">
        <div className="eyebrow"><span /> AMPHOREUS CHARACTER ARCHIVE · 0{selectedIndex + 1}</div>
        <p className="hero-kicker">{selected.quote}</p>
        <h1 className={selected.name.length > 2 ? "long-name" : ""}>{Array.from(selected.name).map((letter, index) => <span key={`${selected.id}-${index}`}>{letter}</span>)}</h1>
        <p className="hero-en">{selected.en} <i>—</i> {selected.epithet}</p>
        <p className="hero-description">{selected.bio}</p>
        <div className="hero-actions" aria-hidden={detailOpen}><button className="primary-action" onClick={openDetail} tabIndex={detailOpen ? -1 : 0}>进入角色档案 <span>↗</span></button><a className="text-action" href="#scripts" tabIndex={detailOpen ? -1 : 0}>阅读剧本 <span>↓</span></a></div>
        <button className="record-close" onClick={closeDetail} tabIndex={detailOpen ? 0 : -1} aria-hidden={!detailOpen}><span>←</span> 收起详细档案 <small>ESC</small></button>
      </div>
      <div className="hero-visual"><div className="halo" /><img key={selected.id} src={selected.image} alt={`${selected.name}角色立绘`} /><div className="vertical-type">{selected.city} · {selected.path} · {selected.element}</div></div>
      <nav className="stage-character-nav" aria-label="切换封面角色" aria-hidden={detailOpen}>
        <ol>{characters.map((character, index) => <li key={character.id}><button className={selected.id === character.id ? "active" : ""} onClick={() => selectCharacter(character)} aria-pressed={selected.id === character.id} tabIndex={detailOpen ? -1 : 0}><span>0{index + 1}</span><strong>{character.name}</strong><small>{character.en}</small></button></li>)}</ol>
      </nav>
      <div className="hero-counter"><span>0{selectedIndex + 1}</span><i /><small>08</small></div>
      <div className="scroll-cue">SCROLL TO DESCEND <span>↓</span></div>
    </section>

    {detailOpen ? <CharacterArchiveContent character={selected} index={selectedIndex} onSelect={selectFromRecord} /> : <div className="stage-default-content">
      <section className="scripts-section" id="scripts">
        <div className="section-heading"><div><small>CHAPTER 01</small><h2>未完的逐火篇章</h2></div><p>以 Markdown 保存的原创示例剧本，<br />在阅读页中实时转换为排版内容。</p></div>
        <div className="scripts-grid">{scripts.map((script) => <ScriptCard key={script.id} script={script} />)}</div>
      </section>
      <Footer />
    </div>}
  </main>;
}

function CharacterDetail({ onPlay }: { onPlay: (character: Character) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const character = characters.find((item) => item.id === id) ?? characters[0];
  const index = characters.findIndex((item) => item.id === character.id);
  useEffect(() => { onPlay(character); window.scrollTo({ top: 0 }); }, [character.id]);
  const nextCharacter = characters[(index + 1) % characters.length];
  return <main className="detail-view" style={{ "--detail-accent": character.color } as React.CSSProperties}>
    <section className="detail-hero">
      <button className="detail-back" onClick={() => navigate(-1)}>← 返回</button>
      <div className="detail-number">0{index + 1}</div><div className="detail-grid-line one" /><div className="detail-grid-line two" />
      <div className="detail-copy"><div className="eyebrow">CHRYSOS HEIR · RECORD 0{index + 1}</div><h1>{character.name}</h1><p className="detail-en">{character.en}</p><h2>{character.epithet}</h2><blockquote>“{character.quote}”</blockquote><div className="detail-tags">{character.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
      <div className="detail-portrait"><div className="detail-halo" /><img src={character.image} alt={`${character.name}完整角色立绘`} /><span className="detail-vertical">{character.city} / {character.accent}</span></div>
      <div className="detail-facts"><span><small>PATH / 命途</small>{character.path}</span><span><small>TYPE / 属性</small>{character.element}</span><span><small>ORIGIN / 出身</small>{character.city}</span></div>
    </section>
    <section className="detail-story"><div><small>ARCHIVE NOTE · 非官方概念设定集</small><h2>隔着一只蝶的距离，<br />听见每个人的命运。</h2></div><div><p>{character.bio}</p><p>此页面用于展示角色详情的排版与动效结构。正式内容可以继续增加语音、技能、关系图谱和图集模块。</p></div></section>
    <section className="roster-strip"><div className="strip-heading"><small>SWITCH RECORD</small><h2>切换角色</h2></div><div className="strip-list">{characters.map((item, i) => <Link key={item.id} to={`/characters/${item.id}`} className={item.id === character.id ? "active" : ""} onClick={() => onPlay(item)}><span>0{i + 1}</span><img src={item.image} alt="" /><strong>{item.name}</strong></Link>)}</div></section>
    <Link className="next-record" to={`/characters/${nextCharacter.id}`} onClick={() => onPlay(nextCharacter)}><small>NEXT RECORD</small><span>{nextCharacter.name}</span><i>→</i></Link>
    <Footer />
  </main>;
}

function ScriptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const script = scripts.find((item) => item.id === id) ?? scripts[0];
  const nextScript = scripts[(scripts.findIndex((item) => item.id === script.id) + 1) % scripts.length];
  useEffect(() => window.scrollTo({ top: 0 }), [script.id]);
  return <main className="reader-view">
    <div className="reader-progress" />
    <aside className="reader-aside"><button onClick={() => navigate(-1)}>← 返回档案</button><div><small>EPISODE</small><strong>{script.index}</strong></div><div className="reader-toc"><span>本篇角色</span>{script.cast.map((name) => <em key={name}>{name}</em>)}</div><span className="reader-mark">◇</span></aside>
    <article className="reader-article"><header><div className="eyebrow">NARRATIVE LOG · {script.index}</div><h1>{script.title}</h1><p>{script.subtitle}</p><div><span>{script.duration}</span><span>{script.cast.join(" · ")}</span><span>MARKDOWN → HTML</span></div></header><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{script.markdown}</ReactMarkdown></div><Link className="reader-next" to={`/scripts/${nextScript.id}`}><small>继续阅读</small><strong>{nextScript.title}</strong><span>→</span></Link></article>
  </main>;
}

function Footer() {
  return <footer><div className="footer-mark">◇</div><div><strong>蝶影剧场</strong><span>MEMORIA OF AMPHOREUS</span></div><p>非官方视觉概念站 · 角色版权归 HoYoverse 所有<br />本站文本为设计展示用途的原创示例</p><a href="#top">回到顶部 ↑</a></footer>;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("castorice-theme") || "dark");
  const [activeCharacter, setActiveCharacter] = useState(characters[0]);
  const [muted, setMuted] = useState(() => localStorage.getItem("castorice-muted") === "true");
  const location = useLocation();
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("castorice-theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("castorice-muted", String(muted)); }, [muted]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  const onPlay = (character: Character) => { if (character.id !== activeCharacter.id) setActiveCharacter(character); };
  return <div id="top" className="app-shell"><Header theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} muted={muted} toggleMuted={() => setMuted((value) => !value)} character={activeCharacter} /><Routes><Route path="/" element={<HomeStage onPlay={onPlay} />} /><Route path="/characters/:id" element={<CharacterDetail onPlay={onPlay} />} /><Route path="/scripts/:id" element={<ScriptPage />} /><Route path="*" element={<HomeStage onPlay={onPlay} />} /></Routes></div>;
}

export default App;
