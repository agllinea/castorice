import { useState, type DragEvent, type MouseEvent } from "react";
import { ActionIcon } from "@mantine/core";
import { IconChevronDown, IconChevronRight, IconCopy, IconGripVertical } from "@tabler/icons-react";
import { EditableContent, MessageThreadHeadingFields } from "./EditableContent";
import { BufferedInput } from "../forms/BufferedFields";
import { ReadOnlyContent } from "./ReadOnlyContent";
import { HighlightedRichText } from "./RichText";
import { collectRubyAnnotations, plainRubyText } from "./rich-text-utils";
import { sameScriptAddress, scriptNodeDomId } from "./screenplay-model";
import type { AssetUrlResolver, JsonNode, ScriptBlock, ScriptNodeAddress, ScriptTextMatch } from "./types";

async function copyToClipboard(text: string) {
	await navigator.clipboard.writeText(text);
}

interface ScriptHierarchyNodeProps {
	blockId: string;
	node: JsonNode;
	path: number[];
	level: number;
	selectedAddresses: ScriptNodeAddress[];
	editableAddress: ScriptNodeAddress | null;
	activeMatch: ScriptTextMatch | null;
	onSelect: (address: ScriptNodeAddress, shiftKey: boolean) => void;
	onChange: (path: number[], node: JsonNode) => void;
	onDrop: (target: ScriptNodeAddress, dragged: ScriptNodeAddress, nest: boolean) => void;
	onDialogueCursor: (address: ScriptNodeAddress, offset: number) => void;
	resolveAssetUrl?: AssetUrlResolver;
}

function ScriptHierarchyNode({ blockId, node, path, level, selectedAddresses, editableAddress, activeMatch, onSelect, onChange, onDrop, onDialogueCursor, resolveAssetUrl }: ScriptHierarchyNodeProps) {
	const [dragOver, setDragOver] = useState(false);
	const isMessageThread = node.type === "message-thread";
	const isContainer = node.type === "fold" || isMessageThread;
	const address = { blockId, path };
	const selected = selectedAddresses.some((candidate) => sameScriptAddress(candidate, address));
	const editable = editableAddress ? sameScriptAddress(editableAddress, address) : false;
	const content = Array.isArray(node.content) ? node.content as JsonNode[] : [];
	const isActiveMatch = Boolean(activeMatch && sameScriptAddress(activeMatch.address, address));
	const containsActiveMatch = Boolean(activeMatch && activeMatch.address.blockId === blockId && path.length < activeMatch.address.path.length && path.every((value, index) => activeMatch.address.path[index] === value));
	const select = (event: MouseEvent) => {
		event.stopPropagation();
		if ((event.target as HTMLElement).closest(".selectable-row")) return;
		onSelect(address, event.shiftKey);
	};
	const handleDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setDragOver(false);
		try { onDrop(address, JSON.parse(event.dataTransfer.getData("application/x-castorice-block")) as ScriptNodeAddress, isContainer); } catch { /* Ignore foreign drags. */ }
	};
	const startDrag = (event: DragEvent) => {
		event.stopPropagation();
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("application/x-castorice-block", JSON.stringify(address));
	};
	const dragHandle = <button type="button" className="block-drag-handle" draggable aria-label="拖动内容块" title="拖动内容块" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onDragStart={startDrag}><IconGripVertical size={15} /></button>;
	const dialogueText = node.type === "dialogue" ? String(node.text ?? "") : "";
	const annotations = dialogueText ? collectRubyAnnotations(dialogueText) : [];
	const dialogueCopyActions = node.type === "dialogue" ? <div className="dialogue-copy-actions" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>{annotations.length ? <ActionIcon className="annotation-copy-button" variant="subtle" color="gray" size="xs" aria-label="复制本段全部注音" title="复制全部注音" onClick={() => void copyToClipboard(annotations.join(" "))}><IconCopy size={11} /></ActionIcon> : null}<ActionIcon variant="subtle" color="gray" size="sm" aria-label="复制对话文本" title="复制对话文本" onClick={() => void copyToClipboard(plainRubyText(dialogueText))}><IconCopy size={14} /></ActionIcon></div> : null;
	const wrapperClass = `script-view-block script-level-${level} ${path.length ? "is-nested" : "is-root"} ${selected ? "is-selected" : ""} ${isActiveMatch ? "is-search-match" : ""} ${dragOver ? isContainer ? "is-drop-target" : "is-insert-target" : ""}`;

	if (isContainer) {
		const collapsed = Boolean(node.collapsed) && !containsActiveMatch;
		return <article id={scriptNodeDomId(address)} className={wrapperClass} data-level={level} data-search-active={isActiveMatch || undefined} onClick={select} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; setDragOver(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false); }} onDrop={handleDrop}>
			{dragHandle}
			<div className={`read-node ${isMessageThread ? "read-node-message-thread" : "read-node-fold"} inline-edit-node ${collapsed ? "is-collapsed" : ""}`} data-depth={level - 1}>
				<div className="read-node-heading">{editable ? isMessageThread ? <MessageThreadHeadingFields node={node} content={content} onChange={(value) => onChange(path, value)} /> : <BufferedInput className="inline-heading-input" value={String(node.title ?? "")} placeholder="折叠组标题" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onValueChange={(value) => onChange(path, { ...node, title: value })} /> : <div className="container-heading-copy"><strong><HighlightedRichText text={String(node.title ?? (isMessageThread ? "未命名短信会话" : "未命名折叠组"))} highlight={isActiveMatch && activeMatch?.field === "title" ? activeMatch : undefined} /></strong>{isMessageThread ? <small>{String(node.subtitle ?? "") || "无副标题"} · 手机持有者：{String(node.owner ?? "开拓者")}</small> : null}</div>}<ActionIcon className="fold-toggle-button" variant="subtle" color="gray" size="xs" aria-label={collapsed ? "展开内容" : "收起内容"} title={collapsed ? "展开" : "收起"} aria-expanded={!collapsed} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onChange(path, { ...node, collapsed: !collapsed }); }}>{collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}</ActionIcon></div>
				{collapsed ? null : <div className="read-node-children">{content.map((child, index) => <ScriptHierarchyNode key={index} blockId={blockId} node={child} path={[...path, index]} level={level + 1} selectedAddresses={selectedAddresses} editableAddress={editableAddress} activeMatch={activeMatch} onSelect={onSelect} onChange={onChange} onDrop={onDrop} onDialogueCursor={onDialogueCursor} resolveAssetUrl={resolveAssetUrl} />)}</div>}
			</div>
		</article>;
	}

	return <article id={scriptNodeDomId(address)} className={wrapperClass} data-level={level} data-search-active={isActiveMatch || undefined} onClick={select} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setDragOver(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false); }} onDrop={handleDrop}>
		{dragHandle}
		{editable ? <EditableContent node={node} onChange={(value) => onChange(path, value)} onDialogueCursor={(offset) => onDialogueCursor(address, offset)} resolveAssetUrl={resolveAssetUrl} /> : <ReadOnlyContent node={node} path={path} selected={new Set()} highlight={isActiveMatch && activeMatch ? activeMatch : undefined} onToggle={(_path, _descendants, modifiers) => onSelect(address, Boolean(modifiers?.shiftKey))} resolveAssetUrl={resolveAssetUrl} />}
		{dialogueCopyActions}
	</article>;
}

export function ScriptBlockView({ block, selectedAddresses, editableAddress, activeMatch, onSelect, onChange, onDrop, onDialogueCursor, resolveAssetUrl }: Omit<ScriptHierarchyNodeProps, "blockId" | "node" | "path" | "level"> & { block: ScriptBlock }) {
	return <ScriptHierarchyNode blockId={block.id} node={block.node} path={[]} level={1} selectedAddresses={selectedAddresses} editableAddress={editableAddress} activeMatch={activeMatch} onSelect={onSelect} onChange={onChange} onDrop={onDrop} onDialogueCursor={onDialogueCursor} resolveAssetUrl={resolveAssetUrl} />;
}
