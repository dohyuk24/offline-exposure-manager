-- ============================================================
-- 오프라인 매체 관리 서비스 — 초기 필수 시드
--
-- 포함: branches (14개 지점 마스터 데이터)
-- 미포함: media_records / budget_logs / score_logs
--         → 앱에서 사용자가 직접 생성하는 데이터이므로 seed에 포함하지 않음.
--         → 데모·UI 확인용 샘플은 `supabase/demo_data.sql` 참조.
--
-- 재실행 안전성: 동일 slug 는 upsert 로 처리.
-- ============================================================

insert into branches (name, slug, budget_monthly, slack_channel) values
  ('오피스',       'office',              0, 'C_OFFICE'),
  ('역삼ARC',      'yeoksam-arc',    500000, 'C_YEOKSAM_ARC'),
  ('도곡',         'dogok',          500000, 'C_DOGOK'),
  ('신도림',       'sindorim',       500000, 'C_SINDORIM'),
  ('논현',         'nonhyeon',       500000, 'C_NONHYEON'),
  ('판교',         'pangyo',         500000, 'C_PANGYO'),
  ('강변',         'gangbyeon',      500000, 'C_GANGBYEON'),
  ('가산',         'gasan',          500000, 'C_GASAN'),
  ('삼성',         'samsung',        500000, 'C_SAMSUNG'),
  ('광화문',       'gwanghwamun',    500000, 'C_GWANGHWAMUN'),
  ('한티',         'hanti',          500000, 'C_HANTI'),
  ('마곡',         'magok',          500000, 'C_MAGOK'),
  ('판교벤처타운', 'pangyo-venture', 500000, 'C_PANGYO_VENTURE'),
  ('역삼GFC',      'yeoksam-gfc',    500000, 'C_YEOKSAM_GFC'),
  ('합정',         'hapjeong',       500000, 'C_HAPJEONG')
on conflict (slug) do update set
  name = excluded.name,
  budget_monthly = excluded.budget_monthly,
  slack_channel = excluded.slack_channel;
