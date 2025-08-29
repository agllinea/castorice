import type { ToCItem, TreeNode } from "../types/model";

// Generate table of contents from content
export const generateTOC = (content: string): ToCItem[] => {
    const headings = content.match(/^#{1,3}\s+(.+)$/gm) || [];
    return headings.map((heading, index) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, "");
        // Handle UTF-8 characters properly for IDs
        const id = text
            .toLowerCase()
            .normalize("NFD") // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
            .replace(/[^\w\s-]/g, "") // Remove special chars except spaces and hyphens
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Replace multiple hyphens with single
            .replace(/(^-|-$)/g, ""); // Remove leading/trailing hyphens
        return { level, text, id, index };
    });
};

// Convert appIndex TreeNode to navigation format with proper labels
export const convertToNavigationTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => ({
        ...node,
        label: node.label || node.id.replace(/\.md$/, ""), // Remove .md extension for display
        type: node.component ? "tool" : node.id.endsWith(".md") ? "doc" : undefined,
        children: node.children ? convertToNavigationTree(node.children) : undefined,
    }));
};

// Build path from appIndex structure
export const buildDocPath = (nodes: TreeNode[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const node of nodes) {
        const newPath = [...currentPath, node.id];

        if (node.id === targetId) {
            return newPath;
        }

        if (node.children) {
            const result = buildDocPath(node.children, targetId, newPath);
            if (result) {
                return result;
            }
        }
    }
    return null;
};

// Convert path to file path for markdown files
export const pathToFilePath = (path: string[]): string => {
    return path.join("/") + (path[path.length - 1].endsWith(".md") ? "" : ".md");
};

// Find node by path in appIndex
export const findNodeByPath = (nodes: TreeNode[], path: string[]): TreeNode | null => {
    if (path.length === 0) return null;

    let currentNodes = nodes;
    let targetNode: TreeNode | null = null;

    for (const pathSegment of path) {
        const foundNode = currentNodes.find((node) => node.id === pathSegment);
        if (!foundNode) {
            return null;
        }

        targetNode = foundNode;
        if (foundNode.children) {
            currentNodes = foundNode.children;
        }
    }

    return targetNode;
};
