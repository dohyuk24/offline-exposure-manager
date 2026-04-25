-- 권한 시스템 — user_profiles + user_branch_access.
-- 자세한 설계는 docs/permissions-plan.md 참고.
--
-- 인증: Supabase Auth (Slack OAuth provider). auth.users 와 1:1 매핑.
-- Role: admin / manager / viewer (3단계)
-- Scope: user_branch_access 로 지점 단위 N:M
--
-- RLS: 이 마이그레이션에선 테이블만 생성. RLS 정책은 가드 헬퍼·미들웨어
-- 도입 PR 에서 함께 활성화.

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  slack_user_id text,                       -- OAuth provider 가 채움
  role text not null default 'viewer',      -- 'admin' | 'manager' | 'viewer'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_role
  on user_profiles(role) where is_active = true;
create index if not exists idx_user_profiles_slack
  on user_profiles(slack_user_id) where slack_user_id is not null;

-- 사용자별 접근 가능 지점 (admin 은 별도 매핑 없이 전체 접근 — 가드 로직)
create table if not exists user_branch_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, branch_id)
);

create index if not exists idx_user_branch_access_branch
  on user_branch_access(branch_id);
