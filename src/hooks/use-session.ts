import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, user: session?.user ?? null };
}

export function displayNameFor(user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null): string {
  if (!user) return "Guest";
  const meta = user.user_metadata as { display_name?: string; full_name?: string; name?: string } | null;
  return (
    meta?.display_name ||
    meta?.full_name ||
    meta?.name ||
    user.email?.split("@")[0] ||
    "Student"
  );
}
