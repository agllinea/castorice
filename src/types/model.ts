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
    level: number;
    text: string;
    id: string;
    index: number;
}
