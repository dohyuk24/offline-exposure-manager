-- 매체 카테고리 4분류 → 3분류 통합.
-- O-OOH(자체보유) 가 P-OOH(공식매체) 로 흡수되어 사라진다.
--
-- 새 분류:
--   P-OOH (공식매체)   — 외부 OOH + 지점 자체 보유 매체 통합
--   D-OOH (배포형매체) — 전단지·족자·게릴라 현수막 등
--   A-OOH (제휴매체)   — 혜택·관계 교환 기반
--
-- 코드 정합성: src/types/index.ts 의 MEDIA_CATEGORY 와 동기.
-- 적용 순서: 0005 → 0006 → 0007 → 0008

update media_records set category = 'P-OOH' where category = 'O-OOH';
