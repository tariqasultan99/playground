"use client";

import {
    AnimatePresence,
    animate,
    MotionConfig,
    motion,
    type Transition,
    useIsPresent,
    useMotionValue,
    useReducedMotion,
    type Variants,
} from "motion/react";
import { type ReactNode, type Ref, useEffect, useLayoutEffect, useRef, useState } from "react";
// Loads the project-wide hover and click sounds.
import "./sound";

/* ------------------------------------------------------------------ */
/* Icons: outline by default, filled when active                       */
/* ------------------------------------------------------------------ */

type IconName =
    | "home"
    | "search"
    | "bell"
    | "user"
    | "more"
    | "sliders"
    | "help"
    | "moon"
    | "lock"
    | "chat"
    | "book";

const ICONS: Record<IconName, (filled: boolean) => ReactNode> = {
    home: (f) => (
        <path
            d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.25v-5.75h-5.5v5.75H5A1.5 1.5 0 0 1 3.5 19z"
            fill={f ? "currentColor" : "none"}
        />
    ),
    search: (f) => (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" fill={f ? "currentColor" : "none"} />
            <path d="m15.5 15.5 5 5" strokeWidth={f ? 2.6 : undefined} />
        </>
    ),
    bell: (f) => (
        <>
            <path
                d="M6 9.5a6 6 0 0 1 12 0c0 4.2 1.4 6.2 2.2 7H3.8c.8-.8 2.2-2.8 2.2-7Z"
                fill={f ? "currentColor" : "none"}
            />
            <path d="M10 20a2.1 2.1 0 0 0 4 0" />
        </>
    ),
    user: (f) => (
        <>
            <circle cx="12" cy="8" r="4" fill={f ? "currentColor" : "none"} />
            <path
                d="M4.5 20.5c.6-3.8 3.6-6 7.5-6s6.9 2.2 7.5 6z"
                fill={f ? "currentColor" : "none"}
            />
        </>
    ),
    more: (f) => (
        <>
            {[
                [4, 4],
                [13.5, 4],
                [4, 13.5],
                [13.5, 13.5],
            ].map(([x, y]) => (
                <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width="6.5"
                    height="6.5"
                    rx="1.8"
                    fill={f ? "currentColor" : "none"}
                />
            ))}
        </>
    ),
    sliders: (f) => (
        <>
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="2.5" fill={f ? "currentColor" : "var(--dock-bg)"} />
            <circle cx="15" cy="17" r="2.5" fill={f ? "currentColor" : "var(--dock-bg)"} />
        </>
    ),
    help: (f) => (
        <>
            <circle cx="12" cy="12" r="8.5" fill={f ? "currentColor" : "none"} />
            <path
                d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6M12 17h.01"
                stroke={f ? "var(--dock-bg)" : "currentColor"}
            />
        </>
    ),
    moon: (f) => (
        <path
            d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"
            fill={f ? "currentColor" : "none"}
        />
    ),
    lock: (f) => (
        <>
            <rect
                x="5"
                y="10.5"
                width="14"
                height="10"
                rx="2"
                fill={f ? "currentColor" : "none"}
            />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </>
    ),
    chat: (f) => (
        <path
            d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6.5L6 20v-4H7"
            fill={f ? "currentColor" : "none"}
        />
    ),
    book: (f) => (
        <path
            d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5zm0 14A1.5 1.5 0 0 0 6.5 21H19"
            fill={f ? "currentColor" : "none"}
        />
    ),
};

function Icon({ name, filled = false }: { name: IconName; filled?: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {ICONS[name](filled)}
        </svg>
    );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={direction === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type Item = { id: string; label: string; icon: IconName; children?: Item[] };

const TABS: Item[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "search", label: "Search", icon: "search" },
    { id: "activity", label: "Activity", icon: "bell" },
    { id: "profile", label: "Profile", icon: "user" },
];

const MORE: Item[] = [
    {
        id: "settings",
        label: "Settings",
        icon: "sliders",
        children: [
            { id: "appearance", label: "Appearance", icon: "moon" },
            { id: "privacy", label: "Privacy", icon: "lock" },
            { id: "notifications", label: "Notifications", icon: "bell" },
        ],
    },
    {
        id: "help",
        label: "Help",
        icon: "help",
        children: [
            { id: "guides", label: "Guides", icon: "book" },
            { id: "contact", label: "Contact support", icon: "chat" },
        ],
    },
];

// Dock tab labels in on-screen order, for the tooltip strip.
const TIP_LABELS = [...TABS.map((t) => t.label), "More"];

const ALL_ITEMS =[...TABS, ...MORE.flatMap((m) => [m, ...(m.children ?? [])])];

export function labelFor(id: string) {
    return ALL_ITEMS.find((i) => i.id === id)?.label ?? id;
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

// Container spring: open/close and every page change. ~0.24s with a touch of bounce.
const DOCK_SPRING: Transition = { type: "spring", visualDuration: 0.24, bounce: 0.27 };

// Tooltip gliding between tabs (position and width): soft, barely-there bounce.
const TIP_SPRING: Transition = { type: "spring", visualDuration: 0.22, bounce: 0.15 };

const crossFade: Variants = {
    initial: { opacity: 0, filter: "blur(2px)" },
    animate: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.14, delay: 0.05, ease: "easeOut" },
    },
    exit: { opacity: 0, filter: "blur(2px)", transition: { duration: 0.08, ease: "easeIn" } },
};

// Nested pages. Transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1); opacity 220ms ease.
// The exiting page is only removed once its (longer) slide has finished.
const PAGE_TRANSITION: Transition = {
    x: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] },
    opacity: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }, // CSS `ease`
};

// direction: 1 = drilling in, -1 = going back.
// In:   incoming page 100% -> 0, parent page 0 -> -30% (both fade).
// Back: nested page 0 -> 100%, parent page -30% -> 0.
const page: Variants = {
    initial: (dir: number) => ({ x: dir > 0 ? "100%" : "-30%", opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: PAGE_TRANSITION },
    exit: (dir: number) => ({
        x: dir > 0 ? "-30%" : "100%",
        opacity: 0,
        transition: PAGE_TRANSITION,
    }),
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

// The open panel matches the collapsed dock: 5 buttons (44px) + 4 gaps (4px) + padding (2 x 6px).
const DOCK_WIDTH = (TABS.length + 1) * 44 + TABS.length * 4 + 2 * 6;

const rowClass =
    "flex h-11 w-full items-center gap-3 rounded-full px-4 text-left text-[15px] font-medium " +
    "text-[var(--dock-fg-muted)] outline-none transition-colors " +
    "hover:bg-[var(--dock-hover)] hover:text-[var(--dock-fg)] " +
    "focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] " +
    // Active (current page): a subtle fill that stays put on hover.
    "aria-[current=page]:bg-[var(--dock-active)] aria-[current=page]:hover:bg-[var(--dock-active)] " +
    "aria-[current=page]:text-[var(--dock-fg)]";

export function ExpandingDock({
    active,
    onSelect,
}: {
    active: string;
    onSelect: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [path, setPath] = useState<Item[]>([]); // nested trail inside the panel
    const [direction, setDirection] = useState(1);

    const reduceMotion = useReducedMotion();
    const navRef = useRef<HTMLElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const restoreFocus = useRef(false);

    const level = path.at(-1);

    function close() {
        restoreFocus.current = true;
        setOpen(false);
        setPath([]);
    }

    function select(id: string) {
        onSelect(id);
        close();
    }

    function drillIn(item: Item) {
        setDirection(1);
        setPath((p) => [...p, item]);
    }

    function back() {
        setDirection(-1);
        setPath((p) => p.slice(0, -1));
    }

    // Escape steps back one level, then closes. Clicking outside closes.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            e.preventDefault();
            if (path.length) back();
            else close();
        }
        function onPointer(e: PointerEvent) {
            if (!navRef.current?.contains(e.target as Node)) close();
        }
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [open, path.length]);

    // Each newly shown level takes focus. Targeted by id, because the exiting level is still
    // in the DOM while it fades out.
    const levelId = level?.id ?? "root";
    useEffect(() => {
        if (!open) return;
        navRef.current
            ?.querySelector<HTMLElement>(`[data-level="${levelId}"] [data-row] button`)
            ?.focus({ preventScroll: true });
    }, [open, levelId]);

    // On every page change, spring the pages area from its old height to the new page's height.
    // Pages are bottom-anchored (justify-end; the exiting page is pinned to bottom: 0), so the
    // container's top edge reveals or clips them while their content only moves sideways.
    const pagesRef = useRef<HTMLDivElement>(null);
    const pagesHeight = useRef(0);
    const heightAnim = useRef<ReturnType<typeof animate> | null>(null);
    useLayoutEffect(() => {
        const wrap = pagesRef.current;
        if (!open || !wrap) {
            pagesHeight.current = 0;
            return;
        }
        const pageEl = wrap.querySelector<HTMLElement>(`[data-level="${levelId}"]`);
        if (!pageEl) return;
        const next = pageEl.offsetHeight;
        let from = pagesHeight.current;
        if (heightAnim.current) {
            // Interrupted mid-spring: continue from wherever it is now.
            heightAnim.current.stop();
            heightAnim.current = null;
            from = wrap.offsetHeight;
        }
        pagesHeight.current = next;
        if (!from || from === next || reduceMotion) {
            wrap.style.height = "";
            return;
        }
        wrap.style.height = `${from}px`;
        heightAnim.current = animate(
            wrap,
            { height: [`${from}px`, `${next}px`] },
            {
                ...DOCK_SPRING,
                onComplete: () => {
                    wrap.style.height = "";
                    heightAnim.current = null;
                },
            },
        );
    }, [open, levelId, reduceMotion]);

    // Return focus to "More" after the panel closes.
    useEffect(() => {
        if (!open && restoreFocus.current) {
            restoreFocus.current = false;
            moreButtonRef.current?.focus({ preventScroll: true });
        }
    }, [open]);

    // Tooltip for the collapsed dock's tabs, anchored above the hovered / focused button.
    const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);
    function showTip(el: HTMLElement, label: string) {
        const r = el.getBoundingClientRect();
        // Horizontally centred on the tab, vertically anchored to the top of the dock.
        const top = navRef.current?.getBoundingClientRect().top ?? r.top;
        const x = r.left + r.width / 2;
        setTip({ label, x, y: top });
    }
    function hideTip() {
        setTip(null);
    }
    const tipHandlers = { onShowTip: showTip, onHideTip: hideTip };

    const containerTransition = reduceMotion ? { duration: 0 } : DOCK_SPRING;
    const moreActive = MORE.some(
        (m) => m.id === active || m.children?.some((c) => c.id === active),
    );

    return (
        <MotionConfig reducedMotion="user">
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <motion.nav
                    ref={navRef}
                    layout
                    // Layout (scale) animation only for open/close. Page changes animate a real
                    // height instead, so bottom-anchored pages never ride the moving top edge.
                    layoutDependency={open}
                    transition={{ layout: containerTransition }}
                    aria-label="Primary"
                    className={
                        "pointer-events-auto relative overflow-hidden " +
                        "bg-[var(--dock-bg)] text-[var(--dock-fg)] " +
                        // Inset ring instead of a border, so the border adds no width.
                        "shadow-[inset_0_0_0_1px_var(--dock-border),0_8px_30px_-6px_rgb(0_0_0/0.18),0_2px_6px_-2px_rgb(0_0_0/0.08)] " +
                        "backdrop-blur-xl"
                    }
                    style={{ borderRadius: 28 }}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {open ? (
                            <motion.div
                                key="panel"
                                layout="position"
                                layoutDependency={open}
                                variants={crossFade}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="relative p-2"
                                style={{ width: DOCK_WIDTH }}
                            >
                                <div
                                    ref={pagesRef}
                                    className="relative flex flex-col justify-end"
                                >
                                    <AnimatePresence initial={false} custom={direction}>
                                        <Page
                                            key={levelId}
                                            levelId={levelId}
                                            direction={direction}
                                        >
                                            <PanelHeader
                                                title={level?.label ?? "Menu"}
                                                onBack={level ? back : undefined}
                                                onClose={level ? undefined : close}
                                            />
                                            <ul className="flex w-full flex-col gap-0.5">
                                                {(level?.children ?? TABS).map((item) => (
                                                    <PanelRow
                                                        key={item.id}
                                                        item={item}
                                                        active={active === item.id}
                                                        onClick={() => select(item.id)}
                                                    />
                                                ))}
                                                {!level && (
                                                    <>
                                                        <li
                                                            role="separator"
                                                            className="mx-4 my-1.5 h-px bg-[var(--dock-border)]"
                                                        />
                                                        {MORE.map((item) => (
                                                            <PanelRow
                                                                key={item.id}
                                                                item={item}
                                                                active={
                                                                    active === item.id ||
                                                                    !!item.children?.some(
                                                                        (c) => c.id === active,
                                                                    )
                                                                }
                                                                onClick={() => drillIn(item)}
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                            </ul>
                                        </Page>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.ul
                                key="dock"
                                layout="position"
                                variants={crossFade}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                data-dock-tabs
                                // Hide only when leaving the whole row, so moving across the
                                // gaps between tabs doesn't make the tooltip blink.
                                onPointerLeave={hideTip}
                                className="flex items-center gap-1 p-1.5"
                            >
                                {TABS.map((item) => (
                                    <li key={item.id}>
                                        <DockButton
                                            label={item.label}
                                            icon={item.icon}
                                            active={active === item.id}
                                            onClick={() => onSelect(item.id)}
                                            {...tipHandlers}
                                        />
                                    </li>
                                ))}
                                <li>
                                    <DockButton
                                        ref={moreButtonRef}
                                        label="More"
                                        icon="more"
                                        active={moreActive}
                                        expanded={false}
                                        onClick={() => setOpen(true)}
                                        {...tipHandlers}
                                    />
                                </li>
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </motion.nav>
            </div>
            {/* One shared tooltip, rendered outside the nav (its overflow-hidden would clip it). */}
            <AnimatePresence>
                {tip && !open && (
                    <motion.div
                        key="tip"
                        aria-hidden="true"
                        className="pointer-events-none fixed left-0 z-[60]"
                        style={{ top: tip.y - 4 }} // 4px above the dock
                        initial={{ x: tip.x, opacity: 0, y: 2 }}
                        animate={{ x: tip.x, opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ x: TIP_SPRING, default: { duration: 0.12, ease: "easeOut" } }}
                    >
                        <div className="absolute bottom-0 left-0 -translate-x-1/2">
                            <TooltipStrip labels={TIP_LABELS} active={tip.label} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MotionConfig>
    );
}

// Every tab label sits in one horizontal row; the tooltip is a window (mask) onto it.
// Changing tab springs the row so the new label slides into view, while the window
// resizes to that label's width — on the same spring as the tooltip's glide.
function TooltipStrip({ labels, active }: { labels: string[]; active: string }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const metrics = useRef<{ left: number; width: number }[]>([]);
    const width = useMotionValue(0);
    const x = useMotionValue(0);
    const reduceMotion = useReducedMotion();

    // Measure every label once and jump straight to the first one, before first paint.
    useLayoutEffect(() => {
        const row = rowRef.current;
        if (!row) return;
        const rowLeft = row.getBoundingClientRect().left;
        metrics.current = [...row.children].map((el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left - rowLeft, width: r.width };
        });
        const m = metrics.current[Math.max(0, labels.indexOf(active))];
        width.set(m.width);
        x.set(-m.left);
        // Only on mount: later changes spring (below).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Each tab change springs the row and the window together.
    useEffect(() => {
        const m = metrics.current[Math.max(0, labels.indexOf(active))];
        if (!m) return;
        if (reduceMotion) {
            width.set(m.width);
            x.set(-m.left);
            return;
        }
        const a = animate(width, m.width, TIP_SPRING);
        const b = animate(x, -m.left, TIP_SPRING);
        return () => {
            a.stop();
            b.stop();
        };
    }, [active, labels, reduceMotion, width, x]);

    return (
        <motion.div
            style={{ width }}
            // Always white, with a hairline ring and soft shadow to lift it off any background.
            className={
                "overflow-hidden rounded-lg bg-white text-xs font-medium text-zinc-900 " +
                "shadow-[inset_0_0_0_1px_rgb(24_24_27/0.1),0_4px_14px_-4px_rgb(0_0_0/0.16),0_1px_3px_-1px_rgb(0_0_0/0.08)]"
            }
        >
            <motion.div ref={rowRef} style={{ x }} className="flex w-max">
                {labels.map((label) => (
                    <span key={label} className="whitespace-nowrap px-2.5 py-1">
                        {label}
                    </span>
                ))}
            </motion.div>
        </motion.div>
    );
}


function DockButton({
    ref,
    label,
    icon,
    active,
    expanded,
    onClick,
    onShowTip,
    onHideTip,
}: {
    ref?: Ref<HTMLButtonElement>;
    label: string;
    icon: IconName;
    active: boolean;
    expanded?: boolean;
    onClick: () => void;
    onShowTip: (el: HTMLElement, label: string) => void;
    onHideTip: () => void;
}) {
    return (
        <button
            ref={ref}
            type="button"
            aria-label={label}
            aria-current={active && expanded === undefined ? "page" : undefined}
            aria-expanded={expanded}
            onClick={() => {
                onHideTip();
                onClick();
            }}
            // Mouse hover only (a tap shouldn't flash it or tick), plus keyboard focus.
            onPointerEnter={(e) => e.pointerType === "mouse" && onShowTip(e.currentTarget, label)}
            onFocus={(e) =>
                e.currentTarget.matches(":focus-visible") && onShowTip(e.currentTarget, label)
            }
            // Tabbing to the next dock button keeps the tooltip (it glides there instead).
            onBlur={(e) =>
                !(e.relatedTarget as Element | null)?.closest("[data-dock-tabs]") && onHideTip()
            }
            className={
                "grid size-11 place-items-center rounded-full outline-none transition-colors " +
                "focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] " +
                (active
                    ? "text-[var(--dock-fg)]"
                    : "text-[var(--dock-fg-muted)] hover:bg-[var(--dock-hover)] hover:text-[var(--dock-fg)]")
            }
        >
            <Icon name={icon} filled={active} />
        </button>
    );
}

function PanelRow({
    item,
    active,
    onClick,
}: {
    item: Item;
    active: boolean;
    onClick: () => void;
}) {
    const nested = !!item.children;
    return (
        <li data-row>
            <button
                type="button"
                onClick={onClick}
                aria-current={active && !nested ? "page" : undefined}
                className={rowClass + (active ? " text-[var(--dock-fg)]" : "")}
            >
                <Icon name={item.icon} filled={active} />
                <span className="flex-1 truncate">{item.label}</span>
                {nested && (
                    <span className="text-[var(--dock-fg-muted)]">
                        <Chevron direction="right" />
                    </span>
                )}
            </button>
        </li>
    );
}

function PanelHeader({
    title,
    onBack,
    onClose,
}: {
    title: string;
    onBack?: () => void;
    onClose?: () => void;
}) {
    // Equal-width side columns keep the title centered on the panel, whatever sits beside it.
    return (
        <div className="mb-1 grid h-11 grid-cols-[1fr_auto_1fr] items-center px-1">
            <div className="flex justify-start">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 items-center gap-1 rounded-full pr-3 pl-2 text-[15px] font-medium text-[var(--dock-fg-muted)] outline-none transition-colors hover:bg-[var(--dock-hover)] hover:text-[var(--dock-fg)] focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)]"
                    >
                        <Chevron direction="left" />
                        Back
                    </button>
                )}
            </div>
            <span className="truncate px-2 text-center text-[13px] font-semibold uppercase tracking-wide text-[var(--dock-fg-muted)]">
                {title}
            </span>
            <div className="flex justify-end">{onClose && <CloseButton onClick={onClose} />}</div>
        </div>
    );
}

// One menu level. While exiting it is lifted out of flow and pinned to the bottom, so the
// incoming page sets the height and the container's top edge reveals / clips it.
function Page({
    levelId,
    direction,
    children,
}: {
    levelId: string;
    direction: number;
    children: ReactNode;
}) {
    const isPresent = useIsPresent();
    return (
        <motion.div
            data-level={levelId}
            custom={direction}
            variants={page}
            initial="initial"
            animate="animate"
            exit="exit"
            inert={!isPresent}
            className={isPresent ? "w-full" : "absolute inset-x-0 bottom-0"}
        >
            {children}
        </motion.div>
    );
}

function CloseButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Close menu"
            aria-expanded={true}
            className="grid size-9 place-items-center rounded-full text-[var(--dock-fg-muted)] outline-none transition-colors hover:bg-[var(--dock-hover)] hover:text-[var(--dock-fg)] focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)]"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
            >
                <path d="M6 6l12 12M18 6 6 18" />
            </svg>
        </button>
    );
}
