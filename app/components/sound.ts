"use client";

import { useSyncExternalStore } from "react";

// UI sound effects. Drop the files into public/sounds/ with these names; a missing file
// is simply skipped, so the UI keeps working silently until the sounds are added.
const FILES = {
    hover: "/sounds/hover.wav", // "bencho-lull", ~0.26s
    press: "/sounds/press.wav", // "bencho-pop", ~0.08s
} as const;

export type SoundName = keyof typeof FILES;

// Kept low on purpose: hover sounds play often and get tiring when loud.
// 1 = the file's own loudness; above 1 boosts it but can start to crackle.
const VOLUME: Record<SoundName, number> = { hover: 1, press: 1 };

const STORAGE_KEY = "sound";

/* ------------------------------------------------------------------ */
/* On / off (shared by every component, remembered between visits)     */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let enabled: boolean | null = null;

function readEnabled() {
    if (enabled === null) {
        try {
            enabled = localStorage.getItem(STORAGE_KEY) !== "off";
        } catch {
            enabled = true;
        }
    }
    return enabled;
}

export function setSoundEnabled(next: boolean) {
    enabled = next;
    try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
        // Storage unavailable: the choice still applies for this visit.
    }
    for (const notify of listeners) notify();
}

// Returns null on the server, before the saved choice is known.
export function useSoundEnabled() {
    return useSyncExternalStore<boolean | null>(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        readEnabled,
        () => null,
    );
}

/* ------------------------------------------------------------------ */
/* Playback (Web Audio: preloaded, instant, can overlap)               */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};

function setup() {
    if (ctx || typeof window === "undefined") return;
    ctx = new AudioContext();
    const audio = ctx;
    for (const [name, url] of Object.entries(FILES) as [SoundName, string][]) {
        fetch(url)
            .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(res.status)))
            .then((data) => audio.decodeAudioData(data))
            .then((buffer) => {
                buffers[name] = buffer;
            })
            .catch(() => {
                // Not added yet (or unreadable): stay silent.
            });
    }
}

// Browsers keep audio locked until the visitor clicks, taps or types once, so the audio
// engine starts (and the sounds load) on that first interaction.
if (typeof window !== "undefined") {
    const unlock = () => {
        setup();
        void ctx?.resume();
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    // Every click on a button anywhere in the project plays the press sound (keyboard
    // Enter/Space fire "click" too). Capture phase: we see the button as it was when
    // clicked, so a busy (aria-disabled) button stays silent.
    window.addEventListener(
        "click",
        (e) => {
            const target = interactive(e.target);
            if (target && target.getAttribute("aria-disabled") !== "true") playSound("press");
        },
        true,
    );

    // Every hover onto a button anywhere in the project plays the hover sound: once per
    // button entered (moving within it, or over its icon and label, stays quiet). Mouse
    // only, since touch has no hover. Disabled or busy buttons have no hover state, so
    // they stay silent.
    window.addEventListener("pointerover", (e) => {
        if (e.pointerType !== "mouse") return;
        const target = interactive(e.target);
        if (!target || target === interactive(e.relatedTarget)) return;
        if (target.matches(":disabled") || target.getAttribute("aria-disabled") === "true") return;
        playSound("hover");
    });
}

function interactive(node: EventTarget | null) {
    return node instanceof Element ? node.closest("button, a[href], [role=button]") : null;
}

export function playSound(name: SoundName) {
    const buffer = buffers[name];
    if (!ctx || !buffer || !readEnabled() || ctx.state !== "running") return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = VOLUME[name];
    source.buffer = buffer;
    source.connect(gain).connect(ctx.destination);
    source.start();
}
