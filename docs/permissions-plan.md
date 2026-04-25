# 권한 관리 시스템 — 기획

> **이 문서의 위치**: PRD 반영 전 단계. 인증 방식·권한 모델·어드민 UI 결정 후 PRD 흡수 + 구현.
> **작성일**: 2026-04-26
> **목적**: 어떤 사용자가 어떤 페이지/지점에 접근할 수 있는지 명확히. 어드민이 사용자별 권한을 어드민에서 부여·수정.

---

## 1. 현재 상태

- **인증**: `ADMIN_PASSWORD` 환경변수 단순 비밀번호 — 어드민 페이지만 보호
- **그 외 페이지**: 인증·권한 체크 없음 (누구나 모든 지점·매체·점수·예산 접근 가능)
- **DB 스키마**: `branches`, `media_records`, `daily_tasks`, `score_logs`, `budget_logs`, `distribution_events` — 사용자/권한 테이블 없음
- **RLS**: 전 테이블 OFF (내부 툴 가정)

→ 사용자 늘어나면 "지점 매니저는 자기 지점만, 마케팅실은 전 지점" 식 분리 필수.

---

## 2. 결정 필요 #1 — 인증 방식

### 옵션

| 옵션 | 사용자 경험 | 셋업 비용 | 보안 |
|------|-------------|-----------|------|
| **A. Slack OAuth** (via Supabase Auth) | 슬랙으로 로그인 (워크스페이스 소속이면 즉시) | Supabase Auth + Slack App OAuth scope | 강함 |
| **B. Google OAuth** (Workspace SSO) | 회사 G-Suite 로 로그인. 도메인 제한 (`butfitseoul.com`) | Supabase Auth + Google OAuth client | 강함 |
| **C. Email Magic Link** (Supabase Auth) | 이메일 입력 → 메일 링크 클릭 → 로그인 | Supabase Auth 만 | 중간 (이메일 보안에 의존) |
| **D. 단순 ID/PW** (자체 DB) | 어드민이 ID 발급 → 사용자가 ID/PW 로그인 | 가장 단순 | 약함 (비번 관리 책임) |

### 추천: **A (Slack OAuth)**
이유:
- 이미 데일리 알림이 슬랙으로 가는 흐름과 동일 ID 사용 → 정합성
- 임직원이 이미 슬랙 워크스페이스 소속 → 별도 가입 절차 X
- 사용자 식별자 = `slack_user_id`. 그룹 멘션·DM 도 같은 ID 로 가능
- 단점: Slack OAuth 셋업 약간 복잡 (Slack App 에서 OAuth scope 추가)

대안: **B (Google)** — 회사 G-Suite 가 표준이라면 더 자연. 도메인 제한 (`*@butfitseoul.com`) 으로 안전

> **결정 필요**: A / B / C / D

---

## 3. 권한 모델 — 3-layer

### Layer 1: Role (역할)
사용자의 기본 권한 클래스.

| Role | 설명 | 핵심 권한 |
|------|------|-----------|
| **admin** | 전체 관리자 | 모든 지점 조회·편집, 사용자 권한 관리, 어드민 페이지 |
| **manager** | 지점 매니저 | 허용된 지점 조회·편집, CSV 다운로드 (v2) |
| **viewer** | 조회 전용 | 허용된 지점 조회만 |

### Layer 2: Scope (지점 접근 범위)
사용자가 볼 수 있는 지점 목록. `admin` 은 전체. `manager`/`viewer` 는 명시적으로 부여한 지점만.

`user_branch_access (user_id, branch_id)` — N:M 매핑

### Layer 3: Capability (옵션 기능)
Role 외에 별도 ON/OFF 가능한 기능 플래그. v1 후보:
- `csv_export` (CSV 다운로드)
- `slack_test_send` (테스트 슬랙 발송)
- 추후 추가 가능

> **결정 필요**: Capability 시스템 v1 도입 vs v2 보류. 추천: **v2 보류** (Role + Scope 만으로 v1 충분, Capability 는 필요 생기면 추가)

---

## 4. DB 스키마

### Supabase Auth 사용 (옵션 A/B/C 인 경우)

```sql
-- Supabase Auth 의 auth.users 와 1:1 매핑
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,                              -- auth.users 에서 sync
  slack_user_id text,                      -- 옵션 A 면 OAuth 시 자동 채움
  role text not null default 'viewer',     -- admin / manager / viewer
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_branch_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  granted_at timestamptz default now(),
  primary key (user_id, branch_id)
);

create index idx_user_profiles_role on user_profiles(role) where is_active = true;
```

### 자체 DB (옵션 D 인 경우)

```sql
create table app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,             -- bcrypt
  display_name text,
  role text not null default 'viewer',
  is_active boolean default true,
  created_at timestamptz default now()
);
-- + app_user_branch_access 동일 패턴
```

### RLS 활성화 시점

권한 시스템 도입과 동시에 RLS 켜는 게 안전 (지금은 OFF).

```sql
-- 예: media_records — manager/viewer 는 자기 지점만
alter table media_records enable row level security;

create policy "users see media in their branches"
  on media_records for select
  using (
    auth.uid() in (select id from user_profiles where role = 'admin')
    or branch_id in (
      select branch_id from user_branch_access where user_id = auth.uid()
    )
  );
```

> **결정 필요**: RLS 활성화 — 인증 도입과 동시에 vs 나중에. 추천: **동시에 활성화** (어차피 인증 도입하면 RLS 가 자연스러움)

---

## 5. 가드 패턴 (코드)

### 5.1 미들웨어 (전역 인증 체크)
`src/middleware.ts`
- 모든 요청에서 세션 확인
- 미인증 → `/login` 리다이렉트
- 예외: `/login`, `/api/cron/*` (Bearer 인증 별도)

### 5.2 헬퍼
`src/lib/auth/guards.ts`
```typescript
export async function requireUser(): Promise<UserProfile>
export async function requireRole(min: 'viewer' | 'manager' | 'admin'): Promise<UserProfile>
export async function requireBranchAccess(branchSlug: string): Promise<UserProfile>
```

### 5.3 페이지별 사용
- `/admin/*` → `requireRole('admin')`
- `/branches/[id]/*` → `requireBranchAccess(branchId)`
- 그 외 (`/`, `/ranking`, `/guide/*`) → `requireUser()` 만

### 5.4 데이터 필터링
서버 컴포넌트의 query 들이 user 의 접근 가능 지점만 반환하도록 필터.
- `listActiveBranches()` → 현재 사용자가 접근 가능한 지점만
- `listBranchSummaries()` → 마찬가지
- (admin 은 전체)

→ RLS 가 켜져있으면 DB 단에서 자동 필터링되어 안전

---

## 6. 어드민 UI — 권한 관리 페이지

`/admin/users` (또는 `/admin/permissions`) 신설.

### 6.1 페이지 구성

```
┌───────────────────────────────────────┐
│ 권한 관리                            X │
├───────────────────────────────────────┤
│ 📋 권한 그룹 정의                      │
│   admin    전체 관리자 …               │
│   manager  지점 매니저 …               │
│   viewer   조회 전용 …                 │
├───────────────────────────────────────┤
│ 🔍 [이름 또는 이메일로 검색...]          │
├───────────────────────────────────────┤
│ ┌─ 강희성 · kan@... ─ [viewer] [3지점] ▼│
│ │  권한 그룹: [viewer ▼]               │
│ │  접근 가능 지점:                     │
│ │  [역삼ARC] [도곡] [신도림] [논현] …   │
│ │  (chip 클릭 토글)                    │
│ └────────────────────────────────────  │
│                                        │
│ ┌─ 이정후 · jhoo@... ─ [manager] [1] ▼ │
│   ...                                  │
└────────────────────────────────────────┘
```

### 6.2 액션
- **사용자 추가**: 옵션 A 면 사용자가 처음 로그인 시 자동 등록 (role=viewer, 지점 0개). 어드민이 후속으로 권한 부여
- **권한 그룹 변경**: dropdown
- **지점 chip 토글**: 클릭 = 추가/제거
- **비활성화**: `is_active=false` (삭제 X — 점수·로그 보존)

### 6.3 자동 부여
- 첫 로그인 시 — `role=viewer`, 지점 0개. 안내 화면 ("관리자에게 지점 권한 요청") 노출
- `admin` 첫 사용자 — 어드민에서 직접 SQL 또는 환경변수 (`INITIAL_ADMIN_EMAILS=...`) 로 부트스트랩

---

## 7. 결정 필요 항목 (요약)

체크박스 채워주면 PRD 반영 + 구현 들어감.

- [ ] **인증 방식**: ① **A Slack OAuth *(추천)*** / ② B Google OAuth / ③ C Email Magic Link / ④ D 자체 ID·PW
- [ ] **Role 3단계 (admin/manager/viewer)**: 그대로 OK 인지
- [ ] **Capability 시스템**: ① v1 도입 / ② **v2 보류 *(추천)***
- [ ] **RLS 활성화 시점**: ① **인증과 동시에 *(추천)*** / ② 나중에
- [ ] **첫 admin 부트스트랩**: ① 환경변수 (`INITIAL_ADMIN_EMAILS`) *(추천)* / ② SQL 직접 / ③ 첫 사용자가 자동 admin
- [ ] **신규 사용자 디폴트**: ① **viewer + 지점 0 *(추천)*** / ② 등록만 해두고 비활성

---

## 8. 단계별 진행 제안

1. 의사결정 마치기 ← **지금**
2. PRD 에 §2~§6 결정사항 반영
3. **DB 마이그레이션**: `user_profiles`, `user_branch_access` 테이블 + RLS 정책
4. **인증 셋업**: Supabase Auth + 선택 provider (Slack/Google) OAuth 등록
5. **로그인 페이지** + 미들웨어
6. **가드 헬퍼** + 기존 페이지에 적용
7. **데이터 쿼리 필터** (RLS 와 중복이지만 명시적 안전)
8. **어드민 권한 관리 페이지** (`/admin/users`)
9. **첫 admin 부트스트랩** + 운영 가이드 문서화

---

## 9. 영향받는 파일 (참고)

```
인프라
- src/middleware.ts                                인증 미들웨어 (신규)
- src/lib/supabase/client.ts                       Auth helper 추가
- src/lib/auth/guards.ts                           requireUser / requireRole / requireBranchAccess (신규)
- supabase/migrations/0007_auth_*.sql              user_profiles + user_branch_access + RLS
- .env.example                                     OAuth client 키, INITIAL_ADMIN_EMAILS 추가

페이지
- src/app/login/page.tsx                           로그인 (신규)
- src/app/admin/page.tsx                           기존 단순 비번 → Supabase Auth + role check
- src/app/admin/users/page.tsx                     권한 관리 페이지 (신규)
- src/app/admin/users/actions.ts                   role / branch access 변경 액션
- 기존 페이지 모두                                 가드 적용 (1줄 추가)

기존 어드민 인증 정리
- src/lib/admin-auth.ts                            ADMIN_PASSWORD 방식 → role-based 로 전환
```
