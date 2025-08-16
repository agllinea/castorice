import { AnimatePresence, motion } from "framer-motion";
import { Hash, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { FloatingTOCProps } from "../types/component";

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
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: item.index * 0.03, duration: 0.2 }}
                                        >
                                            <motion.button
                                                whileHover={{ x: 2 }}
                                                onClick={() => scrollToHeading(item.id)}
                                                className={`block py-2 px-3 text-left w-full rounded-lg transition-colors ${
                                                    activeId === item.id
                                                        ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                                                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
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
