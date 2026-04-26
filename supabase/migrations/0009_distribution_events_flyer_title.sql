-- D-OOH 회차에 '전단 제목' 필드 추가.
-- 회차마다 어떤 내용의 전단을 배포했는지 별도로 기록.

alter table distribution_events
  add column if not exists flyer_title text;
