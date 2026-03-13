"use client";

import Link from "next/link";

import { WorldScene } from "@/components/world/WorldScene";
import { WorldPanel } from "@/components/world/WorldPanel";

export default function WorldPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 sm:max-w-6xl">
      <section className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            World
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            View your world in 3D
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
        >
          Back to dashboard
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <WorldScene />
        <WorldPanel />
      </section>
    </main>
  );
}
