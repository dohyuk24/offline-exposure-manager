-- 같은 물리적 매체 위치를 월별로 이어서 기록할 수 있도록
-- location_key 컬럼 추가. 기존 레코드는 독립된 UUID로 자동 채워진다.
--
-- 히스토리 = 같은 location_key 를 공유하는 레코드의 시계열.

alter table media_records
  add column if not exists location_key uuid not null default gen_random_uuid();

create index if not exists media_records_location_key_idx
  on media_records(location_key, created_at desc)
  where deleted_at is null;
