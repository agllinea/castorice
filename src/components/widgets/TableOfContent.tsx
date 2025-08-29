import { Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import type { ToCItem } from "../../types/model";
import { TreeNode } from "../bases/TreeView";
import { useClickOutside } from "../../hooks/useClickOutside";
import { FloatingPanel } from "../bases/FloatingPanel";

export const TableOfContent: React.FC<{
    items: ToCItem[];
    isOpen: boolean;
    onClose: () => void;
}> = ({ items, isOpen, onClose }) => {
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

    // Track active section using scroll listener (existing logic)
    useEffect(() => {
        if (!isOpen || items.length === 0) return;

        const handleScroll = () => {
            const scrollContainer = document.querySelector(".toc-content") as HTMLElement;
            if (!scrollContainer) return;

            const scrollPosition = scrollContainer.scrollTop + 140;
            let currentActiveId = "";

            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                const element = document.getElementById(item.id);

                if (element) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;

                    if (scrollPosition >= elementTop - 50) {
                        currentActiveId = item.id;
                        break;
                    }
                }
            }

            if (!currentActiveId && scrollPosition < 200 && items.length > 0) {
                currentActiveId = items[0].id;
            }

            setActiveId(currentActiveId);
        };

        const scrollContainer = document.querySelector(".toc-content");
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
        }

        handleScroll();

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener("scroll", handleScroll);
            }
        };
    }, [items, isOpen]);

    // Use shared hooks
    useClickOutside(isOpen, onClose, ["[data-panel]", "#toc-toggle-button"]);
    useEscapeKey(isOpen, onClose);

    const scrollToHeading = (item: ToCItem): void => {
        const element = document.getElementById(item.id);

        if (element) {
            const scrollContainer = document.querySelector(".toc-content") as HTMLElement;

            if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top;
                const currentScrollTop = scrollContainer.scrollTop;
                const headerOffset = 140;
                const targetScrollTop = currentScrollTop + relativeTop - headerOffset;

                scrollContainer.scrollTo({
                    top: targetScrollTop,
                    behavior: "smooth",
                });

                setActiveId(item.id);
            } else {
                const headerOffset = 140;
                const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
                const targetPosition = elementTop - headerOffset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth",
                });

                setActiveId(item.id);
            }
        }
    };

    const getTOCItemStyles = (item: ToCItem) => {
        const levelStyles = {
            1: "text-base",
            2: "ml-4 text-sm",
            3: "ml-8 text-sm",
            4: "ml-12 text-xs",
            5: "ml-16 text-xs",
            6: "ml-20 text-xs",
        };
        return levelStyles[item.level as keyof typeof levelStyles] || "ml-20 text-xs";
    };

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Table of Contents"
            icon={<Hash className="w-4 h-4 text-theme-accent" />}
            position={position}
            footer={
                items.length > 0 ? (
                    <div className="text-xs text-theme-secondary text-center">
                        {items.length} section{items.length !== 1 ? "s" : ""}
                        {activeId && (
                            <span className="ml-2 text-theme-accent">
                                • {items.find((item) => item.id === activeId)?.text.slice(0, 30)}...
                            </span>
                        )}
                    </div>
                ) : undefined
            }
        >
            {items.length === 0 ? (
                <p className="text-sm text-theme-secondary text-center py-4">No headings found in this document</p>
            ) : (
                <nav className="overflow-x-visible">
                    <ul className="space-y-1 text-sm">
                        {items.map((item) => (
                            <li key={`${item.id}-${item.index}`}>
                                <TreeNode
                                    isActive={activeId === item.id}
                                    onClick={() => scrollToHeading(item)}
                                    className={getTOCItemStyles(item)}
                                    title={item.path}
                                >
                                    <span className="block truncate leading-tight">{item.text}</span>
                                </TreeNode>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </FloatingPanel>
    );
};
