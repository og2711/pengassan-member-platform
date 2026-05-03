-- Swim lanes (columns on the board)
create table lanes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  color text not null default '#3B82F6',
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- Issues / grievance cards
create table issues (
  id uuid primary key default gen_random_uuid(),
  lane_id uuid references lanes(id) on delete cascade,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  tags text[] default '{}',
  "order" integer not null default 0,
  created_at timestamptz default now()
);

-- Admin updates/comments on issues (visible to all, writable by admin only)
create table issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table issue_updates enable row level security;
create policy "Public read updates" on issue_updates for select using (true);
create policy "Admin write updates" on issue_updates for all using (auth.role() = 'authenticated');

-- Public recommendations submitted via form
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  message text not null,
  status text check (status in ('pending', 'reviewed')) default 'pending',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table lanes enable row level security;
alter table issues enable row level security;
alter table recommendations enable row level security;

-- Public can read lanes and issues
create policy "Public read lanes" on lanes for select using (true);
create policy "Public read issues" on issues for select using (true);

-- Only authenticated (admin) can mutate lanes and issues
create policy "Admin write lanes" on lanes for all using (auth.role() = 'authenticated');
create policy "Admin write issues" on issues for all using (auth.role() = 'authenticated');

-- Anyone can insert a recommendation; only admin can read/update them
create policy "Public insert recommendations" on recommendations for insert with check (true);
create policy "Admin read recommendations" on recommendations for select using (auth.role() = 'authenticated');
create policy "Admin update recommendations" on recommendations for update using (auth.role() = 'authenticated');

-- Official profile overrides (bio + avatar, keyed by static official id)
create table official_profiles (
  id text primary key,
  avatar_url text,
  bio text,
  updated_at timestamptz default now()
);

alter table official_profiles enable row level security;
create policy "Public read official profiles" on official_profiles for select using (true);
create policy "Admin write official profiles" on official_profiles for all using (auth.role() = 'authenticated');

-- Storage bucket for official photos (run separately in Supabase dashboard):
-- insert into storage.buckets (id, name, public) values ('officials', 'officials', true);
-- create policy "Public read official photos" on storage.objects for select using (bucket_id = 'officials');
-- create policy "Admin upload official photos" on storage.objects for insert with check (bucket_id = 'officials' and auth.role() = 'authenticated');
-- create policy "Admin delete official photos" on storage.objects for delete using (bucket_id = 'officials' and auth.role() = 'authenticated');

-- Chapter events
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text check (type in ('meeting', 'workshop', 'seminar', 'social', 'union', 'other')) default 'meeting',
  date text not null,
  time text not null default '09:00',
  location text not null default '',
  description text,
  attendees text[] default '{}',
  pictures text[] default '{}',
  created_at timestamptz default now()
);

alter table events enable row level security;
create policy "Public read events" on events for select using (true);
create policy "Admin write events" on events for all using (auth.role() = 'authenticated');

-- Storage bucket for event pictures (run separately in Supabase dashboard):
-- insert into storage.buckets (id, name, public) values ('events', 'events', true);
-- create policy "Public read event pictures" on storage.objects for select using (bucket_id = 'events');
-- create policy "Admin upload event pictures" on storage.objects for insert with check (bucket_id = 'events' and auth.role() = 'authenticated');
-- create policy "Admin delete event pictures" on storage.objects for delete using (bucket_id = 'events' and auth.role() = 'authenticated');

-- Seed default lanes
insert into lanes (title, color, "order") values
  ('Unresolved', '#EF4444', 0),
  ('In Progress', '#F59E0B', 1),
  ('Under Review', '#8B5CF6', 2),
  ('Resolved', '#10B981', 3);
