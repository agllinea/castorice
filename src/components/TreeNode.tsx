import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FileText, Wrench } from "lucide-react";

import type { TreeNodeComponentProps } from "../types/component";

export const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
    node,
    level = 0,
    currentDocId,
    expandedNodes,
    isMobile,
    onDocSelect,
    onToggleNode,
}) => {
    const handleNodeClick = (): void => {
        if (node.children) {
            onToggleNode(node.id);
        } else {
            onDocSelect(node.id);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNodeClick();
        }
    };

    const isActive = currentDocId === node.id;
    const isExpanded = expandedNodes.includes(node.id);

    return (
        <div className="select-none">
            {node.children ? (
                <div>
                    <motion.div
                        whileHover={{ x: -2 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-theme-hover transition-colors text-theme-primary`}
                        onClick={handleNodeClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`}
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex items-center justify-center"
                        >
                            <ChevronRight className="w-4 h-4 text-theme-secondary" />
                        </motion.div>
                        <span className="text-sm">{node.label}</span>
                    </motion.div>
                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: "easeInOut",
                                    opacity: { duration: 0.2 },
                                }}
                                className="overflow-hidden"
                            >
                                <div className="ml-6 space-y-1 pt-1">
                                    {node.children.map((child, index) => (
                                        <motion.div
                                            key={child.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{
                                                duration: 0.15,
                                                delay: index * 0.03, // Subtle stagger for smoother appearance
                                                ease: "easeOut",
                                            }}
                                        >
                                            <TreeNodeComponent
                                                node={child}
                                                level={level + 1}
                                                currentDocId={currentDocId}
                                                expandedNodes={expandedNodes}
                                                isMobile={isMobile}
                                                onDocSelect={onDocSelect}
                                                onToggleNode={onToggleNode}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    whileHover={{ x: -2 }}
                    // whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer 
                        transition-colors
                        ${isActive ? "bg-theme-active text-theme-accent" : "text-theme-primary hover:bg-theme-hover"}
                    `}
                    onClick={handleNodeClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    aria-label={`Select ${node.label}`}
                    aria-current={isActive ? "page" : undefined}
                >
                    {node.type === "tool" ? (
                        <Wrench className={`w-4 h-4 ${isActive ? "text-theme-accent" : "text-theme-secondary"}`} />
                    ) : (
                        <FileText className={`w-4 h-4 ${isActive ? "text-theme-accent" : "text-theme-secondary"}`} />
                    )}
                    <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{node.label}</span>
                </motion.div>
            )}
        </div>
    );
};
