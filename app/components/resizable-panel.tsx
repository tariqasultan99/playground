"use client";

import { motion, type Transition } from "motion/react";
import { useId, useRef, useState } from "react";

// Panel width, as a share of the parent frame's width.
const MIN = 25;
const MAX = 50;
const DEFAULT = 33;
const STEP = 5; // arrow keys

// Same spring as the dock and the pay button. Used for keyboard and double-click changes;
// dragging follows the pointer directly.
const SPRING: Transition = { type: "spring", visualDuration: 0.24, bounce: 0.27 };

const clamp = (value: number) => Math.min(MAX, Math.max(MIN, value));

// A grey frame with a white side panel on the right. Drag the handle on the panel's left edge
// to resize it between 25% and 50% of the frame; double-click the handle to reset.
export function ResizablePanel() {
    const panelId = useId();
    const frameRef = useRef<HTMLDivElement>(null);
    // Distance between the pointer and the panel's edge when the drag started, so the panel
    // doesn't jump to the pointer.
    const grabOffset = useRef(0);
    const [width, setWidth] = useState(DEFAULT);
    const [dragging, setDragging] = useState(false);

    // Width (%) the panel would have if its left edge sat at `clientX`.
    function widthAt(clientX: number) {
        const frame = frameRef.current;
        if (!frame) return width;
        const rect = frame.getBoundingClientRect();
        const style = getComputedStyle(frame);
        const left = rect.left + Number.parseFloat(style.paddingLeft);
        const right = rect.right - Number.parseFloat(style.paddingRight);
        return ((right - clientX) / (right - left)) * 100;
    }

    return (
        <div
            ref={frameRef}
            className={
                "flex h-[560px] w-full bg-[var(--panel-frame)] p-2 " +
                "shadow-[inset_0_0_0_1px_var(--dock-border)] " +
                (dragging ? "cursor-col-resize select-none" : "")
            }
            style={{ borderRadius: 28 }}
        >
            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
                <div className="h-3 w-1/3 rounded-full bg-[var(--dock-active)]" />
                <div className="h-3 w-2/3 rounded-full bg-[var(--dock-hover)]" />
                <div className="h-3 w-1/2 rounded-full bg-[var(--dock-hover)]" />
            </div>

            {/* Resize handle: a 12px-wide hit area with a small pill in the middle. Arrow keys,
                Home and End resize it from the keyboard. */}
            <div
                role="separator"
                tabIndex={0}
                aria-label="Resize side panel"
                aria-controls={panelId}
                aria-orientation="vertical"
                aria-valuemin={MIN}
                aria-valuemax={MAX}
                aria-valuenow={Math.round(width)}
                aria-valuetext={`${Math.round(width)}% wide`}
                data-dragging={dragging || undefined}
                onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    grabOffset.current = widthAt(e.clientX) - width;
                    setDragging(true);
                }}
                onPointerMove={(e) => {
                    if (!dragging) return;
                    setWidth(clamp(widthAt(e.clientX) - grabOffset.current));
                }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onDoubleClick={() => setWidth(DEFAULT)}
                onKeyDown={(e) => {
                    const next: ((w: number) => number) | null =
                        e.key === "ArrowLeft"
                            ? (w) => w + STEP
                            : e.key === "ArrowRight"
                              ? (w) => w - STEP
                              : e.key === "Home"
                                ? () => MIN
                                : e.key === "End"
                                  ? () => MAX
                                  : null;
                    if (next === null) return;
                    e.preventDefault();
                    setWidth((w) => clamp(next(w)));
                }}
                className="group flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center rounded-full outline-none"
            >
                <span
                    className={
                        "h-8 w-1 rounded-full bg-[var(--panel-handle)] transition-[height,background-color] duration-150 " +
                        "group-hover:h-12 group-hover:bg-[var(--dock-fg-muted)] " +
                        "group-focus-visible:h-12 group-focus-visible:bg-[var(--dock-ring)] " +
                        "group-data-[dragging]:h-12 group-data-[dragging]:bg-[var(--dock-ring)]"
                    }
                />
            </div>

            {/* Side panel. Corner radius 20 = frame radius 28 − 8px padding, so the curves nest. */}
            <motion.aside
                id={panelId}
                aria-label="Side panel"
                initial={false}
                animate={{ width: `${width}%` }}
                transition={dragging ? { duration: 0 } : SPRING}
                className={
                    "flex shrink-0 flex-col gap-3 overflow-hidden border border-[var(--panel-border)] " +
                    "bg-[var(--panel-surface)] p-5 text-[var(--dock-fg)]"
                }
                style={{ borderRadius: 20 }}
            >
                <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate text-[15px] font-semibold">Side panel</h2>
                    <span className="text-[13px] font-medium tabular-nums text-[var(--dock-fg-muted)]">
                        {Math.round(width)}%
                    </span>
                </div>
                <div className="h-3 w-3/4 rounded-full bg-[var(--dock-active)]" />
                <div className="h-3 w-1/2 rounded-full bg-[var(--dock-hover)]" />
                <div className="h-3 w-2/3 rounded-full bg-[var(--dock-hover)]" />
            </motion.aside>
        </div>
    );
}
