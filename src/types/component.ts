import type { ReactNode } from "react";
import type { DocTool, SearchableDoc, TOCItem, TreeNode } from "./model";

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

export interface BackgroundMusicPlayerProps {
    musicPath: string;
    isPlaying: boolean;
    retryInterval?: number; // in milliseconds
    volume?: number; // 0 to 1
    fadeInDuration?: number; // in milliseconds, default 10 seconds
    onPlayStateChange?: (playing: boolean) => void;
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

export interface ThemeSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
}

export interface DocSearchProps {
    isOpen: boolean;
    query: string;
    setQuery: (q: string) => void;
    onClose: () => void;
    results: SearchableDoc[];
    onResultClick: (docId: string) => void;
    searchableDocs: SearchableDoc[];
    isMobile: boolean;
}

export interface FloatingTOCProps {
    items: TOCItem[];
    isOpen: boolean;
    onClose: () => void;
}

export interface ThemeManagerProps {
    children: ReactNode;
    defaultTheme?: string;
}