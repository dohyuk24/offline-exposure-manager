-- branches.token 제거
-- 지점 담당자 인증은 URL 토큰이 아닌 Supabase Auth 계정 기반으로 전환.
-- 계정 ↔ 지점 매핑 테이블은 별도 마이그레이션에서 도입.

drop index if exists branches_token_idx;
alter table branches drop column if exists token;
