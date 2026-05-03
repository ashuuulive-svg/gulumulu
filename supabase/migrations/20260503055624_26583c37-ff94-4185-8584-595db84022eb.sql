
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN ban_reason text,
  ADD COLUMN banned_at timestamptz;

-- Admins can update any profile (in addition to existing self-update policy)
CREATE POLICY "Admins update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admins can delete any post / comment
CREATE POLICY "Admins delete any post" ON public.posts
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any comment" ON public.post_comments
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Block banned users from creating content (drop & recreate insert policies)
DROP POLICY "Users insert own posts" ON public.posts;
CREATE POLICY "Users insert own posts" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
);

DROP POLICY "Users insert own comments" ON public.post_comments;
CREATE POLICY "Users insert own comments" ON public.post_comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
);

DROP POLICY "Users like as themselves" ON public.post_likes;
CREATE POLICY "Users like as themselves" ON public.post_likes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
);

-- 5. Auto-assign admin role on signup for hardcoded master email; also extend handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare
  base_name text;
  candidate text;
  i int := 0;
begin
  base_name := lower(regexp_replace(coalesce(
    new.raw_user_meta_data->>'preferred_username',
    split_part(coalesce(new.email,''),'@',1),
    'user'
  ), '[^a-z0-9_]', '', 'g'));
  if length(base_name) < 3 then base_name := 'user'; end if;

  candidate := base_name;
  while exists (select 1 from public.profiles where lower(username) = candidate) loop
    i := i + 1;
    candidate := base_name || i::text;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Default user role
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  -- Master admin
  if lower(coalesce(new.email, '')) = 'ashuuulive@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;

  return new;
end $function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill: if master admin already signed up, grant admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'ashuuulive@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;
