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
                    "relative flex h-12 items-center justify-center overflow-hidden " +
                    // With a leading icon the sides are tuned by eye, not by number: the solid
                    // round icon reads heavier than the text, so its side is 2px tighter
                    // (20px vs 22px). Measured on screen, the visible gaps are ~20 and ~22.3.
                    (busy ? "pr-[22px] pl-5 " : "px-6 ") +
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
            // Same 18px box as the check badge, and the ring fills it, so both steps line up.
            className="size-[18px] animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
        >
            <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeOpacity={0.25} />
            <path d="M22.5 12A10.5 10.5 0 0 0 12 1.5" stroke="currentColor" />
        </svg>
    );
}

// A solid white circle with a green tick inside. The circle fills its whole box, so there is
// no empty space beside it to throw off the padding.
function Check() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]">
            <motion.circle
                cx="12"
                cy="12"
                r="12"
                fill="white"
                // The badge pops in, then the tick draws itself.
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
            />
            <motion.path
                d="M7 12.4l3.3 3.3L17 9"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.26, delay: 0.12, ease: "easeOut" }}
            />
        </svg>
    );
}
