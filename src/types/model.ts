import React from "react";

export interface DocTool {
    id: string;
    title: string;
    type: "doc" | "tool";
    category: string;
    content: string;
    tags?: string[];
    component?: React.FC; // Add component property
}

export interface SearchableDoc {
    id: string;
    title: string;
    type: "doc" | "tool";
    category: string;
    content: string;
    tags?: string[];
    path: string[];
}

export interface TreeNode {
    id: string;
    component?: React.FC;
    label?: string;
    type?: "doc" | "tool";
    children?: TreeNode[];
}

export interface TOCItem {
    id: string;
    text: string;
    level: number;
    index: number;
    path: string; // Added path for context
}
export interface ScrollbarStyle {
    id: string;
    name: string;
    description: string;
    className: string;
    preview: string;
}

export interface ThemeConfig {
    id: string;
    name: string;
    background: {
        image: string;
        overlay?: string;
        position?: string;
        size?: string;
        repeat?: string;
    };
    music: {
        path: string;
        volume?: number;
        fadeInDuration?: number;
    };
}

export interface ThemeContextType {
    currentTheme: ThemeConfig;
    themes: Record<string, ThemeConfig>;
    setTheme: (themeId: string) => void;
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
    musicPlaying: boolean;
    currentScrollbarStyle: ScrollbarStyle;
    scrollbarStyles: ScrollbarStyle[];
    setScrollbarStyle: (styleId: string) => void;
}

