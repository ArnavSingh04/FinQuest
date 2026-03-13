"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/",          label: "Home",   icon: "◆" },
  { href: "/dashboard", label: "Log",    icon: "✚" },
  { href: "/city",      label: "City",   icon: "⬡" },
  { href: "/history",   label: "History", icon: "≡" },
];

export function NavBar() {
  const path = usePathname();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass-card border-t border-white/10 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2">
            {LINKS.map(({ href, label, icon }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 transition-all ${
                    active
                      ? "text-sky-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span className={`text-lg leading-none transition-transform ${active ? "scale-110" : ""}`}>
                    {icon}
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                  {active && (
                    <span className="mt-0.5 h-0.5 w-4 rounded-full bg-sky-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 hidden md:block">
        <div className="glass-card-sm border-b border-white/8">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold gradient-text">⬡ FinQuest</span>
            </Link>
            <div className="flex items-center gap-1">
              {LINKS.slice(1).map(({ href, label, icon }) => {
                const active = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
