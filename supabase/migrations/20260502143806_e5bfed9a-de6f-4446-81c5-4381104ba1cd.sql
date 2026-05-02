-- Switch username_available to SECURITY INVOKER (RLS allows authenticated users to read profiles)
create or replace function public.username_available(_username text)
returns boolean
language sql stable
security invoker set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(_username)
  );
$$;
grant execute on function public.username_available(text) to authenticated;

-- Tighten avatars SELECT: anyone can read a specific object by full path,
-- but listing/enumeration is restricted to the owner.
drop policy if exists "Avatars readable when path is known" on storage.objects;
create policy "Avatars: owner can list, anyone can read by path"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'avatars' and (
      -- Owner can do anything (including listing their folder)
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
      -- Everyone else may only fetch a specific object (no wildcard listing)
      or current_setting('request.method', true) = 'GET'
    )
  );