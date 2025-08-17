import { AnimatePresence, motion } from "framer-motion";
import { Check, MousePointer, Palette, Settings, Volume2, VolumeX, X } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { useTheme } from "../ThemeManager";

import type { ThemeConfig, ScrollbarStyle } from "../ThemeManager";

interface ThemeSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
}

// Color preview configurations for each theme
const THEME_PREVIEWS = {
    purple: {
        colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
        gradient: "from-purple-500 to-purple-300",
        name: "Purple Dream",
    },
    gold: {
        colors: ["#f59e0b", "#fbbf24", "#fde68a"],
        gradient: "from-amber-500 to-amber-200",
        name: "Golden Elegance",
    },
    green: {
        colors: ["#10b981", "#34d399", "#a7f3d0"],
        gradient: "from-emerald-500 to-emerald-200",
        name: "Forest Serenity",
    },
};

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose, isMobile }) => {
    const { 
        currentTheme, 
        themes, 
        setTheme, 
        musicEnabled, 
        setMusicEnabled, 
        musicPlaying,
        currentScrollbarStyle,
        scrollbarStyles,
        setScrollbarStyle
    } = useTheme();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            setTimeout(() => modalRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleThemeChange = (themeId: string) => {
        setTheme(themeId);
    };

    const handleScrollbarStyleChange = (styleId: string) => {
        setScrollbarStyle(styleId);
    };

    const toggleMusic = () => {
        setMusicEnabled(!musicEnabled);
    };

    const renderColorPreview = (themeId: string) => {
        const preview = THEME_PREVIEWS[themeId as keyof typeof THEME_PREVIEWS];
        if (!preview) return null;

        return (
            <div className="flex gap-1">
                {preview.colors.map((color, index) => (
                    <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                ))}
            </div>
        );
    };

    const renderThemePreview = (themeId: string) => {
        const preview = THEME_PREVIEWS[themeId as keyof typeof THEME_PREVIEWS];
        if (!preview) return null;

        return (
            <div className={`w-full h-16 rounded-lg bg-gradient-to-r ${preview.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5" />
                <div className="absolute bottom-2 left-2">
                    <div className="w-8 h-1 bg-white/30 rounded mb-1" />
                    <div className="w-12 h-1 bg-white/20 rounded" />
                </div>
            </div>
        );
    };

    const renderScrollbarPreview = (style: ScrollbarStyle) => {
        const getPreviewStyle = () => {
            switch (style.id) {
                case "elegant":
                    return "bg-gradient-to-r from-purple-500 to-purple-300 shadow-md";
                case "minimal":
                    return "bg-gray-400";
                case "autohide":
                    return "bg-gray-300 opacity-50";
                case "glass":
                    return "bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm border border-white/20";
                case "invisible":
                    return "bg-transparent border border-dashed border-gray-300";
                default:
                    return "bg-gray-500";
            }
        };

        return (
            <div className="w-full h-6 bg-gray-100 rounded-md relative overflow-hidden border">
                <div className={`w-2 h-full rounded-sm absolute right-1 top-0 ${getPreviewStyle()}`} />
                <div className="text-xs text-gray-600 px-2 py-1 font-mono">
                    {style.preview}
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh]"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`flex flex-col overflow-auto backdrop-blur-sm rounded-2xl shadow-2xl border border-theme bg-theme-surface/95 max-h-[80vh] ${
                            isMobile ? "w-[90vw] max-w-md" : "w-[500px]"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 p-4 border-b border-theme">
                            <Settings className="w-6 h-6 flex-shrink-0 text-theme-secondary" />
                            <h2 className="flex-1 text-lg font-medium text-theme-primary">Settings</h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-theme-hover rounded-lg transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-theme-secondary" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-6 overflow-auto scrollbar-elegant">
                            {/* Theme Selection */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette className="w-4 h-4 text-theme-secondary" />
                                    <h3 className="text-sm font-bold text-theme-primary">Choose Theme</h3>
                                </div>
                                <div className="grid gap-3">
                                    {Object.entries(themes).map(([themeId, theme]) => {
                                        const isSelected = currentTheme.id === themeId;
                                        const preview = THEME_PREVIEWS[themeId as keyof typeof THEME_PREVIEWS];
                                        
                                        return (
                                            <motion.button
                                                key={themeId}
                                                onClick={() => handleThemeChange(themeId)}
                                                className={`relative p-3 rounded-xl transition-all duration-200 text-left border ${
                                                    isSelected
                                                        ? "border-theme-primary bg-theme-active"
                                                        : "border-theme hover:bg-theme-hover"
                                                }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">{renderColorPreview(themeId)}</div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-theme-primary">
                                                            {preview?.name || theme.name}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-theme-accent flex-shrink-0" />
                                                    )}
                                                </div>

                                                {/* Theme Preview */}
                                                <div className="mt-3">{renderThemePreview(themeId)}</div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Scrollbar Style Selection */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MousePointer className="w-4 h-4 text-theme-secondary" />
                                    <h3 className="text-sm font-bold text-theme-primary">Scrollbar Style</h3>
                                </div>
                                <div className="grid gap-2">
                                    {scrollbarStyles.map((style) => {
                                        const isSelected = currentScrollbarStyle.id === style.id;
                                        
                                        return (
                                            <motion.button
                                                key={style.id}
                                                onClick={() => handleScrollbarStyleChange(style.id)}
                                                className={`p-3 rounded-xl transition-all duration-200 text-left border ${
                                                    isSelected
                                                        ? "border-theme-primary bg-theme-active"
                                                        : "border-theme hover:bg-theme-hover"
                                                }`}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-theme-primary">
                                                            {style.name}
                                                        </div>
                                                        <div className="text-xs text-theme-secondary mt-0.5">
                                                            {style.description}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-theme-accent flex-shrink-0" />
                                                    )}
                                                </div>
                                                
                                                {/* Scrollbar Preview */}
                                                {renderScrollbarPreview(style)}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Music Settings */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    {musicEnabled ? (
                                        <Volume2 className="w-4 h-4 text-theme-secondary" />
                                    ) : (
                                        <VolumeX className="w-4 h-4 text-theme-secondary" />
                                    )}
                                    <h3 className="text-sm font-bold text-theme-primary">Audio Settings</h3>
                                </div>
                                <div className="space-y-3">
                                    <motion.button
                                        onClick={toggleMusic}
                                        className={`w-full p-3 rounded-xl transition-all duration-200 text-left border ${
                                            musicEnabled
                                                ? "border-theme-primary bg-theme-active"
                                                : "border-theme hover:bg-theme-hover"
                                        }`}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-theme-primary">Background Music</div>
                                                <div className="text-xs text-theme-secondary mt-0.5">
                                                    {musicEnabled ? "Currently playing" : "Disabled"}
                                                    {musicEnabled && musicPlaying && (
                                                        <span className="ml-1 text-theme-accent">♪</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div
                                                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                                        musicEnabled 
                                                            ? "bg-theme-accent scale-100" 
                                                            : "bg-theme-border scale-75"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ThemeSettings;