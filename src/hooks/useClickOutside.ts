import { useEffect } from "react";

export const useClickOutside = (isOpen: boolean, onClose: () => void, selectors: string[] = []) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;

            // Check if click is on any of the specified selectors
            const isInsideComponent = selectors.some((selector) => target.closest(selector));

            if (!isInsideComponent) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, selectors]);
};
