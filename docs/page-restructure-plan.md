# 지점 페이지 재구조화 — 기획

> **이 문서의 위치**: PRD 반영 전 단계의 기획 메모. 의사결정 후 PRD 흡수 + 구현.
> **작성일**: 2026-04-26
> **목적**:
> 1. 신규 발굴 ↔ 기존 매체 업데이트 흐름 명확히 분리
> 2. 관리판 ↔ 현황판 분리 (예산은 별도 sub-page)
> 3. 지점 표시 순서 사용자 지정

---

## 1. 현재 상태 (사실 정리)

### 라우팅
```
/branches                                  ← 모든 지점 카드
/branches/[id]                             ← 지점 페이지 (관리 + 현황 혼재)
/branches/[id]/new                         ← 매체 등록 폼 (신규 / 히스토리 이어가기 둘 다)
/branches/[id]/records/[id]/edit           ← 매체 수정 폼
```

### 지점 페이지 구성 (현재)
1. 헤더 + `+ 매체 등록` 버튼 (단일 CTA)
2. 오늘의 할 일 카드 (관리)
3. 공식매체 그리드 (관리/조회 혼재 — 카드 클릭 → 수정)
4. 비공식·자체보유 그리드 (동일)
5. **예산 위젯** (현황)
6. **점수 위젯** (현황)

### 폼 구성 (현재)
- `MediaForm` 컴포넌트 1개로 신규/수정/히스토리 이어가기 모두 처리
- 필드 동일: category, media_type, status, description, size, content_type, start_date, end_date, cost, barter_condition, is_new_discovery, photos
- 신규일 때만 `is_new_discovery` 체크박스 노출

### 핵심 문제
- "+ 매체 등록" CTA 가 **신규 발굴**과 **자체보유 등록** 두 가지 의도를 합쳐서 받음
- 폼이 동일해서 발굴(=현장에서 빠르게 사진+위치만)에는 무겁고, 업데이트(=상태/사진 변경)에도 어색
- 지점 페이지가 "오늘 할 일" + "매체 관리" + "내 점수 보기" + "예산 보기" 를 다 떠안고 있어 화면 길어짐
- 관리(action) 와 현황(read-only) 의 멘탈 모드가 다른데 같은 화면에서 같이 처리

---

## 2. 변경 #1 — 신규 발굴 ↔ 업데이트 분리

### 2.1 CTA 분리

지점 페이지 헤더에 버튼 2개:
- **`✨ 신규 매체 발굴`** — primary, accent 색
- **`기존 매체 업데이트`** — 보조. 또는 안내문구 ("기존 매체는 카드 클릭")

> 추천: **CTA 1개 + 안내문구**
> - `✨ 신규 매체 발굴` 만 prominently. 업데이트는 카드 클릭 흐름이 직관적이라 별도 버튼 불필요.
> - 카드 그리드 위에 작은 안내: *"기존 매체는 카드를 눌러 업데이트"*

### 2.2 폼 분리

#### 발굴 폼 (`/branches/[id]/discover` 또는 `/new?intent=discover`)
필수 최소화 — **"현장에서 30초 안에 기록"** 이 목표:
- 사진 (1장 이상)
- media_type (X배너 / 현수막 / 족자 / 전단지 / 바터배너 / 기타)
- 위치 라벨 (description 으로 사용 — "강남대로 sk자이 앞")
- (자동 세팅) `is_new_discovery=true`, `category=비공식`, `status=아이디어`
- (옵션 — 펼치기) start_date, end_date, cost, barter_condition

#### 업데이트 폼 (`/records/[id]/edit` — 기존)
풀필드 prefilled. 변경 중심:
- 상태 변경 (드롭다운 강조)
- 사진 추가 (기존 + 신규)
- 종료일 변경
- 비고 / 가격 등 모든 필드 수정 가능
- `is_new_discovery` 토글 X (이미 등록된 매체)

> 추천:
> - 폼 컴포넌트 분리 (`DiscoverForm`, `MediaForm` 또는 `UpdateForm`) — 공통 필드는 작은 building block 으로 추출
> - URL 도 분리 (`/discover` vs `/records/[id]/edit`) — 진입 흐름·분석 추적 명확

### 2.3 페이지 역할 분리 (관리판 vs 현황판)

#### 옵션 A. 같은 페이지 + 헤딩으로 섹션 구분
```
[헤더 + 신규 발굴 CTA]
─── 오늘의 할 일 ─────
─── 매체 관리 ────────  ← 카드 그리드 + 안내
─── 이번 달 현황 ─────  ← 점수 위젯
```
장점: 라우팅 변경 없음. 단점: 모드 혼재 여전.

#### 옵션 B. 라우트 분리 + 탭/메뉴 전환 *(추천)*
```
/branches/[id]              관리판 (default)
  - 헤더 + 신규 발굴 CTA
  - 오늘의 할 일
  - 매체 그리드 (공식 / 비공식·자체보유)

/branches/[id]/insights     현황판
  - 이번 달 점수 위젯
  - 누적 / 랭킹 위치
  - (v2) 차트, 히스토리 분석

/branches/[id]/budget       예산판 (변경 #2)
  - 예산 위젯
  - (v2) 더 좋은 뷰
```

지점 페이지 헤더에 탭 (`관리 · 현황 · 예산`) 또는 sidebar 보조 링크.

> 추천: **B + 탭 헤더**. 사용자 의도("관리판과 현황판은 달라야") 에 가장 부합.

### 2.4 모바일 탭바 영향
현재 모바일 탭바: `홈 / 지점 / 랭킹 / 가이드` (4개)
- **변경 없음**. 지점 진입 후 화면 내 탭으로 전환.

---

## 3. 변경 #2 — 예산 sub-page + 지점 정렬

### 3.1 예산 sub-page

- 지점 페이지에서 **`<Section title="예산">` 블록 제거**
- `/branches/[id]/budget` 신규 페이지로 이전
- 현재 `BudgetWidget` 그대로 → v2 에서 더 좋은 뷰 (월별 추이, 항목별 분포, 잔액 게이지 등)
- 지점 헤더 탭에 "예산" 추가

### 3.2 지점 정렬 — 사용자 지정 순서

#### 사용자 지정 14개 순서
```
1. 역삼ARC
2. 도곡
3. 신도림
4. 논현
5. 판교
6. 강변
7. 가산
8. 삼성
9. 광화문
10. 한티
11. 마곡
12. 판교벤처타운
13. 역삼GFC
14. 합정
```

#### 14개 외 지점은 없음

사용자 확인: 14개가 전체 운영 지점. `seed.sql` 도 동일하게 14개만 등록.
혹시 DB 에 추가로 들어가 있다면 정리 SQL 별도 실행 (§7 참고).

#### 구현 방식 (결정 필요)
- **α. 코드 상수**:
  ```typescript
  // src/lib/branch-order.ts
  export const BRANCH_DISPLAY_ORDER: string[] = [
    "yeoksam-arc", "dogok", "sindorim", "nonhyeon", "pangyo",
    "gangbyeon", "gasan", "samseong", "gwanghwamun", "hanti",
    "magok", "pangyo-venture", "yeoksam-gfc", "hapjeong",
  ];
  ```
  지점 목록 정렬 시 이 순서대로. 미포함 → 뒤로.

- **β. DB 컬럼**:
  ```sql
  alter table branches add column display_order int;
  ```
  어드민 UI 에서 순서 편집 가능.

> 추천: **α (코드 상수)** — 변경 빈도 낮음. DB 컬럼은 over-engineer.
> 운영하면서 자주 바뀌면 그때 β 로 마이그레이션.

#### 적용 범위
정렬을 적용해야 하는 위치:
- 사이드바 지점 목록
- `/branches` 모든 지점 그리드
- 홈 페이지 지점 현황 카드
- 모바일 탭바의 "지점" 진입 시 목록
- 점수판 / 랭킹 — 점수순 그대로 (정렬 무시)
- 어드민 — 정렬 무시 또는 동일 (협의)

---

## 4. 결정 필요 항목 (요약)

체크박스 채워주면 PRD 반영 + 구현 들어감.

### 변경 #1
- [ ] **CTA**: ① CTA 1개 + 안내 *(추천)* / ② CTA 2개
- [ ] **폼 분리**: ① URL + 컴포넌트 둘 다 분리 *(추천)* / ② 같은 폼 모드만 분리
- [ ] **페이지 분리**: ① A 같은 페이지 섹션 / ② **B 라우트 분리 + 탭 *(추천)***
- [ ] **현황판 라우트 이름**: `insights` *(추천)* / `dashboard` / `status` / 기타
- [ ] **발굴 폼 자동 기본값**: `category=비공식 + status=아이디어` *(추천)* / 사용자가 매번 선택

### 변경 #2
- [x] **지점 셋**: 14개 고정 (역삼ARC, 도곡, 신도림, 논현, 판교, 강변, 가산, 삼성, 광화문, 한티, 마곡, 판교벤처타운, 역삼GFC, 합정). 그 외는 운영 X
- [ ] **정렬 구현**: ① **코드 상수 *(추천)*** / ② DB 컬럼
- [ ] **예산 sub-page 이름**: `/budget` *(추천)* / `/finance` / 기타

---

## 5. 단계별 진행 제안

1. 의사결정 마치기 ← **지금**
2. PRD 에 §2~§3 결정사항 반영
3. **변경 #2 먼저 — 작은 변경 + 안정성**:
   - 코드 상수 + 정렬 유틸 (`src/lib/branch-order.ts`)
   - 사이드바 / `/branches` / 홈 정렬 적용
   - 미명시 지점이 비활성이라면 어드민에서 토글
4. **`/branches/[id]/budget` sub-page 신설** + 지점 페이지에서 예산 섹션 제거
5. **변경 #1 — 페이지 분리**:
   - `/branches/[id]/insights` 신설 (기존 score widget 이전)
   - 지점 페이지 헤더에 탭 (`관리 · 현황 · 예산`)
   - 지점 페이지 = 관리판 (할 일 + 매체 그리드 + 신규 발굴 CTA)
6. **변경 #1 — 폼 분리**:
   - `DiscoverForm` 신규 (컴팩트, 자동 기본값)
   - `/branches/[id]/discover` 라우트
   - 기존 `MediaForm` 은 업데이트 전용으로 정리
7. 모바일 / 데스크톱 검증

---

## 7. DB 안전망 — 14개 외 지점 정리 SQL

`seed.sql` 만 돌렸으면 DB 에 14개만 있어 추가 작업 불필요. 혹시 직접 추가했거나 의심되면 Supabase SQL Editor 에 아래 실행:

```sql
-- (선택) 14개 외 지점 식별
select id, name, slug, is_active
from branches
where slug not in (
  'yeoksam-arc', 'dogok', 'sindorim', 'nonhyeon', 'pangyo',
  'gangbyeon', 'gasan', 'samsung', 'gwanghwamun', 'hanti',
  'magok', 'pangyo-venture', 'yeoksam-gfc', 'hapjeong'
);

-- (실제 삭제) 위 SELECT 결과 확인 후 실행
-- 주의: 해당 지점의 media_records / score_logs / budget_logs / daily_tasks
-- 도 함께 사라짐. on delete cascade 가 걸려있는 테이블만 자동 삭제됨 —
-- media_records 는 cascade 없으니 먼저 별도 cleanup 필요할 수 있음.
delete from branches
where slug not in (
  'yeoksam-arc', 'dogok', 'sindorim', 'nonhyeon', 'pangyo',
  'gangbyeon', 'gasan', 'samsung', 'gwanghwamun', 'hanti',
  'magok', 'pangyo-venture', 'yeoksam-gfc', 'hapjeong'
);
```

---

## 6. 영향받는 파일 (참고)

```
변경 #1
- src/app/branches/[branchId]/page.tsx       관리판 정리 (예산·점수 제거, CTA 변경)
- src/app/branches/[branchId]/insights/page.tsx   신설 (현황판)
- src/app/branches/[branchId]/discover/page.tsx   신설 (발굴 폼)
- src/components/media/discover-form.tsx          신설
- src/components/media/media-form.tsx              업데이트 전용으로 정리
- src/components/branch/branch-tabs.tsx           신설 (탭 헤더)

변경 #2
- src/app/branches/[branchId]/budget/page.tsx     신설 (예산 sub)
- src/lib/branch-order.ts                         신설 (정렬 상수)
- src/lib/supabase/queries/branches.ts            정렬 적용
- src/components/layout/sidebar.tsx               정렬 사용
- src/app/branches/page.tsx                       정렬 사용
- src/app/page.tsx                                지점 카드 정렬 사용
```
