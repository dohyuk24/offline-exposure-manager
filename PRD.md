# 오프라인 매체 관리 서비스 PRD

> v0.4 · 2026-04-26 · 기획 docs (`docs/*.md`) 의 결정사항 흡수

---

## 1. 배경 및 목적

### 1.1 배경

지점별 오프라인 매체 현황은 Notion 카드 단위로 관리되고 있으나 다음 문제가 있다.

- 매체 현황을 언제·어떻게 업데이트해야 하는지 구조화된 체계 없음
- 유가/자체보유/배포형/제휴 매체가 혼재되어 카테고리별 현황 파악 어려움
- 마케팅실에서 전 지점 매체 현황을 한눈에 볼 수 없음
- 지점별 비공식매체 예산 잔액 실시간 파악 불가
- 지점이 매체를 업데이트·발굴해도 서로 알 수 없어 동기부여 부족
- "오늘 뭐 해야 하지" 가 자동으로 알려지지 않아 누락이 잦음

### 1.2 목적

| # | 목표 | 대상 사용자 |
|---|------|------------|
| 1 | 매체 현황을 4분류 (P/A/D/O OOH) + 지점별로 체계적으로 관리 | 지점 담당자 / 마케팅실 |
| 2 | "오늘 해야 할 일" 을 데일리로 자동 생성하고 미처리 시 점수 차감 | 지점 담당자 |
| 3 | 지점별 비공식·자체보유 예산 가시성 확보 (할당·사용·잔액) | 지점 담당자 / 마케팅실 |
| 4 | 업데이트·신규 발굴·D-OOH 회차 등 행위에 점수·피드백을 부여 | 지점 담당자 |
| 5 | 권한 기반 접근 (사용자별 지점 scope) | 마케팅실 어드민 |

### 1.3 서비스 비전

- **지점 담당자:** "오늘의 할 일이 자동으로 알려지고, 처리하면 점수가 쌓인다. 잊으면 차감된다."
- **마케팅실:** "지점에서 알아서 오프라인을 관리하고, 미처리는 한눈에 보인다."

---

## 2. 사용자 및 역할

### 2.1 Role (권한 위계)

| Role | 설명 | 핵심 권한 |
|------|------|-----------|
| **admin** | 전체 관리자 (마케팅실) | 모든 지점 조회·편집, 사용자 권한 관리, 어드민 페이지 |
| **manager** | 지점 매니저 | 허용된 지점 조회·편집 |
| **viewer** | 조회 전용 | 허용된 지점 조회만 |

### 2.2 Scope
- `admin` 은 자동 전체 지점 접근
- `manager`/`viewer` 는 `user_branch_access` 테이블에서 명시 부여한 지점만

### 2.3 인증
- **Supabase Auth + Slack OAuth (OIDC)** — 버핏서울 슬랙 워크스페이스 멤버
- 첫 로그인 시 `user_profiles` 자동 생성
- `INITIAL_ADMIN_EMAILS` 환경변수에 매칭되는 이메일은 자동 admin

> 자세한 구현은 `docs/permissions-plan.md` 참조 (N1, N2 머지 / N3, N4 보류)

### 2.4 지점 목록 (14개, 운영 우선순위 정렬)

역삼ARC, 도곡, 신도림, 논현, 판교, 강변, 가산, 삼성, 광화문, 한티, 마곡, 판교벤처타운, 역삼GFC, 합정

`src/lib/branch-order.ts` 의 `BRANCH_DISPLAY_ORDER` 가 정렬 source of truth.

---

## 3. 매체 분류 체계 (4분류)

| 코드 | 풀네임 | 정의 | 카드 단위 | 예산 귀속 |
|------|--------|------|-----------|-----------|
| **P-OOH** | Paid OOH | 비용 + 기간 단위 외부 광고 (버스·지하철·빌보드 등) | 위치별 | 오피스 별도 (본 서비스 budget_logs 미포함) |
| **A-OOH** | Affiliated OOH | 비용 대신 혜택·관계 교환 (바터제휴) | 위치별 | 지점 예산 (실비 발생 시) |
| **D-OOH** | Distribution OOH | 단기·고빈도 배포형 (전단지·족자) | **디자인별** + 회차 누적 | 지점 예산 (인쇄·인건비) |
| **O-OOH** | Owned OOH | 우리 통제 매체 (자체 현수막·족자 등) | 위치별 | 지점 예산 (제작비) |

### 3.1 P-OOH / O-OOH / A-OOH — 위치 단위 카드
1 카드 = 1 위치(=`location_key`). 같은 위치를 월별로 다시 등록하면 히스토리로 누적.

### 3.2 D-OOH — 디자인 단위 카드 + 회차 타임라인
- 1 카드 = 1 디자인 (예: "봄 PT 프로모션 전단지")
- 하위에 회차(distribution_events) N건 — 각 회차에 배포일·배포지·수량·비용
- 카드에 "누적 N장 / M회차" 노출
- 카드 클릭 → 타임라인 페이지 + 새 회차 추가

> 자세한 설계는 `docs/media-category-restructure-plan.md`

---

## 4. 정보 구조 (IA)

```
/                                    홈 · 전체 현황 (마케팅실용)
/ranking                             점수판 · 랭킹 (상위 3개 공개)
/branches                            모든 지점 그리드
/branches/[id]                       지점 페이지 (관리 탭, default)
   ├─ ?cat=P-OOH|O-OOH|D-OOH|A-OOH    카테고리 sub-tab (디폴트 전체)
   └─ ?view=card|table                 카드/테이블 토글 (디폴트 table)
/branches/[id]/insights              지점 현황 (점수)
/branches/[id]/budget                지점 예산 (사용 내역)
/branches/[id]/discover              신규 매체 등록 (P/O/A intent)
/branches/[id]/distributions/new     D-OOH 디자인 + 첫 회차 등록
/branches/[id]/records/[id]/edit     매체 수정
/branches/[id]/records/[id]/distributions   D-OOH 회차 타임라인
/branches/[id]/new?from=recordId     히스토리 이어가기

/login                               Slack OAuth 로그인 (N2)
/auth/callback, /auth/signout        OAuth 콜백 / 사인아웃

/guide/scoring                       점수 룰 가이드
/guide/barter-bp                     바터제휴 BP (공사 중)
/guide/media                         매체별 가이드 (공사 중)

/admin                               어드민 (지점/예산/슬랙 설정)
/admin/users                         권한 관리 (N4 보류)

/api/cron/generate-daily-tasks       새벽 03:00 KST task 생성 (Vercel Cron)
/api/cron/send-daily-slack           평일 14:00 KST 슬랙 발송
```

### 4.1 지점 페이지 탭 구조

**메인 탭**: 관리 / 현황 / 예산 (`<BranchTabs />`)

**관리 탭 안 sub-tab**: 전체 / P-OOH / O-OOH / D-OOH / A-OOH (`<CategorySubTabs />`, URL `?cat=`)

**뷰 토글**: 🃏 카드 / 📋 테이블 (디폴트 table, URL `?view=`)

---

## 5. 핵심 기능

### 5.1 매체 등록·관리

#### 5.1.1 매체 레코드 필드
| 필드 | 타입 | 비고 |
|------|------|------|
| category | text | P-OOH / A-OOH / D-OOH / O-OOH |
| media_type | text | OOH / 현수막 / 족자 / 전단지 / 바터제휴배너 / 기타 |
| status | text | 게시중 / 게시종료 / 협의중 / 협의실패 / 아이디어 / 미진행 / 협의완료 |
| description | text | 위치 라벨 (P/O/A) 또는 디자인 이름 (D) |
| start_date / end_date | date | 노출 기간 |
| cost | int | 원 단위. P-OOH 는 오피스 별도라 budget_logs 미반영 |
| barter_condition | text | A-OOH / 바터배너 시 제휴 조건 |
| photos[] | text[] | Supabase Storage URL |
| location_key | uuid | 같은 위치 히스토리 그룹 |
| latitude/longitude/zone_id | — | DB 저장만, UI 미표시 (지도 시각화 추후) |

#### 5.1.2 등록 흐름

| 흐름 | 진입 | 자동 세팅 |
|------|------|-----------|
| **P-OOH 발굴** | `/discover?intent=paid` | category=P-OOH, status=아이디어, is_new_discovery=true |
| **O-OOH 등록** | `/discover?intent=owned` | category=O-OOH, status=게시중 |
| **A-OOH 등록** | `/discover?intent=affiliated` | category=A-OOH, status=협의중 |
| **D-OOH 디자인 + 첫 회차** | `/distributions/new` | category=D-OOH, status=게시중 |
| **히스토리 이어가기** | `/new?from=recordId` | 부모의 location_key, category, media_type 상속 |
| **수정** | `/records/[id]/edit` | 기존 값 prefilled |

각 카테고리 섹션 헤더에 **`+ 등록`** CTA (라벨 통일).

#### 5.1.3 D-OOH 회차 관리
- `/records/[id]/distributions` — 디자인별 회차 타임라인
- 회차 추가 폼 inline (배포일·배포지·수량·비용·메모)
- 각 회차 [수정] / [삭제] (삭제 시 점수 reversal)

### 5.2 데일리 루틴 시스템 (Task Lifecycle)

> 자세한 설계: `docs/daily-routine-plan.md`

#### 5.2.1 흐름
1. **매일 새벽 03:00 KST** — `/api/cron/generate-daily-tasks` 가 지점별로 트리거 조건 검사 → `daily_tasks` insert (또는 carry over count +1)
2. **평일 14:00 KST** — `/api/cron/send-daily-slack` 이 지점 슬랙 채널에 미처리 task 요약 발송
3. **사용자 액션** (매체 등록·수정·사진 추가) → 관련 task 자동 완료 + 점수 부여
4. **모호한 task** → 위젯에서 수동 체크
5. **7일 미처리** → status='expired' + 점수 −5

#### 5.2.2 Task 종류 5개

| type | 트리거 | 자동 완료 매핑 | 수동 체크 |
|------|--------|----------------|-----------|
| `unofficial_update` | OWNED + 게시중 + updated_at ≥ 7일 | 매체 사진 추가 또는 status 변경 | ✅ |
| `posting_ending` | 게시중 + end_date ≤ 오늘+3일 | status=게시종료 또는 후속 매체 등록 | ✅ |
| `negotiating_followup` | 협의중 + 등록 ≥ 14일 | status 가 협의중 → 다른 값 | ✅ |
| `discovery_zero` | 이번 달 신규 발굴 0건 + 오늘 ≥ 15일 | 신규 발굴 매체 1건 등록 | ❌ (자동만) |
| `barter_progress` | 바터제휴배너 + 협의중 | status 변경 | ✅ |

> 임계값(7일/3일/14일/15일)은 `src/lib/daily-tasks/triggers.ts` 상수.

#### 5.2.3 점수 모델 (v1)

| 이벤트 | 점수 |
|--------|------|
| 일반 task 완료 (`unofficial_update` / `posting_ending` / `negotiating_followup`) | **+1** |
| 신규 발굴 task 완료 (`discovery_zero`) | **+5** |
| 바터제휴 task 완료 (`barter_progress`) | **+7** |
| Task 만료 (7일 미처리) | **−5** |
| 자발 보너스 (할 일 없는데 신규 발굴) | **+5** |
| D-OOH 신규 디자인 등록 | **+3** (첫 회차와 별도) |
| D-OOH 회차 추가 (반복 배포) | **+2** |
| D-OOH 회차 삭제 | **−2** (대칭 reversal) |

> 점수 값은 `src/types/index.ts` 의 `SCORE_CONFIG` 상수.
> 가이드 페이지: `/guide/scoring` (사용자용 설명 + FAQ)

#### 5.2.4 위젯 (관리 탭 상단)
- "오늘의 할 일" 카드 — 진척률 + 항목 리스트
- 각 항목에 (i) 툴팁 — 완료 +N / 만료 −5 점수 룰
- 카테고리 carry over count ≥ 1 → "⚠ N+1일째 미처리" 빨간 배지
- 자동 완료 task → "자동 완료" 회색 배지

#### 5.2.5 홈 미처리 요약 배너
- 0 건 아니면 홈 상단에 "오늘 미처리 N건 — 광화문 5, 신도림 4 …"
- 마케팅실 시각화. 0 건 시 미노출.

### 5.3 슬랙 봇 알림

#### 5.3.1 데일리 task 발송 (평일 14:00 KST)
- 지점별 미처리 task 요약 → 지점 슬랙 채널
- User Group 멘션 (`<!subteam^...>`)
- 0 건 지점 → 발송 X
- `SLACK_TEST_CHANNEL_OVERRIDE` 시 모든 발송 → 단일 테스트 채널

#### 5.3.2 액션 알림
| 이벤트 | 채널 | 함수 |
|--------|------|------|
| 신규 매체 발굴 | 마케팅실 채널 | `sendDiscoveryAlert` |
| 공식매체(P-OOH) 후보 제안 | 마케팅실 채널 | `sendOfficialProposalAlert` |
| 바터제휴 성사 | 마케팅실 채널 | `sendBarterSuccessAlert` |
| 업데이트 리마인더 (v0 호환) | 지점 채널 | `sendReminderAlert` |

> 모든 발송은 `lib/slack/notify.ts` + `lib/slack/client.ts` (Bot Token chat.postMessage) 경유

### 5.4 예산 관리

- 지점별 월 할당 (default 500,000원, 어드민에서 수정)
- `/branches/[id]/budget` 페이지 — BudgetWidget + 사용 내역 리스트
- 매체 등록·수정 시 cost > 0 + **카테고리가 P-OOH 가 아니면** budget_logs 자동 누적
- D-OOH 회차도 비용 입력 시 자동 누적 (record + 월 단위 합계 1행 패턴)

### 5.5 어드민

비밀번호 인증 진입 (v1, `ADMIN_PASSWORD`). 마케팅실 전용. 추후 권한 시스템(N3) 으로 전환 예정.

| 기능 | 설명 |
|------|------|
| 지점 관리 | 추가, 이름 수정, 예산·슬랙 채널·슬랙 그룹 ID 설정, 비활성화 |
| 권한 관리 (N4 보류) | 사용자별 role / 지점 scope 부여·수정 |

---

## 6. 권한 시스템

> 자세한 설계: `docs/permissions-plan.md`

### 6.1 인증
- Supabase Auth + Slack OAuth (`provider='slack_oidc'`)
- `/login` → 슬랙 로그인 → `/auth/callback` 코드 교환 → 세션 쿠키
- 첫 로그인 시 `user_profiles` 자동 생성 (`ensureUserProfile`)

### 6.2 권한 모델 (3-layer)
- **Role**: admin / manager / viewer (`USER_ROLE`)
- **Scope**: `user_branch_access` (N:M)
- **Capability**: v2 보류

### 6.3 부트스트랩
- `INITIAL_ADMIN_EMAILS` 환경변수 (콤마 구분 이메일) → 첫 로그인 시 자동 admin

### 6.4 가드 (N3 보류)
- `src/middleware.ts` — 미인증 시 `/login` redirect
- `requireUser` / `requireRole(min)` / `requireBranchAccess(slug)` 헬퍼
- RLS 정책 활성화

---

## 7. 데이터 구조

전체 스키마는 `CLAUDE.md` 의 "DB 스키마 (Supabase)" 섹션 참조.

핵심 테이블:
- `branches` (14지점, 슬랙 채널·그룹 ID 포함)
- `media_records` (4분류 카테고리, location_key 히스토리)
- `distribution_events` (D-OOH 회차)
- `daily_tasks` (Task 라이프사이클)
- `score_logs` (v0 호환 + v1 task 기반 액션)
- `budget_logs` (P-OOH 외 카테고리 + D-OOH 회차)
- `user_profiles` + `user_branch_access` (권한)

마이그레이션:
1. `0001_init_schema.sql`
2. `0002_drop_branch_token.sql`
3. `0003_add_location_key.sql`
4. `0004_daily_tasks.sql`
5. `0005_media_category_4cat.sql`
6. `0006_distribution_events.sql`
7. `0007_user_permissions.sql`

---

## 8. 개발 범위

### v1.0 구현 완료
- 4분류 매체 등록·수정·삭제 + 카테고리별 sub-tab + 카드/테이블 토글
- D-OOH 디자인 카드 + 회차 타임라인 (수정/삭제 포함)
- 데일리 루틴 시스템 (cron + 위젯 + 슬랙 발송 + 점수 모델)
- 지점 페이지 3탭 (관리/현황/예산), 모바일 탭바
- 홈 전체 현황 + 미처리 요약 배너
- 점수판 / 랭킹 (상위 3개)
- 어드민 (지점·예산·슬랙 설정)
- 사이드바 위계 (active 강조 + chevron 토글 + 사용자 메뉴)
- 슬랙 알림 (Bot Token chat.postMessage)
- Slack OAuth 로그인 코드 (셋업 미완)

### v1.0 미구현 / 보류
- 권한 가드 강제 + RLS (N3)
- 어드민 권한 관리 페이지 `/admin/users` (N4)
- 지도 기반 매체 뷰 (latitude/longitude/zone_id 활용)
- 매체별 제작 가이드 콘텐츠 (`/guide/media`, `/guide/barter-bp`)
- A-OOH 전용 흐름 (현재는 일반 폼 재활용)
- 검색·필터·정렬

---

## 9. 미결 사항

| # | 질문 | 영향 범위 |
|---|------|----------|
| 1 | Zone ID 정의: 상권 구역을 누가 어떻게 사전 정의하는가? | DB / 추후 지도 |
| 2 | 권한 시스템 N3/N4 진행 시점: 사용자 늘어날 때 vs 배포 직전 | 운영 |
| 3 | D-OOH 디자인 캠페인 단위 그룹핑 (캠페인 entity 도입 필요한가) | D-OOH UX |
| 4 | 데일리 task 임계값 (7일/3일/14일) 운영 후 조정 정책 | 점수 모델 |
| 5 | Vercel 배포 + Cron 활성화 시점 | 인프라 |

---

## 10. 용어 정의

| 용어 | 정의 |
|------|------|
| P-OOH | Paid OOH. 비용 + 기간 단위 외부 광고 (구 "공식매체") |
| A-OOH | Affiliated OOH. 혜택·관계 교환으로 확보한 외부 매체 (구 "비공식 + 바터제휴배너") |
| D-OOH | Distribution OOH. 단기 배포형 (전단지·족자) (구 "비공식 + 전단지/족자") |
| O-OOH | Owned OOH. 우리 통제 상시 매체 (구 "자체보유") |
| 디자인 / 회차 | D-OOH 단위 — 디자인 1건 = media_records 1행, 회차 N건 = distribution_events |
| Task / Daily Task | 시스템이 매일 새벽 자동 생성하는 "오늘의 할 일" |
| Carry Over | Task 가 미처리 상태로 다음날 이어지는 누적 카운트 |
| Role / Scope | 권한 (admin/manager/viewer) / 접근 가능 지점 |
| Slack User Group | 슬랙 그룹 멘션 (`<!subteam^...>`) — 지점별 매체 관리자 그룹 |
| Bot Token | Slack `chat.postMessage` 인증용. webhook 대체. |
| Cron Secret | `/api/cron/*` Bearer 인증. Vercel Cron 자동 헤더 |

---

## 11. 관련 문서

- `CLAUDE.md` — Claude Code 작업 가이드, DB 스키마, 코드 컨벤션
- `DESIGN.md` — 디자인 토큰, 컴포넌트 스펙
- `README.md` — 프로젝트 개요
- `docs/daily-routine-plan.md` — 데일리 task 의사결정 history
- `docs/page-restructure-plan.md` — 지점 페이지 재구조화 history
- `docs/media-category-restructure-plan.md` — 4분류 도입 history
- `docs/permissions-plan.md` — 권한 시스템 설계 (부분 구현)
