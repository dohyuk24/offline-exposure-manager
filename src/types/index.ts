/**
 * 공통 타입 · 상수 정의
 * DB 스키마는 CLAUDE.md "DB 스키마" 섹션 기준.
 */

// ============================================================
// 상수 — 상태값 / 구분 / 점수 가중치
// ============================================================

export const MEDIA_STATUS = {
  POSTING: "게시중",
  ENDED: "게시종료",
  NEGOTIATING: "협의중",
  FAILED: "협의실패",
  IDEA: "아이디어",
  NOT_STARTED: "미진행",
  NEGOTIATED: "협의완료",
} as const;
export type MediaStatus = (typeof MEDIA_STATUS)[keyof typeof MEDIA_STATUS];

export const MEDIA_CATEGORY = {
  OFFICIAL: "공식",
  OWNED: "자체보유",
  UNOFFICIAL: "비공식",
} as const;
export type MediaCategory = (typeof MEDIA_CATEGORY)[keyof typeof MEDIA_CATEGORY];

export const MEDIA_TYPE = {
  OOH: "OOH",
  BANNER: "현수막",
  SCROLL: "족자",
  LEAFLET: "전단지",
  BARTER_BANNER: "바터제휴배너",
  ETC: "기타",
} as const;
export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export const CONTENT_TYPE = {
  IMAGE: "이미지",
  TEXT: "텍스트",
  VIDEO: "영상",
} as const;
export type ContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

export const SCORE_CONFIG = {
  UPDATE: 1,
  UPDATE_WITH_PHOTO: 1.5,
  NEW_DISCOVERY: 5,
  BARTER_SUCCESS: 7,
} as const;

export const SCORE_ACTION = {
  UPDATE: "update",
  NEW_DISCOVERY: "new_discovery",
  BARTER_SUCCESS: "barter_success",
} as const;
export type ScoreAction = (typeof SCORE_ACTION)[keyof typeof SCORE_ACTION];

// ============================================================
// DB row 타입 — CLAUDE.md 스키마와 일치
// ============================================================

export type Branch = {
  id: string;
  name: string;
  slug: string;
  token: string;
  budget_monthly: number;
  slack_channel: string | null;
  is_active: boolean;
  created_at: string;
};

export type MediaRecord = {
  id: string;
  branch_id: string;
  category: MediaCategory;
  media_type: MediaType;
  status: MediaStatus;
  description: string | null;
  size: string | null;
  content_type: ContentType | null;
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  barter_condition: string | null;
  internal_code: string | null;
  managed_by_marketing: boolean;
  latitude: number | null;
  longitude: number | null;
  zone_id: string | null;
  is_new_discovery: boolean;
  photos: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BudgetLog = {
  id: string;
  branch_id: string;
  media_record_id: string | null;
  amount: number;
  memo: string | null;
  year_month: string;
  created_at: string;
};

export type ScoreLog = {
  id: string;
  branch_id: string;
  media_record_id: string | null;
  action: ScoreAction;
  score: number;
  year_month: string;
  created_at: string;
};
