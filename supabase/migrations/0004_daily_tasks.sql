-- 데일리 할 일 라이프사이클을 위한 daily_tasks 테이블 + 슬랙 그룹 태그 컬럼.
-- 자세한 설계는 docs/daily-routine-plan.md 참고.
--
-- 흐름: 매일 새벽 cron 이 트리거 조건 검사 → daily_tasks insert → 사용자 액션
-- 으로 자동 완료 또는 위젯에서 수동 체크 → 7일 미처리 시 만료 + 점수 -5.

-- 1) 지점에 슬랙 User Group ID 컬럼 추가 (`<!subteam^...>` 멘션용)
alter table branches
  add column if not exists slack_user_group_id text;

-- 2) daily_tasks 테이블
create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,

  -- 'unofficial_update' | 'posting_ending' | 'negotiating_followup'
  -- | 'discovery_zero' | 'barter_progress'
  task_type text not null,

  -- 자동 완료 매핑 대상. discovery_zero 는 NULL.
  related_record_id uuid references media_records(id) on delete cascade,

  -- 어느 날 만들어진 task 인지 (yyyy-mm-dd)
  generated_for date not null,

  -- 만료 기준일 (carry over chain 시작일 + 7일).
  expires_at date not null,

  -- 'open' | 'done' | 'expired'
  status text not null default 'open',

  completed_at timestamptz,

  -- 'auto' | 'manual' (status=done 일 때만 의미 있음)
  completed_by text,

  -- 며칠째 이어진 건지 (위젯 ⚠ 라벨용).
  carry_over_count int not null default 0,

  created_at timestamptz not null default now()
);

-- 위젯·cron 의 핵심 쿼리 패턴: 지점 + open + 오늘
create index if not exists idx_daily_tasks_branch_open
  on daily_tasks(branch_id, status, generated_for);

-- 매체 액션 시 자동 완료 매핑용 (related_record_id 기준 open 만 lookup).
create index if not exists idx_daily_tasks_related_open
  on daily_tasks(related_record_id)
  where status = 'open';

-- 만료 처리 cron 용 (expires_at < today AND status='open').
create index if not exists idx_daily_tasks_expiring
  on daily_tasks(expires_at)
  where status = 'open';
