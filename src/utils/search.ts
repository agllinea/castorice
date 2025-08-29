import type { TreeNode, SearchItem } from "../types/model";

// Build searchable docs from navigation tree
export const buildSearchableDocs = (nodes: TreeNode[], parentPath: string[] = []): SearchItem[] => {
    const docs: SearchItem[] = [];

    const processNode = (node: TreeNode, currentPath: string[]) => {
        const fullPath = [...currentPath, node.id];

        if (node.component) {
            // For components, create a searchable entry with basic info
            docs.push({
                id: node.id,
                title: node.label || node.id,
                type: "tool",
                category: currentPath.length > 0 ? currentPath[0] : "Interactive Tool",
                content: `Interactive ${node.label || node.id} tool component`,
                tags: ["interactive", "tool", "component"],
                path: fullPath,
            });
        } else if (node.id.endsWith(".md") || (!node.children && !node.component)) {
            // For markdown files, create a searchable entry (content will be loaded when needed)
            docs.push({
                id: node.id,
                title: node.label || node.id.replace(/\.md$/, ""),
                type: "doc",
                category: currentPath.length > 0 ? currentPath[0] : "Documentation",
                content: "", // Content will be loaded when needed for better search
                tags: [],
                path: fullPath,
            });
        }

        if (node.children) {
            node.children.forEach((child) => processNode(child, fullPath));
        }
    };

    nodes.forEach((node) => processNode(node, parentPath));
    return docs;
};

// Enhanced search utility with better matching
export const searchDocs = (docs: SearchItem[], query: string): SearchItem[] => {
    if (!query) return [];

    const lowercaseQuery = query.toLowerCase();
    const queryWords = lowercaseQuery.split(" ").filter((word) => word.length > 0);

    return docs
        .map((doc) => {
            let score = 0;
            const titleLower = doc.title.toLowerCase();
            const categoryLower = doc.category.toLowerCase();
            const contentLower = doc.content.toLowerCase();

            // Title matches (highest priority)
            if (titleLower.includes(lowercaseQuery)) {
                score += 100;
            }
            queryWords.forEach((word) => {
                if (titleLower.includes(word)) score += 50;
            });

            // Category matches
            if (categoryLower.includes(lowercaseQuery)) {
                score += 30;
            }
            queryWords.forEach((word) => {
                if (categoryLower.includes(word)) score += 15;
            });

            // Content matches (for components, this will be basic description)
            if (contentLower.includes(lowercaseQuery)) {
                score += 20;
            }
            queryWords.forEach((word) => {
                if (contentLower.includes(word)) score += 10;
            });

            // Tag matches
            doc.tags?.forEach((tag) => {
                if (tag.toLowerCase().includes(lowercaseQuery)) {
                    score += 40;
                }
                queryWords.forEach((word) => {
                    if (tag.toLowerCase().includes(word)) score += 20;
                });
            });

            // Path matches (for nested items)
            const pathStr = doc.path.join(" ").toLowerCase();
            if (pathStr.includes(lowercaseQuery)) {
                score += 10;
            }

            return { doc, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ doc }) => doc);
};