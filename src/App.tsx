import { FileText, Hash, Menu, Search, Wrench } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

import Content from "./Content";
import Header from "./Header";
import Navigator from "./Navigator";
import { decodeDocId, findDocByPath, findDocPath, getDocIdFromPath, getExpandedNodesForPath, isValidPath, pathToUrl, urlToPath } from "./routingUtils";

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
        type: "doc",
    },
    { id: "react-hooks", label: "React Hooks Guide", type: "doc" },
    { id: "css-grid", label: "CSS Grid Layout", type: "doc" },
    {
        id: "devops",
        label: "DevOps",
        children: [{ id: "docker-basics", label: "Docker Basics", type: "doc" }],
    },
    {
        id: "tools",
        label: "Tools",
        children: [
            { id: "api-testing", label: "API Testing with Postman", type: "tool" },
            { id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" },
            {
                id: "wocaonimade",
                label: "hahahhaha",
                children: [
                    {
                        id: "frontend",
                        label: "Frontend",
                        type: "doc",
                    },
                    { id: "react-hooks", label: "React Hooks Guide", type: "doc" },
                    { id: "css-grid", label: "CSS Grid Layout", type: "doc" },
                    {
                        id: "devops",
                        label: "DevOps",
                        children: [{ id: "docker-basics", label: "Docker Basics", type: "doc" }],
                    },
                    {
                        id: "tools",
                        label: "Tools",
                        children: [
                            { id: "api-testing", label: "API Testing with Postman", type: "tool" },
                            { id: "figma-shortcuts1", label: "Figma Shortcuts1", type: "tool" },
                        ],
                    },
                    {
                        id: "design",
                        label: "Design",
                        children: [{ id: "figma-shortcuts", label: "Figma Shortcuts", type: "tool" }],
                    },
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

// Main App Content Component
const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(384); // Default to w-96 (384px)
    const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

    // Parse current path from URL - memoize to prevent infinite loops
    const currentPath = useMemo(() => urlToPath(location.pathname), [location.pathname]);
    const currentDocId = useMemo(() => getDocIdFromPath(currentPath), [currentPath]);

    // Find current document
    const currentDoc = useMemo(
        () => (currentDocId ? mockDocs.find((doc) => doc.id === currentDocId) : undefined),
        [currentDocId]
    );

    // Generate search results and table of contents
    const tableOfContents = useMemo(() => (currentDoc ? generateTOC(currentDoc.content) : []), [currentDoc]);

    // Set up initial expanded nodes based on current path
    useEffect(() => {
        if (currentPath.length > 0) {
            const expandedForPath = getExpandedNodesForPath(currentPath);
            setExpandedNodes((prev) => {
                // Only update if there are actually new nodes to expand
                const newNodes = expandedForPath.filter((node) => !prev.includes(node));
                if (newNodes.length > 0) {
                    return [...new Set([...prev, ...expandedForPath])];
                }
                return prev;
            });
        } else {
            // Default expanded nodes when no path - only set if not already set
            setExpandedNodes((prev) => {
                if (prev.length === 0) {
                    return ["frontend", "tools"];
                }
                return prev;
            });
        }
    }, [currentPath.join("/")]);

    // Handle window resize
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

    const toggleNode = (nodeId: string): void => {
        setExpandedNodes((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]));
    };

    const handleDocSelect = (docId: string): void => {
        // Find the path to this document in the navigation tree
        const docPath = findDocPath(navigationTree, docId);
        if (docPath) {
            // Convert path to URL and navigate
            const urlPath = pathToUrl(docPath);
            navigate(`/${urlPath}`);
        }
    };

    const handleSidebarClose = (): void => {
        setSidebarOpen(false);
    };

    const handleSidebarResize = (width: number): void => {
        setSidebarWidth(width);
    };

    const handleSearchResultClick = (docId: string): void => {
        // Find path and navigate
        const docPath = findDocPath(navigationTree, docId);
        if (docPath) {
            const urlPath = pathToUrl(docPath);
            navigate(`/${urlPath}`);
        }
    };

    const handleSidebarToggle = (): void => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <Header
                isMobile={isMobile}
                mockDocs={mockDocs}
                navigationTree={navigationTree}
                onSidebarToggle={handleSidebarToggle}
                onSearchResultClick={handleSearchResultClick}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Navigator Component */}
                <Navigator
                    navigationTree={navigationTree}
                    currentDocId={currentDocId || ""}
                    expandedNodes={expandedNodes}
                    isMobile={isMobile}
                    sidebarOpen={sidebarOpen}
                    sidebarWidth={sidebarWidth}
                    onDocSelect={handleDocSelect}
                    onToggleNode={toggleNode}
                    onCloseSidebar={handleSidebarClose}
                    onSidebarResize={handleSidebarResize}
                />

                {/* Content Area */}
                <Content currentDoc={currentDoc} tableOfContents={tableOfContents} isMobile={isMobile} />
            </div>
        </div>
    );
};

// Route component to handle document paths
const DocumentRoute: React.FC = () => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse the path from URL parameters
    const pathSegments = params["*"]?.split("/").filter(Boolean) || [];
    const currentPath = pathSegments.map((segment) => decodeDocId(segment));

    // Validate the path exists in our navigation tree
    if (pathSegments.length > 0 && !isValidPath(navigationTree, currentPath)) {
        return <Navigate to="/" replace />;
    }

    return <AppContent />;
};

// Root App component with router
const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                {/* Handle all paths including nested ones */}
                <Route path="/*" element={<DocumentRoute />} />
                {/* Default redirect to first document */}
                <Route path="/" element={<Navigate to="/frontend/react-hooks" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
