import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Palette } from "lucide-react";
import React from "react";

interface ThemeControlProps {
    currentTheme: { id: string; name: string };
    themes: Record<string, { id: string; name: string }>;
    themeDropdownOpen: boolean;
    setThemeDropdownOpen: (open: boolean) => void;
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
    onThemeSelect: (themeId: string) => void;
}

const ThemeControl: React.FC<ThemeControlProps> = ({
    currentTheme,
    themes,
    themeDropdownOpen,
    setThemeDropdownOpen,
    musicEnabled,
    setMusicEnabled,
    onThemeSelect,
}) => (
    <div className="relative">
        <div className="w-full flex items-center justify-between px-3 hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                {/* Clickable music control image in circle */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMusicEnabled(!musicEnabled);
                    }}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                        musicEnabled ? "bg-theme-primary/20 shadow-lg" : "bg-theme-surface/50 hover:bg-theme-primary/10"
                    }`}
                    animate={
                        musicEnabled
                            ? {
                                  y: [0, -4, 0],
                                  scale: [1, 1.05, 1],
                              }
                            : {
                                  y: 0,
                                  scale: 1,
                              }
                    }
                    transition={{
                        duration: 1.5,
                        repeat: musicEnabled ? Infinity : 0,
                        ease: "easeInOut",
                    }}
                >
                    <img src="/img/Sticker_Castorice_02.png" className="w-10 h-10 object-contain" alt="Music control" />
                    {musicEnabled && (
                        <motion.div
                            className="pulse absolute inset-0 rounded-full border-2 border-theme-primary/60"
                            // animate={{
                            //     // scale: [1, 1, 1.3],
                            //     opacity: [0, 1,0.75,0.5,0.25, 0],
                            // }}
                            // transition={{
                            //     duration: 2,
                            //     repeat: Infinity,
                            //     ease: "easeOut",
                            //     repeatDelay: 0,
                            // }}
                        />
                    )}
                </motion.button>

                {/* Theme name - clickable to open dropdown */}
                <button onClick={() => setThemeDropdownOpen(!themeDropdownOpen)} className="text-left py-3 flex-1">
                    <div className="text-sm text-theme-primary">{currentTheme.name}</div>
                </button>
            </div>

            {/* Chevron - clickable to open dropdown */}
            <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
            >
                <motion.div animate={{ rotate: themeDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronUp className="w-4 h-4 text-theme-secondary" />
                </motion.div>
            </button>
        </div>

        <AnimatePresence>
            {themeDropdownOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 right-0 mb-3 border border-theme/50 rounded-2xl shadow-md overflow-hidden backdrop-blur-md bg-theme-surface/90"
                >
                    {Object.values(themes).map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => onThemeSelect(theme.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-white/20 transition-all duration-200 flex items-center gap-3 ${
                                currentTheme.id === theme.id ? "bg-white/10 text-theme-accent" : "text-theme-secondary"
                            }`}
                        >
                            <div
                                className="w-4 h-4 rounded-full border-2 border-theme-primary"
                                style={{
                                    backgroundColor: `rgb(var(--theme-primary))`,
                                }}
                            />
                            <span className="text-sm">{theme.name}</span>
                        </button>
                    ))}
                    {/* Music Toggle */}
                    <div className="border-t border-theme/40">
                        <button
                            onClick={() => setMusicEnabled(!musicEnabled)}
                            className="w-full px-4 py-3 text-left hover:bg-white/20 transition-all duration-200 flex items-center gap-3 text-theme-secondary"
                        >
                            <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 border-theme-primary ${
                                    musicEnabled ? "bg-theme-primary" : "bg-transparent"
                                }`}
                            >
                                {musicEnabled && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <span className="text-sm">Background Music</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default ThemeControl;
