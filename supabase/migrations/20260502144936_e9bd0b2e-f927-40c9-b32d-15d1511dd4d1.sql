
-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  caption text default '',
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_author_idx on public.posts(author_id);
create index posts_created_idx on public.posts(created_at desc);

alter table public.posts enable row level security;

create policy "Posts viewable by authenticated"
  on public.posts for select to authenticated using (true);
create policy "Users insert own posts"
  on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "Users update own posts"
  on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "Users delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = author_id);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- LIKES
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes(user_id);

alter table public.post_likes enable row level security;

create policy "Likes viewable by authenticated"
  on public.post_likes for select to authenticated using (true);
create policy "Users like as themselves"
  on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users unlike themselves"
  on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- COMMENTS
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments(post_id, created_at);

alter table public.post_comments enable row level security;

create policy "Comments viewable by authenticated"
  on public.post_comments for select to authenticated using (true);
create policy "Users insert own comments"
  on public.post_comments for insert to authenticated with check (auth.uid() = author_id);
create policy "Users update own comments"
  on public.post_comments for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "Users delete own comments"
  on public.post_comments for delete to authenticated using (auth.uid() = author_id);

create trigger post_comments_set_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

-- STORAGE
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

create policy "Post images public read"
  on storage.objects for select using (bucket_id = 'post-images');
create policy "Users upload own post images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own post images"
  on storage.objects for update to authenticated
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own post images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- REALTIME
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;
