import { IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { ActionIcon, Badge, Button } from "../../components/ui";
import type { NodePath } from "../../components/content/types";

export interface MissionContentHeading {
	title: string;
	path: NodePath;
}

interface MissionContentTocOverlayProps {
	opened: boolean;
	missionName: string;
	headings: MissionContentHeading[];
	onClose: () => void;
	onOpen: (heading: MissionContentHeading) => void;
}

export function MissionContentTocOverlay({ opened, missionName, headings, onClose, onOpen }: MissionContentTocOverlayProps) {
	return <AnimatePresence>{opened ? <motion.div className="mission-toc-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} onClick={onClose}>
		<motion.aside className="mission-toc-overlay mission-content-toc-overlay" role="dialog" aria-label="当前任务内容目录" initial={{ opacity: 0, x: 18, scale: .985 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 12, scale: .99 }} transition={{ duration: .2, ease: [.2, 0, 0, 1] }} onClick={(event) => event.stopPropagation()}>
			<header><div><strong>任务内容目录</strong><Badge variant="light" color="blue" size="xs">{headings.length}</Badge></div><ActionIcon aria-label="关闭内容目录" variant="subtle" color="gray" size="xs" onClick={onClose}><IconX /></ActionIcon></header>
			<p className="mission-content-toc-name">{missionName}</p>
			<nav>{headings.length ? headings.map((heading) => <Button key={JSON.stringify(heading.path)} variant="subtle" color="gray" size="compact-sm" title={heading.title} onClick={() => { onOpen(heading); onClose(); }}>{heading.title}</Button>) : <p>当前任务没有三级标题</p>}</nav>
		</motion.aside>
	</motion.div> : null}</AnimatePresence>;
}
