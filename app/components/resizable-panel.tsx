"use client";

import {
    type MotionValue,
    motion,
    type Transition,
    useReducedMotion,
    useSpring,
    useTransform,
} from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

// Panel width, as a share of the parent frame's width.
const MIN = 25;
const MAX = 50;
const DEFAULT = 33;
const STEP = 5; // arrow keys

// Same spring as the dock and the pay button. Used for keyboard and double-click changes and
// for the handle's shape; dragging the panel follows the pointer directly.
const SPRING_OPTIONS = { visualDuration: 0.24, bounce: 0.27 };
const SPRING: Transition = { type: "spring", ...SPRING_OPTIONS };

// Handle shape. One shape that morphs between states, so nothing swaps or jumps:
// resting capsule → taller capsule (hover / pressed) → thin line while moving.
const CAPSULE_WIDTH = 8; // includes its 1px border
const CAPSULE_HEIGHT = 36;
const CAPSULE_HEIGHT_ACTIVE = 48; // hover, keyboard focus, pressed
const CAPSULE_BORDER = 1;
const LINE_WIDTH = 4;
const LINE_HEIGHT = CAPSULE_HEIGHT_ACTIVE + 4;
const LINE_GAP = 4; // space between the panel border and the line, on the side it's moving to
// At the 25% / 50% limits the line goes thinner, straight, a little taller, and flickers.
const LIMIT_WIDTH = 2;
const LIMIT_HEIGHT = LINE_HEIGHT + 4;
const FLICKER_S = 0.45; // one off-on cycle; stays under 3 flashes a second
// Line centre, measured from the centre of the 1px border, keeping LINE_GAP clear of it.
const lineOffset = (lineWidth: number) => 0.5 + LINE_GAP + lineWidth / 2;

// Moving.
const MOVE_THRESHOLD = 2; // px of travel before a press counts as moving (ignores a shaky click)
const TURN_DISTANCE = 6; // px of travel the other way before the line switches sides
const MAX_BEND = 7; // px the middle can bow out
const BASE_BEND = 3; // bend as soon as it moves, however slowly
const VELOCITY_BEND = 0.3; // extra bend per px of (smoothed) pointer movement between events
const SETTLE_MS = 120; // straighten once the pointer stops moving
// Soft enough to ease into the bend, with a little wobble as it straightens.
const RUBBER = { stiffness: 280, damping: 18, mass: 0.6 };

const clamp = (value: number) => Math.min(MAX, Math.max(MIN, value));
const clampBend = (value: number) => Math.min(MAX_BEND, Math.max(-MAX_BEND, value));

// Springs to `value`, or jumps straight there when the visitor prefers reduced motion.
function animateTo(motionValue: MotionValue<number>, value: number, instant: boolean | null) {
    if (instant) motionValue.jump(value);
    else motionValue.set(value);
}

// A grey frame with a white side panel on the right. Drag the handle on the panel's left edge
// to resize it between 25% and 50% of the frame; double-click the handle to reset.
export function ResizablePanel() {
    const panelId = useId();
    const frameRef = useRef<HTMLDivElement>(null);
    // Distance between the pointer and the panel's edge when the drag started, so the panel
    // doesn't jump to the pointer.
    const grabOffset = useRef(0);
    const pressX = useRef(0);
    const lastX = useRef(0);
    const direction = useRef(0); // -1 left, 1 right, 0 not decided yet
    const reverseTravel = useRef(0);
    const velocity = useRef(0); // smoothed px per pointer event
    const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [width, setWidth] = useState(DEFAULT);
    const [hovered, setHovered] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);
    const [dragging, setDragging] = useState(false);
    // Pressed and has started moving: the handle stays a thin line until released.
    const [moving, setMoving] = useState(false);
    // Moving and held at the 25% or 50% limit.
    const [atLimit, setAtLimit] = useState(false);
    const reduceMotion = useReducedMotion();

    // The handle's shape, all springs so every change is continuous.
    const shapeWidth = useSpring(CAPSULE_WIDTH, SPRING_OPTIONS);
    const shapeHeight = useSpring(CAPSULE_HEIGHT, SPRING_OPTIONS);
    const border = useSpring(CAPSULE_BORDER, SPRING_OPTIONS);
    const side = useSpring(0, SPRING_OPTIONS); // px from the border's centre
    const bend = useSpring(0, RUBBER); // px the middle bows out, positive = right

    // A vertical stroke with round caps: the caps add half the stroke width at each end, so the
    // straight part is the height minus the width. The curve's control point sits at twice the
    // bend, so the middle of the curve lands exactly on the bend.
    const path = useTransform([shapeWidth, shapeHeight, bend], ([w, h, b]: number[]) => {
        const half = Math.max(0, (h - w) / 2);
        return `M0 ${-half}Q${2 * b} 0 0 ${half}`;
    });
    const fillWidth = useTransform([shapeWidth, border], ([w, b]: number[]) => w - 2 * b);

    useEffect(() => {
        const active = hovered || focusVisible || dragging;
        animateTo(
            shapeWidth,
            atLimit ? LIMIT_WIDTH : moving ? LINE_WIDTH : CAPSULE_WIDTH,
            reduceMotion,
        );
        animateTo(
            shapeHeight,
            atLimit
                ? LIMIT_HEIGHT
                : moving
                  ? LINE_HEIGHT
                  : active
                    ? CAPSULE_HEIGHT_ACTIVE
                    : CAPSULE_HEIGHT,
            reduceMotion,
        );
        animateTo(border, moving ? 0 : CAPSULE_BORDER, reduceMotion);
        if (!moving || atLimit) animateTo(bend, 0, reduceMotion);
        if (!moving) animateTo(side, 0, reduceMotion);
    }, [
        hovered,
        focusVisible,
        dragging,
        moving,
        atLimit,
        reduceMotion,
        shapeWidth,
        shapeHeight,
        border,
        side,
        bend,
    ]);

    // The frame's inner edges (px), inside its padding.
    function frameEdges() {
        const frame = frameRef.current;
        if (!frame) return null;
        const rect = frame.getBoundingClientRect();
        const style = getComputedStyle(frame);
        return {
            left: rect.left + Number.parseFloat(style.paddingLeft),
            right: rect.right - Number.parseFloat(style.paddingRight),
        };
    }

    // Width (%) the panel would have if its left edge sat at `clientX`.
    function widthAt(clientX: number) {
        const edges = frameEdges();
        if (!edges) return width;
        return ((edges.right - clientX) / (edges.right - edges.left)) * 100;
    }

    function endDrag() {
        clearTimeout(settleTimer.current);
        setDragging(false);
        setMoving(false);
        setAtLimit(false);
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
            {/* Main area. The 8px gap matches the frame's padding. */}
            <div className="mr-2 flex min-w-0 flex-1 flex-col gap-3 p-6">
                <div className="h-3 w-1/3 rounded-full bg-[var(--dock-active)]" />
                <div className="h-3 w-2/3 rounded-full bg-[var(--dock-hover)]" />
                <div className="h-3 w-1/2 rounded-full bg-[var(--dock-hover)]" />
            </div>

            {/* Side panel. Corner radius 20 = frame radius 28 − 8px padding, so the curves nest. */}
            <motion.aside
                id={panelId}
                aria-label="Side panel"
                initial={false}
                animate={{ width: `${width}%` }}
                transition={dragging ? { duration: 0 } : SPRING}
                className={
                    "relative flex shrink-0 flex-col gap-3 border border-[var(--panel-border)] " +
                    "bg-[var(--panel-surface)] p-5 text-[var(--dock-fg)]"
                }
                style={{ borderRadius: 20 }}
            >
                {/* Resize handle, centred on the panel's left border: a 12px-wide hit area with a
                    small capsule in the middle. Arrow keys, Home and End resize it from the
                    keyboard. */}
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
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                    onFocus={(e) => setFocusVisible(e.currentTarget.matches(":focus-visible"))}
                    onBlur={() => setFocusVisible(false)}
                    onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        grabOffset.current = widthAt(e.clientX) - width;
                        pressX.current = e.clientX;
                        lastX.current = e.clientX;
                        direction.current = 0;
                        reverseTravel.current = 0;
                        velocity.current = 0;
                        setDragging(true);
                    }}
                    onPointerMove={(e) => {
                        if (!dragging) return;
                        const wanted = widthAt(e.clientX) - grabOffset.current;
                        const next = clamp(wanted);
                        setWidth(next);
                        const moved = e.clientX - lastX.current;
                        lastX.current = e.clientX;
                        if (moved === 0) return;
                        if (!moving && Math.abs(e.clientX - pressX.current) < MOVE_THRESHOLD) return;

                        // Direction, with some give: a small wobble back doesn't flip the line
                        // to the other side; it switches after TURN_DISTANCE px the other way.
                        const sign = Math.sign(moved);
                        if (direction.current === 0) {
                            direction.current = sign;
                        } else if (sign !== direction.current) {
                            reverseTravel.current += Math.abs(moved);
                            if (reverseTravel.current >= TURN_DISTANCE) {
                                direction.current = sign;
                                reverseTravel.current = 0;
                            }
                        } else {
                            reverseTravel.current = 0;
                        }
                        velocity.current = velocity.current * 0.6 + moved * 0.4;

                        // Held at the 25% / 50% limit: the line goes straight (the effect above
                        // handles its shape) and the flicker on the svg below takes over.
                        const limitHit = wanted <= MIN || wanted >= MAX;
                        setAtLimit(limitHit);
                        setMoving(true);
                        // The line sits just off the border, on the side it's moving towards.
                        animateTo(
                            side,
                            direction.current * lineOffset(limitHit ? LIMIT_WIDTH : LINE_WIDTH),
                            reduceMotion,
                        );
                        clearTimeout(settleTimer.current);
                        if (reduceMotion || limitHit) return;

                        // Otherwise it bows gently towards the movement as soon as it moves, a
                        // little more when faster, and springs straight shortly after it stops.
                        const speed = Math.max(0, velocity.current * direction.current);
                        bend.set(clampBend(direction.current * (BASE_BEND + speed * VELOCITY_BEND)));
                        settleTimer.current = setTimeout(() => {
                            velocity.current = 0;
                            bend.set(0);
                        }, SETTLE_MS);
                    }}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
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
                    className={
                        "group absolute inset-y-0 left-[-0.5px] z-10 flex w-3 -translate-x-1/2 " +
                        "cursor-col-resize touch-none items-center justify-center outline-none"
                    }
                >
                    {/* The handle, drawn as a round-capped stroke so one shape can morph from
                        capsule to line. Resting, it's an 8px capsule covering the border (a thin
                        bar can't sit dead-centre on a 1px line at every screen density). The
                        outer stroke is its border, in the panel's surface colour: white in light
                        mode, the panel's dark grey in dark mode. */}
                    <motion.svg
                        aria-hidden="true"
                        width={1}
                        height={LINE_HEIGHT}
                        // (0, 0) is the centre of this box, so the shape sits centred on the border.
                        viewBox={`-0.5 ${-LINE_HEIGHT / 2} 1 ${LINE_HEIGHT}`}
                        style={{ x: side }}
                        // Flickers off and on while held at a limit (not with reduced motion).
                        initial={false}
                        animate={{ opacity: atLimit && !reduceMotion ? [1, 0.2, 1] : 1 }}
                        transition={
                            atLimit && !reduceMotion
                                ? { duration: FLICKER_S, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                                : { duration: 0.15 }
                        }
                        className={
                            "pointer-events-none absolute overflow-visible text-[var(--panel-handle)] " +
                            "transition-colors duration-150 group-hover:text-[var(--dock-fg-muted)] " +
                            "group-focus-visible:text-[var(--dock-ring)] group-data-[dragging]:text-[var(--dock-ring)]"
                        }
                    >
                        <motion.path
                            d={path}
                            fill="none"
                            strokeWidth={shapeWidth}
                            strokeLinecap="round"
                            className="stroke-[var(--panel-surface)]"
                        />
                        <motion.path
                            d={path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={fillWidth}
                            strokeLinecap="round"
                        />
                    </motion.svg>
                </div>

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
