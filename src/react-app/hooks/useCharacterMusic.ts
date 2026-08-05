import { useEffect, useRef, useState } from "react";

const FADE_DURATION = 950;
const PLAYING_VOLUME = 0.38;

function easeInOut(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

export function useCharacterMusic(trackUrl: string, muted: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const audioPool = useRef(new Set<HTMLAudioElement>());
  const fadeFrames = useRef(new Map<HTMLAudioElement, number>());

  const fadeTo = (audio: HTMLAudioElement, targetVolume: number, onComplete?: () => void) => {
    const existingFrame = fadeFrames.current.get(audio);
    if (existingFrame !== undefined) cancelAnimationFrame(existingFrame);

    const startingVolume = audio.volume;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / FADE_DURATION, 1);
      const eased = easeInOut(progress);
      audio.volume = Math.max(0, Math.min(1, startingVolume + (targetVolume - startingVolume) * eased));

      if (progress < 1) {
        fadeFrames.current.set(audio, requestAnimationFrame(animate));
        return;
      }

      fadeFrames.current.delete(audio);
      onComplete?.();
    };

    fadeFrames.current.set(audio, requestAnimationFrame(animate));
  };

  useEffect(() => {
    const absoluteTrackUrl = new URL(trackUrl, window.location.href).href;
    let nextAudio = currentAudio.current;

    if (!nextAudio || nextAudio.src !== absoluteTrackUrl) {
      nextAudio = new Audio(trackUrl);
      nextAudio.loop = false;
      nextAudio.preload = "auto";
      nextAudio.volume = 0;
      audioPool.current.add(nextAudio);
      currentAudio.current = nextAudio;
      setIsPlaying(false);
    }

    const selectedAudio = nextAudio;
    let disposed = false;
    let attemptingPlayback = false;
    const handleEnded = () => setIsPlaying(false);
    selectedAudio.addEventListener("ended", handleEnded);

    audioPool.current.forEach((audio) => {
      if (audio === selectedAudio) return;
      fadeTo(audio, 0, () => {
        audio.pause();
        audioPool.current.delete(audio);
      });
    });

    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", attemptPlayback, true);
      window.removeEventListener("keydown", attemptPlayback, true);
      window.removeEventListener("touchstart", attemptPlayback, true);
    };

    const addUnlockListeners = () => {
      window.addEventListener("pointerdown", attemptPlayback, true);
      window.addEventListener("keydown", attemptPlayback, true);
      window.addEventListener("touchstart", attemptPlayback, true);
    };

    async function attemptPlayback() {
      if (disposed || muted || attemptingPlayback || currentAudio.current !== selectedAudio) return;
      attemptingPlayback = true;
      try {
        await selectedAudio.play();
        if (disposed || muted || currentAudio.current !== selectedAudio) {
          selectedAudio.pause();
          return;
        }
        removeUnlockListeners();
        setIsPlaying(true);
        fadeTo(selectedAudio, PLAYING_VOLUME);
      } catch {
        selectedAudio.volume = 0;
        addUnlockListeners();
      } finally {
        attemptingPlayback = false;
      }
    }

    if (muted) {
      setIsPlaying(false);
      removeUnlockListeners();
      fadeTo(selectedAudio, 0, () => selectedAudio.pause());
    } else {
      void attemptPlayback();
    }

    return () => {
      disposed = true;
      removeUnlockListeners();
      selectedAudio.removeEventListener("ended", handleEnded);
    };
  }, [muted, trackUrl]);

  useEffect(() => () => {
    fadeFrames.current.forEach((frame) => cancelAnimationFrame(frame));
    fadeFrames.current.clear();
    audioPool.current.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    audioPool.current.clear();
  }, []);

  return isPlaying;
}
