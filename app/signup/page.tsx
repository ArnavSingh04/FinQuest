"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { signUpWithEmail, useUser } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const { data, error } = await signUpWithEmail({
      email,
      password,
      username,
      fullName,
    });

    if (error) {
      setFeedback(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setFeedback(
        "Account created. If email confirmation is enabled in Supabase, confirm your email before logging in.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
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
          Start your city
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Create your FinQuest account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Every user gets their own city, insights, achievements, and group progress.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Username</span>
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
            />
          </label>
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
              minLength={6}
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
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {feedback ? <p className="mt-4 text-sm text-slate-300">{feedback}</p> : null}

        <p className="mt-6 text-sm text-slate-300">
          Already signed up?{" "}
          <Link href="/login" className="text-sky-300">
            Log in
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
