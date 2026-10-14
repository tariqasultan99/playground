"use client";

import { motion } from "motion/react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// The theme lives on <html data-theme>, set before first paint by the inline script in
// layout.tsx; this component just reads and flips it.
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
}
const getTheme = (): Theme =>
    document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";

// Same feel as the dock: ~0.24s with a light bounce.
const KNOB_SPRING = { type: "spring", visualDuration: 0.24, bounce: 0.27 } as const;

// `className` should include a position (defaults to relative) — the track icons rely on it.
export function ThemeSwitch({ className = "relative" }: { className?: string }) {
    // Server snapshot is null, so the knob only appears once the real theme is known.
    const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);
    const dark = theme === "dark";

    function toggle() {
        const next: Theme = dark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem("theme", next);
        } catch {
            // Storage unavailable (private mode etc.): the switch still works for this visit.
        }
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Dark mode"
            onClick={toggle}
            disabled={theme === null}
            className={
                "flex h-9 w-[68px] items-center rounded-full bg-[var(--dock-bg)] p-1 " +
                "text-[var(--dock-fg-muted)] outline-none backdrop-blur-xl transition-colors " +
                "shadow-[inset_0_0_0_1px_var(--dock-border),0_4px_14px_-4px_rgb(0_0_0/0.14)] " +
                "hover:text-[var(--dock-fg)] focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] " +
                className
            }
        >
            {/* Track icons: sun on the left, moon on the right. */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-[9px]">
                <SunIcon />
                <MoonIcon />
            </span>
            {theme !== null && (
                <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{ x: dark ? 32 : 0 }}
                    transition={KNOB_SPRING}
                    className="relative grid size-7 place-items-center rounded-full bg-[var(--dock-fg)] text-[var(--background)] shadow-sm"
                >
                    {dark ? <MoonIcon /> : <SunIcon />}
                </motion.span>
            )}
        </button>
    );
}

function SunIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
        </svg>
    );
}
