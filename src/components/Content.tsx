import { motion } from "framer-motion";
import { FileText, List, Loader, Menu } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import type { ContentProps } from "../types/component";
import { FloatingTOC } from "./FloatingTOC";

const Content: React.FC<ContentProps> = ({
    currentDoc,
    tableOfContents,
    loading = false,
    isMobile,
    onSidebarToggle,
}) => {
    const contentRef = useRef<HTMLElement>(null);
    const [tocOpen, setTocOpen] = useState(false);

    // Add IDs to headings after markdown is rendered
    useEffect(() => {
        if (!contentRef.current || !currentDoc || currentDoc.component) return;

        const headings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
        headings.forEach((heading, index) => {
            const tocItem = tableOfContents[index];
            if (tocItem) {
                heading.id = tocItem.id;
                // Cast to HTMLElement to access style
                (heading as HTMLElement).style.scrollMarginTop = "8rem";
            }
        });
    }, [currentDoc, tableOfContents]);

    // Close TOC when document changes
    useEffect(() => {
        setTocOpen(false);
    }, [currentDoc?.id]);

    // Loading state
    if (loading) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                            <h2 className="text-lg font-semibold text-gray-600">Loading document...</h2>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

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
        <div className="bg-gray-50 flex-1 flex flex-col overflow-hidden relative">
            {/* Fixed Title Header */}
            <div className=" px-6 py-4 flex-shrink-0 sticky top-0 z-30 border-b border-gray-200">
                <div className="max-w-4xl mx-auto">
                    {/* <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {currentDoc.type === "tool" ? <Wrench className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span>{currentDoc.category}</span>
                    </div> */}

                    {/* Title and TOC Toggle */}
                    <div className="flex justify-between gap-4 items-center">
                        <div className="flex justify-between gap-4 items-center overflow-auto">
                            {isMobile && (
                                <button
                                    onClick={onSidebarToggle}
                                    className="p-2.5 hover:bg-gray-100/80 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95"
                                    aria-label="Toggle sidebar"
                                >
                                    <Menu className="w-5 h-5 text-gray-700" />
                                </button>
                            )}
                            <div className="text-lg font-bold text-gray-900 flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                                {currentDoc.title}
                            </div>
                        </div>

                        {/* TOC Toggle Button - Only show for markdown content */}
                        {!currentDoc.component && tableOfContents.length > 0 && (
                            <motion.button
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
                    {currentDoc.component ? (
                        // Render React component
                        <div className="min-h-[50vh]">
                            <currentDoc.component />
                        </div>
                    ) : (
                        // Render Markdown content
                        <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({ node, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return match ? (
                                            <SyntaxHighlighter
                                                style={oneDark as any}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-lg"
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code
                                                className={`${className} bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm`}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    },
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
                                    p: ({ children, ...props }) => (
                                        <p className="mb-4 leading-relaxed text-gray-700" {...props}>
                                            {children}
                                        </p>
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
                                        <div className="overflow-x-auto mb-4">
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
                    )}
                </article>
            </main>

            {/* Floating Table of Contents - Only for markdown content */}
            {!currentDoc.component && (
                <FloatingTOC items={tableOfContents} isOpen={tocOpen} onClose={() => setTocOpen(false)} />
            )}
        </div>
    );
};

export default Content;
