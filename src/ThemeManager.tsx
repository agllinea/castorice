import React, { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";
import BackgroundMusicPlayer from "./components/BackgroundMusicPlayer";

// Scrollbar style configuration
export interface ScrollbarStyle {
    id: string;
    name: string;
    description: string;
    className: string;
    preview: string;
}

// Theme configuration interface
interface ThemeConfig {
    id: string;
    name: string;
    background: {
        image: string;
        overlay?: string;
        position?: string;
        size?: string;
        repeat?: string;
    };
    music: {
        path: string;
        volume?: number;
        fadeInDuration?: number;
    };
}

// Theme context interface
interface ThemeContextType {
    currentTheme: ThemeConfig;
    themes: Record<string, ThemeConfig>;
    setTheme: (themeId: string) => void;
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
    musicPlaying: boolean;
    currentScrollbarStyle: ScrollbarStyle;
    scrollbarStyles: ScrollbarStyle[];
    setScrollbarStyle: (styleId: string) => void;
}

// Available scrollbar styles
const SCROLLBAR_STYLES: ScrollbarStyle[] = [
    {
        id: "default",
        name: "Default",
        description: "Standard elegant scrollbars",
        className: "",
        preview: "━━━━━━━━━━"
    },
    {
        id: "elegant",
        name: "Elegant",
        description: "Premium gradient scrollbars with shadows",
        className: "scrollbar-elegant",
        preview: "▓▓▓▓▓▓▓▓▓▓"
    },
    {
        id: "invisible",
        name: "Invisible",
        description: "Completely hidden scrollbars",
        className: "scrollbar-invisible",
        preview: "          "
    }
];

// Pre-configured themes (simplified - colors now handled by CSS classes)
const THEMES: Record<string, ThemeConfig> = {
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

const DEFAULT_THEME = "purple";
const DEFAULT_SCROLLBAR_STYLE = "default";

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeManagerProps {
    children: ReactNode;
    defaultTheme?: string;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ children, defaultTheme = DEFAULT_THEME }) => {
    const [currentThemeId, setCurrentThemeId] = useState<string>(defaultTheme);
    const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
    const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
    const [currentScrollbarStyleId, setCurrentScrollbarStyleId] = useState<string>(DEFAULT_SCROLLBAR_STYLE);

    const currentTheme = THEMES[currentThemeId] || THEMES[DEFAULT_THEME];
    const currentScrollbarStyle = SCROLLBAR_STYLES.find(style => style.id === currentScrollbarStyleId) || SCROLLBAR_STYLES[0];

    // Load saved preferences
    useEffect(() => {
        const savedTheme = localStorage.getItem("app-theme");
        const savedMusicEnabled = localStorage.getItem("app-music-enabled");
        const savedScrollbarStyle = localStorage.getItem("app-scrollbar-style");

        if (savedTheme && THEMES[savedTheme]) {
            setCurrentThemeId(savedTheme);
        }

        if (savedMusicEnabled !== null) {
            setMusicEnabled(savedMusicEnabled === "true");
        }

        if (savedScrollbarStyle && SCROLLBAR_STYLES.find(style => style.id === savedScrollbarStyle)) {
            setCurrentScrollbarStyleId(savedScrollbarStyle);
        }
    }, []);

    // Apply theme class and background
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // Remove existing theme classes
        Object.keys(THEMES).forEach(themeId => {
            root.classList.remove(`theme-${themeId}`);
        });

        // Add current theme class
        root.classList.add(`theme-${currentThemeId}`);

        // Set background
        const theme = currentTheme;
        const backgroundStyle = `
            ${theme.background.overlay ? theme.background.overlay + "," : ""}
            url('${theme.background.image}')
        `;

        body.style.backgroundImage = backgroundStyle;
        body.style.backgroundPosition = theme.background.position || "center center";
        body.style.backgroundSize = theme.background.size || "cover";
        body.style.backgroundRepeat = theme.background.repeat || "no-repeat";
        body.style.backgroundAttachment = "fixed";

        // Save theme preference
        localStorage.setItem("app-theme", currentThemeId);
    }, [currentTheme, currentThemeId]);

    // Apply scrollbar style
    useEffect(() => {
        const html = document.documentElement;
        
        // Remove existing scrollbar classes
        SCROLLBAR_STYLES.forEach(style => {
            if (style.className) {
                html.classList.remove(style.className);
            }
        });

        // Add current scrollbar class
        if (currentScrollbarStyle.className) {
            html.classList.add(currentScrollbarStyle.className);
        }

        // Save scrollbar style preference
        localStorage.setItem("app-scrollbar-style", currentScrollbarStyleId);
    }, [currentScrollbarStyle, currentScrollbarStyleId]);

    // Save music preference
    useEffect(() => {
        localStorage.setItem("app-music-enabled", musicEnabled.toString());
    }, [musicEnabled]);

    const setTheme = (themeId: string): void => {
        if (THEMES[themeId]) {
            setCurrentThemeId(themeId);
        }
    };

    const setScrollbarStyle = (styleId: string): void => {
        if (SCROLLBAR_STYLES.find(style => style.id === styleId)) {
            setCurrentScrollbarStyleId(styleId);
        }
    };

    const handleMusicPlayStateChange = (playing: boolean): void => {
        setMusicPlaying(playing);
    };

    const contextValue: ThemeContextType = {
        currentTheme,
        themes: THEMES,
        setTheme,
        musicEnabled,
        setMusicEnabled,
        musicPlaying,
        currentScrollbarStyle,
        scrollbarStyles: SCROLLBAR_STYLES,
        setScrollbarStyle,
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            <BackgroundMusicPlayer
                musicPath={currentTheme.music.path}
                isPlaying={musicEnabled}
                volume={currentTheme.music.volume || 0.15}
                fadeInDuration={currentTheme.music.fadeInDuration || 30000}
                retryInterval={2000}
                onPlayStateChange={handleMusicPlayStateChange}
            />
            <div className={`theme-root theme-${currentThemeId}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeManager");
    }
    return context;
};

export type { ThemeConfig };
export default ThemeManager;