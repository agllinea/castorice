import type { ScrollbarStyle } from "./ThemeManager";

export const THEME_PREVIEWS = {
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

export const renderColorPreview = (themeId: string) => {
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

export const renderThemePreview = (themeId: string) => {
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

export const renderScrollbarPreview = (style: ScrollbarStyle) => {
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
            <div className="text-xs text-gray-600 px-2 py-1 font-mono">{style.preview}</div>
        </div>
    );
};
