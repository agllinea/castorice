import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    isMobile?: boolean;
    width?: string;
    maxWidth?: string;
    maxHeight?: string;
    topOffset?: string;
    className?: string;
    backdropClassName?: string;
    autoFocus?: boolean;
}> = ({
    isOpen,
    onClose,
    children,
    isMobile = false,
    width,
    maxWidth,
    maxHeight = "80vh",
    topOffset = "10vh",
    className = "",
    backdropClassName = "",
    autoFocus = true,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && autoFocus && modalRef.current) {
            setTimeout(() => modalRef.current?.focus(), 100);
        }
    }, [isOpen, autoFocus]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Default responsive width logic
    const getWidth = () => {
        if (width) return width;
        return isMobile ? "w-[90vw] max-w-md" : "w-[500px]";
    };

    const getMaxWidth = () => {
        if (maxWidth) return maxWidth;
        return isMobile ? "max-w-md" : "";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-start justify-center ${backdropClassName}`}
                    style={{ paddingTop: topOffset }}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`backdrop-blur-sm rounded-2xl shadow-2xl border border-theme bg-theme-surface/95 ${getWidth()} ${getMaxWidth()} ${className}`}
                        style={{ maxHeight }}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
