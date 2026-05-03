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
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setupComplete: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, gender, avatar_url, is_private, is_verified, is_banned, ban_reason, banned_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] fetchProfile error", error);
    return null;
  }
  return (data as Profile | null) ?? null;
}

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = (userId: string) => {
    fetchProfile(userId).then(setProfile);
    fetchIsAdmin(userId).then(setIsAdmin);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadAll(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadAll(data.session.user.id);
      }
      setLoading(false);
    });

    // Realtime: keep profile fresh (e.g. ban applied by admin)
    const ch = supabase
      .channel("profile-self")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const row = payload.new as Profile;
        if (row?.id && row.id === session?.user?.id) setProfile(row);
      })
      .subscribe();

    return () => {
      sub.subscription.unsubscribe();
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    if (!session?.user) return;
    setProfile(await fetchProfile(session.user.id));
    setIsAdmin(await fetchIsAdmin(session.user.id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
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
        isAdmin,
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
