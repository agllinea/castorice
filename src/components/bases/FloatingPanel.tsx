import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";

// ===== FLOATING PANEL =====
export const FloatingPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: ReactNode;
    position?: { top: number; right: number };
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}> = ({ isOpen, onClose, title, icon, position = { top: 0, right: 24 }, children, footer, className = "" }) => {
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
                    className={`
            fixed min-w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-12rem)] 
            bg-theme-surface/95 backdrop-blur-md rounded-2xl shadow-2xl 
            border border-theme z-40 overflow-hidden
            ${className}
          `}
                    style={{
                        top: position.top,
                        right: position.right,
                    }}
                    data-panel
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-theme bg-theme-surface/80">
                        <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                            {icon}
                            {title}
                        </h3>
                        <IconButton aria-label={`Close ${title.toLowerCase()}`} onClick={onClose} icon={<X />} />
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-theme-border scrollbar-track-transparent overflow-x-hidden">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && <div className="px-4 py-2 border-t border-theme bg-theme-surface/80">{footer}</div>}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
