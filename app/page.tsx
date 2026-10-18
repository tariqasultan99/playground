"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState } from "react";
import { type ComponentId, ComponentsPanel } from "./components/components-panel";
import { ExpandingDock, labelFor } from "./components/expanding-dock";
import { PayButton } from "./components/pay-button";
import { ResizablePanel } from "./components/resizable-panel";
import { SoundSwitch } from "./components/sound-switch";
import { ThemeSwitch } from "./components/theme-switch";

// Opacity only: a transform or filter here would make the dock's `position: fixed` follow this
// wrapper instead of the screen.
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
} as const;

export default function Home() {
  const [component, setComponent] = useState<ComponentId>("dock");
  const [active, setActive] = useState("home");

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-4 pb-32 font-sans dark:bg-black">
        <ComponentsPanel active={component} onSelect={setComponent} />
        <SoundSwitch className="fixed top-4 right-[92px]" />
        <ThemeSwitch className="fixed top-4 right-4" />

        <AnimatePresence mode="wait" initial={false}>
          {component === "dock" ? (
            <motion.div key="dock" {...fade} className="flex flex-col items-center gap-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Current page</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {labelFor(active)}
              </h1>
              <ExpandingDock active={active} onSelect={setActive} />
            </motion.div>
          ) : component === "button" ? (
            <motion.div key="button" {...fade} className="flex flex-col items-center gap-6">
              <h1 className="sr-only">Button</h1>
              <PayButton />
            </motion.div>
          ) : (
            // Left padding keeps the frame clear of the fixed Components panel (16px + 224px).
            <motion.div key="panel" {...fade} className="w-full max-w-[1200px] pt-16 pl-60">
              <h1 className="sr-only">Side panel</h1>
              <ResizablePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
