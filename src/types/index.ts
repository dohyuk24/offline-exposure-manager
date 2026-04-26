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

/**
 * 매체 카테고리 3분류 (공식 / 배포형 / 제휴).
 * 구 OWNED(O-OOH)는 PAID(P-OOH)에 흡수됨 — DB 마이그레이션 필요.
 */
export const MEDIA_CATEGORY = {
  /** 공식매체 — 유가 옥외 + 자체보유 통합 */
  PAID: "P-OOH",
  /** 제휴매체 — 비용 대신 혜택·관계 교환 */
  AFFILIATED: "A-OOH",
  /** 배포형매체 — 전단지·족자·게릴라 현수막 등 단기 배포 */
  DISTRIBUTION: "D-OOH",
} as const;
export type MediaCategory = (typeof MEDIA_CATEGORY)[keyof typeof MEDIA_CATEGORY];

/** UI 노출용 한글 라벨 */
export const MEDIA_CATEGORY_LABEL: Record<MediaCategory, string> = {
  "P-OOH": "공식매체",
  "A-OOH": "제휴매체",
  "D-OOH": "배포형매체",
};

/** 카테고리 툴팁 설명 */
export const MEDIA_CATEGORY_DESC: Record<MediaCategory, string> = {
  "P-OOH":
    "버스 정류장·지하철역 등에 위치한 광고 지면, 또는 지점이 건물·상가 등과 공식 협의하여 확보한 지면",
  "A-OOH":
    "비용 대신 혜택·관계·가치 교환으로 확보한 제휴 매체",
  "D-OOH":
    "전단지, 족자, 게릴라 현수막 등의 지점 주도 액션",
};

export const MEDIA_TYPE = {
  // P-OOH (공식매체)
  BUS_STOP: "버스 정류장",
  SUBWAY: "지하철역",
  // D-OOH (배포형)
  LEAFLET: "전단지",
  SCROLL: "족자",
  GUERILLA_BANNER: "게릴라 현수막",
  // A-OOH (제휴)
  BARTER_BANNER: "바터제휴배너",
  // 공통/기타 — 레거시 OOH/현수막 데이터 호환용
  OOH: "OOH",
  BANNER: "현수막",
  ETC: "기타",
} as const;
export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

/** 카테고리별 등록 폼에서 노출할 매체 종류. */
export const MEDIA_TYPE_BY_CATEGORY: Record<MediaCategory, readonly MediaType[]> = {
  "P-OOH": [MEDIA_TYPE.BUS_STOP, MEDIA_TYPE.SUBWAY],
  "D-OOH": [
    MEDIA_TYPE.LEAFLET,
    MEDIA_TYPE.SCROLL,
    MEDIA_TYPE.GUERILLA_BANNER,
    MEDIA_TYPE.ETC,
  ],
  "A-OOH": [MEDIA_TYPE.BARTER_BANNER, MEDIA_TYPE.ETC],
};

export const CONTENT_TYPE = {
  IMAGE: "이미지",
  TEXT: "텍스트",
  VIDEO: "영상",
} as const;
export type ContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

export const SCORE_CONFIG = {
  // v0 호환 (별도 액션이 발생할 때 직접 부여하던 점수)
  UPDATE: 1,
  UPDATE_WITH_PHOTO: 1.5,
  NEW_DISCOVERY: 5,
  BARTER_SUCCESS: 7,
  // v1 daily task 기반 점수
  TASK_COMPLETE: 1,
  TASK_DISCOVERY_COMPLETE: 5,
  TASK_BARTER_COMPLETE: 7,
  TASK_EXPIRED: -5,
  BONUS_ACTION: 5,
  // D-OOH 배포 노력 점수
  DISTRIBUTION_DESIGN_NEW: 3, // 신규 디자인 등록 보너스 (첫 회차와 별도)
  DISTRIBUTION_EVENT: 2, // 회차 1건 추가 (신규/추가 무관)
} as const;

export const SCORE_ACTION = {
  // v0
  UPDATE: "update",
  NEW_DISCOVERY: "new_discovery",
  BARTER_SUCCESS: "barter_success",
  // v1 daily task 기반
  TASK_COMPLETE: "task_complete",
  TASK_DISCOVERY: "task_discovery",
  TASK_BARTER: "task_barter",
  TASK_EXPIRED: "task_expired",
  BONUS_DISCOVERY: "bonus_discovery",
  // D-OOH 배포 활동
  DISTRIBUTION_DESIGN_NEW: "distribution_design_new",
  DISTRIBUTION_EVENT: "distribution_event",
} as const;
export type ScoreAction = (typeof SCORE_ACTION)[keyof typeof SCORE_ACTION];

export const DAILY_TASK_TYPE = {
  UNOFFICIAL_UPDATE: "unofficial_update",
  POSTING_ENDING: "posting_ending",
  NEGOTIATING_FOLLOWUP: "negotiating_followup",
  DISCOVERY_ZERO: "discovery_zero",
  BARTER_PROGRESS: "barter_progress",
} as const;
export type DailyTaskType =
  (typeof DAILY_TASK_TYPE)[keyof typeof DAILY_TASK_TYPE];

export const DAILY_TASK_STATUS = {
  OPEN: "open",
  DONE: "done",
  EXPIRED: "expired",
} as const;
export type DailyTaskStatus =
  (typeof DAILY_TASK_STATUS)[keyof typeof DAILY_TASK_STATUS];

export const DAILY_TASK_COMPLETED_BY = {
  AUTO: "auto",
  MANUAL: "manual",
} as const;
export type DailyTaskCompletedBy =
  (typeof DAILY_TASK_COMPLETED_BY)[keyof typeof DAILY_TASK_COMPLETED_BY];

/** Task 타입별 완료 시 점수 매핑. */
export const TASK_COMPLETE_SCORE: Record<DailyTaskType, number> = {
  unofficial_update: SCORE_CONFIG.TASK_COMPLETE,
  posting_ending: SCORE_CONFIG.TASK_COMPLETE,
  negotiating_followup: SCORE_CONFIG.TASK_COMPLETE,
  discovery_zero: SCORE_CONFIG.TASK_DISCOVERY_COMPLETE,
  barter_progress: SCORE_CONFIG.TASK_BARTER_COMPLETE,
};

/** Task 만료(7일 미처리) 시 차감 점수. 모든 타입 동일. */
export const TASK_EXPIRE_SCORE = SCORE_CONFIG.TASK_EXPIRED;

/** Task 자동 완료가 가능한지 여부. discovery_zero 는 자동 전용. */
export const TASK_MANUAL_CHECK_ALLOWED: Record<DailyTaskType, boolean> = {
  unofficial_update: true,
  posting_ending: true,
  negotiating_followup: true,
  discovery_zero: false,
  barter_progress: true,
};

// ============================================================
// DB row 타입 — CLAUDE.md 스키마와 일치
// ============================================================

export type Branch = {
  id: string;
  name: string;
  slug: string;
  budget_monthly: number;
  slack_channel: string | null;
  slack_user_group_id: string | null;
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
  location_key: string;
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

export type DistributionEvent = {
  id: string;
  media_record_id: string;
  distributed_on: string; // yyyy-mm-dd
  location_label: string | null;
  quantity: number | null;
  cost: number | null;
  memo: string | null;
  created_at: string;
};

export type DailyTask = {
  id: string;
  branch_id: string;
  task_type: DailyTaskType;
  related_record_id: string | null;
  generated_for: string; // yyyy-mm-dd
  expires_at: string; // yyyy-mm-dd
  status: DailyTaskStatus;
  completed_at: string | null;
  completed_by: DailyTaskCompletedBy | null;
  carry_over_count: number;
  created_at: string;
};

// ============================================================
// 권한 시스템 (자세한 설계는 docs/permissions-plan.md)
// ============================================================

export const USER_ROLE = {
  ADMIN: "admin",
  MANAGER: "manager",
  VIEWER: "viewer",
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/** Role 권한 위계 (높을수록 권한 큼). 가드 헬퍼에서 비교용. */
export const ROLE_RANK: Record<UserRole, number> = {
  viewer: 1,
  manager: 2,
  admin: 3,
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  slack_user_id: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserBranchAccess = {
  user_id: string;
  branch_id: string;
  granted_at: string;
};
