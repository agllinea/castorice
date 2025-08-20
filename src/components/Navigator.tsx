import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, Settings } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { useTheme } from "./ThemeManager";
import { buildSearchableDocs, searchDocs } from "../utils/search";

import type { NavigatorProps } from "../types/component";
import { TreeNodeComponent } from "./TreeNode";
import DocSearch from "./DocSearch";
import MusicControl from "./MusicControl";
import type { SearchableDoc } from "../types/model";
import ThemeSettings from "./Setting";

const Navigator: React.FC<NavigatorProps> = ({
    navigationTree,
    currentDocId,
    expandedNodes,
    isMobile,
    sidebarOpen,
    sidebarWidth,
    onDocSelect,
    onToggleNode,
    onCloseSidebar,
    onSidebarResize,
}) => {
    const { currentTheme, musicEnabled, setMusicEnabled } = useTheme();
    const [isResizing, setIsResizing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(sidebarWidth);

    // Search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
    const [searchableDocs, setSearchableDocs] = useState<SearchableDoc[]>([]);
    const [loadedContent, setLoadedContent] = useState<Map<string, string>>(new Map());

    // Theme settings modal state
    const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState<boolean>(false);

    // Sidebar width constraints
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 500;

    // Build searchable docs from navigation tree
    useEffect(() => {
        const docs = buildSearchableDocs(navigationTree);
        setSearchableDocs(docs);
    }, [navigationTree]);

    // Load content for markdown files when needed for better search
    const loadContentForSearch = async (doc: SearchableDoc) => {
        if (doc.type === "tool" || loadedContent.has(doc.id)) {
            return;
        }

        try {
            const filePath = `/docs/${doc.path.join("/")}${doc.id.endsWith(".md") ? "" : ".md"}`;
            const response = await fetch(filePath);
            if (response.ok) {
                const content = await response.text();
                setLoadedContent((prev) => new Map(prev).set(doc.id, content));

                // Update the searchable doc with loaded content
                setSearchableDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, content } : d)));
            }
        } catch (error) {
            console.warn(`Could not load content for search: ${doc.id}`);
        }
    };

    // Pre-load content for better search experience (debounced)
    useEffect(() => {
        if (searchQuery.length > 2) {
            const timer = setTimeout(() => {
                searchableDocs
                    .filter((doc) => doc.type === "doc" && !loadedContent.has(doc.id))
                    .slice(0, 3) // Load only first few to avoid too many requests
                    .forEach(loadContentForSearch);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [searchQuery, searchableDocs, loadedContent]);

    // Generate search results
    const searchResults = searchDocs(searchableDocs, searchQuery);

    // Handle escape key to close modals
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (isThemeSettingsOpen) {
                    setIsThemeSettingsOpen(false);
                } else if (isSearchModalOpen) {
                    setIsSearchModalOpen(false);
                    setSearchQuery("");
                }
            }
            // CMD/Ctrl + K to open search (like macOS)
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                setIsSearchModalOpen(true);
            }
            // CMD/Ctrl + , to open theme settings (like many apps)
            if ((event.metaKey || event.ctrlKey) && event.key === ",") {
                event.preventDefault();
                setIsThemeSettingsOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isSearchModalOpen, isThemeSettingsOpen]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isMobile) return;

            e.preventDefault();
            setIsResizing(true);
            setStartX(e.clientX);
            setStartWidth(sidebarWidth);

            // Add cursor style to body
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [isMobile, sidebarWidth]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + deltaX));
            onSidebarResize(newWidth);
        },
        [isResizing, startX, startWidth, onSidebarResize]
    );

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);

        // Remove cursor style from body
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleDocSelect = (docId: string): void => {
        onDocSelect(docId);
        if (isMobile) {
            onCloseSidebar();
        }
    };

    const handleSearchResultClick = (docId: string) => {
        handleDocSelect(docId);
        handleCloseSearchModal();
    };

    const handleOverlayClick = (): void => {
        onCloseSidebar();
    };

    const handleOverlayKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
            onCloseSidebar();
        }
    };

    const handleSearchClick = () => {
        setIsSearchModalOpen(true);
    };

    const handleCloseSearchModal = () => {
        setIsSearchModalOpen(false);
        setSearchQuery("");
    };

    const handleThemeSettingsClick = () => {
        setIsThemeSettingsOpen(true);
    };

    const handleCloseThemeSettings = () => {
        setIsThemeSettingsOpen(false);
    };
    
    return (
        <>
            {/* Sidebar - Always rendered on mobile, positioned with transform */}
            <motion.div
                className={`${isMobile ? "fixed inset-0 z-50" : "border-r relative"} bg-theme-surface border-theme`}
                style={{
                    ...(isMobile ? {} : { width: sidebarWidth }),
                }}
                initial={isMobile ? { x: "-100%" } : false}
                animate={isMobile ? { x: sidebarOpen ? 0 : "-100%" } : {}}
                transition={
                    isMobile
                        ? {
                              type: "tween",
                              duration: 0.35,
                              ease: [0.25, 0.1, 0.25, 1], // Material Design easing
                          }
                        : { type: "spring", damping: 30, stiffness: 300 }
                }
            >
                {/* Header Section with Title and Controls */}
                <div className="backdrop-blur-sm border-b border-theme px-4 py-3 flex items-center gap-2 relative z-[80] h-16 shadow-sm bg-theme-surface">
                    {isMobile && (
                        <motion.button
                            onClick={onCloseSidebar}
                            className="p-2.5 hover:bg-theme-hover rounded-xl transition-all duration-200 flex-shrink-0 text-theme-secondary"
                            aria-label="Close menu"
                        >
                            <Menu className="w-5 h-5" />
                        </motion.button>
                    )}
                    {!isMobile && (
                        <motion.button
                            onClick={handleSearchClick}
                            className="p-2.5 hover:bg-theme-hover rounded-xl transition-all duration-200 flex-shrink-0 text-theme-secondary"
                            aria-label="Search documentation"
                            title="Search (Ctrl+K)"
                        >
                            <Search className="w-5 h-5" />
                        </motion.button>
                    )}
                    {/* Controls - Search and Theme Settings */}
                    <div className={`flex gap-1 ml-auto flex-1"`}>
                        {/* Search button */}
                        {isMobile && (
                            <motion.button
                                onClick={handleSearchClick}
                                className="p-2.5 hover:bg-theme-hover rounded-xl transition-all duration-200 flex-shrink-0 text-theme-secondary"
                                aria-label="Search documentation"
                                title="Search (Ctrl+K)"
                            >
                                <Search className="w-5 h-5" />
                            </motion.button>
                        )}

                        {/* Theme Settings button */}
                        <motion.button
                            onClick={handleThemeSettingsClick}
                            className="p-2.5 hover:bg-theme-hover rounded-xl transition-all duration-200 flex-shrink-0 text-theme-secondary"
                            aria-label="Theme settings"
                            title="Theme Settings (Ctrl+,)"
                        >
                            <Settings className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>

                <div
                    className="px-4 py-4 flex-1 overflow-y-auto"
                    style={{ height: "calc(100% - 56px)", paddingBottom: "80px" }}
                >
                    <nav className="space-y-2" role="navigation" aria-label="Documentation navigation">
                        {navigationTree.map((node) => (
                            <TreeNodeComponent
                                key={node.id}
                                node={node}
                                currentDocId={currentDocId}
                                expandedNodes={expandedNodes}
                                isMobile={isMobile}
                                onDocSelect={handleDocSelect}
                                onToggleNode={onToggleNode}
                            />
                        ))}
                    </nav>
                </div>

                {/* Theme Controls Footer - Floating Glass */}
                <div
                    className="absolute bottom-4 left-4 right-4 rounded-2xl backdrop-blur-md border border-theme/50 shadow-sm bg-theme-surface/80"
                    data-theme-controls
                >
                    <MusicControl
                        currentTheme={currentTheme}
                        musicEnabled={musicEnabled}
                        setMusicEnabled={setMusicEnabled}
                    />
                </div>

                {/* Resize Handle - Desktop Only */}
                {!isMobile && (
                    <div
                        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-theme-active transition-colors group ${
                            isResizing ? "bg-theme-active" : "bg-transparent"
                        }`}
                        onMouseDown={handleMouseDown}
                    >
                        {/* Visual indicator on hover */}
                        <div
                            className={`absolute top-0 right-0 w-1 h-full transition-all ${
                                isResizing ? "bg-theme-active" : "bg-gray-300 opacity-0 group-hover:opacity-100"
                            }`}
                        />
                    </div>
                )}
            </motion.div>

            {/* Mobile overlay */}
            {isMobile && (
                <motion.div
                    className="fixed inset-0 bg-black z-40"
                    style={{
                        pointerEvents: sidebarOpen ? "auto" : "none",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: sidebarOpen ? 0.5 : 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={handleOverlayClick}
                    role="button"
                    tabIndex={sidebarOpen ? 0 : -1}
                    onKeyDown={handleOverlayKeyDown}
                    aria-label="Close sidebar overlay"
                    aria-hidden={!sidebarOpen}
                />
            )}

            {/* Search Modal */}
            <DocSearch
                isOpen={isSearchModalOpen}
                query={searchQuery}
                setQuery={setSearchQuery}
                onClose={handleCloseSearchModal}
                results={searchResults}
                onResultClick={handleSearchResultClick}
                searchableDocs={searchableDocs}
                isMobile={isMobile}
            />

            {/* Theme Settings Modal */}
            <ThemeSettings isOpen={isThemeSettingsOpen} onClose={handleCloseThemeSettings} isMobile={isMobile} />
        </>
    );
};

export default Navigator;
