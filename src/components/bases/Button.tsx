import { motion, noop } from "framer-motion";

import type { ReactNode } from "react";
import type { ReactElement } from "react";
import React from "react";
import "./style.css";
import type { tr } from "framer-motion/client";
const sizeStyles = {
    sm: "p-1.5 w-7 h-7",
    md: "p-2.5 w-10 h-10",
    lg: "p-3 w-12 h-12",
};

const variantStyles = {
    default: "hover:bg-theme-hover text-theme-secondary",
    ghost: "hover:bg-theme-hover/50 text-theme-secondary",
    outline: "border border-theme-border hover:bg-theme-hover text-theme-secondary hover:text-theme-primary",
};

const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
};

const stateColor = {
    normal: "",
    active: "text-theme-accent",
    disabled: "opacity-50 text-theme-secondary cursor-not-allowed",
};
const stateBackground = {
    normal: "bg-theme-surface group-hover:bg-theme-hover",
    active: "bg-theme-primary/50 text-theme-accent",
    disabled: "",
};

export const Button: React.FC<{
    onClick?: () => void;
    icon: ReactNode;
    children?: ReactNode;
    title?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
    isMobile?: boolean;
    disabled?: boolean;
    active?: boolean;
}> = ({ onClick, icon, children, className = "", size = "md", disabled = false, isMobile = false, active = false }) => {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`zzz-button ${isMobile ? "px-2.5" : "px-9"} py-2 font-bold ${
                active ? "text-black" : "text-white hover:text-gray-200"
            } transition-colors duraction-200`}
        >
            <motion.span
                className="zzz-button-bg-wrap absolute inset-0 flex"
                initial={{ scale: 1, opacity: 0 }}
                animate={
                    active
                        ? {
                              scale: [1.15, 1.2, 1.15],
                              opacity: [1, 1, 1],
                          }
                        : {
                              opacity: 0,
                          }
                }
                transition={{
                    duration: active ? 2 : 0.2,
                    repeat: active ? Infinity : 0, // only loop if active
                    ease: "easeInOut",
                }}
            >
                <motion.span className="zzz-button-bg absolute inset-0 flex">
                    <motion.span className="zzz-button-bg-inner" />
                </motion.span>
            </motion.span>

            <div
                className={`relative z-10 flex items-center justify-center gap-2 pointer-events-none ` }
            >
                {isMobile ? (
                    <span className={`${iconSizes[size]} flex items-center justify-center`}>{icon}</span>
                ) : (
                    <>{children}</>
                )}
            </div>
        </motion.button>
    );
};

type ButtonElement = ReactElement<React.ComponentProps<typeof Button>, typeof Button>;

export const ButtonGroup: React.FC<{
    children: ButtonElement | ButtonElement[];
    className?: string;
}> = ({ children, className = "" }) => {
    // Only render Button elements
    const filteredChildren = React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type === Button
    );
    return <div className={`zzz-button-group`}>{filteredChildren}</div>;
};

// ===== USAGE EXAMPLE =====
// // Additional usage examples with different variants and sizes:

// // Small ghost button
// <IconButton
//     onClick={handleAction}
//     icon={<SomeIcon />}
//     aria-label="Small action"
//     size="sm"
//     variant="ghost"
// />

// // Large outlined button
// <IconButton
//     onClick={handleAction}
//     icon={<SomeIcon />}
//     aria-label="Large action"
//     size="lg"
//     variant="outline"
// />

// // Disabled button
// <IconButton
//     onClick={handleAction}
//     icon={<SomeIcon />}
//     aria-label="Disabled action"
//     disabled={true}
// />

// // Custom styling
// <IconButton
//     onClick={handleAction}
//     icon={<SomeIcon />}
//     aria-label="Custom action"
//     className="bg-red-500 hover:bg-red-600"
// />
