import type { DocTool, TOCItem, TreeNode } from "./model";

export interface NavigatorProps {
    navigationTree: TreeNode[];
    currentDocId: string;
    expandedNodes: string[];
    isMobile: boolean;
    sidebarOpen: boolean;
    sidebarWidth: number;
    onDocSelect: (docId: string) => void;
    onToggleNode: (nodeId: string) => void;
    onCloseSidebar: () => void;
    onSidebarResize: (width: number) => void;
}

export interface TreeNodeComponentProps {
    node: TreeNode;
    level?: number;
    currentDocId: string;
    expandedNodes: string[];
    isMobile: boolean;
    onDocSelect: (docId: string) => void;
    onToggleNode: (nodeId: string) => void;
}

export interface ContentProps {
    currentDoc: DocTool | null;
    tableOfContents: TOCItem[];
    isMobile: boolean;
    loading?: boolean;
    onSidebarToggle?: () => void; // Callback for sidebar toggle
}

export interface FloatingTOCProps {
    items: TOCItem[];
    isOpen: boolean;
    onClose: () => void;
}