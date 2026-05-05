-- 1. Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by authenticated"
  ON public.follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users follow as themselves"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

CREATE POLICY "Users unfollow themselves"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

-- 2. Counter helpers
CREATE OR REPLACE FUNCTION public.follower_count(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.follows WHERE following_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.following_count(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.follows WHERE follower_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_following(_follower uuid, _following uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.follows WHERE follower_id = _follower AND following_id = _following);
$$;

-- 3. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- 4. Flush demo content (keep profiles & auth users)
DELETE FROM public.post_comments;
DELETE FROM public.post_likes;
DELETE FROM public.posts;