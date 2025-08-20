import { AnimatePresence, motion } from "framer-motion";
import { Hash, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FloatingTOCProps } from "../types/component";
import type { TOCItem } from "../types/model";

export const FloatingTOC: React.FC<FloatingTOCProps> = ({ items, isOpen, onClose }) => {
    const [activeId, setActiveId] = useState<string>("");
    const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 24 });

    // Calculate position relative to TOC button
    useEffect(() => {
        if (isOpen) {
            const button = document.getElementById("toc-toggle-button");
            if (button) {
                const rect = button.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 15,
                    right: window.innerWidth - rect.right,
                });
            }
        }
    }, [isOpen]);

    // Track active section using scroll listener
    useEffect(() => {
        if (!isOpen || items.length === 0) return;

        const handleScroll = () => {
            const scrollContainer = document.querySelector(".toc-content") as HTMLElement;
            if (!scrollContainer) return;

            const scrollPosition = scrollContainer.scrollTop + 140; // Account for header offset
            let currentActiveId = "";

            // Find the current section by checking which heading we've scrolled past
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                const element = document.getElementById(item.id);

                if (element) {
                    // Get element position relative to the scroll container
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;

                    if (scrollPosition >= elementTop - 50) {
                        // Small buffer for better UX
                        currentActiveId = item.id;
                        break;
                    }
                }
            }

            // If we haven't scrolled past any heading, check if we're near the top
            if (!currentActiveId && scrollPosition < 200 && items.length > 0) {
                currentActiveId = items[0].id;
            }

            setActiveId(currentActiveId);
        };

        // Add scroll listener to the scroll container
        const scrollContainer = document.querySelector(".toc-content");
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
        }

        // Initial check
        handleScroll();

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener("scroll", handleScroll);
            }
        };
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

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const scrollToHeading = (item: TOCItem): void => {
        console.log("Scrolling to:", item.level, item.text, "ID:", item.id); // Debug log

        const element = document.getElementById(item.id);

        if (element) {
            console.log("Element found:", element); // Debug log

            // Get the scrollable container
            const scrollContainer = document.querySelector(".toc-content") as HTMLElement;

            if (scrollContainer) {
                // Calculate position relative to the scroll container
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();

                const relativeTop = elementRect.top - containerRect.top;
                const currentScrollTop = scrollContainer.scrollTop;
                const headerOffset = 140;

                const targetScrollTop = currentScrollTop + relativeTop - headerOffset;

                console.log("Scrolling to position:", targetScrollTop); // Debug log

                scrollContainer.scrollTo({
                    top: targetScrollTop,
                    behavior: "smooth",
                });

                // Update active state immediately for better UX
                setActiveId(item.id);
            } else {
                // Fallback to window scroll
                const headerOffset = 140;
                const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
                const targetPosition = elementTop - headerOffset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth",
                });

                setActiveId(item.id);
            }
        } else {
            console.warn("Element not found for ID:", item.id); // Debug log
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
                    className="fixed min-w-80  max-w-[calc(100vw-3rem)] max-h-[calc(100vh-12rem)] bg-theme-surface/95 backdrop-blur-md rounded-2xl shadow-2xl border border-theme z-40 overflow-hidden"
                    style={{
                        top: position.top,
                        right: position.right,
                    }}
                    data-toc-panel
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-theme bg-theme-surface/80">
                        <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                            <Hash className="w-4 h-4 text-theme-accent" />
                            Table of Contents
                        </h3>
                        <motion.button
                            onClick={onClose}
                            className="p-1.5 hover:bg-theme-hover rounded-lg transition-colors group"
                            aria-label="Close table of contents"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X className="w-4 h-4 text-theme-secondary group-hover:text-theme-primary transition-colors" />
                        </motion.button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-theme-border scrollbar-track-transparent overflow-x-hidden">
                        {items.length === 0 ? (
                            <p className="text-sm text-theme-secondary text-center py-4">
                                No headings found in this document
                            </p>
                        ) : (
                            <nav className="overflow-x-visible">
                                <ul className="space-y-1 text-sm">
                                    {items.map((item) => (
                                        <motion.li
                                            whileHover={{ x: -2 }}
                                            key={`${item.id}-${item.index}`} // Use ID + index for uniqueness
                                        >
                                            <motion.button
                                                onClick={() => scrollToHeading(item)}
                                                className={`block py-2.5 px-3 text-left w-full rounded-lg transition-all duration-200 group ${
                                                    activeId === item.id
                                                        ? "bg-theme-active text-theme-accent border-l-3 border-theme-accent shadow-sm"
                                                        : "text-theme-secondary hover:text-theme-primary hover:bg-theme-hover"
                                                } ${
                                                    item.level === 1
                                                        ? "font-semibold text-base"
                                                        : item.level === 2
                                                        ? "ml-4 text-sm"
                                                        : item.level === 3
                                                        ? "ml-8 text-sm"
                                                        : item.level === 4
                                                        ? "ml-12 text-xs"
                                                        : item.level === 5
                                                        ? "ml-16 text-xs"
                                                        : "ml-20 text-xs"
                                                }`}
                                                title={item.path} // Show full path on hover
                                            >
                                                <span className="block truncate leading-tight">
                                                    {/* <span className="text-xs opacity-40 mt-1 inline mr-1">
                                                        H{item.level}
                                                    </span> */}
                                                    {item.text}
                                                </span>
                                            </motion.button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </nav>
                        )}
                    </div>

                    {/* Footer with item count and current active */}
                    {items.length > 0 && (
                        <div className="px-4 py-2 border-t border-theme bg-theme-surface/80">
                            <div className="text-xs text-theme-secondary text-center">
                                {items.length} section{items.length !== 1 ? "s" : ""}
                                {activeId && (
                                    <span className="ml-2 text-theme-accent">
                                        • {items.find((item) => item.id === activeId)?.text.slice(0, 30)}...
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
