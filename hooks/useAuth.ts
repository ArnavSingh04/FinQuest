"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/auth";

interface UseAuthResult {
  user: User | null;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthState() {
      try {
        // Resolve quickly from the local session so the UI does not stay blocked.
        const sessionResult = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setUser(sessionResult.data.session?.user ?? null);
        setLoading(false);

        // Revalidate against Supabase auth in the background.
        const userResult = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        setUser(userResult.data.user ?? sessionResult.data.session?.user ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setLoading(false);
      }
    }

    loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setUser(nextSession?.user ?? null);
      setLoading(false);
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
