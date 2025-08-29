import { motion } from "framer-motion";

import type { ReactNode } from "react";

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

export const IconButton: React.FC<{
    onClick: () => void;
    icon: ReactNode;
    "aria-label": string;
    title?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "ghost" | "outline";
    disabled?: boolean;
}> = ({ onClick, icon, className = "", size = "md", variant = "default", disabled = false, ...ariaProps }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-xl transition-all duration-200 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className} `}
            {...ariaProps}
        >
            <span className={`${iconSizes[size]} flex items-center justify-center`}>{icon}</span>
        </button>
    );
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
