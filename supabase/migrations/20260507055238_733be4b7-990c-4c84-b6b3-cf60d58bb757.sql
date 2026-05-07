
-- post_saves
CREATE TABLE IF NOT EXISTS public.post_saves (
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saves" ON public.post_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saves" ON public.post_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saves" ON public.post_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_hides
CREATE TABLE IF NOT EXISTS public.post_hides (
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE public.post_hides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own hides" ON public.post_hides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own hides" ON public.post_hides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own hides" ON public.post_hides FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- posts: music + hidden flag
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_artist text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_preview_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_artwork_url text;
