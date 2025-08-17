import { motion } from "framer-motion";
import { FileText, List, Loader, Menu } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import type { ContentProps } from "../types/component";
import { FloatingTOC } from "./FloatingTOC";
import { useTheme } from "../ThemeManager";

const Content: React.FC<ContentProps> = ({
    currentDoc,
    tableOfContents,
    loading = false,
    isMobile,
    onSidebarToggle,
}) => {
    const contentRef = useRef<HTMLElement>(null);
    const [tocOpen, setTocOpen] = useState(false);
    const [tocItems, setTocItems] = useState<
        Array<{
            id: string;
            text: string;
            level: number;
            index: number;
            path: string;
        }>
    >([]);
    const { currentTheme } = useTheme();

    // Helper function to generate unique IDs
    const generateUniqueId = (): string => {
        return `heading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Keep a counter for heading slugs
    const headingCounts: Record<string, number> = {};

    function getStableId(level: string, text: string) {
        const slug = generateSlug(text);
        const base = `${level}-${slug}`;
        if (headingCounts[base]) {
            headingCounts[base] += 1;
            return `${base}-${headingCounts[base]}`;
        }
        headingCounts[base] = 1;
        return base;
    }

    // Helper function to generate clean slug from text
    const generateSlug = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .trim();
    };

    // Scan the rendered DOM to build TOC
    useEffect(() => {
        if (!contentRef.current || !currentDoc || currentDoc.component) {
            setTocItems([]);
            return;
        }

        // Wait for React to finish rendering
        const timer = setTimeout(() => {
            if (!contentRef.current) return;

            const headings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
            const items: Array<{
                id: string;
                text: string;
                level: number;
                index: number;
                path: string;
            }> = [];

            // Track heading hierarchy for path generation
            const pathStack: string[] = [];

            headings.forEach((heading, index) => {
                // Skip headings inside code blocks or pre elements
                if (heading.closest("pre, code, .code-block")) return;

                const text = heading.textContent?.trim() || "";
                if (!text) return;

                const level = parseInt(heading.tagName.charAt(1));

                // The heading should already have an ID from our custom components
                const id = heading.id;

                if (!id) {
                    console.warn("Heading found without ID:", text);
                    return;
                }

                // Update path stack based on heading level
                while (pathStack.length > 0 && pathStack.length >= level) {
                    pathStack.pop();
                }

                pathStack.push(text);
                const path = pathStack.join(" > ");

                items.push({
                    id,
                    text,
                    level,
                    index,
                    path,
                });
            });

            setTocItems(items);
        }, 100);

        return () => clearTimeout(timer);
    }, [currentDoc?.content]); // Re-run when content changes

    // Close TOC when document changes
    useEffect(() => {
        setTocOpen(false);
    }, [currentDoc?.id]);

    // Loading state with theme integration
    if (loading) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 bg-theme-background">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader className="w-8 h-8 text-theme-accent mx-auto mb-4 animate-spin" />
                            <h2 className="text-lg font-semibold text-theme-secondary">Loading document...</h2>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!currentDoc) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 bg-theme-background">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-theme-secondary">Select a document to view</h2>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-theme-background flex-1 flex flex-col overflow-hidden relative">
            {/* Fixed Title Header with theme integration */}
            <div className="bg-theme-surface/95 backdrop-blur-sm px-6 py-4 flex-shrink-0 sticky top-0 z-30 border-b border-theme h-16 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Title and TOC Toggle */}
                    <div className="flex justify-between gap-4 items-center">
                        <div className="flex justify-between gap-4 items-center overflow-auto">
                            {isMobile && (
                                <button
                                    onClick={onSidebarToggle}
                                    className="p-2.5 hover:bg-theme-hover rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95"
                                    aria-label="Toggle sidebar"
                                >
                                    <Menu className="w-5 h-5 text-theme-primary" />
                                </button>
                            )}
                            <div className="text-lg font-bold text-theme-primary flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                                {currentDoc.title}
                            </div>
                        </div>

                        {/* TOC Toggle Button - Only show for markdown content */}
                        {!currentDoc.component && tocItems.length > 0 && (
                            <motion.button
                                onClick={() => setTocOpen((prev: boolean) => !prev)}
                                className="flex items-center gap-2 px-3 py-2 bg-theme-surface hover:bg-theme-hover text-theme-primary rounded-lg transition-colors text-sm font-medium shadow-sm border border-theme"
                                aria-label="Open table of contents"
                                id="toc-toggle-button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">Contents</span>
                            </motion.button>
                        )}
                    </div>

                    {currentDoc.tags && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {currentDoc.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-theme-active text-theme-accent text-xs rounded-md font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content with theme integration */}
            <main className="toc-content flex-1 overflow-y-auto p-6 bg-gray-50" ref={contentRef}>
                <article className="max-w-4xl mx-auto">
                    {currentDoc.component ? (
                        // Render React component
                        <div className="min-h-[50vh]">
                            <currentDoc.component />
                        </div>
                    ) : (
                        // Render Markdown content with themed styles
                        <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({ node, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return match ? (
                                            <div className="code-block">
                                                <SyntaxHighlighter
                                                    style={oneDark as any}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    className="rounded-lg shadow-lg"
                                                >
                                                    {String(children).replace(/\n$/, "")}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code
                                                className={`${className} bg-theme-active text-theme-primary px-2 py-1 rounded text-sm font-mono`}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    },

                                    h1: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h1", text);
                                        return (
                                            <h1
                                                id={id}
                                                className="text-3xl font-bold mb-6 text-theme-primary border-b border-theme pb-2"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h1>
                                        );
                                    },
                                    h2: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h2", text);
                                        return (
                                            <h2
                                                id={id}
                                                className="text-2xl font-semibold mb-4 mt-8 text-theme-primary"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h2>
                                        );
                                    },
                                    h3: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h3", text);
                                        return (
                                            <h3
                                                id={id}
                                                className="text-xl font-medium mb-3 mt-6 text-theme-primary"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h3>
                                        );
                                    },
                                    h4: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h4", text);
                                        return (
                                            <h4
                                                id={id}
                                                className="text-lg font-medium mb-3 mt-4 text-theme-primary"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h4>
                                        );
                                    },
                                    h5: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h5", text);
                                        return (
                                            <h5
                                                id={id}
                                                className="text-base font-medium mb-2 mt-4 text-theme-primary"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h5>
                                        );
                                    },
                                    h6: ({ children, ...props }) => {
                                        const text = String(children);
                                        const id = getStableId("h6", text);
                                        return (
                                            <h6
                                                id={id}
                                                className="text-sm font-medium mb-2 mt-4 text-theme-primary"
                                                style={{ scrollMarginTop: "140px" }}
                                                {...props}
                                            >
                                                {children}
                                            </h6>
                                        );
                                    },

                                    // the rest of your components unchanged...
                                    p: ({ children, ...props }) => (
                                        <p className="mb-4 leading-relaxed text-theme-primary" {...props}>
                                            {children}
                                        </p>
                                    ),
                                    blockquote: ({ children, ...props }) => (
                                        <blockquote
                                            className="border-l-4 border-theme-accent bg-theme-surface pl-6 py-4 my-6 italic text-theme-secondary rounded-r-lg shadow-sm"
                                            {...props}
                                        >
                                            {children}
                                        </blockquote>
                                    ),
                                    table: ({ children, ...props }) => (
                                        <div className="overflow-x-auto mb-6 shadow-lg rounded-lg border border-theme">
                                            <table className="min-w-full bg-theme-surface" {...props}>
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({ children, ...props }) => (
                                        <th
                                            className="bg-theme-active border-b border-theme px-6 py-3 text-left font-semibold text-theme-primary text-sm uppercase tracking-wider"
                                            {...props}
                                        >
                                            {children}
                                        </th>
                                    ),
                                    td: ({ children, ...props }) => (
                                        <td className="border-b border-theme px-6 py-4 text-theme-primary" {...props}>
                                            {children}
                                        </td>
                                    ),
                                    ul: ({ children, ...props }) => (
                                        <ul className="mb-4 space-y-2 text-theme-primary" {...props}>
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children, ...props }) => (
                                        <ol className="mb-4 space-y-2 text-theme-primary" {...props}>
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children, ...props }) => (
                                        <li className="leading-relaxed" {...props}>
                                            {children}
                                        </li>
                                    ),
                                    a: ({ children, href, ...props }) => (
                                        <a
                                            href={href}
                                            className="text-theme-accent hover:text-theme-primary underline decoration-theme-accent hover:decoration-theme-primary transition-colors duration-200"
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    ),
                                    strong: ({ children, ...props }) => (
                                        <strong className="font-semibold text-theme-primary" {...props}>
                                            {children}
                                        </strong>
                                    ),
                                    em: ({ children, ...props }) => (
                                        <em className="italic text-theme-secondary" {...props}>
                                            {children}
                                        </em>
                                    ),
                                    tr: ({ children, ...props }) => (
                                        <tr className="border-b border-theme" {...props}>
                                            {children}
                                        </tr>
                                    ),
                                }}
                            >
                                {currentDoc.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </article>
            </main>

            {/* Floating Table of Contents - Only for markdown content */}
            {!currentDoc.component && tocItems.length > 0 && (
                <FloatingTOC items={tocItems} isOpen={tocOpen} onClose={() => setTocOpen(false)} />
            )}
        </div>
    );
};

export default Content;
