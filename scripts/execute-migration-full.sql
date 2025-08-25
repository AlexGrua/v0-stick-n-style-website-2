-- pages / blocks / publications / audit for block-based public pages
-- NOTE: run in dev; ensure RLS and cache reload after apply

begin;

-- 1) pages table
create table if not exists public.pages (
  id bigserial primary key,
  key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) page_blocks table
create table if not exists public.page_blocks (
  id bigserial primary key,
  page_id bigint not null references public.pages(id) on delete cascade,
  type text not null,
  props jsonb not null default '{}'::jsonb,
  slot text not null default 'main',
  position integer not null default 0,
  is_active boolean not null default true,
  locale text null,
  valid_from timestamptz null,
  valid_to timestamptz null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_blocks_props_object check (jsonb_typeof(props) = 'object'),
  constraint page_blocks_position_nonneg check (position >= 0),
  constraint page_blocks_unique_position unique (page_id, position)
);

-- 3) publications table
create table if not exists public.page_publications (
  id bigserial primary key,
  page_id bigint not null references public.pages(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null default '[]'::jsonb,
  published_at timestamptz not null default now(),
  published_by text null
);

-- 4) audit logs
create table if not exists public.audit_logs (
  id bigserial primary key,
  entity text not null,
  entity_id bigint null,
  action text not null,
  by text null,
  diff jsonb null,
  created_at timestamptz not null default now()
);

-- Indices
create index if not exists idx_page_blocks_page_slot_pos on public.page_blocks(page_id, slot, position);
create index if not exists idx_page_blocks_page_locale_active on public.page_blocks(page_id, locale, is_active);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_page_blocks_set_updated_at') then
    create trigger trg_page_blocks_set_updated_at
      before update on public.page_blocks
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_pages_set_updated_at') then
    create trigger trg_pages_set_updated_at
      before update on public.pages
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.pages enable row level security;
alter table public.page_blocks enable row level security;
alter table public.page_publications enable row level security;
alter table public.audit_logs enable row level security;

-- Policies: read to anon/auth, write only admin/service_role (assumes JWT with role claim or service key)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'pages' and policyname = 'pages_read_all') then
    create policy pages_read_all on public.pages for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'page_blocks' and policyname = 'page_blocks_read_all') then
    create policy page_blocks_read_all on public.page_blocks for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'page_publications' and policyname = 'page_publications_read_all') then
    create policy page_publications_read_all on public.page_publications for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'audit_logs_read_all') then
    create policy audit_logs_read_all on public.audit_logs for select using (true);
  end if;
end $$;

-- write policies: keep minimal, rely on service_role for CI/admin
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'pages' and policyname = 'pages_write_admin') then
    create policy pages_write_admin on public.pages for all using (false) with check (false);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'page_blocks' and policyname = 'page_blocks_write_admin') then
    create policy page_blocks_write_admin on public.page_blocks for all using (false) with check (false);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'page_publications' and policyname = 'page_publications_write_admin') then
    create policy page_publications_write_admin on public.page_publications for all using (false) with check (false);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'audit_logs_write_admin') then
    create policy audit_logs_write_admin on public.audit_logs for all using (false) with check (false);
  end if;
end $$;

-- Seed page 'home'
insert into public.pages(key)
  values ('home')
on conflict (key) do nothing;

commit;

-- After apply
-- select pg_notify('pgrst', 'reload schema');
