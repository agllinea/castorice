import { IconArrowLeft } from "@tabler/icons-react";
import { BufferedInput } from "../../components/forms/BufferedFields";
import type { ScreenplayDocument } from "../../components/content/types";
import { ActionIcon, Button, MenuButton } from "../../components/ui";

interface ScreenplayMetaPanelProps {
	document: ScreenplayDocument;
	activeFile: string;
	compact?: boolean;
	showCharacters?: boolean;
	onBack: () => void;
	onTitleChange: (value: string) => void;
	onChapterChange: (value: string) => void;
	onCharacterHiddenChange: (character: string, hidden: boolean) => void;
	onDelete: () => void;
}

interface ScreenplayCharacterManagerProps {
	document: ScreenplayDocument;
	onCharacterHiddenChange: (character: string, hidden: boolean) => void;
	className?: string;
}

export function ScreenplayCharacterManager({ document, onCharacterHiddenChange, className = "" }: ScreenplayCharacterManagerProps) {
	return <div className={`character-manager ${className}`}><span>出场人物</span>{document.characters.visible.length ? document.characters.visible.map((character) => <Button key={character} size="compact-xs" variant="light" color="blue" title="从人物列表中隐藏" onClick={() => onCharacterHiddenChange(character, true)}>{character}</Button>) : <em>未识别到对话角色</em>}{document.characters.hidden.length ? <MenuButton className="hidden-character-menu" label={`已隐藏 ${document.characters.hidden.length}`} items={document.characters.hidden.map((character) => ({ label: `${character} · 恢复显示`, onClick: () => onCharacterHiddenChange(character, false) }))} /> : null}</div>;
}

export function ScreenplayMetaPanel({ document, activeFile, compact = false, showCharacters = true, onBack, onTitleChange, onChapterChange, onCharacterHiddenChange, onDelete }: ScreenplayMetaPanelProps) {
	return <header className={`script-header ${compact ? "is-compact" : ""}`}>
		<ActionIcon className="back-to-library" variant="subtle" color="gray" size={compact ? "sm" : "lg"} aria-label="返回剧本列表" title="返回剧本列表" onClick={onBack}><IconArrowLeft size={compact ? 16 : 19} /></ActionIcon>
		<div className="script-title-fields">
			<div className="script-title-row"><strong>{document.id}</strong><BufferedInput className="title-input" placeholder="剧本标题" value={document.title} onValueChange={onTitleChange} /></div>
			<BufferedInput className="chapter-input" placeholder="所属篇章（可选）" value={document.chapter} onValueChange={onChapterChange} />
			{showCharacters ? <ScreenplayCharacterManager document={document} onCharacterHiddenChange={onCharacterHiddenChange} /> : null}
		</div>
		<div className="file-actions"><span>{activeFile}</span><Button className="danger-text" variant="subtle" color="red" size="compact-xs" onClick={onDelete}>删除剧本</Button></div>
	</header>;
}
