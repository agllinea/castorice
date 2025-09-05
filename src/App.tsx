import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

import Content from "./components/Content";
import Sidebar from "./components/Sidebar";
import { decodeDocId, findDocPath, getDocIdFromPath, getExpandedNodesForPath, isValidPath, pathToUrl, urlToPath } from "./utils/routing";

import type { DocItem, TreeNodeItem } from "./types/model";
import appIndex from "./appIndex";
import { convertToNavigationTree, findNodeByPath, generateTOC, pathToFilePath, buildDocPath } from "./utils/doc";
import ThemeManager from "./theme/ThemeManager";
import "./scrollbar.css";

// Main App Content Component
const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(384);
    const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 640);
    const [currentDoc, setCurrentDoc] = useState<DocItem | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Convert appIndex to navigation tree
    const navigationTree = useMemo(() => convertToNavigationTree(appIndex), []);

    // Parse current path from URL
    const currentPath = useMemo(() => urlToPath(location.pathname), [location.pathname]);
    const currentDocId = useMemo(() => getDocIdFromPath(currentPath), [currentPath]);

    // Find current node from appIndex
    const currentNode = useMemo(() => {
        return currentDocId ? findNodeByPath(appIndex, currentPath) : null;
    }, [currentDocId, currentPath]);

    // Generate table of contents
    const tableOfContents = useMemo(() => {
        return currentDoc ? generateTOC(currentDoc.content) : [];
    }, [currentDoc]);

    // Load document content
    useEffect(() => {
        if (!currentNode) {
            setCurrentDoc(null);
            return;
        }

        // If it's a component, create a DocItem entry
        if (currentNode.component) {
            setCurrentDoc({
                id: currentNode.id,
                title: currentNode.label || currentNode.id,
                type: "tool",
                category: "Interactive Tool",
                content: "", // Components don't need content
                component: currentNode.component,
            });
            return;
        }

        // If it's a markdown file, load the content
        if (currentNode.id.endsWith(".md") || (!currentNode.children && !currentNode.component)) {
            const loadMarkdownContent = async () => {
                setLoading(true);
                try {
                    const filePath = `/docs/${pathToFilePath(currentPath)}`;
                    const response = await fetch(filePath);

                    if (!response.ok) {
                        throw new Error(`Failed to load ${filePath}`);
                    }

                    const content = await response.text();

                    setCurrentDoc({
                        id: currentNode.id,
                        title: currentNode.label || currentNode.id.replace(/\.md$/, ""),
                        type: "doc",
                        category: currentPath.length > 1 ? currentPath[0] : "Documentation",
                        content: content,
                        tags: [],
                    });
                } catch (error) {
                    console.error("Error loading markdown file:", error);
                    setCurrentDoc({
                        id: currentNode.id,
                        title: currentNode.label || currentNode.id,
                        type: "doc",
                        category: "Documentation",
                        content: `# Error Loading Document\n\nCould not load the document at path: ${pathToFilePath(
                            currentPath
                        )}\n\nPlease check if the file exists in the public/docs folder.`,
                        tags: [],
                    });
                } finally {
                    setLoading(false);
                }
            };

            loadMarkdownContent();
        }
    }, [currentNode, currentPath]);

    // Set up initial expanded nodes based on current path
    useEffect(() => {
        if (currentPath.length > 0) {
            const expandedForPath = getExpandedNodesForPath(currentPath);
            setExpandedNodes((prev) => {
                const newNodes = expandedForPath.filter((node) => !prev.includes(node));
                if (newNodes.length > 0) {
                    return [...new Set([...prev, ...expandedForPath])];
                }
                return prev;
            });
        } else {
            setExpandedNodes((prev) => {
                if (prev.length === 0) {
                    return ["example"]; // Default to expand example
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

    // Create mock docs for search functionality (you might want to build this dynamically)
    const mockDocs: DocItem[] = useMemo(() => {
        const docs: DocItem[] = [];

        const extractDocs = (nodes: TreeNodeItem[], parentPath: string[] = []) => {
            nodes.forEach((node) => {
                const currentPath = [...parentPath, node.id];

                if (node.component) {
                    docs.push({
                        id: node.id,
                        title: node.label || node.id,
                        type: "tool",
                        category: "Interactive Tool",
                        content: "",
                        component: node.component,
                    });
                } else if (node.id.endsWith(".md") || (!node.children && !node.component)) {
                    docs.push({
                        id: node.id,
                        title: node.label || node.id.replace(/\.md$/, ""),
                        type: "doc",
                        category: parentPath.length > 0 ? parentPath[0] : "Documentation",
                        content: "", // Content will be loaded when needed
                        tags: [],
                    });
                }

                if (node.children) {
                    extractDocs(node.children, currentPath);
                }
            });
        };

        extractDocs(appIndex);
        return docs;
    }, []);

    const entry = useRef(null as HTMLVideoElement | null);
    const [entryPlayed, setEntryPlayed] = useState(false);

    return (
        <div className="h-screen flex flex-col">
            {/* <div className="absolute top-0 left-0 w-full h-full z-[1000] overflow-hidden">
                <video
                    ref={entry}
                    className={`h-full object-cover ${entryPlayed && "opacity-0"} transition-opacity duration-500`}
                    muted
                    onClick={() => {
                        entry.current?.play();
                        setTimeout(() => {
                            setEntryPlayed(true);
                        }, 1900);
                    }}
                >
                    <source src="/vdo1.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div> */}

            <div className="flex flex-1 overflow-hidden">
                {/* Navigator Component */}
                {/* <Sidebar
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
                /> */}

                {/* Content Area */}
                <Content
                    currentDoc={currentDoc}
                    tableOfContents={tableOfContents}
                    isMobile={isMobile}
                    loading={loading}
                    onSidebarToggle={handleSidebarToggle}
                />
            </div>
        </div>
    );
};

// Route component to handle document paths
const DocumentRoute: React.FC = () => {
    const params = useParams();

    // Parse the path from URL parameters
    const pathSegments = params["*"]?.split("/").filter(Boolean) || [];
    const currentPath = pathSegments.map((segment) => decodeDocId(segment));

    // Validate the path exists in our navigation tree
    const navigationTree = convertToNavigationTree(appIndex);
    if (pathSegments.length > 0 && !isValidPath(navigationTree, currentPath)) {
        return <Navigate to="/" replace />;
    }
    return <AppContent />;
};

// Root App component with router
const App: React.FC = () => {
    // Find first available document for default redirect
    const getFirstAvailableDoc = (): string => {
        const findFirstLeaf = (nodes: TreeNodeItem[]): string | null => {
            for (const node of nodes) {
                if (node.component || node.id.endsWith(".md") || (!node.children && !node.component)) {
                    const docPath = buildDocPath(appIndex, node.id);
                    if (docPath) {
                        return pathToUrl(docPath);
                    }
                }
                if (node.children) {
                    const result = findFirstLeaf(node.children);
                    if (result) return result;
                }
            }
            return null;
        };
        return findFirstLeaf(appIndex) || "example/basic%20tool/Counter";
    };

    return (
        <ThemeManager>
            <Router>
                <Routes>
                    {/* Handle all paths including nested ones */}
                    <Route path="/*" element={<DocumentRoute />} />
                    {/* Default redirect to first document */}
                    <Route path="/" element={<Navigate to={`/${getFirstAvailableDoc()}`} replace />} />
                </Routes>
            </Router>
        </ThemeManager>
    );
};

export default App;
