"use client";

import { AnimatePresence, motion } from "motion/react";
import { playSound, setSoundEnabled, useSoundEnabled } from "./sound";

// Round on/off button for UI sounds, styled like the theme switch next to it.
// `className` should include a position.
export function SoundSwitch({ className = "relative" }: { className?: string }) {
    const enabled = useSoundEnabled();

    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled === true}
            aria-label="Sound effects"
            onClick={() => {
                setSoundEnabled(!enabled);
                // The global click sound ran while still muted; confirm "on" with the sound.
                if (!enabled) playSound("press");
            }}
            disabled={enabled === null}
            className={
                "grid size-9 place-items-center rounded-full bg-[var(--dock-bg)] " +
                "text-[var(--dock-fg-muted)] outline-none backdrop-blur-xl transition-colors " +
                "shadow-[inset_0_0_0_1px_var(--dock-border),0_4px_14px_-4px_rgb(0_0_0/0.14)] " +
                "hover:text-[var(--dock-fg)] focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] " +
                className
            }
        >
            {enabled !== null && (
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={enabled ? "on" : "off"}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.14, ease: "easeOut" }}
                        className="grid place-items-center"
                    >
                        <SpeakerIcon muted={!enabled} />
                    </motion.span>
                </AnimatePresence>
            )}
        </button>
    );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
            {muted ? (
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
            ) : (
                <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
            )}
        </svg>
    );
}
