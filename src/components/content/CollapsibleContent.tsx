import { AnimatePresence, motion } from "motion/react";
import type { MouseEventHandler, PointerEventHandler, ReactNode } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { ActionIcon } from "../ui";

interface CollapsibleContentProps {
	id?: string;
	collapsed: boolean;
	onCollapsedChange: (collapsed: boolean) => void;
	className?: string;
	depth?: number;
	heading: ReactNode;
	headingClassName?: string;
	trailingActions?: ReactNode;
	children: ReactNode;
	expandLabel?: string;
	collapseLabel?: string;
	onHeadingClick?: MouseEventHandler<HTMLDivElement>;
	onHeadingDoubleClick?: MouseEventHandler<HTMLDivElement>;
	onTogglePointerDown?: PointerEventHandler<HTMLButtonElement>;
}

export function CollapsibleContent({
	id,
	collapsed,
	onCollapsedChange,
	className = "",
	depth,
	heading,
	headingClassName = "",
	trailingActions,
	children,
	expandLabel = "展开内容",
	collapseLabel = "收起内容",
	onHeadingClick,
	onHeadingDoubleClick,
	onTogglePointerDown,
}: CollapsibleContentProps) {
	const actionLabel = collapsed ? expandLabel : collapseLabel;
	return <div id={id} className={`read-node collapsible-content ${className} ${collapsed ? "is-collapsed" : "is-expanded"}`} data-depth={depth}>
		<div className={`read-node-heading ${headingClassName}`} onClick={onHeadingClick} onDoubleClick={onHeadingDoubleClick}>
			{heading}
			<ActionIcon
				className="fold-toggle-button"
				variant="subtle"
				color="gray"
				size="sm"
				aria-label={actionLabel}
				title={actionLabel}
				aria-expanded={!collapsed}
				onPointerDown={(event) => { event.stopPropagation(); onTogglePointerDown?.(event); }}
				onClick={(event) => { event.stopPropagation(); onCollapsedChange(!collapsed); }}
				onDoubleClick={(event) => event.stopPropagation()}
			>
				<motion.span className="fold-toggle-icon" animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: .18, ease: [.2, 0, 0, 1] }}><IconChevronDown size={14} /></motion.span>
			</ActionIcon>
			{trailingActions}
		</div>
		<AnimatePresence initial={false}>
			{collapsed ? null : <motion.div
				className="collapsible-content-region"
				initial={{ height: 0, opacity: 0 }}
				animate={{ height: "auto", opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
				transition={{ height: { duration: .22, ease: [.2, 0, 0, 1] }, opacity: { duration: .14, ease: "easeOut" } }}
			>
				<div className="read-node-children">{children}</div>
			</motion.div>}
		</AnimatePresence>
	</div>;
}
