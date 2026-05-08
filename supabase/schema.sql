-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Posts (supports nested replies via parent_id)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 280),
  image_url text,
  parent_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Likes
create table public.likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (post_id, user_id)
);

-- Follows
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Indexes for performance
create index posts_user_id_idx on public.posts(user_id);
create index posts_parent_id_idx on public.posts(parent_id);
create index posts_created_at_idx on public.posts(created_at desc);
create index likes_user_id_idx on public.likes(user_id);
create index follows_follower_idx on public.follows(follower_id);
create index follows_following_idx on public.follows(following_id);

-- Storage bucket for post images
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;

-- Profiles: public read, owner write
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Posts: public read, owner write
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_delete" on public.posts for delete using (auth.uid() = user_id);

-- Likes: public read, owner write
create policy "likes_select" on public.likes for select using (true);
create policy "likes_insert" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.likes for delete using (auth.uid() = user_id);

-- Follows: public read, owner write
create policy "follows_select" on public.follows for select using (true);
create policy "follows_insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on public.follows for delete using (auth.uid() = follower_id);

-- Storage policy for post images
create policy "post_images_select" on storage.objects for select using (bucket_id = 'post-images');
create policy "post_images_insert" on storage.objects for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
create policy "post_images_delete" on storage.objects for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- View: posts with like/comment counts and user like status
create or replace function get_posts(p_user_id uuid, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, user_id uuid, content text, image_url text, parent_id uuid, created_at timestamptz,
  likes_count bigint, comments_count bigint, liked_by_user boolean,
  profile_username text, profile_bio text, profile_avatar_url text
) language sql stable as $$
  select
    p.id, p.user_id, p.content, p.image_url, p.parent_id, p.created_at,
    count(distinct l.user_id) as likes_count,
    count(distinct c.id) as comments_count,
    bool_or(l.user_id = p_user_id) as liked_by_user,
    pr.username, pr.bio, pr.avatar_url
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  left join public.likes l on l.post_id = p.id
  left join public.posts c on c.parent_id = p.id
  where p.parent_id is null
  group by p.id, pr.username, pr.bio, pr.avatar_url
  order by p.created_at desc
  limit p_limit offset p_offset;
$$;
