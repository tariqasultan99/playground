"use client";

import { useState } from "react";
import { ExpandingDock, labelFor } from "./components/expanding-dock";
import { ThemeSwitch } from "./components/theme-switch";

export default function Home() {
  const [active, setActive] = useState("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-4 pb-32 font-sans dark:bg-black">
      <ThemeSwitch className="fixed top-4 right-4" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Current page</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {labelFor(active)}
      </h1>
      <ExpandingDock active={active} onSelect={setActive} />
    </main>
  );
}
