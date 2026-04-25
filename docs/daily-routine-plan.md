# 데일리 루틴 & 슬랙 봇 알림 — 기획 (history)

> **상태**: ✅ **PRD 흡수 완료** · v1 구현 완료 (PR 1~6 머지)
> **운영 source of truth**: PRD §5.5 + `src/lib/daily-tasks/*` + `src/types/index.ts` (SCORE_CONFIG)
> **본 문서**: 의사결정 history 보존. 임계값·점수 등 현재 값은 코드/PRD 참조.
> **작성일**: 2026-04-26 (의사결정 2차 확정 — Task 라이프사이클 도입)
> **목적**: 지점 담당자가 "오늘 뭐 해야 하지?" 라는 질문을 앱/슬랙에서 자동으로 받게 만들기.

---

## 1. 풀고 싶은 문제

지점 담당자는 매체 관리가 본업이 아님. **잊혀짐 → 누락 → 점수 낮음 → 동기 저하** 의 악순환이 있을 거라고 가정.

해결 가설:

- **할 일 라이프사이클이 코어** — 매일 새벽 자동 생성 → 사용자 액션으로 자동 완료 또는 수동 체크 → 7일 경과 시 만료 + 점수 차감
- **앱**: 지점 페이지 상단 "오늘의 할 일" 카드. 항목 옆 (i) 아이콘으로 점수 룰 툴팁 노출
- **슬랙**: 매일 평일 14시, 지정 채널에 그날의 할 일 요약 발송 (알림 채널 역할)

핵심 원칙: **"체크리스트가 곧 점수 액션과 연결"** — 따로 일하는 게 아니라 평소 일이 곧 체크. 안 한 건 명확히 페널티.

---

## 2. "오늘의 할 일" 후보 항목

> 코드에 이미 있는 데이터로 검출 가능한 항목들.

### A. 매일 노출되는 항목

| # | 항목 | 트리거 조건 | 점수 (완료 / 만료) |
|---|------|------------|---------------------|
| 1 | **비공식 매체 현황 업데이트** | `category=비공식` AND `status=게시중` AND 마지막 업데이트 ≥ 7일 전 | +1 / **−5** |
| 2 | **게시 종료 임박 매체 처리** | `status=게시중` AND `end_date` ≤ 오늘 + 3일 | +1 / **−5** |
| 3 | **협의중 매체 후속 액션** | `status=협의중` AND 등록 ≥ 14일 경과 | +1 / **−5** |
| 4 | **이번 달 신규 발굴 0건 경고** | 이번 달 `is_new_discovery=true` 카운트 = 0 AND 오늘이 월 15일 이후 | **+5** / −5 |

### B. 주간/월간 노출 항목

| # | 항목 | 트리거 조건 | 점수 (완료 / 만료) |
|---|------|------------|---------------------|
| 5 | **이번 주 바터제휴 진행률 체크** | `media_type=바터제휴배너` AND `status=협의중` 이 1건 이상 | **+7** / −5 |
| 6 | ~~예산 소진 가이드~~ *(v2 보류)* | — | — |
| 7 | ~~가이드 문서 확인~~ *(v2 보류)* | — | — |

### C. 점수와 무관한 단순 알림 (마케팅실 → 지점, v2 보류)

| # | 항목 | 발화 시점 |
|---|------|-----------|
| 8 | 우리 지점 이번 달 랭킹 변동 | 매주 월요일 오전 |
| 9 | 다른 지점 신규 발굴 사례 (벤치마킹용) | 신규 발굴 발생 시 |

---

## 3. Task 라이프사이클 (핵심 데이터 모델)

> 이게 코어. 슬랙 봇 / 위젯은 이 데이터 위에 얹는 표현 레이어.

### 흐름

```
매일 새벽 03:00 (KST) cron
   ↓
지점별로 §2 의 항목 1~5 트리거 조건 검사
   ↓
조건 만족하는 task 를 daily_tasks 테이블에 insert
(이미 어제 열린 동일 task 가 있으면 carry_over_count 증가시켜 새 레코드 생성)
   ↓
사용자가 매체 액션 (등록 · 수정 · 상태 변경 · 사진 추가)
   ↓
연관 task 자동 완료 처리 (status=done, completed_by='auto')
   ↓
모호한 task 는 위젯에서 사용자가 수동 체크 (status=done, completed_by='manual')
   ↓
generated_for + 7일 지나도 done 안 된 task → status=expired, 점수 −5
```

### Task 종류 (5개)

| type | 트리거 항목 | 자동 완료 매핑 | 수동 체크 허용 |
|------|------------|----------------|----------------|
| `unofficial_update` | §2-1 | 해당 매체의 사진 추가 또는 `status` 변경 | ✅ |
| `posting_ending` | §2-2 | 해당 매체 `status=게시종료` 변경 또는 후속 매체 등록 | ✅ |
| `negotiating_followup` | §2-3 | 해당 매체 `status` 가 `협의중` → 다른 값 | ✅ |
| `discovery_zero` | §2-4 | 이번 달 신규 발굴 1건 이상 등록 | ❌ (자동만) |
| `barter_progress` | §2-5 | 해당 바터제휴 매체 `status` 변경 | ✅ |

### 누적 표시 ("N일째 미처리")

- 새벽 cron 이 task 생성 시, 같은 `(branch_id, task_type, related_record_id)` 조합으로 어제 open 상태였던 게 있는지 확인
- 있으면 새 task 의 `carry_over_count = 어제.carry_over_count + 1`
- 어제 task 는 새 task 가 생성되면 자동으로 만료 카운팅에서 제외 (= 7일 만료는 "최초 generated_for" 기준이 아니라 "현재 carry over chain 의 최초 generated_for" 기준)
- 위젯/슬랙에 "OO 매체 — 8일째 미처리" 라벨 노출 → 시각적 압박감

### 점수 모델 (전면 개편)

| 이벤트 | 점수 |
|--------|------|
| 일반 task 정상 완료 (auto/manual 무관) | **+1** |
| 신규 발굴 task 완료 (`discovery_zero`) | **+5** |
| 바터제휴 task 완료 (`barter_progress`) | **+7** |
| Task 만료 (7일 경과 미처리) | **−5** |
| 할 일 외 보너스 액션 *(예: 트리거 안 됐는데 자발적으로 신규 발굴)* | 별도 보너스 +5 (액션 시점) |

> 기존 `SCORE_CONFIG` 는 v2 호환 위해 컬럼 유지하되, v1 점수 산정 로직은 `daily_tasks` 기반으로 전환.
> 사진 보너스 (+0.5) 는 단순화 위해 v1 에서 제외, v2 검토.

---

## 4. 화면 UI 제안

### 옵션 A. **지점 페이지 상단 "오늘의 할 일" 카드** *(채택)*

```
┌────────────────────────────────────────────┐
│ 오늘의 할 일 · 4월 26일             진척 1/4│
├────────────────────────────────────────────┤
│ ☑ 비공식 매체 1건 업데이트 완료             │
│ ☐ 게시 종료 임박 1건 — 4/29 종료 (D-3) (i) │
│ ☐ 협의중인 매체 1건 — 18일째 미처리 ⚠ (i)  │
│ ☐ 이번 달 신규 발굴 0건 (i)                 │
└────────────────────────────────────────────┘
```

- **위치**: 지점 페이지 (`/branches/[branchId]`) 최상단, 예산 위젯 위
- **(i) 툴팁**: 항목 클릭/호버 시 점수 규칙 노출 ("이 task 완료 시 +1점, 7일 미처리 시 −5점")
- **체크박스**: 자동 완료된 건은 ☑ (잠금), 수동 체크 가능한 건은 ☐ (클릭으로 완료)
- **N일째 라벨**: `carry_over_count ≥ 1` 이면 ⚠ 아이콘 + 일수 표시

### 옵션 C. **홈 페이지 상단 배너 (마케팅실용 요약)** *(채택)*

- 마케팅실/다지점 사용자용 — "지점별 미처리 task 카운트"
- 예: "오늘 미처리 17건 — 광화문 5, 신도림 4, 합정 3 …"

### 옵션 B. *(보류)*
모바일 탭바 "오늘" 탭 — 진입점 명확하지만 탭 5개로 늘어남. v2 재검토.

---

## 5. 슬랙 봇 알림 형식

### 발송 시점 *(확정)*

- **매일 평일 오후 14시 (KST)** — 점심 직후 / 오후 일정 시작 전
- 주말 발송 X
- 항목 0개일 때는 **발송 안 함** (노이즈 회피)

### 발송 채널 *(확정)*

운영 시: **옵션 1 — 지점별 전용 채널**
- 슬랙 워크스페이스에 24개 지점 채널이 이미 존재
- DB `branches.slack_channel` 필드에 채널 ID 저장
- Bot Token 1개로 모든 채널에 발송

**v1 테스트 단계**: 모든 알림을 **사용자(@do) 개인 채널** 로 우선 발송.
- 환경변수 `SLACK_TEST_CHANNEL_OVERRIDE` 가 세팅되면 모든 발송이 그 채널로 강제 리다이렉트
- 검증 끝나면 환경변수 제거 → 자동으로 지점별 채널 발송으로 전환

### 멘션 정책 *(확정)*

- 슬랙 **User Group (그룹 태그)** 사용 — `<!subteam^SXXXXXX|@매체관리자>` 포맷
- 그룹 ID 는 지점별로 다를 수 있음 → DB 에 별도 컬럼 추가 필요 (§6 참고)

### 메시지 포맷 (예시)

```
<!subteam^S0XXXXX|@역삼ARC매체관리자> 오늘의 매체 관리 할 일 · 4/26 (월)

📍 역삼ARC 지점 · 미처리 4건

☐ 비공식 매체 업데이트 필요 (3건)
  • 강남대로 X배너 — 8일째 미처리 ⚠
  • 신논현역 현수막 — 12일째 미처리 ⚠
  • 역삼 골목 전단지 — 7일째 미처리

☐ 게시 종료 임박 (1건)
  • 강남대로 X배너 — 4/29 종료 (D-3)

☐ 협의중 매체 후속 액션 (1건)
  • OO상가 X배너 — 18일째 협의중

☐ 이번 달 신규 발굴 0건 — 순회 시 후보 1개 등록해보세요

→ 앱에서 처리: https://offline.butfit.../branches/yeoksam-arc
```

> **결정 필요 (소소)**:
> - 항목별 deep link 까지 박을지 (지점 페이지 단일 링크로 충분?)
> - 봇 이름/아이콘 (예: "오프라인봇 🪧")

---

## 6. 데이터/구현 메모

### 새로 필요한 테이블 — `daily_tasks`

```sql
create table daily_tasks (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id),
  task_type text not null,
    -- 'unofficial_update' | 'posting_ending' | 'negotiating_followup'
    -- | 'discovery_zero' | 'barter_progress'
  related_record_id uuid references media_records(id),
    -- 자동 완료 매핑용. discovery_zero 는 NULL.
  generated_for date not null,
    -- 어느 날 만들어진 task 인지
  expires_at date not null,
    -- 보통 generated_for + 7일. carry over chain 시작일 + 7일.
  status text not null default 'open',
    -- 'open' | 'done' | 'expired'
  completed_at timestamptz,
  completed_by text,
    -- 'auto' | 'manual' (status=done 일 때만)
  carry_over_count int not null default 0,
    -- 며칠째 이어진 건지
  created_at timestamptz default now()
);

create index idx_daily_tasks_branch_open
  on daily_tasks(branch_id, status, generated_for);
create index idx_daily_tasks_related
  on daily_tasks(related_record_id) where status = 'open';
```

### 점수 부여 로직 변경

- 기존: 매체 등록 액션에서 직접 `score_logs` insert
- 변경: 매체 등록 액션 → `daily_tasks` 자동 완료 처리 → 완료 트리거에서 `score_logs` insert
- 만료 처리: 새벽 cron 이 task 생성 후, `expires_at < today AND status='open'` 인 task 를 `expired` 로 업데이트하면서 `score_logs` 에 −5점 insert
- 할 일 외 보너스 액션은 기존 로직 유지 (별도 +5)

### 기타

- **`media_records.updated_at` 갱신 정의**: 사진 추가, 상태 변경, 설명 수정 — 모두 `updated_at` 갱신. created 와 동일한 시점이면 update 로 안 침
- **DB 스키마 변경 (지점)**:
  - `branches.slack_channel` (이미 존재) — 채널 ID `C0XXXXX`
  - `branches.slack_user_group_id` (신규) — User Group ID `S0XXXXX`
  - 어드민 페이지 폼에 두 필드 추가
- **Slack 연동**: Bot Token (`SLACK_BOT_TOKEN`), 테스트 단계 `SLACK_TEST_CHANNEL_OVERRIDE`

### Cron 환경

- Vercel Cron (`vercel.json`)
- 새벽 task 생성: 매일 03:00 KST = `0 18 * * *` (UTC, 전날 18시)
- 14시 슬랙 발송: 평일 14:00 KST = `0 5 * * 1-5` (UTC)
- 호출 endpoint: `/api/cron/generate-daily-tasks`, `/api/cron/send-daily-slack`
- 인증: `CRON_SECRET` 헤더 검증

### 점수 룰 노출 위치 (툴팁 + 가이드)

1. **위젯 항목별 (i) 아이콘** — 호버/탭 시 작은 툴팁 ("완료 +1, 7일 미처리 −5")
2. **점수 위젯에 (i) 아이콘** — 호버 시 전체 점수 산정 규칙 요약 + "자세히" → 가이드 페이지로 이동
3. **신규 가이드 페이지 `/guide/scoring`** — 전체 룰 표 + 예시 시나리오 (현재 `/guide/*` 가 공사중인 placeholder 인데 여기 채우면 됨)

---

## 7. 결정 확정 내역

### 1차 (슬랙·범위·UI)

- [x] **포함 항목**: §A 1~4 + §B 5 (총 5개). §B 6, §C 7~9 는 v2 보류
- [x] **임계값**: 비공식 7일 / 게시 종료 3일 / 협의중 14일
- [x] **UI**: A (지점 카드) + C (홈 요약 배너)
- [x] **슬랙 채널 구조**: 옵션 1 (지점별). v1 은 `SLACK_TEST_CHANNEL_OVERRIDE` 로 개인 채널 강제
- [x] **할 일 0건일 때**: 미발송
- [x] **멘션 정책**: 슬랙 User Group 그룹 태그
- [x] **Slack 연동 방식**: Bot Token
- [x] **발송 시간**: 평일 14시 KST

### 2차 (Task 라이프사이클)

- [x] **Task 생성 시점**: 매일 새벽 03:00 KST cron
- [x] **완료 판정**: 자동 + 수동 둘 다 (`discovery_zero` 만 자동 전용)
- [x] **미완료 처리**: 7일 경과 시 만료 + 점수 −5. 누적 carry over 표시
- [x] **점수 모델**: 정상 완료 +1 / 신규 발굴 +5 / 바터 +7 / 만료 −5 / 할 일 외 보너스 액션 +5
- [x] **체크리스트 완료 저장**: **저장** (1차 결정 뒤집음 — `daily_tasks` 테이블 신설)
- [x] **점수 룰 노출**: 위젯 (i) 툴팁 + `/guide/scoring` 페이지

---

## 8. 단계별 진행 제안

1. ~~의사결정 마치기~~ ✅ 완료
2. PRD 에 §2~§6 결정사항 반영 (특히 점수 모델 변경)
3. **Supabase 마이그레이션**: `daily_tasks` 테이블 + `branches.slack_user_group_id` 컬럼 추가 → SQL 사용자 전달
4. `/api/cron/generate-daily-tasks` route 구현 (새벽 03:00 KST)
5. 자동 완료 매핑: 매체 등록·수정 액션에 `daily_tasks` 완료 트리거 연결, 점수 부여 로직 daily_tasks 기반으로 전환
6. 옵션 A 위젯 (지점 페이지 "오늘의 할 일" 카드 + 툴팁) 구현
7. 옵션 C 위젯 (홈 마케팅실용 요약 배너) 구현
8. `/guide/scoring` 페이지 구현 — 점수 룰 + 예시
9. **사용자 액션**: 슬랙 워크스페이스에 봇 앱 등록 → Bot Token 발급, 사용자 개인 채널 ID 확보 → `.env.local` 에 `SLACK_BOT_TOKEN`, `SLACK_TEST_CHANNEL_OVERRIDE` 세팅
10. `/api/cron/send-daily-slack` route 구현 + Vercel Cron 등록 (평일 14:00 KST)
11. 사용자 개인 채널에서 1~2주 운영 검증 → 임계값·점수 조정
12. 검증 후 어드민에서 24개 지점 채널 ID·그룹 ID 입력 → `SLACK_TEST_CHANNEL_OVERRIDE` 제거 → 본격 운영

### 사용자가 미리 알아둘 것 (Slack 봇 등록)

1. https://api.slack.com/apps → **Create New App** → From scratch → 워크스페이스 선택
2. 좌측 **OAuth & Permissions** → Bot Token Scopes 에 `chat:write`, `chat:write.public`, `usergroups:read` 추가
3. **Install to Workspace** → 발급된 `xoxb-...` 토큰을 `SLACK_BOT_TOKEN` 으로 저장
4. 사용자 개인 채널에 봇 초대: `/invite @봇이름`
5. 채널 ID 는 슬랙에서 채널명 우클릭 → "View channel details" → 맨 아래 `C0XXXXX...` 복사
