import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Badge, Button, Menu, Modal, NavLink, Paper, SegmentedControl, Select, Textarea, TextInput, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconCheck, IconChevronDown, IconChevronRight, IconCopy, IconFilePlus, IconGripVertical, IconMapPin, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import "./App.css";

type JsonNode = Record<string, unknown> & { type?: string };

interface MissionEntry {
	name: string;
	link: string;
	type?: "ex";
	sourceFile?: string;
	dataFile?: string;
	children?: MissionEntry[];
}

type MissionIndex = Record<string, Record<string, MissionEntry[]>>;

interface MissionRef extends MissionEntry {
	category: string;
	location: string;
	series: string;
	dataFile: string;
}

interface MissionDocument {
	mission: Record<string, unknown> & { name?: string };
	content: JsonNode[];
	source?: Record<string, unknown>;
}

interface ScriptBlock {
	id: string;
	source?: {
		mission: string;
		dataFile: string;
		contentIndex: number;
		contentPath?: Array<string | number>;
	};
	node: JsonNode;
}

type NodePath = Array<string | number>;

interface ScriptNodeAddress {
	blockId: string;
	path: number[];
}

type SearchMode = "gender" | "trailblazer-reference";

interface ScriptTextMatch {
	address: ScriptNodeAddress;
	field: "text" | "title" | "content" | "subtitle";
	start: number;
	end: number;
	term: string;
	replacement?: string;
}

interface SelectionModifiers {
	shiftKey?: boolean;
	additive?: boolean;
	forceSelect?: boolean;
	forceDeselect?: boolean;
}

interface ScreenplayDocument {
	schemaVersion: 2;
	id: string;
	title: string;
	chapter: string;
	characters: {
		visible: string[];
		hidden: string[];
	};
	createdAt: string;
	updatedAt: string;
	blocks: ScriptBlock[];
}

interface ScreenplaySummary {
	name: string;
	id: string;
	title: string;
	chapter: string;
	characters: string[];
	blockCount: number;
	updatedAt: string;
	invalid?: boolean;
}

interface BootstrapResponse {
	index: MissionIndex;
	screenplays: ScreenplaySummary[];
}

const AUTO_SAVE_INTERVAL_MS = 10_000;

const nodeLabels: Record<string, string> = {
	dialogue: "对话",
	narration: "叙述",
	section: "标题",
	choice: "选项",
	divider: "分隔",
	fold: "折叠内容",
	"objective-description": "任务提示",
	message: "短信",
	"message-thread-start": "短信开始",
	"message-thread-end": "短信结束",
	"message-system": "短信系统提示",
	text: "文本",
	notice: "提示",
	note: "注释",
	image: "图片",
	tabs: "条件分支",
	spoiler: "剧透文本",
	annotation: "标注",
	"list-item": "列表项",
	event: "事件",
	style: "样式",
};

const newNodeTemplates: Record<string, JsonNode> = {
	dialogue: { type: "dialogue", speaker: "", text: "" },
	narration: { type: "narration", text: "" },
	section: { type: "section", level: 2, title: "新章节" },
	choice: {
		type: "choice",
		presentation: "dialogue",
		options: [{ id: 1, text: "新选项", content: [] }],
	},
	divider: { type: "divider" },
	note: { type: "note", text: "" },
	text: { type: "text", text: "" },
};

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function findRubyMarkerEnd(text: string, start: number) {
	let depth = 0;
	for (let index = start; index < text.length - 1; index += 1) {
		if (text.startsWith("{{", index)) { depth += 1; index += 1; continue; }
		if (text.startsWith("}}", index)) {
			depth -= 1;
			if (depth === 0) return index + 2;
			index += 1;
		}
	}
	return -1;
}

function splitRubyMarker(body: string) {
	let depth = 0;
	for (let index = 0; index < body.length; index += 1) {
		if (body.startsWith("{{", index)) { depth += 1; index += 1; continue; }
		if (body.startsWith("}}", index) && depth > 0) { depth -= 1; index += 1; continue; }
		if (body[index] === "|" && depth === 0) return [body.slice(0, index), body.slice(index + 1)] as const;
	}
	return null;
}

function markdownLinkAt(text: string, start: number) {
	if (text[start] !== "[") return null;
	const labelEnd = text.indexOf("](", start + 1);
	if (labelEnd < 0) return null;
	let depth = 1;
	let cursor = labelEnd + 2;
	for (; cursor < text.length; cursor += 1) {
		if (text[cursor] === "(") depth += 1;
		else if (text[cursor] === ")") {
			depth -= 1;
			if (depth === 0) break;
		}
	}
	if (depth !== 0) return null;
	const url = text.slice(labelEnd + 2, cursor);
	if (!/^https?:\/\/\S+$/iu.test(url)) return null;
	return { start, end: cursor + 1, label: text.slice(start + 1, labelEnd), url };
}

function nextMarkdownLink(text: string, from: number) {
	for (let start = text.indexOf("[", from); start >= 0; start = text.indexOf("[", start + 1)) {
		const link = markdownLinkAt(text, start);
		if (link) return link;
	}
	return null;
}

function InlineRubyText({ text }: { text: string }) {
	const output: React.ReactNode[] = [];
	let cursor = 0;
	while (cursor < text.length) {
		const rubyStart = text.indexOf("{{", cursor);
		const link = nextMarkdownLink(text, cursor);
		if (link && (rubyStart < 0 || link.start < rubyStart)) {
			if (link.start > cursor) output.push(text.slice(cursor, link.start));
			output.push(<a className="inline-link" href={link.url} target="_blank" rel="noreferrer" key={`link-${link.start}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><InlineRubyText text={link.label} /></a>);
			cursor = link.end;
			continue;
		}
		if (rubyStart < 0) { output.push(text.slice(cursor)); break; }
		if (rubyStart > cursor) output.push(text.slice(cursor, rubyStart));
		const end = findRubyMarkerEnd(text, rubyStart);
		if (end < 0) { output.push(text.slice(rubyStart)); break; }
		const parts = splitRubyMarker(text.slice(rubyStart + 2, end - 2));
		if (!parts) output.push(text.slice(rubyStart, end));
		else output.push(<ruby className="inline-ruby" key={`${rubyStart}-${end}`}><InlineRubyText text={parts[0]} /><rt><InlineRubyText text={parts[1]} /></rt></ruby>);
		cursor = end;
	}
	return <>{output}</>;
}

function HighlightedRichText({ text, highlight }: { text: string; highlight?: { start: number; end: number } }) {
	if (!highlight || highlight.start < 0 || highlight.end <= highlight.start) return <InlineRubyText text={text} />;
	return <><InlineRubyText text={text.slice(0, highlight.start)} /><mark className="search-match-highlight"><InlineRubyText text={text.slice(highlight.start, highlight.end)} /></mark><InlineRubyText text={text.slice(highlight.end)} /></>;
}

function plainRubyText(text: string) {
	let output = "";
	let cursor = 0;
	while (cursor < text.length) {
		const start = text.indexOf("{{", cursor);
		if (start < 0) return output + text.slice(cursor);
		output += text.slice(cursor, start);
		const end = findRubyMarkerEnd(text, start);
		if (end < 0) return output + text.slice(start);
		const parts = splitRubyMarker(text.slice(start + 2, end - 2));
		output += parts ? plainRubyText(parts[0]) : text.slice(start, end);
		cursor = end;
	}
	return output;
}

function collectRubyAnnotations(text: string) {
	const annotations: string[] = [];
	let cursor = 0;
	while (cursor < text.length) {
		const start = text.indexOf("{{", cursor);
		if (start < 0) break;
		const end = findRubyMarkerEnd(text, start);
		if (end < 0) break;
		const parts = splitRubyMarker(text.slice(start + 2, end - 2));
		if (parts) {
			annotations.push(plainRubyText(parts[1]));
			annotations.push(...collectRubyAnnotations(parts[0]), ...collectRubyAnnotations(parts[1]));
		}
		cursor = end;
	}
	return annotations.filter(Boolean);
}

async function copyToClipboard(text: string) {
	await navigator.clipboard.writeText(text);
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	const payload = (await response.json()) as T & { error?: string };
	if (!response.ok) throw new Error(payload.error ?? `请求失败：${response.status}`);
	return payload;
}

function nodeLabel(node: JsonNode) {
	return nodeLabels[String(node.type ?? "")] ?? String(node.type ?? "未知节点");
}

function nodeSummary(node: JsonNode) {
	if (typeof node.title === "string") return node.title;
	if (typeof node.text === "string") return node.text;
	if (typeof node.content === "string") return node.content;
	if (node.type === "choice" && Array.isArray(node.options)) return `${node.options.length} 个选项`;
	if (node.type === "tabs" && Array.isArray(node.tabs)) return `${node.tabs.length} 个条件分支`;
	if (node.type === "fold" && Array.isArray(node.content)) return `${node.content.length} 段折叠内容`;
	if (typeof node.file === "string") return node.file;
	return "";
}

function expandChoiceOption(option: JsonNode): JsonNode[] {
	const playerLine: JsonNode = { type: "dialogue", speaker: "开拓者", text: String(option.text ?? "") };
	const replies = Array.isArray(option.content) ? (option.content as JsonNode[]).flatMap(expandDialogueChoices) : [];
	return [playerLine, ...replies];
}

function expandDialogueChoices(node: JsonNode): JsonNode[] {
	if (node.type === "choice" && Array.isArray(node.options)) {
		return (node.options as JsonNode[]).flatMap(expandChoiceOption);
	}
	const next = clone(node);
	if (Array.isArray(next.content)) next.content = (next.content as JsonNode[]).flatMap(expandDialogueChoices);
	if (Array.isArray(next.tabs)) {
		next.tabs = (next.tabs as JsonNode[]).map((tab) => ({
			...tab,
			...(Array.isArray(tab.content) ? { content: (tab.content as JsonNode[]).flatMap(expandDialogueChoices) } : {}),
		}));
	}
	return [next];
}

function normalizeScriptBlocks(blocks: ScriptBlock[]) {
	let changed = false;
	const normalized = blocks.flatMap((block) => {
		const nodes = expandDialogueChoices(block.node);
		if (nodes.length !== 1 || JSON.stringify(nodes[0]) !== JSON.stringify(block.node)) changed = true;
		return nodes.map((node, index) => ({ ...block, id: index === 0 ? block.id : crypto.randomUUID(), node }));
	});
	return { blocks: normalized, changed };
}

function scanDialogueSpeakers(blocks: ScriptBlock[]) {
	const speakers: string[] = [];
	const seen = new Set<string>();
	const visit = (node: JsonNode) => {
		if (node.type === "dialogue" && typeof node.speaker === "string") {
			const speaker = plainRubyText(node.speaker).trim();
			if (speaker && !seen.has(speaker)) { seen.add(speaker); speakers.push(speaker); }
		}
		if (Array.isArray(node.content)) (node.content as JsonNode[]).forEach(visit);
		if (Array.isArray(node.options)) (node.options as JsonNode[]).forEach((option) => { if (Array.isArray(option.content)) (option.content as JsonNode[]).forEach(visit); });
		if (Array.isArray(node.tabs)) (node.tabs as JsonNode[]).forEach((tab) => { if (Array.isArray(tab.content)) (tab.content as JsonNode[]).forEach(visit); });
	};
	blocks.forEach((block) => visit(block.node));
	return speakers;
}

function syncScreenplayCharacters(document: ScreenplayDocument) {
	const scanned = scanDialogueSpeakers(document.blocks);
	const hiddenSet = new Set(document.characters?.hidden ?? []);
	const hidden = scanned.filter((speaker) => hiddenSet.has(speaker));
	return { ...document, characters: { visible: scanned.filter((speaker) => !hiddenSet.has(speaker)), hidden } };
}

function collectScriptTextMatches(document: ScreenplayDocument | null, mode: SearchMode | null) {
	if (!document || !mode) return [];
	const matches: ScriptTextMatch[] = [];
	const genderPattern = /他\/她|她\/他|少年\/少女|少女\/少年/gu;
	const fields = ["text", "title", "content", "subtitle"] as const;
	const visit = (node: JsonNode, address: ScriptNodeAddress) => {
		for (const field of fields) {
			const value = node[field]; if (typeof value !== "string") continue;
			if (mode === "gender") {
				for (const match of value.matchAll(genderPattern)) {
					const term = match[0]; const start = match.index ?? 0;
					matches.push({ address, field, start, end: start + term.length, term, replacement: term.includes("少年") ? "少年" : "他" });
				}
			} else {
				for (let start = value.indexOf("开拓者"); start >= 0; start = value.indexOf("开拓者", start + 3)) matches.push({ address, field, start, end: start + 3, term: "开拓者" });
			}
		}
		if (Array.isArray(node.content)) (node.content as JsonNode[]).forEach((child, index) => visit(child, { blockId: address.blockId, path: [...address.path, index] }));
	};
	document.blocks.forEach((block) => visit(block.node, { blockId: block.id, path: [] }));
	return matches;
}

function replaceDialogueSpeaker(node: JsonNode, from: string, to: string): JsonNode {
	const next = { ...node };
	if (next.type === "dialogue" && typeof next.speaker === "string" && plainRubyText(next.speaker).trim() === from) next.speaker = to;
	if (Array.isArray(next.content)) next.content = (next.content as JsonNode[]).map((child) => replaceDialogueSpeaker(child, from, to));
	if (Array.isArray(next.options)) next.options = (next.options as JsonNode[]).map((option) => ({ ...option, ...(Array.isArray(option.content) ? { content: (option.content as JsonNode[]).map((child) => replaceDialogueSpeaker(child, from, to)) } : {}) }));
	if (Array.isArray(next.tabs)) next.tabs = (next.tabs as JsonNode[]).map((tab) => ({ ...tab, ...(Array.isArray(tab.content) ? { content: (tab.content as JsonNode[]).map((child) => replaceDialogueSpeaker(child, from, to)) } : {}) }));
	return next;
}

function pathKey(path: NodePath) {
	return JSON.stringify(path);
}

function childNodePaths(node: JsonNode, path: NodePath): Array<{ node: JsonNode; path: NodePath }> {
	if (Array.isArray(node.content)) {
		return (node.content as JsonNode[]).map((child, index) => ({ node: child, path: [...path, "content", index] }));
	}
	if (node.type === "choice" && Array.isArray(node.options)) {
		return (node.options as JsonNode[]).flatMap((option, optionIndex) => Array.isArray(option.content)
			? (option.content as JsonNode[]).map((child, childIndex) => ({ node: child, path: [...path, "options", optionIndex, "content", childIndex] }))
			: []);
	}
	if (node.type === "tabs" && Array.isArray(node.tabs)) {
		return (node.tabs as JsonNode[]).flatMap((tab, tabIndex) => Array.isArray(tab.content)
			? (tab.content as JsonNode[]).map((child, childIndex) => ({ node: child, path: [...path, "tabs", tabIndex, "content", childIndex] }))
			: []);
	}
	return [];
}

function descendantNodePaths(node: JsonNode, path: NodePath) {
	const paths: NodePath[] = [];
	function visit(current: JsonNode, currentPath: NodePath) {
		if (current.type === "choice" && Array.isArray(current.options)) {
			(current.options as JsonNode[]).forEach((option, optionIndex) => {
				const optionPath = [...currentPath, "options", optionIndex] as NodePath;
				paths.push(optionPath);
				if (Array.isArray(option.content)) {
					(option.content as JsonNode[]).forEach((child, childIndex) => {
						const childPath = [...optionPath, "content", childIndex] as NodePath;
						paths.push(childPath);
						visit(child, childPath);
					});
				}
			});
			return;
		}
		for (const child of childNodePaths(current, currentPath)) {
			paths.push(child.path);
			visit(child.node, child.path);
		}
	}
	visit(node, path);
	return paths;
}

function collectNodePaths(nodes: JsonNode[]) {
	const paths: NodePath[] = [];
	function visit(node: JsonNode, path: NodePath) {
		paths.push(path);
		if (node.type === "choice" && Array.isArray(node.options)) {
			(node.options as JsonNode[]).forEach((option, optionIndex) => {
				const optionPath = [...path, "options", optionIndex] as NodePath;
				paths.push(optionPath);
				if (Array.isArray(option.content)) {
					(option.content as JsonNode[]).forEach((child, childIndex) => visit(child, [...optionPath, "content", childIndex]));
				}
			});
			return;
		}
		for (const child of childNodePaths(node, path)) visit(child.node, child.path);
	}
	nodes.forEach((node, index) => visit(node, [index]));
	return paths;
}

function nodeAtPath(nodes: JsonNode[], path: NodePath) {
	let value: unknown = nodes;
	for (const segment of path) {
		if ((typeof value !== "object" || value === null) && !Array.isArray(value)) return null;
		value = (value as Record<string | number, unknown>)[segment];
	}
	return value && typeof value === "object" && !Array.isArray(value) ? value as JsonNode : null;
}

function isAncestorPath(ancestor: NodePath, descendant: NodePath) {
	return ancestor.length < descendant.length && ancestor.every((segment, index) => segment === descendant[index]);
}

function nestedNodeAtPath(root: JsonNode, path: number[]) {
	let node = root;
	for (const index of path) {
		const content = Array.isArray(node.content) ? node.content as JsonNode[] : [];
		if (!content[index]) return null;
		node = content[index];
	}
	return node;
}

function updateNestedNode(root: JsonNode, path: number[], update: (node: JsonNode) => JsonNode): JsonNode {
	if (!path.length) return update(root);
	const [index, ...rest] = path;
	const content = Array.isArray(root.content) ? root.content as JsonNode[] : [];
	if (!content[index]) return root;
	return { ...root, content: content.map((child, childIndex) => childIndex === index ? updateNestedNode(child, rest, update) : child) };
}

function removeNestedNode(root: JsonNode, path: number[]): { root: JsonNode; node: JsonNode | null } {
	if (!path.length) return { root, node: null };
	const [index, ...rest] = path;
	const content = Array.isArray(root.content) ? root.content as JsonNode[] : [];
	if (!content[index]) return { root, node: null };
	if (!rest.length) return { root: { ...root, content: content.filter((_, childIndex) => childIndex !== index) }, node: content[index] };
	const removed = removeNestedNode(content[index], rest);
	return { root: { ...root, content: content.map((child, childIndex) => childIndex === index ? removed.root : child) }, node: removed.node };
}

function sameNumberPath(left: number[], right: number[]) {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameScriptAddress(left: ScriptNodeAddress, right: ScriptNodeAddress) {
	return left.blockId === right.blockId && sameNumberPath(left.path, right.path);
}

function scriptSiblingGroup(address: ScriptNodeAddress) {
	return address.path.length ? `${address.blockId}:${JSON.stringify(address.path.slice(0, -1))}` : "root";
}

function isNumberPathAncestor(ancestor: number[], descendant: number[]) {
	return ancestor.length < descendant.length && ancestor.every((value, index) => value === descendant[index]);
}

function adjustTargetPathAfterRemoval(target: number[], source: number[]) {
	if (!source.length) return target;
	const sourceParent = source.slice(0, -1);
	if (target.length < source.length || !sameNumberPath(target.slice(0, sourceParent.length), sourceParent)) return target;
	const targetIndex = target[sourceParent.length];
	const sourceIndex = source.at(-1)!;
	if (targetIndex <= sourceIndex) return target;
	const adjusted = [...target];
	adjusted[sourceParent.length] = targetIndex - 1;
	return adjusted;
}

function flattenMissions(index: MissionIndex) {
	const missions: MissionRef[] = [];
	for (const [category, locations] of Object.entries(index)) {
		for (const [location, seriesList] of Object.entries(locations)) {
			for (const series of seriesList) {
				const entries = series.children?.length ? series.children : [series];
				for (const entry of entries) {
					if (!entry.dataFile) continue;
					missions.push({ ...entry, category, location, series: series.name, dataFile: entry.dataFile });
				}
			}
		}
	}
	return missions;
}

function ReadOnlyNode({ node, path, selected, onToggle, depth = 0, highlight }: { node: JsonNode; path: NodePath; selected: Set<string>; onToggle: (path: NodePath, descendants?: NodePath[], modifiers?: SelectionModifiers) => void; depth?: number; highlight?: Pick<ScriptTextMatch, "field" | "start" | "end"> }) {
	const [foldCollapsed, setFoldCollapsed] = useState(Boolean(node.collapsed));
	const type = String(node.type ?? "");
	const content = Array.isArray(node.content) ? node.content as JsonNode[] : [];
	const options = Array.isArray(node.options) ? node.options as JsonNode[] : [];
	const tabs = Array.isArray(node.tabs) ? node.tabs as JsonNode[] : [];
	const summary = nodeSummary(node);
	const summaryField: ScriptTextMatch["field"] | null = typeof node.title === "string" ? "title" : typeof node.text === "string" ? "text" : typeof node.content === "string" ? "content" : null;
	const checked = selected.has(pathKey(path));
	const allDescendants = descendantNodePaths(node, path);
	const hasChildren = content.length > 0;
	const treeHasSelection = checked || allDescendants.some((descendant) => selected.has(pathKey(descendant)));
	const selectTree = allDescendants.length ? (event: React.MouseEvent) => { event.stopPropagation(); onToggle(path, allDescendants, { forceSelect: true }); } : undefined;
	const clearTree = allDescendants.length ? (event: React.MouseEvent) => { event.stopPropagation(); onToggle(path, allDescendants, { forceDeselect: true }); } : undefined;
	const clearButton = clearTree ? <ActionIcon className="clear-tree-button" variant="subtle" color="gray" size="xs" disabled={!treeHasSelection} aria-label={`清除${nodeLabel(node)}及全部子项的选择`} title="清除此块的全部选择" onClick={clearTree} onDoubleClick={(event) => event.stopPropagation()}><IconX size={13} /></ActionIcon> : null;

	if (type === "fold") {
		return (
			<div className={`read-node read-node-fold ${foldCollapsed ? "is-collapsed" : ""} ${checked ? "is-selected" : ""}`} data-depth={depth}>
				<div className="read-node-heading selectable-row" onClick={(event) => onToggle(path, [], { shiftKey: event.shiftKey, additive: event.ctrlKey || event.metaKey })} onDoubleClick={selectTree}><strong><HighlightedRichText text={String(node.title ?? "未命名折叠内容")} highlight={highlight?.field === "title" ? highlight : undefined} /></strong><ActionIcon className="fold-toggle-button" variant="subtle" color="gray" size="xs" aria-label={foldCollapsed ? "展开折叠内容" : "收起折叠内容"} title={foldCollapsed ? "展开" : "收起"} aria-expanded={!foldCollapsed} onClick={(event) => { event.stopPropagation(); setFoldCollapsed((current) => !current); }} onDoubleClick={(event) => event.stopPropagation()}>{foldCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}</ActionIcon>{clearButton}</div>
				{foldCollapsed ? null : <div className="read-node-children">{content.map((child, index) => <ReadOnlyNode key={index} node={child} path={[...path, "content", index]} selected={selected} onToggle={onToggle} depth={depth + 1} />)}</div>}
			</div>
		);
	}

	if (type === "choice") {
		return (
			<div className={`read-node read-node-choice ${checked ? "is-selected" : ""}`} data-depth={depth}>
				<div className="read-node-heading selectable-row" onClick={(event) => onToggle(path, [], { shiftKey: event.shiftKey, additive: event.ctrlKey || event.metaKey })} onDoubleClick={selectTree}><strong>{options.length} 个分支</strong>{clearButton}</div>
				<div className="read-choice-list">
					{options.map((option, optionIndex) => {
						const optionChildren = Array.isArray(option.content) ? option.content as JsonNode[] : [];
						const optionPath = [...path, "options", optionIndex] as NodePath;
						const optionDescendants = optionChildren.flatMap((child, childIndex) => {
							const childPath = [...optionPath, "content", childIndex] as NodePath;
							return [childPath, ...descendantNodePaths(child, childPath)];
						});
						const optionChecked = selected.has(pathKey(optionPath));
						const optionTreeSelected = optionChecked || optionDescendants.some((descendant) => selected.has(pathKey(descendant)));
						return <section className={`read-choice-option ${optionChecked ? "is-selected" : ""}`} key={optionIndex}><header className="selectable-row" onClick={(event) => onToggle(optionPath, optionDescendants, { shiftKey: event.shiftKey, additive: event.ctrlKey || event.metaKey })} onDoubleClick={(event) => { event.stopPropagation(); onToggle(optionPath, optionDescendants, { forceSelect: true }); }}><span>{optionIndex + 1}</span><strong><InlineRubyText text={String(option.text ?? "未命名选项")} /></strong><ActionIcon className="clear-tree-button" variant="subtle" color="gray" size="xs" disabled={!optionTreeSelected} aria-label={`清除选项：${String(option.text ?? "未命名选项")}及全部回应的选择`} title="清除此分支的全部选择" onClick={(event) => { event.stopPropagation(); onToggle(optionPath, optionDescendants, { forceDeselect: true }); }} onDoubleClick={(event) => event.stopPropagation()}><IconX size={13} /></ActionIcon></header><div className="read-node-children">{optionChildren.map((child, childIndex) => <ReadOnlyNode key={childIndex} node={child} path={[...optionPath, "content", childIndex]} selected={selected} onToggle={onToggle} depth={depth + 1} />)}</div></section>;
					})}
				</div>
			</div>
		);
	}

	if (type === "tabs") {
		return (
			<div className={`read-node read-node-tabs ${checked ? "is-selected" : ""}`} data-depth={depth}>
				<div className="read-node-heading selectable-row" onClick={(event) => onToggle(path, [], { shiftKey: event.shiftKey, additive: event.ctrlKey || event.metaKey })} onDoubleClick={selectTree}><strong>{tabs.length} 个条件分支</strong>{clearButton}</div>
				<div className="read-choice-list">{tabs.map((tab, tabIndex) => { const tabChildren = Array.isArray(tab.content) ? tab.content as JsonNode[] : []; return <section className="read-choice-option tab-option" key={tabIndex}><header><span>{tabIndex + 1}</span><strong><InlineRubyText text={String(tab.title ?? "未命名分支")} /></strong><em>{tabChildren.length} 段内容</em></header><div className="read-node-children">{tabChildren.map((child, childIndex) => <ReadOnlyNode key={childIndex} node={child} path={[...path, "tabs", tabIndex, "content", childIndex]} selected={selected} onToggle={onToggle} depth={depth + 1} />)}</div></section>; })}</div>
			</div>
		);
	}

	return (
		<div className={`read-node read-node-${type || "unknown"} ${hasChildren ? "has-children" : "is-leaf"} ${checked ? "is-selected" : ""}`} data-depth={depth} data-tone={typeof node.tone === "string" ? node.tone : undefined}>
			<div className="read-node-line selectable-row" onClick={(event) => onToggle(path, [], { shiftKey: event.shiftKey, additive: event.ctrlKey || event.metaKey })} onDoubleClick={selectTree}>
				{type === "objective-description" && typeof node.location === "string" && node.location ? <strong className="read-objective-location"><InlineRubyText text={node.location} /></strong> : null}
				{typeof node.speaker === "string" && node.speaker ? <strong className="read-speaker"><InlineRubyText text={node.speaker} /></strong> : null}
				<span className="read-text"><HighlightedRichText text={summary || "—"} highlight={summaryField && highlight?.field === summaryField ? highlight : undefined} /></span>
				{hasChildren ? clearButton : null}
			</div>
			{content.length ? <div className="read-node-children">{content.map((child, index) => <ReadOnlyNode key={index} node={child} path={[...path, "content", index]} selected={selected} onToggle={onToggle} depth={depth + 1} />)}</div> : null}
		</div>
	);
}

function SourceCard({ node, path, selected, onToggle }: { node: JsonNode; path: NodePath; selected: Set<string>; onToggle: (path: NodePath, descendants?: NodePath[], modifiers?: SelectionModifiers) => void }) {
	return (
		<div className="source-card">
			<ReadOnlyNode node={node} path={path} selected={selected} onToggle={onToggle} />
		</div>
	);
}

function EditableNode({ node, onChange, onDialogueCursor, depth = 0 }: { node: JsonNode; onChange: (node: JsonNode) => void; onDialogueCursor?: (offset: number) => void; depth?: number }) {
	const type = String(node.type ?? "text");
	const content = Array.isArray(node.content) ? node.content as JsonNode[] : [];
	const tabs = Array.isArray(node.tabs) ? node.tabs as JsonNode[] : [];
	const set = (key: string, value: unknown) => onChange({ ...node, [key]: value });
	const updateChild = (index: number, child: JsonNode) => set("content", content.map((item, itemIndex) => itemIndex === index ? child : item));
	const stop = (event: React.MouseEvent | React.PointerEvent) => event.stopPropagation();

	if (type === "fold") {
		return <div className="read-node read-node-fold inline-edit-node" data-depth={depth}><div className="read-node-heading"><input className="inline-heading-input" value={String(node.title ?? "")} placeholder="折叠标题" onPointerDown={stop} onClick={stop} onChange={(event) => set("title", event.target.value)} /></div><div className="read-node-children">{content.map((child, index) => <EditableNode key={index} node={child} depth={depth + 1} onChange={(value) => updateChild(index, value)} />)}<div className="inline-nested-actions" onPointerDown={stop} onClick={stop}><button onClick={() => set("content", [...content, clone(newNodeTemplates.dialogue)])}>＋ 对话</button><button onClick={() => set("content", [...content, clone(newNodeTemplates.text)])}>＋ 文本</button></div></div></div>;
	}

	if (type === "tabs") {
		return <div className="read-node read-node-tabs inline-edit-node" data-depth={depth}><div className="read-node-heading"><strong>{tabs.length} 个条件分支</strong></div><div className="read-choice-list">{tabs.map((tab, tabIndex) => { const children = Array.isArray(tab.content) ? tab.content as JsonNode[] : []; const updateTab = (value: JsonNode) => set("tabs", tabs.map((item, index) => index === tabIndex ? value : item)); return <section className="read-choice-option tab-option" key={tabIndex}><header><span>{tabIndex + 1}</span><input className="inline-option-input" value={String(tab.title ?? "")} placeholder="分支标题" onPointerDown={stop} onClick={stop} onChange={(event) => updateTab({ ...tab, title: event.target.value })} /><em>{children.length} 段内容</em></header><div className="read-node-children">{children.map((child, childIndex) => <EditableNode key={childIndex} node={child} depth={depth + 1} onChange={(value) => updateTab({ ...tab, content: children.map((item, index) => index === childIndex ? value : item) })} />)}</div></section>; })}</div></div>;
	}

	const hasChildren = content.length > 0;
	const textualKey = typeof node.text === "string" ? "text" : typeof node.content === "string" ? "content" : null;
	return <div className={`read-node read-node-${type || "unknown"} ${hasChildren ? "has-children" : "is-leaf"} inline-edit-node`} data-depth={depth} data-tone={typeof node.tone === "string" ? node.tone : undefined}>
		<div className="read-node-line">
			{type === "objective-description" ? <input className="inline-location-input" value={String(node.location ?? "")} placeholder="地点" onPointerDown={stop} onClick={stop} onChange={(event) => set("location", event.target.value)} /> : null}
			{type === "dialogue" ? <input className="inline-speaker-input" style={{ width: `${Math.max(3, Array.from(String(node.speaker ?? "")).length)}em` }} value={String(node.speaker ?? "")} placeholder="说话人" onPointerDown={stop} onClick={stop} onChange={(event) => set("speaker", event.target.value)} /> : null}
			{type === "section" ? <span className="read-text inline-title-wrap"><input className="inline-title-input" value={String(node.title ?? "")} placeholder="标题" onPointerDown={stop} onClick={stop} onChange={(event) => set("title", event.target.value)} /></span> : type === "message-thread-start" ? <div className="inline-thread-fields"><input value={String(node.title ?? "")} placeholder="联系人" onPointerDown={stop} onClick={stop} onChange={(event) => set("title", event.target.value)} /><input value={String(node.subtitle ?? "")} placeholder="签名" onPointerDown={stop} onClick={stop} onChange={(event) => set("subtitle", event.target.value)} /></div> : textualKey ? <textarea className="inline-textarea" rows={1} value={String(node[textualKey] ?? "")} placeholder="内容" onPointerDown={stop} onClick={(event) => { stop(event); if (type === "dialogue") onDialogueCursor?.(event.currentTarget.selectionStart); }} onSelect={(event) => { if (type === "dialogue") onDialogueCursor?.(event.currentTarget.selectionStart); }} onKeyUp={(event) => { if (type === "dialogue") onDialogueCursor?.(event.currentTarget.selectionStart); }} onChange={(event) => { set(textualKey, event.target.value); if (type === "dialogue") onDialogueCursor?.(event.currentTarget.selectionStart); }} /> : type === "image" ? <input className="inline-text-input" value={String(node.file ?? "")} placeholder="图片文件" onPointerDown={stop} onClick={stop} onChange={(event) => set("file", event.target.value)} /> : <span className="read-text">{nodeSummary(node) || "—"}</span>}
		</div>
		{content.length ? <div className="read-node-children">{content.map((child, index) => <EditableNode key={index} node={child} depth={depth + 1} onChange={(value) => updateChild(index, value)} />)}</div> : null}
	</div>;
}

function Field({ label, value, onChange, multiline = false, type = "text" }: { label: string; value: string | number; onChange: (value: string | number) => void; multiline?: boolean; type?: "text" | "number" }) {
	return (
		<label className="field">
			<span>{label}</span>
			{multiline ? (
				<textarea value={String(value)} onChange={(event) => onChange(event.target.value)} />
			) : (
				<input type={type} value={value} onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)} />
			)}
		</label>
	);
}

function NestedNodeList({ nodes, onChange }: { nodes: JsonNode[]; onChange: (nodes: JsonNode[]) => void }) {
	function update(index: number, node: JsonNode) {
		onChange(nodes.map((item, itemIndex) => itemIndex === index ? node : item));
	}
	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= nodes.length) return;
		const next = [...nodes];
		const [item] = next.splice(index, 1);
		next.splice(target, 0, item);
		onChange(next);
	}
	return (
		<div className="nested-node-list">
			{nodes.map((child, childIndex) => (
				<details className="nested-node" key={childIndex}>
					<summary>
						<span>{String(childIndex + 1).padStart(2, "0")}</span>
						<strong>{nodeLabel(child)}</strong>
						<em>{nodeSummary(child) || "空节点"}</em>
					</summary>
					<div className="nested-node-actions">
						<button disabled={childIndex === 0} onClick={() => move(childIndex, -1)}>上移</button>
						<button disabled={childIndex === nodes.length - 1} onClick={() => move(childIndex, 1)}>下移</button>
						<button className="danger-text" onClick={() => onChange(nodes.filter((_, index) => index !== childIndex))}>删除</button>
					</div>
					<VisualNodeFields node={child} onChange={(value) => update(childIndex, value)} />
				</details>
			))}
			<div className="nested-add-actions">
				<button onClick={() => onChange([...nodes, clone(newNodeTemplates.dialogue)])}>＋ 对话</button>
				<button onClick={() => onChange([...nodes, clone(newNodeTemplates.narration)])}>＋ 叙述</button>
				<button onClick={() => onChange([...nodes, clone(newNodeTemplates.choice)])}>＋ 选项</button>
			</div>
		</div>
	);
}

function VisualNodeFields({ node, onChange }: { node: JsonNode; onChange: (node: JsonNode) => void }) {
	const set = (key: string, value: unknown) => onChange({ ...node, [key]: value });
	const type = String(node.type ?? "text");
	return (
		<div className="visual-fields">
			<label className="field compact-field">
				<span>类型</span>
				<select value={type} onChange={(event) => set("type", event.target.value)}>
					{Object.entries(nodeLabels).map(([value, label]) => <option key={value} value={value}>{label} · {value}</option>)}
				</select>
			</label>
			{type === "dialogue" ? <><Field label="说话人" value={String(node.speaker ?? "")} onChange={(v) => set("speaker", v)} /><Field label="台词" value={String(node.text ?? "")} onChange={(v) => set("text", v)} multiline /></> : null}
			{["narration", "text", "notice", "note", "spoiler", "message-system"].includes(type) ? <Field label="内容" value={String(node.text ?? "")} onChange={(v) => set("text", v)} multiline /> : null}
			{type === "objective-description" ? <><Field label="地点" value={String(node.location ?? "")} onChange={(v) => set("location", v)} /><Field label="内容" value={String(node.text ?? "")} onChange={(v) => set("text", v)} multiline /></> : null}
			{type === "section" ? <><Field label="标题" value={String(node.title ?? "")} onChange={(v) => set("title", v)} /><Field label="层级" type="number" value={Number(node.level ?? 2)} onChange={(v) => set("level", v)} /></> : null}
			{type === "message-thread-start" ? <><Field label="联系人" value={String(node.title ?? "")} onChange={(v) => set("title", v)} /><Field label="签名" value={String(node.subtitle ?? "")} onChange={(v) => set("subtitle", v)} /></> : null}
			{type === "message" ? <><div className="field-row"><Field label="说话人" value={String(node.speaker ?? "")} onChange={(v) => set("speaker", v)} /><label className="field"><span>方向</span><select value={String(node.side ?? "left")} onChange={(event) => set("side", event.target.value)}><option value="left">对方</option><option value="right">开拓者</option></select></label></div><Field label="消息内容" value={String(node.text ?? node.content ?? "")} onChange={(v) => set("text", v)} multiline /></> : null}
			{type === "image" ? <><Field label="文件" value={String(node.file ?? "")} onChange={(v) => set("file", v)} /><Field label="显示宽度" value={String(node.displayWidth ?? "")} onChange={(v) => set("displayWidth", v)} /></> : null}
			{type === "annotation" ? <><Field label="分类" value={String(node.category ?? "")} onChange={(v) => set("category", v)} /><Field label="内容" value={String(node.text ?? "")} onChange={(v) => set("text", v)} multiline /><Field label="注释" value={String(node.note ?? "")} onChange={(v) => set("note", v)} multiline /></> : null}
			{type === "fold" ? <><Field label="折叠标题" value={String(node.title ?? "")} onChange={(v) => set("title", v)} /><label className="toggle-field"><input type="checkbox" checked={Boolean(node.collapsed)} onChange={(event) => set("collapsed", event.target.checked)} /> 默认收起</label><NestedNodeList nodes={Array.isArray(node.content) ? node.content as JsonNode[] : []} onChange={(value) => set("content", value)} /></> : null}
			{type === "choice" ? <div className="nested-groups">
				{(Array.isArray(node.options) ? node.options as JsonNode[] : []).map((option, optionIndex, options) => <section className="nested-group" key={optionIndex}><header><span>选项 {optionIndex + 1}</span><button onClick={() => set("options", options.filter((_, index) => index !== optionIndex))}>删除选项</button></header><Field label="选项文本" value={String(option.text ?? "")} onChange={(value) => set("options", options.map((item, index) => index === optionIndex ? { ...item, text: value } : item))} /><NestedNodeList nodes={Array.isArray(option.content) ? option.content as JsonNode[] : []} onChange={(value) => set("options", options.map((item, index) => index === optionIndex ? { ...item, content: value } : item))} /></section>)}
				<button className="nested-group-add" onClick={() => { const options = Array.isArray(node.options) ? node.options as JsonNode[] : []; set("options", [...options, { id: options.length + 1, text: "新选项", content: [] }]); }}>＋ 添加选项</button>
			</div> : null}
			{type === "tabs" ? <div className="nested-groups">
				{(Array.isArray(node.tabs) ? node.tabs as JsonNode[] : []).map((tab, tabIndex, tabs) => <section className="nested-group" key={tabIndex}><header><span>分支 {tabIndex + 1}</span><button onClick={() => set("tabs", tabs.filter((_, index) => index !== tabIndex))}>删除分支</button></header><Field label="分支标题" value={String(tab.title ?? "")} onChange={(value) => set("tabs", tabs.map((item, index) => index === tabIndex ? { ...item, title: value } : item))} /><NestedNodeList nodes={Array.isArray(tab.content) ? tab.content as JsonNode[] : []} onChange={(value) => set("tabs", tabs.map((item, index) => index === tabIndex ? { ...item, content: value } : item))} /></section>)}
				<button className="nested-group-add" onClick={() => { const tabs = Array.isArray(node.tabs) ? node.tabs as JsonNode[] : []; set("tabs", [...tabs, { id: tabs.length + 1, title: "新分支", content: [] }]); }}>＋ 添加分支</button>
			</div> : null}
			{type === "list-item" ? <><Field label="内容" value={String(node.text ?? "")} onChange={(v) => set("text", v)} multiline /><Field label="缩进层级" type="number" value={Number(node.depth ?? 0)} onChange={(v) => set("depth", v)} /></> : null}
		</div>
	);
}

function ScriptHierarchyNode({ blockId, node, path, level, selectedAddresses, editableAddress, activeMatch, onSelect, onChange, onDrop, onDialogueCursor }: { blockId: string; node: JsonNode; path: number[]; level: number; selectedAddresses: ScriptNodeAddress[]; editableAddress: ScriptNodeAddress | null; activeMatch: ScriptTextMatch | null; onSelect: (address: ScriptNodeAddress, shiftKey: boolean) => void; onChange: (path: number[], node: JsonNode) => void; onDrop: (target: ScriptNodeAddress, dragged: ScriptNodeAddress, nest: boolean) => void; onDialogueCursor: (address: ScriptNodeAddress, offset: number) => void }) {
	const [dragOver, setDragOver] = useState(false);
	const isFold = node.type === "fold";
	const address = { blockId, path };
	const selected = selectedAddresses.some((candidate) => sameScriptAddress(candidate, address));
	const editable = editableAddress ? sameScriptAddress(editableAddress, address) : false;
	const content = Array.isArray(node.content) ? node.content as JsonNode[] : [];
	const isActiveMatch = Boolean(activeMatch && sameScriptAddress(activeMatch.address, address));
	const containsActiveMatch = Boolean(activeMatch && activeMatch.address.blockId === blockId && path.length < activeMatch.address.path.length && path.every((value, index) => activeMatch.address.path[index] === value));
	const select = (event: React.MouseEvent) => {
		event.stopPropagation();
		if ((event.target as HTMLElement).closest(".selectable-row")) return;
		onSelect(address, event.shiftKey);
	};
	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault(); event.stopPropagation(); setDragOver(false);
		try { onDrop(address, JSON.parse(event.dataTransfer.getData("application/x-castorice-block")) as ScriptNodeAddress, isFold); } catch { /* ignore foreign drags */ }
	};
	const startDrag = (event: React.DragEvent) => {
		event.stopPropagation(); event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("application/x-castorice-block", JSON.stringify(address));
	};
	const dragHandle = <button type="button" className="block-drag-handle" draggable aria-label="拖动 block" title="拖动" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onDragStart={startDrag}><IconGripVertical size={15} /></button>;
	const dialogueText = node.type === "dialogue" ? String(node.text ?? "") : "";
	const annotations = dialogueText ? collectRubyAnnotations(dialogueText) : [];
	const dialogueCopyActions = node.type === "dialogue" ? <div className="dialogue-copy-actions" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>{annotations.length ? <ActionIcon className="annotation-copy-button" variant="subtle" color="gray" size="xs" aria-label="复制本段全部注音" title="复制全部注音" onClick={() => void copyToClipboard(annotations.join(" "))}><IconCopy size={11} /></ActionIcon> : null}<ActionIcon variant="subtle" color="gray" size="sm" aria-label="复制对话文本" title="复制对话文本" onClick={() => void copyToClipboard(plainRubyText(dialogueText))}><IconCopy size={14} /></ActionIcon></div> : null;
	const wrapperClass = `script-view-block script-level-${level} ${path.length ? "is-nested" : "is-root"} ${selected ? "is-selected" : ""} ${isActiveMatch ? "is-search-match" : ""} ${dragOver ? isFold ? "is-drop-target" : "is-insert-target" : ""}`;

	if (isFold) {
		const collapsed = Boolean(node.collapsed) && !containsActiveMatch;
		return <article className={wrapperClass} data-level={level} data-search-active={isActiveMatch || undefined} onClick={select} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; setDragOver(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false); }} onDrop={handleDrop}>
			{dragHandle}
			<div className={`read-node read-node-fold inline-edit-node ${collapsed ? "is-collapsed" : ""}`} data-depth={level - 1}>
				<div className="read-node-heading">{editable ? <input className="inline-heading-input" value={String(node.title ?? "")} placeholder="折叠标题" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange(path, { ...node, title: event.target.value })} /> : <strong><HighlightedRichText text={String(node.title ?? "未命名折叠内容")} highlight={isActiveMatch && activeMatch?.field === "title" ? activeMatch : undefined} /></strong>}<ActionIcon className="fold-toggle-button" variant="subtle" color="gray" size="xs" aria-label={collapsed ? "展开折叠内容" : "收起折叠内容"} title={collapsed ? "展开" : "收起"} aria-expanded={!collapsed} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onChange(path, { ...node, collapsed: !collapsed }); }}>{collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}</ActionIcon></div>
				{collapsed ? null : <div className="read-node-children">{content.map((child, index) => <ScriptHierarchyNode key={index} blockId={blockId} node={child} path={[...path, index]} level={level + 1} selectedAddresses={selectedAddresses} editableAddress={editableAddress} activeMatch={activeMatch} onSelect={onSelect} onChange={onChange} onDrop={onDrop} onDialogueCursor={onDialogueCursor} />)}</div>}
			</div>
		</article>;
	}

	return (
		<article className={wrapperClass} data-level={level} data-search-active={isActiveMatch || undefined} onClick={select} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setDragOver(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false); }} onDrop={handleDrop}>
			{dragHandle}
			{editable ? <EditableNode node={node} onChange={(value) => onChange(path, value)} onDialogueCursor={(offset) => onDialogueCursor(address, offset)} /> : <ReadOnlyNode node={node} path={path} selected={new Set()} highlight={isActiveMatch && activeMatch ? activeMatch : undefined} onToggle={(_path, _descendants, modifiers) => onSelect(address, Boolean(modifiers?.shiftKey))} />}
			{dialogueCopyActions}
		</article>
	);
}

function ScriptBlockView({ block, selectedAddresses, editableAddress, activeMatch, onSelect, onChange, onDrop, onDialogueCursor }: { block: ScriptBlock; selectedAddresses: ScriptNodeAddress[]; editableAddress: ScriptNodeAddress | null; activeMatch: ScriptTextMatch | null; onSelect: (address: ScriptNodeAddress, shiftKey: boolean) => void; onChange: (path: number[], node: JsonNode) => void; onDrop: (target: ScriptNodeAddress, dragged: ScriptNodeAddress, nest: boolean) => void; onDialogueCursor: (address: ScriptNodeAddress, offset: number) => void }) {
	return <ScriptHierarchyNode blockId={block.id} node={block.node} path={[]} level={1} selectedAddresses={selectedAddresses} editableAddress={editableAddress} activeMatch={activeMatch} onSelect={onSelect} onChange={onChange} onDrop={onDrop} onDialogueCursor={onDialogueCursor} />;
}

function App() {
	const [index, setIndex] = useState<MissionIndex>({});
	const [screenplays, setScreenplays] = useState<ScreenplaySummary[]>([]);
	const [missionFilter, setMissionFilter] = useState("");
	const [locationFilter, setLocationFilter] = useState("");
	const [selectedMission, setSelectedMission] = useState<MissionRef | null>(null);
	const [missionDocument, setMissionDocument] = useState<MissionDocument | null>(null);
	const [selectedSource, setSelectedSource] = useState<Set<string>>(new Set());
	const [activeFile, setActiveFile] = useState("");
	const [document, setDocument] = useState<ScreenplayDocument | null>(null);
	const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
	const [selectedNodePath, setSelectedNodePath] = useState<number[]>([]);
	const [multiSelectMode, setMultiSelectMode] = useState(false);
	const [multiSelected, setMultiSelected] = useState<ScriptNodeAddress[]>([]);
	const [dialogueCursor, setDialogueCursor] = useState<{ address: ScriptNodeAddress; offset: number } | null>(null);
	const [draggedScreenplay, setDraggedScreenplay] = useState<string | null>(null);
	const [importOpened, setImportOpened] = useState(false);
	const [importText, setImportText] = useState("");
	const [importMode, setImportMode] = useState<"plain" | "source">("plain");
	const [importLoading, setImportLoading] = useState(false);
	const [searchMode, setSearchMode] = useState<SearchMode | null>(null);
	const [searchMatches, setSearchMatches] = useState<ScriptTextMatch[]>([]);
	const [searchMatchIndex, setSearchMatchIndex] = useState(0);
	const [dirty, setDirty] = useState(false);
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const [error, setError] = useState("");
	const revision = useRef(0);
	const documentRef = useRef<ScreenplayDocument | null>(null);
	const activeFileRef = useRef("");
	const dirtyRef = useRef(false);
	const saveInFlight = useRef(false);
	const selectionAnchor = useRef<string | null>(null);
	const multiSelectionChanged = useRef(false);
	const scriptSelectionAnchor = useRef<ScriptNodeAddress | null>(null);
	const missions = useMemo(() => flattenMissions(index), [index]);
	const missionLocations = useMemo(() => [...new Set(missions.map((mission) => mission.location))], [missions]);
	const sourcePaths = useMemo(() => missionDocument ? collectNodePaths(missionDocument.content) : [], [missionDocument]);
	const filteredMissions = useMemo(() => {
		const needle = missionFilter.trim().toLowerCase();
		return missions.filter((mission) => {
			if (locationFilter && mission.location !== locationFilter) return false;
			return !needle || [mission.name, mission.series, mission.location, mission.category].join(" ").toLowerCase().includes(needle);
		});
	}, [locationFilter, missionFilter, missions]);
	const missionGroups = useMemo(() => {
		const locations = new Map<string, Map<string, MissionRef[]>>();
		for (const mission of filteredMissions) {
			if (!locations.has(mission.location)) locations.set(mission.location, new Map());
			const series = locations.get(mission.location)!;
			if (!series.has(mission.series)) series.set(mission.series, []);
			series.get(mission.series)!.push(mission);
		}
		return [...locations].map(([location, series]) => ({
			location,
			series: [...series].map(([name, entries]) => ({ name, entries })),
		}));
	}, [filteredMissions]);
	const selectedBlockIndex = document && selectedBlockId ? document.blocks.findIndex((block) => block.id === selectedBlockId) : -1;
	const selectedBlock = selectedBlockIndex >= 0 && document ? document.blocks[selectedBlockIndex] : null;
	const selectedNode = selectedBlock ? nestedNodeAtPath(selectedBlock.node, selectedNodePath) : null;
	const activeScriptSelection = multiSelectMode ? multiSelected : selectedBlockId ? [{ blockId: selectedBlockId, path: selectedNodePath }] : [];
	const editableAddress = !multiSelectMode && selectedBlockId ? { blockId: selectedBlockId, path: selectedNodePath } : null;
	const canFoldSelection = activeScriptSelection.length > 1 && activeScriptSelection.every((address) => scriptSiblingGroup(address) === scriptSiblingGroup(activeScriptSelection[0]));
	const mergeCandidates = document ? activeScriptSelection.map((address) => {
		const blockIndex = document.blocks.findIndex((block) => block.id === address.blockId);
		const block = document.blocks[blockIndex];
		return { address, node: block ? nestedNodeAtPath(block.node, address.path) : null, index: address.path.length ? address.path.at(-1)! : blockIndex };
	}) : [];
	const mergeIndexes = mergeCandidates.map((candidate) => candidate.index).sort((left, right) => left - right);
	const canMergeDialogues = canFoldSelection
		&& mergeCandidates.length > 1
		&& mergeCandidates.every((candidate) => candidate.node?.type === "dialogue" && candidate.node.speaker === mergeCandidates[0].node?.speaker)
		&& mergeIndexes.every((index, offset) => index === mergeIndexes[0] + offset);
	const canSplitDialogue = Boolean(selectedBlock && selectedNode?.type === "dialogue" && dialogueCursor && dialogueCursor.address.blockId === selectedBlock.id && sameNumberPath(dialogueCursor.address.path, selectedNodePath));
	const normalizedSearchIndex = searchMatches.length ? ((searchMatchIndex % searchMatches.length) + searchMatches.length) % searchMatches.length : 0;
	const activeSearchMatch = searchMatches[normalizedSearchIndex] ?? null;
	documentRef.current = document;
	activeFileRef.current = activeFile;
	dirtyRef.current = dirty;

	const saveCurrentDocument = useCallback(async () => {
		const current = documentRef.current;
		const file = activeFileRef.current;
		if (!current || !file || !dirtyRef.current || saveInFlight.current) return;
		const capturedRevision = revision.current;
		saveInFlight.current = true;
		setSaveState("saving");
		try {
			const saved = await requestJson<ScreenplayDocument>(`/editor-api/screenplay?name=${encodeURIComponent(file)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(current) });
			if (revision.current === capturedRevision && activeFileRef.current === file) {
				documentRef.current = saved; dirtyRef.current = false;
				setDocument(saved); setDirty(false); setSaveState("saved");
			} else if (activeFileRef.current === file) {
				setSaveState("idle");
			}
			setScreenplays(await requestJson<ScreenplaySummary[]>("/editor-api/screenplays"));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : String(reason)); setSaveState("error");
		} finally {
			saveInFlight.current = false;
		}
	}, []);

	useEffect(() => {
		void requestJson<BootstrapResponse>("/editor-api/bootstrap").then((payload) => { setIndex(payload.index); setScreenplays(payload.screenplays); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
	}, []);

	useEffect(() => {
		const timer = window.setInterval(() => void saveCurrentDocument(), AUTO_SAVE_INTERVAL_MS);
		return () => window.clearInterval(timer);
	}, [saveCurrentDocument]);

	useEffect(() => {
		if (!activeSearchMatch) return;
		const frame = window.requestAnimationFrame(() => window.document.querySelector<HTMLElement>('[data-search-active="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" }));
		return () => window.cancelAnimationFrame(frame);
	}, [activeSearchMatch]);

	useEffect(() => {
		function warnBeforeClose(event: BeforeUnloadEvent) { if (dirty) event.preventDefault(); }
		window.addEventListener("beforeunload", warnBeforeClose);
		return () => window.removeEventListener("beforeunload", warnBeforeClose);
	}, [dirty]);

	useEffect(() => {
		function keyDown(event: KeyboardEvent) {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
				event.preventDefault(); void saveCurrentDocument(); return;
			}
			if ((event.target as HTMLElement | null)?.closest("input, textarea, [contenteditable='true']")) return;
			if (event.key === "Shift" && !multiSelectMode) {
				multiSelectionChanged.current = false;
				setMultiSelectMode(true);
				const seed = selectedBlockId ? { blockId: selectedBlockId, path: selectedNodePath } : null;
				setMultiSelected(seed ? [seed] : []);
				scriptSelectionAnchor.current = seed;
			}
			if (event.key === "Escape" && multiSelectMode) {
				setMultiSelectMode(false); setMultiSelected([]); multiSelectionChanged.current = false; scriptSelectionAnchor.current = null;
			}
		}
		function keyUp(event: KeyboardEvent) {
			if ((event.target as HTMLElement | null)?.closest("input, textarea, [contenteditable='true']")) return;
			if (event.key === "Shift" && multiSelectMode && !multiSelectionChanged.current) {
				setMultiSelectMode(false); setMultiSelected([]); scriptSelectionAnchor.current = null;
			}
		}
		window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
		return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); };
	}, [multiSelectMode, saveCurrentDocument, selectedBlockId, selectedNodePath]);

	async function refreshScreenplays() { setScreenplays(await requestJson<ScreenplaySummary[]>("/editor-api/screenplays")); }
	function mutateDocument(update: (current: ScreenplayDocument) => ScreenplayDocument) { setDocument((current) => { if (!current) return current; const next = syncScreenplayCharacters(update(current)); documentRef.current = next; return next; }); revision.current += 1; dirtyRef.current = true; setDirty(true); setSaveState("idle"); }
	function exitMultiSelect() { setMultiSelectMode(false); setMultiSelected([]); multiSelectionChanged.current = false; scriptSelectionAnchor.current = null; }

	async function openMission(mission: MissionRef) {
		setSelectedMission(mission); setMissionDocument(null); setSelectedSource(new Set()); selectionAnchor.current = null; setError("");
		try { setMissionDocument(await requestJson<MissionDocument>(`/editor-api/mission?path=${encodeURIComponent(mission.dataFile)}`)); }
		catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
	}

	async function openScreenplay(name: string) {
		if (dirty && !window.confirm("当前修改尚未写入磁盘，仍要切换剧本吗？")) return;
		setError(""); exitMultiSelect(); setSearchMode(null); setSearchMatches([]); setSearchMatchIndex(0);
		try {
			const payload = await requestJson<ScreenplayDocument & { description?: string }>(`/editor-api/screenplay?name=${encodeURIComponent(name)}`);
			const normalized = normalizeScriptBlocks(Array.isArray(payload.blocks) ? payload.blocks : []);
			const fileId = name.replace(/\.(?:md|json)$/iu, "");
			const id = /^\d{3}$/u.test(payload.id) ? payload.id : /^\d{3}$/u.test(fileId) ? fileId : "";
			const base: ScreenplayDocument = { ...payload, schemaVersion: 2, id, title: payload.title === id ? "" : String(payload.title ?? ""), chapter: String(payload.chapter ?? payload.description ?? ""), characters: payload.characters && Array.isArray(payload.characters.hidden) ? payload.characters : { visible: [], hidden: [] }, blocks: normalized.blocks };
			const next = syncScreenplayCharacters(base);
			const changed = normalized.changed || payload.schemaVersion !== 2 || payload.id !== next.id || payload.title !== next.title || payload.chapter !== next.chapter || JSON.stringify(payload.characters) !== JSON.stringify(next.characters);
			setActiveFile(name); setDocument(next); setSelectedBlockId(null); setSelectedNodePath([]); setDirty(changed); setSaveState("idle"); revision.current = changed ? 1 : 0;
		} 
		catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
	}

	function closeScreenplay() {
		if (dirty && !window.confirm("当前修改尚未写入磁盘，仍要返回剧本列表吗？")) return;
		exitMultiSelect(); setSearchMode(null); setSearchMatches([]); setSearchMatchIndex(0); setActiveFile(""); setDocument(null); setSelectedBlockId(null); setSelectedNodePath([]); setDirty(false); setSaveState("idle");
	}

	async function createScreenplay() {
		const nextNumber = screenplays.reduce((maximum, item) => Math.max(maximum, Number(item.id) || 0), 0) + 1;
		const id = String(nextNumber).padStart(3, "0"); const name = `${id}.md`;
		const now = new Date().toISOString();
		const fresh: ScreenplayDocument = { schemaVersion: 2, id, title: "", chapter: "", characters: { visible: [], hidden: [] }, createdAt: now, updatedAt: now, blocks: [] };
		try {
			const saved = await requestJson<ScreenplayDocument>(`/editor-api/screenplay?name=${encodeURIComponent(name)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fresh) });
			setActiveFile(name); setDocument(saved); setSelectedBlockId(null); setSelectedNodePath([]); setDirty(false); setSaveState("saved"); await refreshScreenplays();
		} catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
	}

	function setCharacterHidden(character: string, hidden: boolean) {
		mutateDocument((current) => ({ ...current, characters: { visible: hidden ? current.characters.visible.filter((item) => item !== character) : [...current.characters.visible, character], hidden: hidden ? [...current.characters.hidden, character] : current.characters.hidden.filter((item) => item !== character) } }));
	}

	function convertTrailblazerSpeakers() {
		mutateDocument((current) => ({ ...current, blocks: current.blocks.map((block) => ({ ...block, node: replaceDialogueSpeaker(block.node, "开拓者", "穹") })) }));
	}

	function toggleScriptSearch(mode: SearchMode) {
		if (searchMode === mode) { setSearchMode(null); setSearchMatches([]); setSearchMatchIndex(0); return; }
		exitMultiSelect(); setSelectedBlockId(null); setSelectedNodePath([]); setDialogueCursor(null); setSearchMode(mode); setSearchMatches(collectScriptTextMatches(document, mode)); setSearchMatchIndex(0);
	}

	function navigateScriptSearch(direction: -1 | 1) {
		if (!searchMode) return;
		const previousMatch = activeSearchMatch;
		const refreshed = collectScriptTextMatches(document, searchMode);
		setSearchMatches(refreshed);
		if (!refreshed.length) { setSearchMatchIndex(0); return; }
		const exactIndex = previousMatch ? refreshed.findIndex((match) => sameScriptAddress(match.address, previousMatch.address) && match.field === previousMatch.field && match.start === previousMatch.start && match.term === previousMatch.term) : -1;
		if (exactIndex >= 0) setSearchMatchIndex((exactIndex + direction + refreshed.length) % refreshed.length);
		else if (direction > 0) setSearchMatchIndex(Math.min(normalizedSearchIndex, refreshed.length - 1));
		else setSearchMatchIndex((Math.min(normalizedSearchIndex, refreshed.length) - 1 + refreshed.length) % refreshed.length);
	}

	function replaceCurrentGenderMatch() {
		const match = activeSearchMatch; if (!match?.replacement || !document) return;
		const block = document.blocks.find((candidate) => candidate.id === match.address.blockId); if (!block) return;
		const node = nestedNodeAtPath(block.node, match.address.path); if (!node) return;
		const value = node[match.field]; if (typeof value !== "string") return;
		updateBlockNode(block.id, match.address.path, { ...node, [match.field]: `${value.slice(0, match.start)}${match.replacement}${value.slice(match.end)}` });
	}

	async function reorderScreenplayList(from: string, to: string) {
		if (from === to) return;
		const fromIndex = screenplays.findIndex((item) => item.name === from); const toIndex = screenplays.findIndex((item) => item.name === to);
		if (fromIndex < 0 || toIndex < 0) return;
		const next = [...screenplays]; const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); setScreenplays(next); setDraggedScreenplay(null);
		try { setScreenplays(await requestJson<ScreenplaySummary[]>("/editor-api/reorder-screenplays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((item) => item.name) }) })); }
		catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); await refreshScreenplays(); }
	}

	async function deleteScreenplay() {
		if (!activeFile || !window.confirm(`确定删除「${activeFile}」吗？此操作不可撤销。`)) return;
		try { await requestJson(`/editor-api/screenplay?name=${encodeURIComponent(activeFile)}`, { method: "DELETE" }); setActiveFile(""); setDocument(null); setSelectedBlockId(null); setSelectedNodePath([]); setDirty(false); await refreshScreenplays(); }
		catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
	}

	function toggleSource(path: NodePath, descendants: NodePath[] = [], modifiers: SelectionModifiers = {}) {
		const key = pathKey(path);
		setSelectedSource((current) => {
			if (modifiers.forceDeselect) {
				const next = new Set(current);
				next.delete(key);
				descendants.forEach((descendant) => next.delete(pathKey(descendant)));
				return next;
			}
			if (modifiers.forceSelect) {
				const next = new Set(current);
				next.add(key);
				descendants.forEach((descendant) => next.add(pathKey(descendant)));
				return next;
			}
			if (modifiers.shiftKey && selectionAnchor.current) {
				const anchorIndex = sourcePaths.findIndex((candidate) => pathKey(candidate) === selectionAnchor.current);
				const targetIndex = sourcePaths.findIndex((candidate) => pathKey(candidate) === key);
				if (anchorIndex >= 0 && targetIndex >= 0) {
					const from = Math.min(anchorIndex, targetIndex);
					const to = Math.max(anchorIndex, targetIndex);
					const next = modifiers.additive ? new Set(current) : new Set<string>();
					for (const rangePath of sourcePaths.slice(from, to + 1)) {
						next.add(pathKey(rangePath));
						const isOption = rangePath.length >= 3 && rangePath.at(-2) === "options" && typeof rangePath.at(-1) === "number";
						if (isOption) {
							sourcePaths.filter((candidate) => isAncestorPath(rangePath, candidate)).forEach((candidate) => next.add(pathKey(candidate)));
						}
					}
					descendants.forEach((descendant) => next.add(pathKey(descendant)));
					return next;
				}
			}
			const next = new Set(current);
			if (next.has(key)) {
				next.delete(key);
				descendants.forEach((descendant) => next.delete(pathKey(descendant)));
				for (const selectedKey of next) {
					const selectedPath = JSON.parse(selectedKey) as NodePath;
					if (isAncestorPath(selectedPath, path)) next.delete(selectedKey);
				}
			} else {
				for (const selectedKey of next) {
					const selectedPath = JSON.parse(selectedKey) as NodePath;
					if (isAncestorPath(selectedPath, path)) next.delete(selectedKey);
				}
				next.add(key);
				descendants.forEach((descendant) => next.add(pathKey(descendant)));
			}
			return next;
		});
		if (!modifiers.shiftKey || !selectionAnchor.current) selectionAnchor.current = key;
	}

	function appendSource(paths: NodePath[]) {
		if (!document || !missionDocument || !selectedMission) return;
		exitMultiSelect();
		const pathsWithoutDuplicateChildren = paths.filter((path) => !paths.some((candidate) => isAncestorPath(candidate, path)));
		const blocks = pathsWithoutDuplicateChildren.flatMap((path) => {
			const node = nodeAtPath(missionDocument.content, path);
			if (!node || typeof path[0] !== "number") return [];
			const isChoiceOption = path.length >= 3 && path.at(-2) === "options" && typeof path.at(-1) === "number";
			const expandedNodes = isChoiceOption ? expandChoiceOption(node) : expandDialogueChoices(node);
			return expandedNodes.map((expandedNode) => ({
				id: crypto.randomUUID(),
				source: {
					mission: selectedMission.name,
					dataFile: selectedMission.dataFile,
					contentIndex: path[0] as number,
					...(path.length > 1 ? { contentPath: path.slice(1) } : {}),
				},
				node: expandedNode,
			}));
		});
		mutateDocument((current) => ({ ...current, blocks: [...current.blocks, ...blocks] })); setSelectedSource(new Set()); selectionAnchor.current = null;
	}

	function insertScriptNodes(nodes: JsonNode[]) {
		if (!nodes.length) return;
		const templates = nodes.map(clone);
		setDialogueCursor(null); exitMultiSelect();
		if (!selectedBlock || !selectedNode) {
			const blocks = templates.map((node) => ({ id: crypto.randomUUID(), node }));
			mutateDocument((current) => ({ ...current, blocks: [...current.blocks, ...blocks] }));
			setSelectedBlockId(blocks.at(-1)!.id); setSelectedNodePath([]); return;
		}
		if (selectedNode.type === "fold") {
			const content = Array.isArray(selectedNode.content) ? selectedNode.content as JsonNode[] : [];
			updateBlockNode(selectedBlock.id, selectedNodePath, { ...selectedNode, content: [...content, ...templates] });
			setSelectedNodePath([...selectedNodePath, content.length + templates.length - 1]); return;
		}
		if (!selectedNodePath.length) {
			const blocksToInsert = templates.map((node) => ({ id: crypto.randomUUID(), node }));
			mutateDocument((current) => { const blocks = [...current.blocks]; blocks.splice(selectedBlockIndex + 1, 0, ...blocksToInsert); return { ...current, blocks }; });
			setSelectedBlockId(blocksToInsert.at(-1)!.id); setSelectedNodePath([]); return;
		}
		const parentPath = selectedNodePath.slice(0, -1); const index = selectedNodePath.at(-1)!;
		const parent = nestedNodeAtPath(selectedBlock.node, parentPath); if (!parent) return;
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		const next = [...siblings]; next.splice(index + 1, 0, ...templates);
		updateBlockNode(selectedBlock.id, parentPath, { ...parent, content: next });
		setSelectedNodePath([...parentPath, index + templates.length]);
	}
	function insertScriptNode(type: string) {
		insertScriptNodes([newNodeTemplates[type] ?? newNodeTemplates.text]);
	}
	function importScriptLines(type: "narration" | "dialogue") {
		const lines = importText.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
		if (!lines.length) return;
		insertScriptNodes(lines.map((text) => type === "dialogue" ? { type, speaker: "？？？", text } : { type, text }));
		setImportText(""); setImportOpened(false);
	}
	async function importWikitext() {
		if (!importText.trim()) return;
		setImportLoading(true); setError("");
		try {
			const parsed = await requestJson<{ content: JsonNode[] }>("/editor-api/parse-wikitext", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: importText }) });
			const nodes = parsed.content.flatMap(expandDialogueChoices);
			if (!nodes.length) throw new Error("没有从源代码中识别出可导入的内容");
			insertScriptNodes(nodes); setImportText(""); setImportOpened(false);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : String(reason));
		} finally {
			setImportLoading(false);
		}
	}
	function updateBlockNode(id: string, path: number[], node: JsonNode) { mutateDocument((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? { ...block, node: path.length ? updateNestedNode(block.node, path, () => node) : node } : block) })); }
	function scriptAddressRange(from: ScriptNodeAddress, to: ScriptNodeAddress) {
		if (!document || scriptSiblingGroup(from) !== scriptSiblingGroup(to)) return null;
		if (!from.path.length && !to.path.length) {
			const fromIndex = document.blocks.findIndex((block) => block.id === from.blockId);
			const toIndex = document.blocks.findIndex((block) => block.id === to.blockId);
			if (fromIndex < 0 || toIndex < 0) return null;
			return document.blocks.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1).map((block) => ({ blockId: block.id, path: [] }));
		}
		if (from.blockId !== to.blockId || !sameNumberPath(from.path.slice(0, -1), to.path.slice(0, -1))) return null;
		const fromIndex = from.path.at(-1)!; const toIndex = to.path.at(-1)!;
		const parentPath = from.path.slice(0, -1);
		const block = document.blocks.find((candidate) => candidate.id === from.blockId);
		const parent = block ? nestedNodeAtPath(block.node, parentPath) : null;
		const siblings = parent && Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		return siblings.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1).map((_, offset) => ({ blockId: from.blockId, path: [...parentPath, Math.min(fromIndex, toIndex) + offset] }));
	}
	function handleScriptSelect(address: ScriptNodeAddress, shiftKey: boolean) {
		setDialogueCursor(null);
		if (!multiSelectMode && !shiftKey) {
			setSelectedBlockId(address.blockId); setSelectedNodePath(address.path); scriptSelectionAnchor.current = address; return;
		}
		if (!multiSelectMode) setMultiSelectMode(true);
		multiSelectionChanged.current = true;
		const seed = multiSelectMode ? multiSelected : selectedBlockId ? [{ blockId: selectedBlockId, path: selectedNodePath }] : [];
		const range = shiftKey && scriptSelectionAnchor.current ? scriptAddressRange(scriptSelectionAnchor.current, address) : null;
		const sameGroup = !seed.length || scriptSiblingGroup(seed[0]) === scriptSiblingGroup(address);
		const base = sameGroup ? seed : [];
		const existing = base.findIndex((candidate) => sameScriptAddress(candidate, address));
		const next = range ?? (existing >= 0 ? base.filter((_, index) => index !== existing) : [...base, address]);
		setMultiSelected(next);
		setSelectedBlockId(address.blockId); setSelectedNodePath(address.path);
		if (!shiftKey || !scriptSelectionAnchor.current || !range) scriptSelectionAnchor.current = address;
	}
	function dissolveSelectedFold() {
		if (!selectedBlock || !selectedNode || selectedNode.type !== "fold" || activeScriptSelection.length !== 1) return;
		const content = Array.isArray(selectedNode.content) ? selectedNode.content as JsonNode[] : [];
		setDialogueCursor(null); exitMultiSelect();
		if (!selectedNodePath.length) {
			const newBlocks = content.map((node) => ({ id: crypto.randomUUID(), node: clone(node) }));
			mutateDocument((current) => { const blocks = current.blocks.filter((block) => block.id !== selectedBlock.id); blocks.splice(selectedBlockIndex, 0, ...newBlocks); return { ...current, blocks }; });
			setSelectedBlockId(newBlocks[0]?.id ?? null); setSelectedNodePath([]); return;
		}
		const parentPath = selectedNodePath.slice(0, -1); const index = selectedNodePath.at(-1)!;
		const parent = nestedNodeAtPath(selectedBlock.node, parentPath); if (!parent) return;
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		const next = [...siblings]; next.splice(index, 1, ...content.map(clone));
		updateBlockNode(selectedBlock.id, parentPath, { ...parent, content: next });
		setSelectedNodePath(content.length ? [...parentPath, index] : parentPath);
	}
	function foldSelectedNodes() {
		if (!canFoldSelection || !document) return;
		const title = "折叠内容";
		setDialogueCursor(null); exitMultiSelect();
		if (activeScriptSelection[0].path.length === 0) {
			const selectedIds = new Set(activeScriptSelection.map((address) => address.blockId));
			const selectedBlocks = document.blocks.filter((block) => selectedIds.has(block.id));
			const firstIndex = document.blocks.findIndex((block) => selectedIds.has(block.id));
			const id = crypto.randomUUID();
			const fold: ScriptBlock = { id, node: { type: "fold", title, content: selectedBlocks.map((block) => clone(block.node)) } };
			mutateDocument((current) => { const blocks = current.blocks.filter((block) => !selectedIds.has(block.id)); blocks.splice(firstIndex, 0, fold); return { ...current, blocks }; });
			setSelectedBlockId(id); setSelectedNodePath([]); return;
		}
		const block = document.blocks.find((candidate) => candidate.id === activeScriptSelection[0].blockId); if (!block) return;
		const parentPath = activeScriptSelection[0].path.slice(0, -1);
		const parent = nestedNodeAtPath(block.node, parentPath); if (!parent) return;
		const selectedIndexes = new Set(activeScriptSelection.map((address) => address.path.at(-1)!));
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		const firstIndex = Math.min(...selectedIndexes);
		const foldedContent = siblings.filter((_, index) => selectedIndexes.has(index)).map(clone);
		const next = siblings.filter((_, index) => !selectedIndexes.has(index));
		next.splice(firstIndex, 0, { type: "fold", title, content: foldedContent });
		updateBlockNode(block.id, parentPath, { ...parent, content: next });
		setSelectedBlockId(block.id); setSelectedNodePath([...parentPath, firstIndex]);
	}
	function mergeSelectedDialogues() {
		if (!canMergeDialogues || !document) return;
		const selection = [...activeScriptSelection];
		setDialogueCursor(null); exitMultiSelect();
		if (!selection[0].path.length) {
			const selectedIds = new Set(selection.map((address) => address.blockId));
			const selectedBlocks = document.blocks.filter((block) => selectedIds.has(block.id));
			const first = selectedBlocks[0]; if (!first) return;
			const firstIndex = document.blocks.findIndex((block) => block.id === first.id);
			const merged = { ...first, node: { ...first.node, text: selectedBlocks.map((block) => String(block.node.text ?? "")).join("") } };
			mutateDocument((current) => { const blocks = current.blocks.filter((block) => !selectedIds.has(block.id)); blocks.splice(firstIndex, 0, merged); return { ...current, blocks }; });
			setSelectedBlockId(first.id); setSelectedNodePath([]); return;
		}
		const block = document.blocks.find((candidate) => candidate.id === selection[0].blockId); if (!block) return;
		const parentPath = selection[0].path.slice(0, -1);
		const parent = nestedNodeAtPath(block.node, parentPath); if (!parent) return;
		const indexes = selection.map((address) => address.path.at(-1)!).sort((left, right) => left - right);
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		const firstIndex = indexes[0]; const first = siblings[firstIndex]; if (!first) return;
		const merged = { ...first, text: indexes.map((index) => String(siblings[index]?.text ?? "")).join("") };
		const next = [...siblings]; next.splice(firstIndex, indexes.length, merged);
		updateBlockNode(block.id, parentPath, { ...parent, content: next });
		setSelectedBlockId(block.id); setSelectedNodePath([...parentPath, firstIndex]);
	}
	function splitSelectedDialogue() {
		if (!selectedBlock || !selectedNode || selectedNode.type !== "dialogue" || !dialogueCursor || dialogueCursor.address.blockId !== selectedBlock.id || !sameNumberPath(dialogueCursor.address.path, selectedNodePath)) return;
		const text = String(selectedNode.text ?? "");
		const offset = Math.max(0, Math.min(dialogueCursor.offset, text.length));
		const first = { ...selectedNode, text: text.slice(0, offset).replace(/[，\s]+$/u, "") };
		const second = { ...clone(selectedNode), text: text.slice(offset).replace(/^[，\s]+/u, "") };
		setDialogueCursor(null);
		if (!selectedNodePath.length) {
			const id = crypto.randomUUID();
			mutateDocument((current) => { const blocks = [...current.blocks]; blocks[selectedBlockIndex] = { ...selectedBlock, node: first }; blocks.splice(selectedBlockIndex + 1, 0, { ...clone(selectedBlock), id, node: second }); return { ...current, blocks }; });
			setSelectedBlockId(id); setSelectedNodePath([]); return;
		}
		const parentPath = selectedNodePath.slice(0, -1); const index = selectedNodePath.at(-1)!;
		const parent = nestedNodeAtPath(selectedBlock.node, parentPath); if (!parent) return;
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		const next = [...siblings]; next.splice(index, 1, first, second);
		updateBlockNode(selectedBlock.id, parentPath, { ...parent, content: next });
		setSelectedNodePath([...parentPath, index + 1]);
	}
	function deleteSelectedNode() {
		if (activeScriptSelection.length > 1 && canFoldSelection && document) {
			const selection = [...activeScriptSelection]; exitMultiSelect(); setDialogueCursor(null);
			if (!selection[0].path.length) {
				const ids = new Set(selection.map((address) => address.blockId));
				mutateDocument((current) => ({ ...current, blocks: current.blocks.filter((block) => !ids.has(block.id)) }));
				setSelectedBlockId(null); setSelectedNodePath([]); return;
			}
			const block = document.blocks.find((candidate) => candidate.id === selection[0].blockId); if (!block) return;
			const parentPath = selection[0].path.slice(0, -1);
			const parent = nestedNodeAtPath(block.node, parentPath); if (!parent) return;
			const indexes = new Set(selection.map((address) => address.path.at(-1)!));
			const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
			updateBlockNode(block.id, parentPath, { ...parent, content: siblings.filter((_, index) => !indexes.has(index)) });
			setSelectedBlockId(block.id); setSelectedNodePath(parentPath); return;
		}
		if (!selectedBlock || !selectedNode) return;
		exitMultiSelect(); setDialogueCursor(null);
		if (!selectedNodePath.length) {
			const id = selectedBlock.id; setSelectedBlockId(null); setSelectedNodePath([]);
			mutateDocument((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== id) })); return;
		}
		const parentPath = selectedNodePath.slice(0, -1); const index = selectedNodePath.at(-1)!;
		const parent = nestedNodeAtPath(selectedBlock.node, parentPath); if (!parent) return;
		const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
		updateBlockNode(selectedBlock.id, parentPath, { ...parent, content: siblings.filter((_, childIndex) => childIndex !== index) });
		setSelectedNodePath(parentPath);
	}
	function moveScriptNode(targetAddress: ScriptNodeAddress, draggedAddress: ScriptNodeAddress, nest: boolean) {
		if (targetAddress.blockId === draggedAddress.blockId && (sameNumberPath(targetAddress.path, draggedAddress.path) || isNumberPathAncestor(draggedAddress.path, targetAddress.path))) return;
		exitMultiSelect();
		mutateDocument((current) => {
			let blocks = [...current.blocks];
			const sourceBlock = blocks.find((block) => block.id === draggedAddress.blockId);
			if (!sourceBlock) return current;
			let draggedNode: JsonNode | null = sourceBlock.node;
			let draggedTopBlock: ScriptBlock | null = null;
			if (!draggedAddress.path.length) {
				draggedTopBlock = sourceBlock;
				blocks = blocks.filter((block) => block.id !== sourceBlock.id);
			} else {
				const removed = removeNestedNode(sourceBlock.node, draggedAddress.path);
				draggedNode = removed.node;
				blocks = blocks.map((block) => block.id === sourceBlock.id ? { ...block, node: removed.root } : block);
			}
			if (!draggedNode) return current;
			const targetPath = targetAddress.blockId === draggedAddress.blockId ? adjustTargetPathAfterRemoval(targetAddress.path, draggedAddress.path) : targetAddress.path;
			const targetBlock = blocks.find((block) => block.id === targetAddress.blockId);
			if (!targetBlock) return current;
			const targetNode = nestedNodeAtPath(targetBlock.node, targetPath);
			if (!targetNode) return current;
			if (nest && targetNode.type === "fold") {
				const targetContent = Array.isArray(targetNode.content) ? targetNode.content as JsonNode[] : [];
				blocks = blocks.map((block) => block.id === targetBlock.id ? { ...block, node: updateNestedNode(block.node, targetPath, (node) => ({ ...node, content: [...targetContent, clone(draggedNode!)] })) } : block);
				return { ...current, blocks };
			}
			if (!targetPath.length) {
				const targetIndex = blocks.findIndex((block) => block.id === targetBlock.id);
				blocks.splice(targetIndex, 0, draggedTopBlock ?? { id: crypto.randomUUID(), node: clone(draggedNode) });
				return { ...current, blocks };
			}
			const parentPath = targetPath.slice(0, -1); const targetIndex = targetPath.at(-1)!;
			const parent = nestedNodeAtPath(targetBlock.node, parentPath); if (!parent) return current;
			const siblings = Array.isArray(parent.content) ? parent.content as JsonNode[] : [];
			const next = [...siblings]; next.splice(targetIndex, 0, clone(draggedNode));
			blocks = blocks.map((block) => block.id === targetBlock.id ? { ...block, node: updateNestedNode(block.node, parentPath, (node) => ({ ...node, content: next })) } : block);
			return { ...current, blocks };
		});
		setSelectedBlockId(targetAddress.blockId); setSelectedNodePath(targetAddress.path);
	}

	return (
		<div className="app-shell">
			<Modal opened={importOpened} onClose={() => setImportOpened(false)} title="导入文本" centered size="lg" overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}>
				<div className="text-import-dialog">
					<SegmentedControl fullWidth value={importMode} onChange={(value) => setImportMode(value as "plain" | "source")} data={[{ value: "plain", label: "普通文本" }, { value: "source", label: "BWiki 源代码" }]} />
					<Textarea autoFocus minRows={12} maxRows={20} autosize placeholder={importMode === "plain" ? "在这里粘贴文本，每个非空行会成为一个 block……" : "粘贴以 *角色：台词、{{剧情选项}}、{{任务描述}} 等组成的 BWiki 源代码……"} value={importText} onChange={(event) => setImportText(event.target.value)} />
					{importMode === "plain" ? <><p>空行会自动忽略。导入的对话默认使用“？？？”作为说话人。</p><div className="text-import-actions"><Button variant="light" disabled={!importText.trim()} onClick={() => importScriptLines("narration")}>导入为叙述</Button><Button disabled={!importText.trim()} onClick={() => importScriptLines("dialogue")}>导入为对话</Button></div></> : <><p>会识别对话、剧情选项、嵌套选项、标题、任务描述和常用文本模板。选项导入剧本后会自动拆成“开拓者”的对话及对应回应。</p><div className="text-import-actions"><Button loading={importLoading} disabled={!importText.trim()} onClick={() => void importWikitext()}>解析并导入</Button></div></>}
				</div>
			</Modal>
			<Paper component="header" radius={0} shadow="xs" className="topbar"><div className="brand"><span className="brand-mark">C</span><div><h1>Castorice 剧本编辑器</h1><p>星穹铁道任务资料 · 本地工作台</p></div></div><div className={`save-indicator ${saveState}`} title="每 10 秒自动保存；按 Ctrl+S 可立即保存"><span />{!activeFile ? "未打开剧本" : saveState === "saving" ? "正在保存…" : saveState === "error" ? "保存失败" : dirty ? "等待自动保存" : "已保存到本地"}</div></Paper>
			{error ? <div className="error-banner"><span>{error}</span><Button variant="subtle" color="red" size="compact-xs" onClick={() => setError("")}>关闭</Button></div> : null}
			<main className="workspace">
				<Paper component="section" shadow="sm" radius="md" className="source-pane">
					<aside className="mission-sidebar">
						<div className="pane-heading"><div><span className="eyebrow">只读资料</span><h2>任务库</h2></div><Badge variant="light" color="blue" size="sm">{missions.length}</Badge></div>
						<TextInput className="library-search" size="xs" radius="md" leftSection={<IconSearch size={14} />} placeholder="搜索任务、系列或地点" value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)} />
						<Select className="library-location" size="xs" radius="md" leftSection={<IconMapPin size={14} />} aria-label="按地点筛选" value={locationFilter} allowDeselect={false} onChange={(value) => setLocationFilter(value ?? "")} data={[{ value: "", label: "所有地点" }, ...missionLocations.map((location) => ({ value: location, label: location }))]} />
						<div className="mission-list">{missionGroups.length ? missionGroups.map((locationGroup) => <section className="mission-location" key={locationGroup.location}>
							<h3>{locationGroup.location}</h3>
							{locationGroup.series.map((series) => <div className="mission-series" key={series.name}>
								<h4>{series.name}</h4>
								{series.entries.map((mission) => <NavLink component="button" key={mission.dataFile} className="mission-item" active={selectedMission?.dataFile === mission.dataFile} variant="light" color="blue" title={`${mission.category} / ${mission.location} / ${mission.series} / ${mission.name}`} label={<span className="mission-name">{mission.name}{mission.type === "ex" ? <em>EX</em> : null}</span>} onClick={() => void openMission(mission)} />)}
							</div>)}
						</section>) : <p className="mission-empty">没有符合条件的任务</p>}</div>
					</aside>
					<div className="source-preview">
						{selectedMission ? <>
							<header className="preview-header"><div><span className="eyebrow">{selectedMission.category} / {selectedMission.location}</span><h2>{selectedMission.name}</h2><p>{selectedMission.series}</p></div><div className="preview-actions"><Button variant="light" color="gray" size="xs" leftSection={<IconFilePlus size={14} />} disabled={!document || !missionDocument} onClick={() => appendSource(missionDocument?.content.map((_, index) => [index] as NodePath) ?? [])}>整任务加入</Button><Button size="xs" leftSection={<IconCheck size={14} />} disabled={!document || selectedSource.size === 0} onClick={() => appendSource(sourcePaths.filter((path) => selectedSource.has(pathKey(path))))}>加入所选 {selectedSource.size ? `(${selectedSource.size})` : ""}</Button></div></header>
							<div className="selection-toolbar"><Button variant="subtle" size="compact-xs" onClick={() => { setSelectedSource(new Set(sourcePaths.map(pathKey))); selectionAnchor.current = null; }}>全选</Button><Button variant="subtle" color="gray" size="compact-xs" onClick={() => { setSelectedSource(new Set()); selectionAnchor.current = null; }}>清空</Button><small>Shift 连选 · 双击父项选择全部子项</small><Badge variant="light" color="gray" size="xs">{missionDocument ? `${sourcePaths.length} 个可选节点` : "正在读取…"}</Badge></div>
							<div className="source-cards">{missionDocument?.content.map((node, nodeIndex) => <SourceCard key={nodeIndex} node={node} path={[nodeIndex]} selected={selectedSource} onToggle={toggleSource} />)}</div>
						</> : <div className="empty-state"><span>←</span><h2>选择一个任务</h2><p>任务原始 JSON 始终保持只读。选择段落后，可复制到右侧剧本中独立修改。</p></div>}
					</div>
				</Paper>
				<Paper component="section" shadow="sm" radius="md" className="script-pane">
					{document ? <div className="script-editor">
						<header className="script-header"><ActionIcon className="back-to-library" variant="subtle" color="gray" size="lg" aria-label="返回剧本列表" title="返回剧本列表" onClick={closeScreenplay}><IconArrowLeft size={19} /></ActionIcon><div className="script-title-fields"><div className="script-title-row"><strong>{document.id}</strong><input className="title-input" placeholder="剧本标题" value={document.title} onChange={(event) => mutateDocument((current) => ({ ...current, title: event.target.value }))} /></div><input className="chapter-input" placeholder="篇章" value={document.chapter} onChange={(event) => mutateDocument((current) => ({ ...current, chapter: event.target.value }))} /><div className="character-manager"><span>人物</span>{document.characters.visible.length ? document.characters.visible.map((character) => <button key={character} title="点击隐藏" onClick={() => setCharacterHidden(character, true)}>{character}</button>) : <em>未检测到对话人</em>}{document.characters.hidden.length ? <Menu position="bottom-start" shadow="md" withinPortal><Menu.Target><button className="hidden-character-trigger">隐藏 {document.characters.hidden.length}</button></Menu.Target><Menu.Dropdown>{document.characters.hidden.map((character) => <Menu.Item key={character} onClick={() => setCharacterHidden(character, false)}>{character} · 恢复显示</Menu.Item>)}</Menu.Dropdown></Menu> : null}</div></div><div className="file-actions"><span>{activeFile}</span><button className="danger-text" onClick={() => void deleteScreenplay()}>删除</button></div></header>
						<div className={`block-toolbar ${multiSelectMode ? "is-multi-select" : ""}`}>
							<div className="block-toolbar-actions toolbar-main-actions">
								<Button variant="subtle" size="compact-sm" onClick={() => insertScriptNode("dialogue")}>添加对话</Button>
								<Button variant="subtle" size="compact-sm" onClick={() => insertScriptNode("narration")}>添加叙述</Button>
								<Button variant="subtle" size="compact-sm" onClick={() => insertScriptNode("section")}>添加标题</Button>
								<Menu position="bottom-start" shadow="md" withinPortal>
									<Menu.Target><Button variant="subtle" size="compact-sm">其他</Button></Menu.Target>
									<Menu.Dropdown><Menu.Item onClick={() => insertScriptNode("text")}>添加文本</Menu.Item><Menu.Item onClick={() => insertScriptNode("note")}>添加注释</Menu.Item><Menu.Item onClick={() => insertScriptNode("divider")}>添加分隔线</Menu.Item></Menu.Dropdown>
								</Menu>
								<Button variant="subtle" size="compact-sm" onClick={() => setImportOpened(true)}>导入</Button>
								<Button variant="subtle" size="compact-sm" onClick={convertTrailblazerSpeakers}>开拓者→穹</Button>
								<Button variant={searchMode === "gender" ? "light" : "subtle"} size="compact-sm" onClick={() => toggleScriptSearch("gender")}>性别优化</Button>
								<Button variant={searchMode === "trailblazer-reference" ? "light" : "subtle"} size="compact-sm" onClick={() => toggleScriptSearch("trailblazer-reference")}>开拓者指代优化</Button>
								<Button variant="subtle" color="orange" size="compact-sm" disabled={activeScriptSelection.length !== 1 || selectedNode?.type !== "fold"} onClick={dissolveSelectedFold}>解散</Button>
								<Button variant="subtle" size="compact-sm" disabled={!canFoldSelection} onClick={foldSelectedNodes}>折叠</Button>
								<Tooltip label={activeScriptSelection.length > 1 ? `删除选中的 ${activeScriptSelection.length} 个 block` : "删除当前节点"} color="red" withArrow><Button variant="subtle" color="red" size="compact-sm" disabled={!activeScriptSelection.length} onClick={deleteSelectedNode}>删除</Button></Tooltip>
								<Tooltip label="仅能合并同级、相连且说话人相同的对话" withArrow><Button variant="subtle" size="compact-sm" disabled={!canMergeDialogues} onClick={mergeSelectedDialogues}>合并</Button></Tooltip>
								<Tooltip label={selectedNode?.type === "dialogue" ? "在台词光标处拆成两段" : "仅对对话生效"} withArrow><Button variant="subtle" color="teal" size="compact-sm" disabled={multiSelectMode || !canSplitDialogue} onMouseDown={(event) => event.preventDefault()} onClick={splitSelectedDialogue}>分割</Button></Tooltip>
							</div>
							{multiSelectMode ? <div className="toolbar-selection multi-selection-status"><Badge variant="filled" color="blue" size="sm">多选</Badge><span>{multiSelected.length ? `已选择 ${multiSelected.length} 个同级 block` : "点击 block 开始选择"} · Esc 退出</span></div> : selectedNode ? <div className="toolbar-selection"><Badge variant="light" color="blue" size="sm">L{selectedNodePath.length + 1} · {nodeLabel(selectedNode)}</Badge><span><InlineRubyText text={nodeSummary(selectedNode) || "空节点"} /></span></div> : <span className="toolbar-hint">按住 Shift 进入多选</span>}
						</div>
						{searchMode ? <div className="script-search-bar"><strong>{searchMode === "gender" ? "性别优化" : "开拓者指代优化"}</strong><span className="script-search-term">{activeSearchMatch ? `“${activeSearchMatch.term}”` : "没有找到匹配内容"}</span><span className="script-search-count">{searchMatches.length ? `${normalizedSearchIndex + 1} / ${searchMatches.length}` : "0 / 0"}</span><Button variant="subtle" size="compact-xs" onClick={() => navigateScriptSearch(-1)}>上一个</Button><Button variant="subtle" size="compact-xs" onClick={() => navigateScriptSearch(1)}>下一个</Button>{searchMode === "gender" ? <Button size="compact-xs" disabled={!activeSearchMatch?.replacement} onClick={replaceCurrentGenderMatch}>替换为“{activeSearchMatch?.replacement ?? "—"}”</Button> : null}<Button variant="subtle" color="gray" size="compact-xs" onClick={() => { setSearchMode(null); setSearchMatches([]); setSearchMatchIndex(0); }}>关闭</Button></div> : null}
						<div className="script-blocks viewer-style">{document.blocks.length ? document.blocks.map((block) => <ScriptBlockView key={block.id} block={block} selectedAddresses={activeScriptSelection} editableAddress={editableAddress} activeMatch={activeSearchMatch} onSelect={handleScriptSelect} onChange={(path, node) => updateBlockNode(block.id, path, node)} onDrop={moveScriptNode} onDialogueCursor={(address, offset) => setDialogueCursor({ address, offset })} />) : <div className="empty-script"><span>＋</span><h3>这个剧本还是空的</h3><p>从左侧加入任务内容，或在上方创建一个空白节点。</p></div>}</div>
					</div> : <div className="screenplay-library"><header className="screenplay-library-header"><h2>剧本</h2><div className="screenplay-library-actions"><Badge variant="light" color="blue" size="lg">{screenplays.length} 个剧本</Badge><Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => void createScreenplay()}>新建</Button></div></header><div className="screenplay-list">{screenplays.length ? screenplays.map((item) => <div className={`screenplay-list-item ${draggedScreenplay === item.name ? "is-dragging" : ""}`} key={item.name} draggable onDragStart={(event) => { setDraggedScreenplay(item.name); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.name); }} onDragEnd={() => setDraggedScreenplay(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const from = draggedScreenplay ?? event.dataTransfer.getData("text/plain"); if (from) void reorderScreenplayList(from, item.name); }} role="button" tabIndex={0} onClick={() => void openScreenplay(item.name)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void openScreenplay(item.name); }}><IconGripVertical className="screenplay-list-grip" size={16} /><strong><b>{item.id || "---"}</b> {item.title || "未命名剧本"}</strong><small className="screenplay-chapter">{item.chapter || "未设置篇章"}</small><small className="screenplay-characters">{item.characters.length ? item.characters.join(" · ") : "暂无显示人物"}</small></div>) : <div className="empty-script"><span>✦</span><h3>还没有剧本</h3><p>点击右上角“新建”创建第一个剧本。</p></div>}</div></div>}
				</Paper>
			</main>
		</div>
	);
}

export default App;
