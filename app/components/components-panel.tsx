"use client";

export type ComponentId = "dock" | "button" | "panel";

export const COMPONENTS: { id: ComponentId; label: string }[] = [
    { id: "dock", label: "Bottom dock" },
    { id: "button", label: "Button" },
    { id: "panel", label: "Side panel" },
];

// Same row recipe as the dock's menu rows: muted by default, hover tint, subtle active fill.
const rowClass =
    "flex h-11 w-full items-center gap-3 rounded-full px-4 text-left text-[15px] font-medium " +
    "text-[var(--dock-fg-muted)] outline-none transition-colors " +
    "hover:bg-[var(--dock-hover)] hover:text-[var(--dock-fg)] " +
    "focus-visible:ring-2 focus-visible:ring-[var(--dock-ring)] " +
    "aria-[current=page]:bg-[var(--dock-active)] aria-[current=page]:hover:bg-[var(--dock-active)] " +
    "aria-[current=page]:text-[var(--dock-fg)]";

// Side panel for switching between the components in the playground.
export function ComponentsPanel({
    active,
    onSelect,
}: {
    active: ComponentId;
    onSelect: (id: ComponentId) => void;
}) {
    return (
        <nav
            aria-label="Components"
            className={
                "fixed top-4 left-4 z-40 w-56 bg-[var(--dock-bg)] p-2 text-[var(--dock-fg)] " +
                "shadow-[inset_0_0_0_1px_var(--dock-border),0_8px_30px_-6px_rgb(0_0_0/0.18),0_2px_6px_-2px_rgb(0_0_0/0.08)] " +
                "backdrop-blur-xl"
            }
            style={{ borderRadius: 28 }}
        >
            {/* Left-aligned, with the same 16px inset as the rows so it lines up with their icons. */}
            <h2 className="mb-1 flex h-11 items-center justify-start px-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--dock-fg-muted)]">
                Components
            </h2>
            <ul className="flex flex-col gap-0.5">
                {COMPONENTS.map((c) => {
                    const isActive = c.id === active;
                    return (
                        <li key={c.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(c.id)}
                                aria-current={isActive ? "page" : undefined}
                                className={rowClass}
                            >
                                <ComponentIcon id={c.id} filled={isActive} />
                                <span className="flex-1 truncate">{c.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

// Outline by default, filled when active — same rule as the dock icons.
function ComponentIcon({ id, filled }: { id: ComponentId; filled: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {id === "dock" ? (
                <>
                    {/* A screen with a pill bar along the bottom. */}
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <rect
                        x="6.5"
                        y="15"
                        width="11"
                        height="3"
                        rx="1.5"
                        fill={filled ? "currentColor" : "none"}
                    />
                </>
            ) : id === "panel" ? (
                <>
                    {/* A frame with a panel docked on the right. */}
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <rect
                        x="13"
                        y="6"
                        width="5"
                        height="12"
                        rx="1.5"
                        fill={filled ? "currentColor" : "none"}
                    />
                </>
            ) : (
                <>
                    {/* A rounded button with a label line. */}
                    <rect
                        x="2.5"
                        y="7"
                        width="19"
                        height="10"
                        rx="5"
                        fill={filled ? "currentColor" : "none"}
                    />
                    <path
                        d="M9 12h6"
                        stroke={filled ? "var(--dock-bg)" : "currentColor"}
                    />
                </>
            )}
        </svg>
    );
}
