import { IconMapPin, IconSearch, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { ActionIcon, Badge, NavLink, Select, TextInput } from "../../components/ui";
import type { MissionRef } from "../../components/content/types";

interface MissionTocGroup {
	location: string;
	series: Array<{ name: string; entries: MissionRef[] }>;
}

interface MissionTocOverlayProps {
	opened: boolean;
	groups: MissionTocGroup[];
	selectedFile?: string;
	total: number;
	search: string;
	category: string;
	location: string;
	categories: string[];
	locations: string[];
	onClose: () => void;
	onOpen: (mission: MissionRef) => void;
	onSearchChange: (value: string) => void;
	onCategoryChange: (value: string) => void;
	onLocationChange: (value: string) => void;
}

export function MissionTocOverlay({ opened, groups, selectedFile, total, search, category, location, categories, locations, onClose, onOpen, onSearchChange, onCategoryChange, onLocationChange }: MissionTocOverlayProps) {
	return <AnimatePresence>{opened ? <motion.div className="mission-toc-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} onClick={onClose}>
		<motion.aside className="mission-toc-overlay" role="dialog" aria-label="任务目录" initial={{ opacity: 0, x: 18, scale: .985 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 12, scale: .99 }} transition={{ duration: .2, ease: [.2, 0, 0, 1] }} onClick={(event) => event.stopPropagation()}>
			<header><div><strong>任务目录</strong><Badge variant="light" color="blue" size="xs">{total}</Badge></div><ActionIcon aria-label="关闭任务目录" variant="subtle" color="gray" size="xs" onClick={onClose}><IconX /></ActionIcon></header>
			<div className="mission-toc-filters">
				<TextInput size="xs" leftSection={<IconSearch size={14} />} placeholder="搜索任务、系列或地点" value={search} onChange={(event) => onSearchChange(event.target.value)} />
				<Select size="xs" aria-label="按任务种类筛选" value={category} allowDeselect={false} onChange={(value) => onCategoryChange(value ?? "")} data={[{ value: "", label: "所有任务种类" }, ...categories.map((item) => ({ value: item, label: item }))]} />
				<Select size="xs" leftSection={<IconMapPin size={14} />} aria-label="按地点筛选" value={location} allowDeselect={false} onChange={(value) => onLocationChange(value ?? "")} data={[{ value: "", label: "所有地点" }, ...locations.map((item) => ({ value: item, label: item }))]} />
			</div>
			<nav>{groups.length ? groups.map((location) => <section className="mission-toc-location" key={location.location}><h3>{location.location}</h3>{location.series.map((series) => <div className="mission-toc-series" key={series.name}><h4>{series.name}</h4>{series.entries.map((mission) => <NavLink key={mission.dataFile} className="mission-toc-item" active={mission.dataFile === selectedFile} label={mission.name} title={`${mission.location} / ${mission.series} / ${mission.name}`} onClick={() => { onOpen(mission); onClose(); }} />)}</div>)}</section>) : <p>没有符合当前筛选条件的任务</p>}</nav>
		</motion.aside>
	</motion.div> : null}</AnimatePresence>;
}
