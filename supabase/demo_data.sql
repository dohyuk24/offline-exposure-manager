-- ============================================================
-- 데모 데이터 — 선택적(optional)
--
-- 목적: UI·그리드·위젯 렌더를 빠르게 확인하기 위한 더미 데이터.
-- 실사용 환경에는 적용하지 말 것. 매체·예산·점수는 앱에서 사용자가 생성한다.
--
-- 선행 조건: supabase/seed.sql 을 먼저 실행해 14개 지점이 존재해야 함.
-- 대상 월: 2026-04
-- 재실행 안전성: 실행 전 대상 테이블 데모 데이터를 모두 삭제(truncate 대신 delete) 한다.
-- ============================================================

delete from score_logs  where year_month = '2026-04';
delete from budget_logs where year_month = '2026-04';
delete from media_records
 where branch_id in (select id from branches);

-- ============================================================
-- 1) 매체 레코드 (지점별 4건 × 14지점 = 56건)
-- ============================================================

-- 역삼ARC
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'yeoksam-arc'),
   '공식', 'OOH', '협의완료', '강남역 2번 출구 버스쉘터', '가로 2m × 세로 1m', '이미지',
   '2026-05-01', '2026-05-31', null, null, false, '{}', true),
  ((select id from branches where slug = 'yeoksam-arc'),
   '자체보유', '현수막', '게시중', '건물 외벽 대형 현수막', '가로 5m × 세로 1.5m', '이미지',
   '2026-04-01', '2026-04-30', 180000, null, false, '{}', false),
  ((select id from branches where slug = 'yeoksam-arc'),
   '비공식', '바터제휴배너', '게시중', '옆 블록 카페 창측 배너', 'A2', '이미지',
   '2026-04-10', '2026-05-10', 0, '카페 원두 PT 수업 1회 제공', false, '{}', false),
  ((select id from branches where slug = 'yeoksam-arc'),
   '비공식', '전단지', '게시종료', '역삼역 인근 오피스 배포', 'A5', '이미지',
   '2026-04-05', '2026-04-12', 80000, null, false, '{}', false);

-- 도곡
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'dogok'),
   '공식', 'OOH', '협의중', '도곡역 스크린도어 광고 협의', null, '이미지',
   null, null, null, null, true, '{}', true),
  ((select id from branches where slug = 'dogok'),
   '자체보유', '현수막', '게시중', '주민센터 앞 현수막 거치대', '가로 4m × 세로 0.9m', '이미지',
   '2026-04-01', '2026-04-30', 120000, null, false, '{}', false),
  ((select id from branches where slug = 'dogok'),
   '비공식', '족자', '아이디어', '도곡초 맞은편 카페 입구', null, null,
   null, null, null, null, false, '{}', false),
  ((select id from branches where slug = 'dogok'),
   '비공식', '전단지', '게시중', '타워팰리스 상가 라운지', 'A5', '이미지',
   '2026-04-15', '2026-04-30', 60000, null, false, '{}', false);

-- 신도림
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'sindorim'),
   '공식', 'OOH', '미진행', '신도림역 디스코 광고판 후보', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'sindorim'),
   '자체보유', '현수막', '게시중', '디큐브시티 외부 연결통로', '가로 3m × 세로 1m', '이미지',
   '2026-04-05', '2026-05-04', 150000, null, false, '{}', false),
  ((select id from branches where slug = 'sindorim'),
   '비공식', '바터제휴배너', '협의중', '이마트 신도림 입점사와 배너 교환 협의', 'B1', '이미지',
   null, null, null, '이마트 키즈카페 체험권 10매 제공', true, '{}', false),
  ((select id from branches where slug = 'sindorim'),
   '비공식', '족자', '게시종료', '역사 내 가판대', null, '이미지',
   '2026-03-15', '2026-04-10', 90000, null, false, '{}', false);

-- 논현
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'nonhyeon'),
   '공식', 'OOH', '협의실패', '논현역 버스쉘터 공고 마감', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'nonhyeon'),
   '자체보유', '현수막', '게시중', '가구거리 중앙 현수막', '가로 4m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 160000, null, false, '{}', false),
  ((select id from branches where slug = 'nonhyeon'),
   '비공식', '바터제휴배너', '게시중', '필라테스 스튜디오 출입구 상호 배너', 'A2', '이미지',
   '2026-04-08', '2026-05-07', 0, '상호 회원 공동 이벤트 1회', false, '{}', false),
  ((select id from branches where slug = 'nonhyeon'),
   '비공식', '전단지', '협의완료', '영동시장 상인회 협의 완료', 'A4', '이미지',
   '2026-05-01', '2026-05-15', 40000, null, false, '{}', false);

-- 판교
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'pangyo'),
   '공식', 'OOH', '협의완료', '판교역 지하 통로 대형 래핑', '가로 6m × 세로 2m', '이미지',
   '2026-05-01', '2026-07-31', null, null, true, '{}', true),
  ((select id from branches where slug = 'pangyo'),
   '자체보유', '현수막', '게시중', 'H스퀘어 정문 현수막', '가로 4m × 세로 1.2m', '이미지',
   '2026-04-01', '2026-04-30', 200000, null, false, '{}', false),
  ((select id from branches where slug = 'pangyo'),
   '자체보유', '족자', '게시중', '로비 엘리베이터 옆 족자', 'B2', '이미지',
   '2026-04-01', '2026-06-30', 80000, null, false, '{}', false),
  ((select id from branches where slug = 'pangyo'),
   '비공식', '바터제휴배너', '아이디어', '테크노밸리 카페 체인 제휴 아이디어', null, null,
   null, null, null, '상호 멤버십 할인 연계', false, '{}', false);

-- 강변
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'gangbyeon'),
   '공식', 'OOH', '미진행', '강변역 테크노마트 LED 후보', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'gangbyeon'),
   '자체보유', '현수막', '게시중', '테크노마트 외벽', '가로 5m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 170000, null, false, '{}', false),
  ((select id from branches where slug = 'gangbyeon'),
   '비공식', '전단지', '게시중', '구의공원 산책로', 'A5', '이미지',
   '2026-04-10', '2026-04-25', 50000, null, false, '{}', false),
  ((select id from branches where slug = 'gangbyeon'),
   '비공식', '기타', '아이디어', '한강공원 간이 스탠딩 보드', null, null,
   null, null, null, null, true, '{}', false);

-- 가산
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'gasan'),
   '공식', 'OOH', '협의중', '가산디지털단지 시내버스 외부 래핑', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'gasan'),
   '자체보유', '현수막', '게시종료', '마리오아울렛 옆 공터', '가로 4m × 세로 1m', '이미지',
   '2026-03-01', '2026-03-31', 140000, null, false, '{}', false),
  ((select id from branches where slug = 'gasan'),
   '비공식', '바터제휴배너', '게시중', '가산 W몰 내 푸드코트 배너', 'A1', '이미지',
   '2026-04-05', '2026-05-04', 0, '푸드코트 주간 PT 체험권 5매', false, '{}', false),
  ((select id from branches where slug = 'gasan'),
   '비공식', '족자', '미진행', '지하철 2번 출구 인근 후보지', null, null,
   null, null, null, null, false, '{}', false);

-- 삼성
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'samsung'),
   '공식', 'OOH', '협의완료', '코엑스 지하 대형 LED 3월 집행 확정', null, '영상',
   '2026-05-15', '2026-06-15', null, null, false, '{}', true),
  ((select id from branches where slug = 'samsung'),
   '자체보유', '현수막', '게시중', '본사 오피스 외벽', '가로 6m × 세로 1.5m', '이미지',
   '2026-04-01', '2026-04-30', 220000, null, false, '{}', false),
  ((select id from branches where slug = 'samsung'),
   '비공식', '바터제휴배너', '게시중', '삼성동 퍼스널 스튜디오 협업', 'A2', '이미지',
   '2026-04-12', '2026-05-11', 0, '원데이 클래스 상호 홍보', true, '{}', false),
  ((select id from branches where slug = 'samsung'),
   '비공식', '전단지', '아이디어', '코엑스몰 팝업 존 근처 배포 구상', null, null,
   null, null, null, null, false, '{}', false);

-- 광화문
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'gwanghwamun'),
   '공식', 'OOH', '협의중', '광화문역 스크린도어 협의', null, '이미지',
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'gwanghwamun'),
   '자체보유', '현수막', '게시중', '광화문 오피스 건물 1층 로비', '가로 3m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 130000, null, false, '{}', false),
  ((select id from branches where slug = 'gwanghwamun'),
   '비공식', '족자', '게시중', '서점 체인 입구 족자 거치', 'B2', '이미지',
   '2026-04-08', '2026-05-07', 70000, null, false, '{}', false),
  ((select id from branches where slug = 'gwanghwamun'),
   '비공식', '전단지', '게시종료', '세종대로 오피스 배포', 'A5', '이미지',
   '2026-03-25', '2026-04-05', 45000, null, false, '{}', false);

-- 한티
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'hanti'),
   '공식', 'OOH', '아이디어', '한티역 인근 디지털 사이니지 후보', null, null,
   null, null, null, null, true, '{}', true),
  ((select id from branches where slug = 'hanti'),
   '자체보유', '현수막', '게시중', '대치동 학원가 입구', '가로 4m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 150000, null, false, '{}', false),
  ((select id from branches where slug = 'hanti'),
   '비공식', '바터제휴배너', '협의완료', '인근 요가 스튜디오 교차 배너', 'A2', '이미지',
   '2026-05-01', '2026-05-31', 0, '상호 원데이 체험권 발급', false, '{}', false),
  ((select id from branches where slug = 'hanti'),
   '비공식', '전단지', '게시중', '한티역 아침 배포', 'A5', '이미지',
   '2026-04-15', '2026-04-25', 55000, null, false, '{}', false);

-- 마곡
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'magok'),
   '공식', 'OOH', '협의완료', 'LG사이언스파크 셔틀 내부 광고', null, '이미지',
   '2026-05-01', '2026-05-31', null, null, false, '{}', true),
  ((select id from branches where slug = 'magok'),
   '자체보유', '현수막', '게시중', '센터 1층 대로변', '가로 4m × 세로 1.2m', '이미지',
   '2026-04-01', '2026-04-30', 160000, null, false, '{}', false),
  ((select id from branches where slug = 'magok'),
   '비공식', '바터제휴배너', '게시중', '카페마곡 창측 배너', 'A1', '이미지',
   '2026-04-10', '2026-05-09', 0, '주 1회 라떼 시음권 제공', true, '{}', false),
  ((select id from branches where slug = 'magok'),
   '비공식', '족자', '미진행', '10호선 연장 예정 역 인근 후보', null, null,
   null, null, null, null, false, '{}', false);

-- 판교벤처타운
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'pangyo-venture'),
   '공식', 'OOH', '미진행', '벤처타운 셔틀버스 외부 래핑 후보', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'pangyo-venture'),
   '자체보유', '현수막', '게시중', '단지 내 공용 게시대', '가로 3m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 110000, null, false, '{}', false),
  ((select id from branches where slug = 'pangyo-venture'),
   '비공식', '바터제휴배너', '협의중', '벤처 카페 라운지 배너 교환', 'A2', '이미지',
   null, null, null, '입주 기업 대상 단체 체험권', false, '{}', false),
  ((select id from branches where slug = 'pangyo-venture'),
   '비공식', '전단지', '게시중', '입주사 메일룸 비치', 'A5', '이미지',
   '2026-04-12', '2026-04-30', 35000, null, false, '{}', false);

-- 역삼GFC
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'yeoksam-gfc'),
   '공식', 'OOH', '협의완료', 'GFC 내부 엘리베이터 디지털 사이니지', null, '영상',
   '2026-05-01', '2026-05-31', null, null, false, '{}', true),
  ((select id from branches where slug = 'yeoksam-gfc'),
   '자체보유', '현수막', '게시종료', '1층 로비 입구 현수막', '가로 3m × 세로 1m', '이미지',
   '2026-03-01', '2026-03-31', 140000, null, false, '{}', false),
  ((select id from branches where slug = 'yeoksam-gfc'),
   '비공식', '바터제휴배너', '게시중', '오피스 공용 라운지 배너', 'A1', '이미지',
   '2026-04-05', '2026-05-04', 0, '입주사 제휴 이벤트 운영', true, '{}', false),
  ((select id from branches where slug = 'yeoksam-gfc'),
   '비공식', '전단지', '협의중', '빌딩 출입구 배포 일정 협의', 'A5', null,
   null, null, null, null, false, '{}', false);

-- 합정
insert into media_records
  (branch_id, category, media_type, status, description, size, content_type,
   start_date, end_date, cost, barter_condition, is_new_discovery, photos, managed_by_marketing)
values
  ((select id from branches where slug = 'hapjeong'),
   '공식', 'OOH', '협의중', '합정역 AK& 인근 버스쉘터', null, null,
   null, null, null, null, false, '{}', true),
  ((select id from branches where slug = 'hapjeong'),
   '자체보유', '현수막', '게시중', '망원로 방향 건물 외벽', '가로 4m × 세로 1m', '이미지',
   '2026-04-01', '2026-04-30', 145000, null, false, '{}', false),
  ((select id from branches where slug = 'hapjeong'),
   '비공식', '바터제휴배너', '게시중', '망원시장 상인회 배너', 'A2', '이미지',
   '2026-04-10', '2026-05-09', 0, '상인회 대상 주 1회 클래스 개방', false, '{}', false),
  ((select id from branches where slug = 'hapjeong'),
   '비공식', '족자', '아이디어', '합정역 2번 출구 공터 거치 아이디어', null, null,
   null, null, null, null, true, '{}', false);

-- ============================================================
-- 2) 예산 사용 내역 (year_month = '2026-04')
-- ============================================================

insert into budget_logs (branch_id, media_record_id, amount, memo, year_month)
select
  m.branch_id,
  m.id,
  m.cost,
  m.description || ' 집행',
  '2026-04'
from media_records m
where m.cost is not null
  and m.cost > 0
  and m.category in ('자체보유', '비공식')
  and (m.start_date is null or date_trunc('month', m.start_date) = date '2026-04-01');

-- 지점별 추가 비용 (제작·인쇄 등 개별 집행)
insert into budget_logs (branch_id, amount, memo, year_month) values
  ((select id from branches where slug = 'yeoksam-arc'),    25000, '전단지 인쇄 추가분', '2026-04'),
  ((select id from branches where slug = 'dogok'),          15000, '족자 출력',         '2026-04'),
  ((select id from branches where slug = 'sindorim'),       30000, '현수막 재출력',     '2026-04'),
  ((select id from branches where slug = 'nonhyeon'),       20000, '바터 답례 다과',    '2026-04'),
  ((select id from branches where slug = 'pangyo'),         45000, '로비 족자 제작',    '2026-04'),
  ((select id from branches where slug = 'gangbyeon'),      18000, '전단지 인쇄',       '2026-04'),
  ((select id from branches where slug = 'gasan'),          22000, '배너 출력 비용',    '2026-04'),
  ((select id from branches where slug = 'samsung'),        35000, '현수막 교체',       '2026-04'),
  ((select id from branches where slug = 'gwanghwamun'),    12000, '족자 부자재',       '2026-04'),
  ((select id from branches where slug = 'hanti'),          18000, '전단지 추가 인쇄',  '2026-04'),
  ((select id from branches where slug = 'magok'),          28000, '현수막 교체 인쇄',  '2026-04'),
  ((select id from branches where slug = 'pangyo-venture'), 16000, '메일룸 비치 인쇄',  '2026-04'),
  ((select id from branches where slug = 'yeoksam-gfc'),    24000, '라운지 배너 출력',  '2026-04'),
  ((select id from branches where slug = 'hapjeong'),       20000, '상인회 배너 제작',  '2026-04');

-- ============================================================
-- 3) 점수 내역 (year_month = '2026-04')
-- ============================================================

insert into score_logs (branch_id, action, score, year_month) values
  ((select id from branches where slug = 'yeoksam-arc'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'yeoksam-arc'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'yeoksam-arc'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'dogok'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'dogok'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'sindorim'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'sindorim'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'sindorim'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'nonhyeon'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'nonhyeon'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo'),         'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo'),         'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo'),         'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo'),         'update', 1, '2026-04'),
  ((select id from branches where slug = 'gangbyeon'),      'update', 1, '2026-04'),
  ((select id from branches where slug = 'gangbyeon'),      'update', 1, '2026-04'),
  ((select id from branches where slug = 'gasan'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'gasan'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'samsung'),        'update', 1, '2026-04'),
  ((select id from branches where slug = 'samsung'),        'update', 1, '2026-04'),
  ((select id from branches where slug = 'samsung'),        'update', 1, '2026-04'),
  ((select id from branches where slug = 'gwanghwamun'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'gwanghwamun'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'hanti'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'hanti'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'hanti'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'magok'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'magok'),          'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo-venture'), 'update', 1, '2026-04'),
  ((select id from branches where slug = 'pangyo-venture'), 'update', 1, '2026-04'),
  ((select id from branches where slug = 'yeoksam-gfc'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'yeoksam-gfc'),    'update', 1, '2026-04'),
  ((select id from branches where slug = 'hapjeong'),       'update', 1, '2026-04'),
  ((select id from branches where slug = 'hapjeong'),       'update', 1, '2026-04');

-- new_discovery: 신규 발굴 레코드 자동 부여
insert into score_logs (branch_id, media_record_id, action, score, year_month)
select branch_id, id, 'new_discovery', 5, '2026-04'
from media_records
where is_new_discovery = true;

-- barter_success: 바터제휴배너 + 게시중 + barter_condition 있는 레코드
insert into score_logs (branch_id, media_record_id, action, score, year_month)
select branch_id, id, 'barter_success', 7, '2026-04'
from media_records
where media_type = '바터제휴배너'
  and status = '게시중'
  and barter_condition is not null;
