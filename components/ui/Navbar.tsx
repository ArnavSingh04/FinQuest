"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/auth";

const authenticatedLinks = [
  { href: "/", label: "Home" },
  { href: "/city", label: "My City" },
  { href: "/history", label: "History" },
  { href: "/lessons", label: "Lessons" },
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
  const { user, loading } = useAuth();

  async function handleLogout() {
    await signOutUser();
    router.push("/");
    router.refresh();
  }

  if (loading || !user || pathname === "/pay") {
    return null;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white"
        >
          FinQuest
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {authenticatedLinks.map((link) => (
            <NavLink
              key={`${link.href}-${link.label}`}
              href={link.href}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-300 sm:block">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  );
}
