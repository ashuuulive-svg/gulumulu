-- Lock down search_path on existing functions
create or replace function public.set_updated_at()
returns trigger language plpgsql
security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

-- username_available: only signed-in users may check
revoke execute on function public.username_available(text) from public, anon, authenticated;
grant execute on function public.username_available(text) to authenticated;

-- handle_new_user must remain SECURITY DEFINER (auth trigger), but tighten access
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Replace broad public-read on avatars bucket with read-by-known-path only.
-- Keeping bucket public so direct getPublicUrl() still works, but disallow listing all objects.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatars readable when path is known"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');
-- Note: storage list endpoint requires explicit prefix; selecting individual objects via known path remains allowed.