# CLAUDE.md — Claude Code 작업 가이드

이 파일을 가장 먼저 읽어줘. 프로젝트의 모든 결정 기준이 여기 있어.

---

## 프로젝트 개요

오프라인 매체 관리 서비스. 지점 담당자가 현장에서 매체를 기록하고, 마케팅실이 전 지점 현황을 관리하는 웹 앱.

- 상세 요구사항 → `PRD.md`
- 디자인 스펙 → `DESIGN.md`
- 프로젝트 개요 → `README.md`

---

## 기술 스택

> 아직 확정 전이면 Claude Code가 제안하되, 아래 제약은 반드시 지켜줘.

- **프레임워크:** Next.js (App Router)
- **스타일링:** Tailwind CSS
- **DB / 백엔드:** Supabase (PostgreSQL + Storage + Auth)
- **배포:** Vercel
- **Slack 연동:** Slack Incoming Webhook
- **폰트:** Pretendard

---

## 코드 작성 규칙

### 일반
- 모든 컴포넌트는 TypeScript로 작성
- 파일명은 kebab-case (`media-card.tsx`, `branch-page.tsx`)
- 컴포넌트명은 PascalCase (`MediaCard`, `BranchPage`)
- 한국어 주석 사용 가능 (UI 관련 로직은 한국어로 설명해도 됨)

### 컴포넌트
- UI 컴포넌트는 `components/` 하위에 기능별 폴더로 분리
- 페이지 컴포넌트는 `app/` 하위 App Router 구조 따름
- 재사용 가능한 컴포넌트는 props 타입 명시 필수

### 상태관리
- 서버 상태: Supabase + React Query (또는 Next.js Server Components)
- 클라이언트 상태: useState / useReducer (전역 상태 최소화)

### 스타일
- Tailwind 유틸리티 클래스 우선
- 커스텀 CSS는 `DESIGN.md`의 토큰 기준으로 작성
- 반응형은 모바일 퍼스트 (`sm:`, `md:`, `lg:` 순서)

---

## 디렉토리 구조

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 홈 · 전체 현황
│   ├── ranking/
│   │   └── page.tsx            # 점수판 · 랭킹
│   ├── branches/
│   │   └── [branchId]/
│   │       └── page.tsx        # 지점 페이지
│   ├── guide/
│   │   ├── barter-bp/page.tsx  # 바터제휴 BP (공사 중)
│   │   └── media/page.tsx      # 매체별 가이드 (공사 중)
│   └── admin/
│       └── page.tsx            # 어드민
├── components/
│   ├── media/
│   │   ├── media-card.tsx      # 갤러리 카드 컴포넌트
│   │   ├── media-form.tsx      # 매체 등록/수정 폼
│   │   └── media-grid.tsx      # 카드 그리드 레이아웃
│   ├── layout/
│   │   ├── sidebar.tsx         # 사이드바 네비게이션
│   │   └── discovery-feed-bar.tsx  # 상단 발견 피드 배너
│   ├── budget/
│   │   └── budget-widget.tsx   # 예산 위젯
│   ├── score/
│   │   └── score-widget.tsx    # 점수 위젯
│   └── ui/                     # 공통 UI (배지, 버튼, 토스트 등)
│       ├── status-badge.tsx
│       ├── micro-feedback.tsx
│       └── wip-placeholder.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── queries/            # DB 쿼리 함수
│   └── slack/
│       └── notify.ts           # Slack 알림 함수
└── types/
    └── index.ts                # 공통 타입 정의
```

---

## DB 스키마 (Supabase)

```sql
-- 지점
-- 인증: 지점 담당자 전용 URL을 쓰지 않고 Supabase Auth 계정 기반으로 권한을 관리한다.
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,        -- URL용 (yeoksam-arc)
  budget_monthly integer default 500000,
  slack_channel text,               -- Slack 채널 ID
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 매체 레코드
create table media_records (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  category text not null,           -- 공식 / 자체보유 / 비공식
  media_type text not null,         -- OOH / 현수막 / 족자 / 전단지 / 바터제휴배너 / 기타
  status text not null,             -- 게시중 / 게시종료 / 협의중 / 협의실패 / 아이디어 / 미진행 / 협의완료
  description text,
  size text,
  content_type text,                -- 이미지 / 텍스트 / 영상
  start_date date,
  end_date date,
  cost integer,                     -- 원 단위
  barter_condition text,
  internal_code text,
  managed_by_marketing boolean default false,
  latitude double precision,        -- GPS (추후 지도 연동)
  longitude double precision,       -- GPS (추후 지도 연동)
  zone_id text,                     -- 상권 구역 ID (추후 지도 연동)
  is_new_discovery boolean default false,  -- 신규 발굴 여부
  photos text[],                    -- Supabase Storage URL 배열
  location_key uuid not null default gen_random_uuid(),  -- 같은 위치 레코드 그룹 (히스토리)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz            -- 소프트 딜리트
);

-- 예산 사용 내역
create table budget_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  media_record_id uuid references media_records(id),
  amount integer not null,
  memo text,
  year_month text not null,         -- '2026-04' 형식
  created_at timestamptz default now()
);

-- 점수 내역
create table score_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  media_record_id uuid references media_records(id),
  action text not null,             -- update / new_discovery / barter_success
  score integer not null,
  year_month text not null,         -- '2026-04'
  created_at timestamptz default now()
);
```

---

## 상태값 정의

`DESIGN.md` 색상 기준과 함께 아래 값을 사용:

```typescript
export const MEDIA_STATUS = {
  POSTING: '게시중',
  ENDED: '게시종료',
  NEGOTIATING: '협의중',
  FAILED: '협의실패',
  IDEA: '아이디어',
  NOT_STARTED: '미진행',
  NEGOTIATED: '협의완료',
} as const;

export const MEDIA_CATEGORY = {
  OFFICIAL: '공식',
  OWNED: '자체보유',
  UNOFFICIAL: '비공식',
} as const;

export const SCORE_CONFIG = {
  UPDATE: 1,
  UPDATE_WITH_PHOTO: 1.5,
  NEW_DISCOVERY: 5,
  BARTER_SUCCESS: 7,
} as const;
```

---

## Slack 알림 함수 규칙

`lib/slack/notify.ts`에서 모든 Slack 알림을 중앙 관리.

```typescript
// 이런 식으로 함수 분리
sendDiscoveryAlert(branch, mediaRecord)   // 신규 발굴 → 마케팅실 채널
sendOfficialProposalAlert(branch, media)  // 공식매체 제안 → 담당자 DM
sendReminderAlert(branch)                 // 업데이트 리마인더 → 지점 채널
```

---

## 브랜치 전략

```
main     ← 배포 브랜치. 직접 push 절대 금지
dev      ← PR 머지 대상. main으로 배포 시 머지
  ├── feat/[기능명]    ex) feat/media-card
  ├── fix/[버그명]     ex) fix/photo-upload
  └── chore/[작업명]  ex) chore/supabase-schema
```

### 작업 순서
1. `dev`에서 새 브랜치 생성: `git checkout -b feat/기능명`
2. 작업 후 커밋
3. GitHub에 push → PR 생성 (→ `dev` 대상)
4. 리뷰 후 머지

### 커밋 메시지 컨벤션
```
feat: 매체 카드 컴포넌트 추가
fix: 사진 업로드 HEIC 변환 오류 수정
chore: Supabase 스키마 초기 설정
style: 상태 배지 색상 조정
docs: CLAUDE.md 기술스택 업데이트
```

---

## Claude Code 작업 요청 패턴

작업 요청할 때 이 형식으로 하면 효율적이야:

```
[브랜치] feat/media-card 에서 작업해줘.
[목표] 매체 카드 컴포넌트 만들어줘.
[참고] DESIGN.md 섹션 4 기준으로.
[제약] TypeScript, Tailwind만 사용.
```

---

## 체크리스트 — PR 올리기 전

- [ ] 모바일에서 UI 확인했는가?
- [ ] TypeScript 타입 에러 없는가? (`tsc --noEmit`)
- [ ] 새 환경변수 추가했으면 `.env.example`에도 추가했는가?
- [ ] Supabase 스키마 변경했으면 마이그레이션 파일 있는가?
- [ ] Slack 알림 함수 직접 호출하지 않고 `lib/slack/notify.ts` 통하는가?
