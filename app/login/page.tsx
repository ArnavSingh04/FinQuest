"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { signInWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setFeedback(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md items-center px-5 py-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full rounded-[2rem] p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Welcome back
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Log in to FinQuest</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Pick up where you left off and continue growing your personal city.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {feedback ? <p className="mt-4 text-sm text-rose-300">{feedback}</p> : null}

        <p className="mt-6 text-sm text-slate-300">
          Need an account?{" "}
          <Link href="/signup" className="text-sky-300">
            Sign up
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
