import { FileText, Hash, Menu, Search, Wrench } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import Navigator from "./Navigator";

// Types
interface DocTool {
    id: string;
    title: string;
    type: "doc" | "tool";
    category: string;
    content: string;
    tags?: string[];
}

interface TreeNode {
    id: string;
    label: string;
    type?: "doc" | "tool";
    children?: TreeNode[];
}

interface TOCItem {
    level: number;
    text: string;
    id: string;
    index: number;
}

// Mock data
const mockDocs: DocTool[] = [
    {
        id: "react-hooks",
        title: "React Hooks Guide",
        type: "doc",
        category: "Frontend",
        content: `# React Hooks Guide

React Hooks allow you to use state and other React features without writing a class.

## useState

The useState Hook lets you add React state to function components.

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useEffect

The useEffect Hook lets you perform side effects in function components.

## useContext

The useContext Hook lets you subscribe to React context without nesting.`,
        tags: ["react", "hooks", "frontend", "javascript"],
    },
    {
        id: "api-testing",
        title: "API Testing with Postman",
        type: "tool",
        category: "Testing",
        content: `# API Testing with Postman

Postman is a powerful tool for API testing and development.

## Getting Started

1. Download and install Postman
2. Create a new collection
3. Add your first request

## Best Practices

- Use environment variables
- Write tests for your APIs
- Organize requests in collections`,
        tags: ["postman", "api", "testing", "tools"],
    },
    {
        id: "css-grid",
        title: "CSS Grid Layout",
        type: "doc",
        category: "Frontend",
        content: `# CSS Grid Layout

CSS Grid Layout is a two-dimensional layout system for the web.

## Basic Grid

\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

## Grid Areas

You can name grid areas for easier layout management.`,
        tags: ["css", "grid", "layout", "frontend"],
    },
    {
        id: "docker-basics",
        title: "Docker Basics",
        type: "doc",
        category: "DevOps",
        content: `# Docker Basics

Docker is a containerization platform.

## Key Concepts

- Images
- Containers
- Dockerfile
- Docker Compose

## Common Commands

\`\`\`bash
docker build -t myapp .
docker run -p 3000:3000 myapp
docker ps
docker stop container_id
\`\`\``,
    },
    {
        id: "figma-shortcuts",
        title: "Figma Keyboard Shortcuts",
        type: "tool",
        category: "Design",
        content: `# Figma Keyboard Shortcuts

Essential shortcuts to speed up your design workflow.

## Selection Tools
- V - Move tool
- A - Frame tool
- R - Rectangle tool
- O - Ellipse tool

## Actions
- Cmd/Ctrl + D - Duplicate
- Cmd/Ctrl + G - Group
- Cmd/Ctrl + Shift + G - Ungroup`,
    },
];

const navigationTree: TreeNode[] = [
    {
        id: "frontend",
        label: "Frontend",
        children: [
            { id: "react-hooks", label: "React Hooks Guide", type: "doc" },
            { id: "css-grid", label: "CSS Grid Layout", type: "doc" },
        ],
    },
    {
        id: "devops",
        label: "DevOps",
        children: [
            { id: "docker-basics", label: "Docker Basics", type: "doc" },
            {
                id: "tools",
                label: "Tools",
                children: [
                    { id: "api-testing", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" },
                    { id: "api-testing1", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts1", label: "Figma Shortcuts", type: "tool" },
                    { id: "api-testing", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" },
                    { id: "api-testing1", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts1", label: "Figma Shortcuts", type: "tool" },
                    { id: "api-testing", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" },
                    { id: "api-testing1", label: "API Testing with Postman", type: "tool" },
                    { id: "figma-shortcuts1", label: "Figma Shortcuts", type: "tool" },
                ],
            },
        ],
    },

    {
        id: "design",
        label: "Design",
        children: [{ id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" }],
    },
];

// Search utility
const searchDocs = (docs: DocTool[], query: string): DocTool[] => {
    if (!query) return [];
    const lowercaseQuery = query.toLowerCase();
    return docs
        .filter(
            (doc) =>
                doc.title.toLowerCase().includes(lowercaseQuery) ||
                doc.content.toLowerCase().includes(lowercaseQuery) ||
                doc.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        )
        .slice(0, 5);
};

// Generate table of contents from content
const generateTOC = (content: string): TOCItem[] => {
    const headings = content.match(/^#{1,3}\s+(.+)$/gm) || [];
    return headings.map((heading, index) => {
        const level = heading.match(/^#+/)?.[0].length || 1;
        const text = heading.replace(/^#+\s+/, "");
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        return { level, text, id, index };
    });
};

const App: React.FC = () => {
    const [currentDocId, setCurrentDocId] = useState<string>("react-hooks");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [expandedNodes, setExpandedNodes] = useState<string[]>(["frontend", "tools"]);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = (): void => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const currentDoc = mockDocs.find((doc) => doc.id === currentDocId);
    const searchResults = useMemo(() => searchDocs(mockDocs, searchQuery), [searchQuery]);
    const tableOfContents = currentDoc ? generateTOC(currentDoc.content) : [];

    const toggleNode = (nodeId: string): void => {
        setExpandedNodes((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]));
    };

    const handleDocSelect = (docId: string): void => {
        setCurrentDocId(docId);
    };

    const handleSidebarClose = (): void => {
        setSidebarOpen(false);
    };

    const formatContent = (content: string): string => {
        // Simple markdown-to-HTML converter for demo purposes
        return content
            .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-6 text-gray-900">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-gray-800">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-3 mt-6 text-gray-700">$1</h3>')
            .replace(
                /```(\w+)?\n([\s\S]*?)```/g,
                '<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4"><code>$2</code></pre>'
            )
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">$1</code>')
            .replace(/^\- (.+)$/gm, '<li class="ml-4">$1</li>')
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/^(?!<[h|p|u|o|l|d])(.+)$/gm, '<p class="mb-4">$1</p>');
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchQuery(e.target.value);
        setShowSearchDropdown(e.target.value.length > 0);
    };

    const handleSearchInputBlur = (): void => {
        setTimeout(() => setShowSearchDropdown(false), 200);
    };

    const handleSearchInputFocus = (): void => {
        if (searchQuery) setShowSearchDropdown(true);
    };

    const handleSearchResultClick = (docId: string): void => {
        setCurrentDocId(docId);
        setSearchQuery("");
        setShowSearchDropdown(false);
    };

    const handleSidebarToggle = (): void => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 relative z-50">
                {isMobile && (
                    <button
                        onClick={handleSidebarToggle}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                <h1 className="text-xl font-bold text-gray-900">DevDocs Hub</h1>

                <div className="flex-1 max-w-md mx-auto relative">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search docs and tools..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            onBlur={handleSearchInputBlur}
                            onFocus={handleSearchInputFocus}
                        />
                    </div>

                    {showSearchDropdown && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                            {searchResults.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                    onClick={() => handleSearchResultClick(doc.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleSearchResultClick(doc.id);
                                        }
                                    }}
                                >
                                    {doc.type === "tool" ? (
                                        <Wrench className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900">{doc.title}</div>
                                        <div className="text-sm text-gray-500">{doc.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Navigator Component */}
                <Navigator
                    navigationTree={navigationTree}
                    currentDocId={currentDocId}
                    expandedNodes={expandedNodes}
                    isMobile={isMobile}
                    sidebarOpen={sidebarOpen}
                    onDocSelect={handleDocSelect}
                    onToggleNode={toggleNode}
                    onCloseSidebar={handleSidebarClose}
                />

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-6">
                        {currentDoc ? (
                            <article className="max-w-4xl mx-auto">
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        {currentDoc.type === "tool" ? (
                                            <Wrench className="w-4 h-4" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        <span>{currentDoc.category}</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentDoc.title}</h1>
                                    {currentDoc.tags && (
                                        <div className="flex flex-wrap gap-2">
                                            {currentDoc.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="prose prose-lg max-w-none"
                                    dangerouslySetInnerHTML={{ __html: formatContent(currentDoc.content) }}
                                />
                            </article>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h2 className="text-xl font-semibold text-gray-600">Select a document to view</h2>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Table of Contents - Desktop only */}
                    {!isMobile && tableOfContents.length > 0 && (
                        <aside className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
                            <div className="sticky top-0">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    Table of Contents
                                </h3>
                                <nav>
                                    <ul className="space-y-1 text-sm">
                                        {tableOfContents.map((item) => (
                                            <li key={item.index}>
                                                <a
                                                    href={`#${item.id}`}
                                                    className={`block py-1 text-gray-600 hover:text-blue-600 transition-colors ${
                                                        item.level === 1
                                                            ? "font-medium"
                                                            : item.level === 2
                                                            ? "ml-3"
                                                            : "ml-6"
                                                    }`}
                                                >
                                                    {item.text}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
