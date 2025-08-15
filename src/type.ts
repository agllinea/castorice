export interface DocTool {
	id: string;
	title: string;
	type: 'doc' | 'tool';
	category: string;
	content: string;
	tags?: string[];
}

export interface TreeNode {
	id: string;
    component?: React.FC;
	label?: string;
	type?: 'doc' | 'tool';
	children?: TreeNode[];
}

export interface TOCItem {
	level: number;
	text: string;
	id: string;
	index: number;
}
