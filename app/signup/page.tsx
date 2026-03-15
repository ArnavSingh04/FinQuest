"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { signUpWithEmail } from "@/lib/auth";

const inputBase = {
  background: "#F2EDE3",
  borderColor: "#C8BFA8",
  color: "#1C3A2E",
  fontFamily: "var(--font-body), DM Sans, sans-serif",
};

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
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

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-5 py-10" style={{ background: "#F2EDE3" }}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[20px] border p-6"
        style={{
          background: "#FFFFFF",
          borderColor: "#C8BFA8",
          boxShadow: "0 4px 24px rgba(28,58,46,0.08)",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
          Start your city
        </p>
        <h1 className="mt-3 font-heading text-3xl font-normal" style={{ color: "#1C3A2E" }}>
          Create your FinCity account
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 14 }}>
          Every user gets their own city, insights, achievements, and group progress.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[13px]" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none transition-colors placeholder:text-[#8A9E94] focus:border-2 focus:border-[#1C3A2E]"
              style={inputBase}
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px]" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Username</span>
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none transition-colors placeholder:text-[#8A9E94] focus:border-2 focus:border-[#1C3A2E]"
              style={inputBase}
              placeholder="username"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px]" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none transition-colors placeholder:text-[#8A9E94] focus:border-2 focus:border-[#1C3A2E]"
              style={inputBase}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px]" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none transition-colors placeholder:text-[#8A9E94] focus:border-2 focus:border-[#1C3A2E]"
              style={inputBase}
              placeholder="Min 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-[15px] text-[15px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: "#C17B3F", height: 52, fontFamily: "var(--font-body), DM Sans, sans-serif" }}
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {feedback ? (
          <p className="mt-4 text-sm" style={{ color: feedback.includes("confirm") ? "#4A6358" : "#D94F3D", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            {feedback}
          </p>
        ) : null}

        <p className="mt-6 text-sm" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
          Already signed up?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#C17B3F" }}>
            Log in
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
