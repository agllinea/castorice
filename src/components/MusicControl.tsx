import { motion } from "framer-motion";
import { MusicIcon, Palette } from "lucide-react";
import React from "react";

interface MusicControlProps {
    currentTheme: { id: string; name: string };
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
}

const MusicControl: React.FC<MusicControlProps> = ({ currentTheme, musicEnabled, setMusicEnabled }) => (
    <div className="relative px-4 py-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <MusicIcon className="w-4 h-4 text-theme-accent" />
                <span className="text-xs text-theme-accent">{currentTheme.name}</span>
            </div>

            {/* Music toggle button - SVG sound waves */}
            <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className="p-2 rounded-lg transition-all opacity-100 hover:opacity-80"
            >
                <svg width="20" height="16" viewBox="0 0 20 16" className="text-theme-accent opacity-80">
                    {/* Sound wave bars */}
                    {[2, 6, 10, 14, 18].map((x, i) => (
                        <motion.line
                            key={i}
                            x1={x + 1}
                            x2={x + 1}
                            y1="8"
                            y2="8"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            animate={
                                musicEnabled
                                    ? {
                                          y1: [10, 2, 7, 4, 10],
                                          y2: [6, 14, 9, 12, 6],
                                      }
                                    : {
                                          y1: 7,
                                          y2: 9,
                                      }
                            }
                            transition={
                                musicEnabled
                                    ? {
                                          duration: 2,
                                          repeat: Infinity,
                                          delay: i * 0.15,
                                          ease: "easeInOut",
                                      }
                                    : {
                                          duration: 0.3,
                                          ease: "easeInOut",
                                      }
                            }
                        />
                    ))}
                </svg>
            </button>
        </div>
    </div>
);

export default MusicControl;
