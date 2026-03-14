"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function ensureSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  ensureSupabaseEnv();

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }

  return browserClient;
}

export async function signInWithEmail(email: string, password: string) {
  return createSupabaseBrowserClient().auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}) {
  return createSupabaseBrowserClient().auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        username: params.username,
        full_name: params.fullName,
      },
    },
  });
}

export async function signOutUser() {
  return createSupabaseBrowserClient().auth.signOut();
}

export function useUser() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then((result: Awaited<ReturnType<typeof supabase.auth.getSession>>) => {
      if (!isMounted) {
        return;
      }

      setSession(result.data.session ?? null);
      setUser(result.data.session?.user ?? null);
      setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    supabase,
  };
}
