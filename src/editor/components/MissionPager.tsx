import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { ActionIcon, Button, Tooltip } from "../../components/ui";
import type { MissionRef } from "../../components/content/types";

interface MissionPagerProps {
	previous: MissionRef | null;
	next: MissionRef | null;
	position: number;
	total: number;
	placement: "header" | "footer";
	onOpen: (mission: MissionRef) => void;
}

export function MissionPager({ previous, next, position, total, placement, onOpen }: MissionPagerProps) {
	const progress = position >= 0 ? `${position + 1} / ${total}` : `— / ${total}`;
	if (placement === "header") {
		return <nav className="mission-pager is-header" aria-label="切换任务">
			<Tooltip label={previous ? `上一个：${previous.name}` : "已经是第一个任务"} withArrow><ActionIcon aria-label="上一个任务" variant="subtle" color="gray" size="xs" disabled={!previous} onClick={() => previous && onOpen(previous)}><IconChevronLeft /></ActionIcon></Tooltip>
			<span className="mission-pager-position" aria-label={`当前是第 ${position + 1} 个任务，共 ${total} 个`}>{progress}</span>
			<Tooltip label={next ? `下一个：${next.name}` : "已经是最后一个任务"} withArrow><ActionIcon aria-label="下一个任务" variant="subtle" color="gray" size="xs" disabled={!next} onClick={() => next && onOpen(next)}><IconChevronRight /></ActionIcon></Tooltip>
		</nav>;
	}

	return <nav className="mission-pager is-footer" aria-label="切换任务">
		<Button variant="subtle" color="gray" size="compact-sm" disabled={!previous} onClick={() => previous && onOpen(previous)} leftSection={<IconChevronLeft size={14} />}><span className="mission-pager-copy"><strong>{previous?.name ?? "没有上一个任务"}</strong><small>{previous?.series ?? "已到任务列表开头"}</small></span></Button>
		<span className="mission-pager-position">{progress}</span>
		<Button variant="subtle" color="gray" size="compact-sm" disabled={!next} onClick={() => next && onOpen(next)}><span className="mission-pager-copy"><strong>{next?.name ?? "没有下一个任务"}</strong><small>{next?.series ?? "已到任务列表末尾"}</small></span><IconChevronRight size={14} /></Button>
	</nav>;
}
