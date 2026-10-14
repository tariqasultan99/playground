"use client";

import { AnimatePresence, motion, type Transition, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type Status = "idle" | "processing" | "paid";

// How long each step lasts before moving on (ms).
const PROCESSING_MS = 1800; // simulated payment
const PAID_MS = 4000; // success is shown, then the button resets

// Same spring as the dock: ~0.24s with a light bounce. Drives the width change.
const SPRING: Transition = { type: "spring", visualDuration: 0.24, bounce: 0.27 };

const LABELS: Record<Status, string> = {
    idle: "Pay $5,999",
    processing: "Processing",
    paid: "Paid",
};

export function PayButton() {
    const [status, setStatus] = useState<Status>("idle");
    const reduceMotion = useReducedMotion();

    // Each step schedules the next one; leaving the step (or the page) cancels its timer.
    useEffect(() => {
        if (status === "idle") return;
        const timer = setTimeout(
            () => setStatus(status === "processing" ? "paid" : "idle"),
            status === "processing" ? PROCESSING_MS : PAID_MS,
        );
        return () => clearTimeout(timer);
    }, [status]);

    const busy = status !== "idle";

    return (
        <>
            <motion.button
                type="button"
                layout
                transition={{ layout: reduceMotion ? { duration: 0 } : SPRING }}
                onClick={() => !busy && setStatus("processing")}
                // aria-disabled (not disabled) keeps keyboard focus on the button while it works.
                aria-disabled={busy}
                // Pressed: a small squeeze, only while it can be clicked.
                whileTap={busy ? undefined : { scale: 0.97 }}
                className={
                    "relative flex h-12 items-center justify-center overflow-hidden px-6 " +
                    "text-[15px] font-semibold outline-none transition-colors duration-300 " +
                    "focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] focus-visible:ring-offset-2 " +
                    "focus-visible:ring-offset-[var(--background)] " +
                    (status === "paid"
                        ? "cursor-default bg-green-600 text-white"
                        : "bg-[var(--dock-fg)] text-[var(--background)] " +
                          (busy ? "cursor-progress" : "cursor-pointer hover:opacity-90"))
                }
                // Inline radius so the layout animation keeps it a true pill while resizing.
                style={{ borderRadius: 9999 }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={status}
                        layout="position"
                        initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="flex items-center gap-2 whitespace-nowrap"
                    >
                        {status === "processing" && <Spinner />}
                        {status === "paid" && <Check />}
                        {LABELS[status]}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* Announces each step to screen readers. */}
            <span className="sr-only" aria-live="polite">
                {status === "idle" ? "" : status === "processing" ? "Processing payment" : "Paid"}
            </span>
        </>
    );
}

function Spinner() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
        >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.25} />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" />
        </svg>
    );
}

function Check() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                // The tick draws itself in.
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
            />
        </svg>
    );
}
