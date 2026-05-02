import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  gender: "male" | "female" | "non_binary" | "prefer_not_to_say" | null;
  avatar_url: string | null;
  is_private: boolean;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** True when the user has finished the setup wizard (has a non-placeholder username + at least one of: avatar / bio / gender). */
  setupComplete: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, gender, avatar_url, is_private")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] fetchProfile error", error);
    return null;
  }
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss an event.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer DB call to avoid deadlock inside the callback
        setTimeout(() => {
          fetchProfile(s.user.id).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // 2. Then read existing session.
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!session?.user) return;
    setProfile(await fetchProfile(session.user.id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  // Heuristic: setup is complete once user has filled bio OR gender OR uploaded an avatar.
  // (Username is auto-generated on signup, so we can't use it alone.)
  const setupComplete = !!profile && (
    !!profile.gender || !!profile.avatar_url || (profile.bio?.length ?? 0) > 0
  );

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        setupComplete,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
