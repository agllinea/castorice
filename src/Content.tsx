import { AnimatePresence, motion } from "framer-motion";
import { FileText, Hash, List, Wrench, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

// Types
export interface DocTool {
    id: string;
    title: string;
    type: "doc" | "tool";
    category: string;
    content: string;
    tags?: string[];
}

export interface TOCItem {
    level: number;
    text: string;
    id: string;
    index: number;
}

interface ContentProps {
    currentDoc: DocTool | undefined;
    tableOfContents: TOCItem[];
    isMobile: boolean;
}

interface FloatingTOCProps {
    items: TOCItem[];
    isOpen: boolean;
    onClose: () => void;
}

// Generate table of contents from content
export const generateTOC = (content: string): TOCItem[] => {
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

const FloatingTOC: React.FC<FloatingTOCProps> = ({ items, isOpen, onClose }) => {
    const [activeId, setActiveId] = useState<string>("");
    const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 24 });

    // Calculate position relative to TOC button
    useEffect(() => {
        if (isOpen) {
            const button = document.getElementById("toc-toggle-button");
            if (button) {
                const rect = button.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 8, // 8px gap below button
                    right: window.innerWidth - rect.right, // Align right edge with button
                });
            }
        }
    }, [isOpen]);

    // Track scroll position to highlight active section
    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => {
            const headings = items
                .map((item) => ({
                    id: item.id,
                    element: document.getElementById(item.id),
                }))
                .filter((item) => item.element);

            // Find the heading that's currently in view
            let currentActiveId = "";
            for (const heading of headings) {
                const rect = heading.element!.getBoundingClientRect();
                if (rect.top <= 150) {
                    // Account for fixed header height
                    currentActiveId = heading.id;
                }
            }
            setActiveId(currentActiveId);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, [items, isOpen]);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const tocPanel = target.closest("[data-toc-panel]");
            const tocButton = target.closest("#toc-toggle-button");

            if (!tocPanel && !tocButton) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const scrollToHeading = (id: string): void => {
        // First try to find by exact ID
        let element = document.getElementById(id);

        // If not found, try to find by heading text (fallback)
        if (!element) {
            const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
            const targetText = items.find((item) => item.id === id)?.text;
            if (targetText) {
                element = Array.from(headings).find((h) =>
                    h.textContent?.toLowerCase().includes(targetText.toLowerCase())
                ) as HTMLElement;
            }
        }

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });

            // Add offset to account for fixed header
            setTimeout(() => {
                window.scrollBy(0, -120); // Account for fixed header height
            }, 100);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                        duration: 0.3,
                    }}
                    className="fixed w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden"
                    style={{
                        top: position.top,
                        right: position.right,
                    }}
                    data-toc-panel
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-600" />
                            Table of Contents
                        </h3>
                        <motion.button
                            // whileHover={{ scale: 1.05 }}
                            // whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Close table of contents"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </motion.button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-96">
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No headings found in this document</p>
                        ) : (
                            <nav>
                                <ul className="space-y-1 text-sm">
                                    {items.map((item) => (
                                        <motion.li
                                            key={item.index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: item.index * 0.02 }}
                                        >
                                            <motion.button
                                                //   whileHover={{ x: 2 }}
                                                //   whileTap={{ scale: 0.98 }}
                                                onClick={() => scrollToHeading(item.id)}
                                                className={`block py-2 px-3 text-left w-full rounded-lg transition-all ${
                                                    activeId === item.id
                                                        ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                                                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                                } ${
                                                    item.level === 1
                                                        ? "font-medium text-base"
                                                        : item.level === 2
                                                        ? "ml-3 text-sm"
                                                        : "ml-6 text-sm"
                                                }`}
                                            >
                                                {item.text}
                                            </motion.button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </nav>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Content: React.FC<ContentProps> = ({ currentDoc, tableOfContents, isMobile }) => {
    const contentRef = useRef<HTMLElement>(null);
    const [tocOpen, setTocOpen] = useState(false);

    // Add IDs to headings after markdown is rendered
    useEffect(() => {
        if (!contentRef.current || !currentDoc) return;

        const headings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
        headings.forEach((heading, index) => {
            const tocItem = tableOfContents[index];
            if (tocItem) {
                heading.id = tocItem.id;
                // Add scroll margin for better positioning
                heading.style.scrollMarginTop = "8rem"; // Account for fixed header
            }
        });
    }, [currentDoc, tableOfContents]);

    // Close TOC when document changes
    useEffect(() => {
        setTocOpen(false);
    }, [currentDoc?.id]);

    if (!currentDoc) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-600">Select a document to view</h2>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Fixed Title Header */}
            <div className="bg-gray-50 px-6 py-4 flex-shrink-0 sticky top-0 z-30 border-b border-gray-200">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {currentDoc.type === "tool" ? <Wrench className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span>{currentDoc.category}</span>
                    </div>

                    {/* Title and TOC Toggle */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 flex-1">{currentDoc.title}</h1>

                        {/* TOC Toggle Button */}
                        {tableOfContents.length > 0 && (
                            <motion.button
                                // whileHover={{ scale: 1.05 }}
                                // whileTap={{ scale: 0.95 }}
                                onClick={() => setTocOpen((prev: boolean) => !prev)}
                                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium shadow-sm border border-gray-200"
                                aria-label="Open table of contents"
                                id="toc-toggle-button"
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">Contents</span>
                            </motion.button>
                        )}
                    </div>

                    {currentDoc.tags && (
                        <div className="flex flex-wrap gap-2">
                            {currentDoc.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-6" ref={contentRef}>
                <article className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ children, ...props }) => (
                                    <h1 className="text-3xl font-bold mb-6 text-gray-900" {...props}>
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children, ...props }) => (
                                    <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-800" {...props}>
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children, ...props }) => (
                                    <h3 className="text-xl font-medium mb-3 mt-6 text-gray-700" {...props}>
                                        {children}
                                    </h3>
                                ),
                                pre: ({ children, ...props }) => (
                                    <pre
                                        className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4"
                                        {...props}
                                    >
                                        {children}
                                    </pre>
                                ),
                                blockquote: ({ children, ...props }) => (
                                    <blockquote
                                        className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4"
                                        {...props}
                                    >
                                        {children}
                                    </blockquote>
                                ),
                                table: ({ children, ...props }) => (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border border-gray-300 rounded-lg" {...props}>
                                            {children}
                                        </table>
                                    </div>
                                ),
                                th: ({ children, ...props }) => (
                                    <th
                                        className="bg-gray-100 border border-gray-300 px-4 py-2 text-left font-semibold"
                                        {...props}
                                    >
                                        {children}
                                    </th>
                                ),
                                td: ({ children, ...props }) => (
                                    <td className="border border-gray-300 px-4 py-2" {...props}>
                                        {children}
                                    </td>
                                ),
                            }}
                        >
                            {currentDoc.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </main>

            {/* Floating Table of Contents */}
            <FloatingTOC items={tableOfContents} isOpen={tocOpen} onClose={() => setTocOpen(false)} />
        </div>
    );
};

export default Content;
