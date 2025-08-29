import { motion } from "framer-motion";
import { Check, MousePointer, Palette, Settings, Volume2, VolumeX, X } from "lucide-react";
import React from "react";

import { useTheme } from "../../theme/ThemeManager";
import { renderColorPreview, renderScrollbarPreview, renderThemePreview, THEME_PREVIEWS } from "../../theme/preview";
import Modal from "../bases/Modal";
import { useAnimationVariants } from "../../hooks/useAnimationVariants";

const SystemConfig: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
}> = ({ isOpen, onClose, isMobile }) => {
    const { slideOnHover } = useAnimationVariants();

    const {
        currentTheme,
        themes,
        setTheme,
        musicEnabled,
        setMusicEnabled,
        musicPlaying,
        currentScrollbarStyle,
        scrollbarStyles,
        setScrollbarStyle,
    } = useTheme();

    const handleThemeChange = (themeId: string) => {
        setTheme(themeId);
    };

    const handleScrollbarStyleChange = (styleId: string) => {
        setScrollbarStyle(styleId);
    };

    const toggleMusic = () => {
        setMusicEnabled(!musicEnabled);
    };

    const ConfigItem = ({
        isSelected,
        onClick,
        children,
    }: {
        isSelected: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <span
            className={`block relative rounded-xl border transition-colors ${
                isSelected ? "border-theme-primary bg-theme-active" : "border-theme hover:bg-theme-hover"
            }`}
        >
            <motion.button onClick={onClick} className={`w-full p-3 text-left`} {...slideOnHover}>
                {children}
            </motion.button>
        </span>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} isMobile={isMobile} className="flex flex-col overflow-auto">
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
                                <ConfigItem
                                    key={themeId}
                                    isSelected={isSelected}
                                    onClick={() => handleThemeChange(themeId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">{renderColorPreview(themeId)}</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-theme-primary">
                                                {preview?.name || theme.name}
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-theme-accent flex-shrink-0" />}
                                    </div>
                                    <div className="mt-3">{renderThemePreview(themeId)}</div>
                                </ConfigItem>
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
                                <ConfigItem
                                    key={style.id}
                                    isSelected={isSelected}
                                    onClick={() => handleScrollbarStyleChange(style.id)}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-theme-primary">{style.name}</div>
                                            <div className="text-xs text-theme-secondary mt-0.5">
                                                {style.description}
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-theme-accent flex-shrink-0" />}
                                    </div>
                                    {renderScrollbarPreview(style)}
                                </ConfigItem>
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
                        <ConfigItem isSelected={musicEnabled} onClick={toggleMusic}>
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
                                            musicEnabled ? "bg-theme-accent scale-100" : "bg-theme-border scale-75"
                                        }`}
                                    />
                                </div>
                            </div>
                        </ConfigItem>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SystemConfig;
