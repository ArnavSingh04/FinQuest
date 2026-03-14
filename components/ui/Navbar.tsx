"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { signOutUser, useUser } from "@/lib/auth";

const authenticatedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/city", label: "City" },
  { href: "/insights", label: "Insights" },
  { href: "/groups", label: "Groups" },
];

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-2 text-sm transition ${
        isActive ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();

  async function handleLogout() {
    await signOutUser();
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          FinQuest
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/" label="Home" isActive={pathname === "/"} />
          {!isLoading && user
            ? authenticatedLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  isActive={pathname === link.href}
                />
              ))
            : null}
        </nav>

        <div className="flex items-center gap-2">
          {!isLoading && user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:block">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
