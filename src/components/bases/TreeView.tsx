import { AnimatePresence, motion } from "framer-motion";

import type { ReactNode } from "react";
import { useAnimationVariants } from "../../hooks/useAnimationVariants";

export const Collapsible: React.FC<{
    isExpanded: boolean;
    children: ReactNode;
    staggerDelay?: number;
}> = ({ isExpanded, children, staggerDelay = 0.03 }) => {
    return (
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
                    <div className="">
                        {Array.isArray(children)
                            ? children.map((child, index) => (
                                  <motion.div
                                      key={index}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{
                                          duration: 0.15,
                                          delay: index * staggerDelay,
                                          ease: "easeOut",
                                      }}
                                  >
                                      {child}
                                  </motion.div>
                              ))
                            : children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const TreeNode: React.FC<{
    children: ReactNode;
    isActive?: boolean;
    onClick: () => void;
    className?: string;
    level?: number;
    "aria-label"?: string;
    "aria-current"?: boolean | "time" | "page" | "false" | "true" | "step" | "location" | "date";
    "aria-expanded"?: boolean;
    title?: string;
}> = ({ children, isActive = false, onClick, className = "", level = 0, ...ariaProps }) => {
    const { fadeIn, slideOnHover } = useAnimationVariants();
    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <motion.div
            {...fadeIn}
            className={`mb-1 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive ? "bg-theme-active text-theme-accent" : "text-theme-secondary hover:bg-theme-hover"
            } ${className}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            {...ariaProps}
        >
            <motion.span className="flex items-center gap-2 px-3 py-2" {...slideOnHover}>
                {children}
            </motion.span>
        </motion.div>
    );
};

export const TreeBranch: React.FC<{
    children: ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    icon?: ReactNode;
    label: string;
    className?: string;
}> = ({ children, isExpanded, onToggle, icon, label, className = "" }) => {
    return (
        <div className="select-none">
            <TreeNode
                onClick={onToggle}
                className={`${className} hover:bg-theme-hover`}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label}`}
            >
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                >
                    {icon}
                </motion.div>
                <span className="text-sm">{label}</span>
            </TreeNode>

            <Collapsible isExpanded={isExpanded}>
                <div className="ml-6">{children}</div>
            </Collapsible>
        </div>
    );
};
