import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
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

const viewRoutes = [
  { to: "/", label: "蝶影舞台", sub: "沉浸式" },
  { to: "/gallery", label: "折光画廊", sub: "卡片式" },
  { to: "/archive", label: "月茧档案", sub: "编辑部" },
];

function ThemeButton({ theme, toggle }: { theme: string; toggle: () => void }) {
  return <button className="icon-button theme-button" onClick={toggle} aria-label="切换明暗主题"><span>{theme === "dark" ? "☼" : "☾"}</span><em>{theme === "dark" ? "浅色" : "深色"}</em></button>;
}

function Header({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const location = useLocation();
  const isShowcase = viewRoutes.some((route) => route.to === location.pathname);
  return <header className="site-header">
    <Link className="brand" to="/" aria-label="回到蝶影剧场首页"><span className="brand-mark">◇</span><span><strong>蝶影剧场</strong><small>MEMORIA · 13</small></span></Link>
    <nav className="main-nav" aria-label="设计方案">
      {viewRoutes.map((route) => <NavLink key={route.to} to={route.to} end={route.to === "/"} className={({ isActive }) => isActive || (!isShowcase && route.to === "/") ? "active" : ""}><span>{route.label}</span><small>{route.sub}</small></NavLink>)}
    </nav>
    <ThemeButton theme={theme} toggle={toggleTheme} />
  </header>;
}

function AudioDock({ character, isChanging }: { character: Character; isChanging: boolean }) {
  return <div className={`audio-dock ${isChanging ? "is-changing" : ""}`} aria-live="polite">
    <div className="disc"><span>✦</span></div>
    <button className="play-button" aria-label="暂停概念音轨">Ⅱ</button>
    <div className="track-meta"><small>NOW PLAYING · 概念音轨</small><strong>{character.track}</strong><span>{character.name} / {character.en}</span></div>
    <div className="waveform" aria-hidden="true">{Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>
    <span className="track-time">01:24 / {character.duration}</span>
  </div>;
}

function CharacterCard({ character, index, onPlay, variant = "default" }: { character: Character; index: number; onPlay: (character: Character) => void; variant?: string }) {
  return <Link to={`/characters/${character.id}`} className={`character-card ${variant}`} style={{ "--accent": character.color } as React.CSSProperties} onClick={() => onPlay(character)}>
    <span className="card-index">0{index + 1}</span>
    <div className="card-image-wrap"><img src={character.image} alt={`${character.name}角色立绘`} /></div>
    <div className="card-copy"><small>{character.epithet}</small><h3>{character.name}</h3><span>{character.en}</span></div>
    <div className="card-arrow">↗</div>
  </Link>;
}

function ScriptCard({ script, compact = false }: { script: ScriptEntry; compact?: boolean }) {
  return <Link className={`script-card ${compact ? "compact" : ""}`} to={`/scripts/${script.id}`}>
    <span className="script-index">{script.index}</span>
    <div><small>{script.subtitle}</small><h3>{script.title}</h3><p>{script.excerpt}</p><div className="script-meta"><span>{script.duration}</span><span>{script.cast.length} 位角色</span></div></div>
    <span className="read-more">阅读剧本 ↗</span>
  </Link>;
}

function HomeStage({ onPlay }: { onPlay: (character: Character) => void }) {
  return <main className="stage-view">
    <section className="stage-hero">
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <div className="butterfly-field" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span><span>◇</span><span>◇</span></div>
      <div className="hero-copy">
        <div className="eyebrow"><span /> AMPHOREUS CHARACTER ARCHIVE · 03</div>
        <p className="hero-kicker">她以死亡注释生命</p>
        <h1><span>遐</span><span>蝶</span></h1>
        <p className="hero-en">CASTORICE <i>—</i> SERVANT OF DEATH</p>
        <p className="hero-description">一座为黄金裔留下的互动剧场。<br />让角色、光影与未被写下的故事再次相遇。</p>
        <div className="hero-actions"><Link className="primary-action" to="/characters/castorice" onClick={() => onPlay(characters[0])}>进入角色档案 <span>↗</span></Link><a className="text-action" href="#characters">浏览全员 <span>↓</span></a></div>
      </div>
      <div className="hero-visual"><div className="halo" /><img src={characters[0].image} alt="遐蝶角色立绘" /><div className="vertical-type">LIFE · DEATH · MEMORY</div></div>
      <div className="hero-counter"><span>01</span><i /><small>08</small></div>
      <div className="scroll-cue">SCROLL TO DESCEND <span>↓</span></div>
    </section>

    <section className="character-section" id="characters">
      <div className="section-heading"><div><small>CHAPTER 01</small><h2>黄金裔 · 角色图鉴</h2></div><p>选择角色，将同步载入<br />其专属概念音轨与视觉色谱。</p></div>
      <div className="character-grid">{characters.map((character, i) => <CharacterCard key={character.id} character={character} index={i} onPlay={onPlay} />)}</div>
    </section>

    <section className="scripts-section">
      <div className="section-heading"><div><small>CHAPTER 02</small><h2>未完的逐火篇章</h2></div><p>以 Markdown 保存的原创示例剧本，<br />在阅读页中实时转换为排版内容。</p></div>
      <div className="scripts-grid">{scripts.map((script) => <ScriptCard key={script.id} script={script} />)}</div>
    </section>
    <Footer />
  </main>;
}

function GalleryView({ onPlay }: { onPlay: (character: Character) => void }) {
  return <main className="gallery-view">
    <section className="gallery-intro">
      <div><span className="eyebrow">CONCEPT B · PRISM GALLERY</span><h1>把命运折成<br /><em>八束光。</em></h1></div>
      <p>更轻、更像一本动态画册。角色以错落的海报卡片展开，适合把视觉素材放在第一位。</p>
      <div className="gallery-stamp">08<br /><small>PORTRAITS</small></div>
    </section>
    <section className="masonry-characters">{characters.map((character, i) => <CharacterCard key={character.id} character={character} index={i} onPlay={onPlay} variant={`gallery-card card-${i + 1}`} />)}</section>
    <section className="gallery-scripts"><div className="gallery-script-heading"><small>INTERMISSION</small><h2>阅读发生在<br />两束光之间。</h2></div><div>{scripts.map((script) => <ScriptCard key={script.id} script={script} compact />)}</div></section>
    <Footer />
  </main>;
}

function ArchiveView({ onPlay }: { onPlay: (character: Character) => void }) {
  const [selected, setSelected] = useState(characters[0]);
  const select = (character: Character) => { setSelected(character); onPlay(character); };
  return <main className="archive-view" style={{ "--archive-accent": selected.color } as React.CSSProperties}>
    <section className="archive-hero">
      <div className="archive-rail">
        <div className="archive-heading"><small>CONCEPT C / CHRYSOS INDEX</small><h1>月茧<br />档案</h1><p>一套冷静、信息密度更高的编辑部排版。适合内容持续增加后的长期维护。</p></div>
        <ol>{characters.map((character, i) => <li key={character.id}><button className={selected.id === character.id ? "active" : ""} onClick={() => select(character)}><span>0{i + 1}</span><strong>{character.name}</strong><small>{character.en}</small></button></li>)}</ol>
      </div>
      <div className="archive-feature">
        <div className="archive-image"><span className="archive-cross cross-a" /><span className="archive-cross cross-b" /><div className="archive-sun" /><img key={selected.id} src={selected.image} alt={`${selected.name}角色立绘`} /></div>
        <div className="archive-detail"><div className="archive-label">CURRENT RECORD <span>● LIVE</span></div><h2>{selected.name}</h2><p className="archive-en">{selected.en}</p><blockquote>“{selected.quote}”</blockquote><div className="archive-facts"><span><small>所属</small>{selected.city}</span><span><small>命途</small>{selected.path}</span><span><small>属性</small>{selected.element}</span></div><Link className="archive-open" to={`/characters/${selected.id}`}>打开完整记录 <span>→</span></Link></div>
      </div>
    </section>
    <section className="archive-scripts"><div className="archive-section-title"><span>02</span><h2>叙事记录</h2><small>NARRATIVE LOGS / MARKDOWN</small></div>{scripts.map((script) => <ScriptCard key={script.id} script={script} compact />)}</section>
    <Footer />
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
  const [isChanging, setIsChanging] = useState(false);
  const location = useLocation();
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("castorice-theme", theme); }, [theme]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  const onPlay = (character: Character) => { if (character.id === activeCharacter.id) return; setIsChanging(true); setActiveCharacter(character); window.setTimeout(() => setIsChanging(false), 700); };
  const hideDock = useMemo(() => location.pathname.startsWith("/scripts/"), [location.pathname]);
  return <div id="top" className="app-shell"><Header theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} /><Routes><Route path="/" element={<HomeStage onPlay={onPlay} />} /><Route path="/gallery" element={<GalleryView onPlay={onPlay} />} /><Route path="/archive" element={<ArchiveView onPlay={onPlay} />} /><Route path="/characters/:id" element={<CharacterDetail onPlay={onPlay} />} /><Route path="/scripts/:id" element={<ScriptPage />} /><Route path="*" element={<HomeStage onPlay={onPlay} />} /></Routes>{!hideDock && <AudioDock character={activeCharacter} isChanging={isChanging} />}</div>;
}

export default App;
