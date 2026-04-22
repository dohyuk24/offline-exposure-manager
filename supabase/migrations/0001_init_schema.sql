-- 오프라인 매체 관리 서비스 — 초기 스키마
-- CLAUDE.md "DB 스키마" 섹션과 1:1 대응.

-- ============================================================
-- 지점
-- ============================================================
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  token text unique not null,
  budget_monthly integer default 500000,
  slack_channel text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists branches_slug_idx on branches(slug);
create index if not exists branches_token_idx on branches(token);

-- ============================================================
-- 매체 레코드
-- ============================================================
create table if not exists media_records (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  category text not null,
  media_type text not null,
  status text not null,
  description text,
  size text,
  content_type text,
  start_date date,
  end_date date,
  cost integer,
  barter_condition text,
  internal_code text,
  managed_by_marketing boolean default false,
  latitude double precision,
  longitude double precision,
  zone_id text,
  is_new_discovery boolean default false,
  photos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists media_records_branch_idx
  on media_records(branch_id) where deleted_at is null;
create index if not exists media_records_discovery_idx
  on media_records(is_new_discovery, created_at desc)
  where deleted_at is null and is_new_discovery = true;

-- ============================================================
-- 예산 사용 내역
-- ============================================================
create table if not exists budget_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  media_record_id uuid references media_records(id) on delete set null,
  amount integer not null,
  memo text,
  year_month text not null,
  created_at timestamptz default now()
);

create index if not exists budget_logs_branch_month_idx
  on budget_logs(branch_id, year_month);

-- ============================================================
-- 점수 내역
-- ============================================================
create table if not exists score_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  media_record_id uuid references media_records(id) on delete set null,
  action text not null,
  score integer not null,
  year_month text not null,
  created_at timestamptz default now()
);

create index if not exists score_logs_branch_month_idx
  on score_logs(branch_id, year_month);

-- ============================================================
-- updated_at 트리거
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists media_records_set_updated_at on media_records;
create trigger media_records_set_updated_at
  before update on media_records
  for each row execute function set_updated_at();
