# 오프라인 매체 관리 서비스 — 디자인 가이드

> v0.1 · 2026년 4월

---

## 1. 디자인 원칙

- **모바일 퍼스트** — 지점 담당자가 현장에서 스마트폰으로 사용하는 상황을 1순위로 설계
- **입력 최소화** — 현장에서 빠르게 기록할 수 있도록 드롭다운, 자동 입력 우선
- **즉각 반응** — 업로드 후 마이크로 피드백으로 행위에 의미 부여
- **Notion 친숙함** — 기존 Notion 운영 방식과 이질감 없는 UI 패턴

---

## 2. 레이아웃

### 2.1 브레이크포인트

| 이름 | 너비 | 주요 대상 |
|------|------|----------|
| mobile | ~767px | 지점 담당자 현장 사용 |
| tablet | 768px~1023px | 보조 |
| desktop | 1024px~ | 마케팅실 대시보드 |

### 2.2 사이드바 네비게이션 (데스크톱)

- 너비: 200px 고정
- 모바일: 햄버거 메뉴 또는 하단 탭바로 전환
- 섹션 구분: 10px 레이블 + 0.5px 구분선

### 2.3 그리드

- 매체 카드: `repeat(auto-fill, minmax(240px, 1fr))` — 모바일 1열, 태블릿 2열, 데스크톱 3열
- 간격: 16px (모바일) / 20px (데스크톱)
- 페이지 패딩: 16px (모바일) / 24px (데스크톱)

---

## 3. 컬러 시스템

### 3.1 기본 팔레트

| 토큰 | 용도 |
|------|------|
| `--color-bg-primary` | 페이지 배경 (흰색) |
| `--color-bg-secondary` | 카드, 사이드바 배경 |
| `--color-bg-tertiary` | 입력 필드, 비활성 영역 |
| `--color-text-primary` | 본문, 제목 |
| `--color-text-secondary` | 부제목, 설명 |
| `--color-text-tertiary` | 힌트, 비활성 텍스트 |
| `--color-border` | 카드 테두리, 구분선 (0.5px) |
| `--color-accent` | 주요 액션 버튼, 링크 |

### 3.2 상태 배지 색상

Notion 기존 상태값 색상 체계를 그대로 따른다.

| 상태 | 배경색 | 텍스트 색 | 의미 |
|------|--------|----------|------|
| 게시 중 | `#D3E5EF` | `#0F7B6C` | 현재 노출 중 |
| 게시 종료 | `#EAE0D9` | `#9F6B53` | 노출 종료됨 |
| 협의 중 | `#DBEDDB` | `#448361` | 진행 협의 단계 |
| 협의 실패 | `#FFE2DD` | `#C4332F` | 협의 결렬 |
| 아이디어 | `#E8DEEE` | `#9065B0` | 발굴 아이디어 단계 |
| 미진행 | `#E3E2E0` | `#787774` | 아직 시작 안 함 |
| 협의 완료 | `#D3E5EF` | `#337EA9` | 협의 완료, 집행 대기 |

배지 스타일:
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
```

### 3.3 구분 배지 색상

| 구분 | 배경색 | 텍스트 색 |
|------|--------|----------|
| 공식매체 | `#D3E5EF` | `#337EA9` |
| 자체보유 | `#EAE0D9` | `#9F6B53` |
| 비공식매체 | `#DBEDDB` | `#448361` |

---

## 4. 매체 카드 컴포넌트

Notion 갤러리 카드 스타일을 기반으로 한다.

### 4.1 카드 구조

```
┌─────────────────────────────┐
│  [사진 썸네일 영역 — 160px]   │  ← 사진 없으면 매체 종류 아이콘 + 배경
├─────────────────────────────┤
│  [구분 배지]  [상태 배지]      │
│                              │
│  카드 제목 (매체 설명 or 종류) │  ← 14px, font-weight 500
│  지점명 · 날짜               │  ← 12px, text-secondary
│                              │
│  💰 N만원   📷 사진 N장       │  ← 12px, 아이콘 + 수치
└─────────────────────────────┘
```

### 4.2 카드 스펙

```css
.media-card {
  background: var(--color-bg-primary);
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.media-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.media-card__thumb {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-card__body {
  padding: 12px;
}

.media-card__badges {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.media-card__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  /* 2줄 말줄임 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media-card__meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.media-card__footer {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
```

### 4.3 사진 없는 경우 썸네일 대체 표시

| 매체 종류 | 대체 아이콘 | 배경색 |
|----------|-----------|--------|
| 현수막 | 🪧 | `#F0F0EF` |
| 족자 | 📜 | `#F0F0EF` |
| 전단지 | 📄 | `#F0F0EF` |
| OOH | 🏙️ | `#EBF3FB` |
| 바터제휴 | 🤝 | `#EDFAF4` |
| 기타 | 📍 | `#F0F0EF` |

### 4.4 신규 발굴 카드 강조

신규 발굴 등록 카드는 상단 테두리에 강조 처리:
```css
.media-card--new-discovery {
  border-top: 2px solid #448361;
}
```
카드 우상단에 `✨ 신규 발굴` 뱃지 추가.

---

## 5. 발견 피드 배너

모든 페이지 상단 고정. 신규 발굴 소식만 노출.

```css
.discovery-feed-bar {
  background: #EBF3FB;
  border-bottom: 0.5px solid #B8D4E8;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #337EA9;
}

.discovery-feed-bar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #337EA9;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

---

## 6. 마이크로 피드백 토스트

업로드 완료 즉시 노출. 일반 토스트와 구별되는 더 풍부한 표현.

```css
.micro-feedback {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 320px;
  text-align: center;
  z-index: 9999;
  animation: slideUp 0.3s ease, fadeOut 0.3s ease 3s forwards;
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; transform: translateX(-50%) translateY(10px); }
}
```

노출 시간: 3.5초 후 자동 소멸.

---

## 7. 폼 / 입력 컴포넌트

### 7.1 매체 등록 폼 레이아웃

모바일 기준 단일 컬럼. 상단에 사진 업로드 영역 배치.

```
[📷 사진 업로드 영역 — 탭하여 카메라 / 갤러리 선택]

구분          [드롭다운]
매체 종류     [드롭다운]
상태          [드롭다운]
설명          [텍스트 입력]
규격/사이즈   [텍스트 입력]
날짜          [날짜 범위 선택]
비용          [숫자 입력 — 원 단위]
바터 조건     [텍스트 입력 — 바터제휴 선택 시만 노출]
GPS           [자동 수집 버튼 + 수동 입력 fallback]

            [등록하기]
```

### 7.2 사진 업로드 영역

```css
.photo-upload-zone {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--color-bg-secondary);
  border: 1.5px dashed var(--color-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
```

모바일에서 탭 시 `<input type="file" accept="image/*" capture="environment">` 호출 → 후면 카메라 우선.

### 7.3 GPS 자동 수집

```
[내 위치로 자동 입력]  버튼 탭
  → Geolocation API 호출
  → 성공: 위도·경도 자동 입력 (읽기 전용으로 표시)
  → 실패: "수동으로 입력해주세요" + 텍스트 필드 활성화
```

GPS 값은 사용자에게 직접 노출하지 않고 "위치 수집 완료 ✓" 텍스트만 표시.

---

## 8. 예산 위젯

지점 페이지 예산 섹션에 사용.

```
┌──────────────────────────────────────┐
│  이번 달 예산                          │
│                                      │
│  ████████████░░░░  68%               │
│  사용 340,000원  /  할당 500,000원     │
│  잔액 160,000원 남음                   │
└──────────────────────────────────────┘
```

- 프로그레스 바: 80% 이상 시 경고 색상(`#FFE2DD` / `#C4332F`)
- 100% 초과 시 바 색상 빨간색 + "예산 초과" 텍스트

---

## 9. 점수 위젯

지점 페이지 점수 섹션 및 `/ranking` 페이지에 사용.

```
┌──────────────────────────────────────┐
│  이번 달 점수          31점 · 전체 2위  │
│                                      │
│  업데이트 3회    +3점                  │
│  신규 발굴 0건   +0점                  │
│  바터 진행 중    (성사 시 +7점)         │
└──────────────────────────────────────┘
```

---

## 10. 타이포그래피

| 용도 | 크기 | 굵기 |
|------|------|------|
| 페이지 제목 | 20px | 600 |
| 섹션 제목 | 15px | 500 |
| 카드 제목 | 14px | 500 |
| 본문 / 설명 | 14px | 400 |
| 메타 / 날짜 | 12px | 400 |
| 배지 | 12px | 500 |
| 섹션 레이블 (사이드바) | 10px | 500, letter-spacing 0.05em |

기본 폰트: `Pretendard, -apple-system, BlinkMacSystemFont, sans-serif`

---

## 11. 공사 중 페이지

바터제휴 BP, 매체별 가이드 — 준비 전까지 표시.

```
[🚧]
공사 중이에요
열심히 만들고 있어요. 곧 오픈할게요!
```

배경: `var(--color-bg-secondary)`, 테두리: 1px dashed `var(--color-border)`, border-radius: 8px, padding: 48px.
