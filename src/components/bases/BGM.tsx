import React, { useEffect, useRef, useState } from "react";

const BGM: React.FC<{
    musicPath: string;
    isPlaying: boolean;
    retryInterval?: number; // in milliseconds
    volume?: number; // 0 to 1
    fadeInDuration?: number; // in milliseconds, default 10 seconds
    onPlayStateChange?: (playing: boolean) => void;
}> = ({
    musicPath,
    isPlaying,
    retryInterval = 1000,
    volume = 0.2,
    fadeInDuration = 30000, // 10 seconds default fade-in
    onPlayStateChange,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [actuallyPlaying, setActuallyPlaying] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [playAttempts, setPlayAttempts] = useState(0);
    const [currentVolume, setCurrentVolume] = useState(0);

    // Function to start fade-in effect
    const startFadeIn = () => {
        if (!audioRef.current) return;

        // Clear any existing fade interval
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
        }

        // Start with very low volume (almost silent)
        const startVolume = 0.001;
        const targetVolume = volume;
        const steps = Math.max(50, fadeInDuration / 100); // At least 50 steps, or one step every 100ms
        const volumeIncrement = (targetVolume - startVolume) / steps;
        const stepDuration = fadeInDuration / steps;

        audioRef.current.volume = startVolume;
        setCurrentVolume(startVolume);

        let currentStep = 0;

        fadeIntervalRef.current = setInterval(() => {
            if (!audioRef.current) {
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                }
                return;
            }

            currentStep++;
            const newVolume = Math.min(targetVolume, startVolume + volumeIncrement * currentStep);
            audioRef.current.volume = newVolume;
            setCurrentVolume(newVolume);

            // If we've reached the target volume, stop the fade
            if (newVolume >= targetVolume || currentStep >= steps) {
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                }
            }
        }, stepDuration);
    };

    // Function to stop fade and set volume immediately
    const stopFadeAndSetVolume = (vol: number) => {
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.volume = vol;
            setCurrentVolume(vol);
        }
    };

    // Function to attempt playing the audio
    const attemptPlay = async () => {
        if (!audioRef.current || !isPlaying) return;

        try {
            // Check if audio can be played
            if (audioRef.current.readyState < 2) {
                console.log("Audio not ready, waiting...");
                return;
            }

            await audioRef.current.play();
            setActuallyPlaying(true);
            setPlayAttempts((prev) => prev + 1);
            onPlayStateChange?.(true);

            // Start the fade-in effect
            startFadeIn();

            // Clear any pending retry
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            console.log("Background music started successfully with fade-in");
        } catch (error: any) {
            const attempt = playAttempts + 1;
            setActuallyPlaying(false);
            setPlayAttempts(attempt);
            onPlayStateChange?.(false);

            // Log different error types
            if (error.name === "NotAllowedError") {
                console.log(`Background music play attempt ${attempt} failed: User interaction required`);
            } else if (error.name === "NotSupportedError") {
                console.error(
                    `Background music play attempt ${attempt} failed: Audio file not supported or not found at path: ${musicPath}`
                );
                // Don't retry for unsupported media
                return;
            } else {
                console.log(`Background music play attempt ${attempt} failed:`, error.name, error.message);
            }

            // Schedule retry if not already scheduled and still want to play
            if (!retryTimeoutRef.current && isPlaying && error.name !== "NotSupportedError") {
                retryTimeoutRef.current = setTimeout(() => {
                    retryTimeoutRef.current = null;
                    attemptPlay();
                }, retryInterval);
            }
        }
    };

    // Stop playing
    const stopPlay = () => {
        if (!audioRef.current) return;

        // Stop fade-in if running
        stopFadeAndSetVolume(0);

        audioRef.current.pause();
        setActuallyPlaying(false);
        onPlayStateChange?.(false);

        // Clear any pending retry
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    };

    // Handle user interaction to enable autoplay
    const handleUserInteraction = () => {
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
            if (isPlaying) {
                attemptPlay();
            }
        }
    };

    // Effect to handle isPlaying prop changes
    useEffect(() => {
        if (isPlaying) {
            attemptPlay();
        } else {
            stopPlay();
        }
    }, [isPlaying]);

    // Effect to handle volume changes during playback
    useEffect(() => {
        if (audioRef.current && actuallyPlaying && !fadeIntervalRef.current) {
            // Only update volume if we're not currently fading in
            audioRef.current.volume = volume;
            setCurrentVolume(volume);
        }
    }, [volume, actuallyPlaying]);

    useEffect(() => {
        // Ensure the path is absolute from the root
        const absolutePath = musicPath.startsWith("/") ? musicPath : `/${musicPath}`;

        // Create full URL to ensure it resolves from the root
        const fullUrl = `${window.location.origin}${absolutePath}`;

        console.log("Loading audio from:", fullUrl);

        const audio = new Audio(fullUrl);
        audio.loop = true;
        audio.volume = 0; // Start with no volume
        audio.preload = "auto";
        audioRef.current = audio;

        // Event listeners
        const handleCanPlay = () => {
            console.log("Background music can play, attempting to start...");
            if (isPlaying) {
                attemptPlay();
            }
        };

        const handleLoadStart = () => {
            console.log("Background music loading started");
        };

        const handleLoadedData = () => {
            console.log("Background music loaded successfully");
        };

        const handlePlay = () => {
            setActuallyPlaying(true);
            onPlayStateChange?.(true);
        };

        const handlePause = () => {
            setActuallyPlaying(false);
            onPlayStateChange?.(false);
            // Stop any ongoing fade
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
        };

        const handleEnded = () => {
            // This shouldn't trigger due to loop, but just in case
            if (isPlaying) {
                attemptPlay();
            }
        };

        const handleError = (e: Event) => {
            const audio = e.target as HTMLAudioElement;
            let errorMessage = "Unknown audio error";

            if (audio.error) {
                switch (audio.error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        errorMessage = "Audio loading aborted";
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        errorMessage = "Network error while loading audio";
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        errorMessage = "Audio decoding error";
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = `Audio file not supported or not found: ${musicPath}`;
                        break;
                }
            }

            console.error("Background music error:", errorMessage);
            setActuallyPlaying(false);
            onPlayStateChange?.(false);

            // Don't retry for src not supported errors
            if (audio.error?.code !== MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED && isPlaying) {
                retryTimeoutRef.current = setTimeout(() => {
                    retryTimeoutRef.current = null;
                    attemptPlay();
                }, retryInterval);
            }
        };

        audio.addEventListener("loadstart", handleLoadStart);
        audio.addEventListener("loadeddata", handleLoadedData);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        // Add user interaction listeners to the document
        const interactionEvents = ["click", "keydown", "touchstart"];
        interactionEvents.forEach((event) => {
            document.addEventListener(event, handleUserInteraction, { once: true });
        });

        // Start initial play attempt if isPlaying is true
        if (isPlaying) {
            attemptPlay();
        }

        return () => {
            // Cleanup
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
            }

            audio.removeEventListener("loadstart", handleLoadStart);
            audio.removeEventListener("loadeddata", handleLoadedData);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);

            interactionEvents.forEach((event) => {
                document.removeEventListener(event, handleUserInteraction);
            });

            audio.pause();
            audio.src = "";
        };
    }, [musicPath, retryInterval]);

    // This component renders nothing (invisible)
    return null;
};

export default BGM;
