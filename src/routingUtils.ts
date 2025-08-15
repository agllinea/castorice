import type { TreeNode } from "./type";

// URL-safe encoding for IDs that may contain UTF-8 characters
export const encodeDocId = (id: string): string => {
    return encodeURIComponent(id).replace(/[!'()*]/g, (c) => {
        return "%" + c.charCodeAt(0).toString(16);
    });
};

// Decode URL-safe IDs back to original
export const decodeDocId = (encodedId: string): string => {
    return decodeURIComponent(encodedId);
};

// Find the path to a document in the navigation tree
export const findDocPath = (tree: TreeNode[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const node of tree) {
        const newPath = [...currentPath, node.id];

        if (node.id === targetId) {
            return newPath;
        }

        if (node.children) {
            const result = findDocPath(node.children, targetId, newPath);
            if (result) {
                return result;
            }
        }
    }
    return null;
};

// Convert a document path to URL path
export const pathToUrl = (path: string[]): string => {
    return path.map(encodeDocId).join("/");
};

// Convert URL path to document path
export const urlToPath = (urlPath: string): string[] => {
    if (!urlPath || urlPath === "/") return [];
    return urlPath.split("/").filter(Boolean).map(decodeDocId);
};

// Get the document ID from a path (last item in the path)
export const getDocIdFromPath = (path: string[]): string | null => {
    return path.length > 0 ? path[path.length - 1] : null;
};

// Find a document by path in the navigation tree
export const findDocByPath = (tree: TreeNode[], path: string[]): TreeNode | null => {
    if (path.length === 0) return null;

    let currentNodes = tree;
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

// Get all parent IDs that should be expanded for a given path
export const getExpandedNodesForPath = (path: string[]): string[] => {
    const expandedNodes: string[] = [];

    // Add all parent nodes to expanded list (exclude the last item which is the document itself)
    for (let i = 0; i < path.length - 1; i++) {
        expandedNodes.push(path[i]);
    }

    return expandedNodes;
};

// Validate if a path exists in the navigation tree
export const isValidPath = (tree: TreeNode[], path: string[]): boolean => {
    return findDocByPath(tree, path) !== null;
};
