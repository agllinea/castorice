import { useState } from "react";
import { IconArrowLeft, IconCopy, IconSearch, IconSettings } from "@tabler/icons-react";
import { CollapsibleContent } from "../components/content/CollapsibleContent";
import {
	ActionIcon,
	Badge,
	Button,
	InteractiveSurface,
	MenuButton,
	Modal,
	NavLink,
	Paper,
	SegmentedControl,
	Select,
	Textarea,
	TextInput,
	Tooltip,
} from "../components/ui";
import "./UiGallery.css";

const buttonVariants = ["filled", "light", "subtle", "outline", "default"] as const;
const buttonColors = ["blue", "gray", "orange", "teal", "red"] as const;
const buttonSizes = ["compact-xs", "compact-sm", "xs", "sm", "md", "lg"] as const;

function GallerySection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
	return <section className="ui-gallery-section"><header><h2>{title}</h2>{description ? <p>{description}</p> : null}</header><div className="ui-gallery-surface">{children}</div></section>;
}

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
	return <div className="ui-gallery-row"><code>{label}</code><div className="ui-gallery-examples">{children}</div></div>;
}

export default function UiGallery() {
	const [selectValue, setSelectValue] = useState("trailblaze");
	const [segment, setSegment] = useState("source");
	const [activeNav, setActiveNav] = useState("second");
	const [modalOpen, setModalOpen] = useState(false);
	const [foldCollapsed, setFoldCollapsed] = useState(false);

	return <main className="ui-gallery-page">
		<header className="ui-gallery-header"><div><span>CASTORICE DESIGN SYSTEM</span><h1>UI 组件检验台</h1><p>集中检查编辑器实际使用的组件、交互状态、hover、focus、disabled 与密度。</p></div><Button variant="outline" leftSection={<IconArrowLeft size={15} />} onClick={() => { window.location.href = "/"; }}>返回编辑器</Button></header>

		<div className="ui-gallery-content">
			<GallerySection title="Button" description="将鼠标依次悬停在每个按钮上，文字颜色不应突然变黑。">
				{buttonVariants.map((variant) => <LabeledRow key={variant} label={variant}>{buttonColors.map((color) => <Button key={color} variant={variant} color={color}>{color}</Button>)}</LabeledRow>)}
				<LabeledRow label="state"><Button>正常</Button><Button loading>保存中</Button><Button disabled>不可用</Button><Button variant="subtle" leftSection={<IconCopy size={14} />}>带图标</Button></LabeledRow>
				<LabeledRow label="size">{buttonSizes.map((size) => <Button key={size} size={size} variant="outline">{size}</Button>)}</LabeledRow>
			</GallerySection>

			<GallerySection title="ActionIcon 与 Tooltip">
				<LabeledRow label="icon"><Tooltip label="复制当前对话" withArrow><ActionIcon aria-label="复制当前对话" variant="subtle" color="blue"><IconCopy size={15} /></ActionIcon></Tooltip><Tooltip label="编辑设置" withArrow><ActionIcon aria-label="编辑设置" variant="light" color="teal"><IconSettings size={15} /></ActionIcon></Tooltip><ActionIcon aria-label="不可用操作" disabled><IconCopy size={15} /></ActionIcon></LabeledRow>
			</GallerySection>

			<GallerySection title="Badge">
				<LabeledRow label="color">{buttonColors.map((color) => <Badge key={color} color={color}>{color}</Badge>)}</LabeledRow>
				<LabeledRow label="size"><Badge size="xs">xs</Badge><Badge size="sm">sm</Badge><Badge size="md">md</Badge><Badge size="lg">lg</Badge><Badge variant="filled" color="blue">filled</Badge></LabeledRow>
			</GallerySection>

			<GallerySection title="TextInput、Textarea 与 Select">
				<div className="ui-gallery-form-grid"><label><span>普通输入框</span><TextInput placeholder="输入标题" /></label><label><span>带前置图标</span><TextInput size="xs" leftSection={<IconSearch size={14} />} placeholder="搜索任务" /></label><label><span>任务筛选</span><Select value={selectValue} onChange={(value) => setSelectValue(value ?? "all")} data={[{ value: "all", label: "所有任务种类" }, { value: "trailblaze", label: "开拓任务" }, { value: "continuance", label: "开拓续闻" }, { value: "companion", label: "同行任务" }]} /></label><label className="is-wide"><span>多行文本</span><Textarea minRows={4} placeholder="在这里输入剧本文本……" /></label></div>
			</GallerySection>

			<GallerySection title="SegmentedControl、Menu 与 Modal">
				<LabeledRow label="segmented"><SegmentedControl value={segment} onChange={setSegment} data={[{ value: "plain", label: "纯文本" }, { value: "source", label: "BWiki 源文" }, { value: "srt", label: "SRT 字幕" }]} /></LabeledRow>
				<LabeledRow label="overlay"><MenuButton label="更多操作" items={[{ label: "普通文本", onClick: () => undefined }, { label: "编辑注释", onClick: () => undefined }]} /><Button variant="outline" onClick={() => setModalOpen(true)}>打开弹窗</Button></LabeledRow>
			</GallerySection>

			<GallerySection title="NavLink 与列表选中线" description="左侧标记保持笔直，不再受列表圆角或 hover 背景影响。">
				<div className="ui-gallery-list-demo"><h3>空间站「黑塔」</h3><h4>今天是昨天的明天</h4><NavLink label="混乱行至深处" active={activeNav === "first"} onClick={() => setActiveNav("first")} /><NavLink label="漩涡止于中心" active={activeNav === "second"} onClick={() => setActiveNav("second")} /><NavLink label="宇宙安宁片刻" active={activeNav === "third"} onClick={() => setActiveNav("third")} /></div>
			</GallerySection>

			<GallerySection title="InteractiveSurface" description="用于整行可点击、可键盘聚焦的剧本条目，不再用按钮模拟复杂卡片。">
				<InteractiveSurface className="ui-gallery-interactive" onActivate={() => setActiveNav("surface")}>
					<strong>001 今天是昨天的明天</strong>
					<span>序幕 · 空间站「黑塔」</span>
					<small>{activeNav === "surface" ? "已选择" : "点击或按 Enter 选择"}</small>
				</InteractiveSurface>
			</GallerySection>

			<GallerySection title="CollapsibleContent" description="任务资料和剧本编辑器共用的折叠容器；检查高度动画、箭头旋转和展开状态。">
				<div className="ui-gallery-fold-demo"><CollapsibleContent collapsed={foldCollapsed} onCollapsedChange={setFoldCollapsed} className="read-node-fold" heading={<div className="container-heading-copy"><strong>调查电梯</strong><small>共享折叠容器示例</small></div>}><div className="read-node read-node-dialogue is-leaf"><div className="read-node-line"><strong className="read-speaker">三月七</strong><span className="read-text">这里是折叠区域内的第一段内容。</span></div></div><div className="read-node read-node-narration is-leaf"><div className="read-node-line"><span className="read-text">展开和收起时，内容高度应当平滑过渡。</span></div></div></CollapsibleContent></div>
			</GallerySection>

			<GallerySection title="Paper">
				<div className="ui-gallery-paper-grid"><Paper shadow="xs" radius="md" className="ui-gallery-paper">xs 阴影</Paper><Paper shadow="sm" radius="md" className="ui-gallery-paper">sm 阴影</Paper><Paper shadow="sm" radius={0} className="ui-gallery-paper">直角面板</Paper></div>
			</GallerySection>
		</div>

		<Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="弹窗组件检验" size="md" centered><div className="ui-gallery-modal-copy"><p>检查遮罩、圆角、关闭按钮和进入/退出动画。</p><TextInput placeholder="弹窗内输入框" /><div><Button variant="subtle" color="gray" onClick={() => setModalOpen(false)}>取消</Button><Button onClick={() => setModalOpen(false)}>确认</Button></div></div></Modal>
	</main>;
}
