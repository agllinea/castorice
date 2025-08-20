import type { ScrollbarStyle, ThemeConfig } from "../types/model";

// Available scrollbar styles
export const SCROLLBAR_STYLES: ScrollbarStyle[] = [
    {
        id: "default",
        name: "Default",
        description: "Standard elegant scrollbars",
        className: "",
        preview: "━━━━━━━━━━",
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "Premium gradient scrollbars with shadows",
        className: "scrollbar-elegant",
        preview: "▓▓▓▓▓▓▓▓▓▓",
    },
    {
        id: "invisible",
        name: "Invisible",
        description: "Completely hidden scrollbars",
        className: "scrollbar-invisible",
        preview: "          ",
    },
];

// Pre-configured themes (simplified - colors now handled by CSS classes)
export const THEMES: Record<string, ThemeConfig> = {
    purple: {
        id: "purple",
        name: "Purple Dream",
        background: {
            image: "/themes/purple/background.jpg",
            overlay: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(196, 181, 253, 0.05) 100%)",
            position: "center center",
            size: "cover",
            repeat: "no-repeat",
        },
        music: {
            path: "/themes/purple/bgm.mp3",
            volume: 0.15,
            fadeInDuration: 30000,
        },
    },
    gold: {
        id: "gold",
        name: "Golden Elegance",
        background: {
            image: "/themes/gold/background.jpg",
            overlay: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(253, 230, 138, 0.05) 100%)",
            position: "center center",
            size: "cover",
            repeat: "no-repeat",
        },
        music: {
            path: "/themes/gold/bgm.mp3",
            volume: 0.18,
            fadeInDuration: 25000,
        },
    },
    green: {
        id: "green",
        name: "Forest Serenity",
        background: {
            image: "/themes/green/background.jpg",
            overlay: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(167, 243, 208, 0.05) 100%)",
            position: "center center",
            size: "cover",
            repeat: "no-repeat",
        },
        music: {
            path: "/themes/green/bgm.mp3",
            volume: 0.12,
            fadeInDuration: 35000,
        },
    },
};

export const DEFAULT_THEME = "purple";
export const DEFAULT_SCROLLBAR_STYLE = "default";