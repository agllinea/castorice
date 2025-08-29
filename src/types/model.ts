import React from "react";

const DocType = {
    Document: "doc",
    Tool: "tool",
} as const;

export type DocType = (typeof DocType)[keyof typeof DocType];

interface DocBase {
    id: string;
    title: string;
    type: DocType;
    category: string;
    content: string;
    tags?: string[];
}

export interface DocItem extends DocBase {
    component?: React.FC;
}

export interface SearchItem extends DocBase {
    path: string[];
}

export interface TreeNodeItem {
    id: string;
    component?: React.FC;
    label?: string;
    type?: DocType;
    children?: TreeNodeItem[];
}

export interface ToCItem {
    id: string;
    text: string;
    level: number;
    index: number;
    path: string;
}
