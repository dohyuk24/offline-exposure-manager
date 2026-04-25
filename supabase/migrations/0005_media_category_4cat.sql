-- 매체 카테고리 4분류 (P/A/D/O OOH) 로 마이그레이션.
-- 자세한 설계는 docs/media-category-restructure-plan.md 참고.
--
-- 매핑 규칙:
--   '공식'                            → 'P-OOH'
--   '자체보유'                        → 'O-OOH'
--   '비공식' AND media_type='바터제휴배너' → 'A-OOH'
--   '비공식' AND media_type='전단지'/'족자' → 'D-OOH'
--   '비공식' 그 외                    → 'D-OOH' (기본)

update media_records set category = 'P-OOH' where category = '공식';
update media_records set category = 'O-OOH' where category = '자체보유';

update media_records
set category = 'A-OOH'
where category = '비공식' and media_type = '바터제휴배너';

update media_records
set category = 'D-OOH'
where category = '비공식';
