-- D-OOH (배포형 매체) 회차 이력.
-- 자세한 설계는 docs/media-category-restructure-plan.md (디자인 단위 카드).
--
-- 데이터 모델:
--   media_records (category='D-OOH') = 디자인 (1행 = 1 디자인)
--   distribution_events                = 회차 (N행 = N 배포 이벤트)

create table if not exists distribution_events (
  id uuid primary key default gen_random_uuid(),
  media_record_id uuid not null references media_records(id) on delete cascade,
  distributed_on date not null,         -- 배포일
  location_label text,                  -- 배포지 (자유 텍스트, 예: '강남대로 일대')
  quantity int,                         -- 장 / 매 (수량)
  cost int,                             -- 인쇄/인건비 (원). null = 미기재
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists idx_distribution_events_record
  on distribution_events(media_record_id, distributed_on desc);
