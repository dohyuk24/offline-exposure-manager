/**
 * 데일리 task 트리거 조건. 임계값은 docs/daily-routine-plan.md §2 와 동기.
 *
 * - 입력: 매체 레코드 1건 + 오늘 날짜
 * - 출력: 트리거된 task_type 배열
 */

import type { DailyTaskType, MediaRecord } from "@/types";
import {
  DAILY_TASK_TYPE,
  MEDIA_CATEGORY,
  MEDIA_STATUS,
  MEDIA_TYPE,
} from "@/types";
import { daysBetween } from "@/lib/date";

const UNOFFICIAL_UPDATE_DAYS = 7;
const POSTING_ENDING_DAYS = 3;
const NEGOTIATING_FOLLOWUP_DAYS = 14;
const DISCOVERY_ZERO_DAY_OF_MONTH = 15;

export function isUnofficialUpdateTriggered(
  record: MediaRecord,
  today: Date
): boolean {
  if (record.deleted_at) return false;
  // 3분류 통합 후: 공식매체(PAID) 게시중 매체 사진 갱신을 챙긴다.
  // (구 OWNED 트리거 — OWNED 가 PAID 로 흡수됨)
  if (record.category !== MEDIA_CATEGORY.PAID) return false;
  if (record.status !== MEDIA_STATUS.POSTING) return false;
  return daysBetween(new Date(record.updated_at), today) >= UNOFFICIAL_UPDATE_DAYS;
}

export function isPostingEndingTriggered(
  record: MediaRecord,
  today: Date
): boolean {
  if (record.deleted_at) return false;
  if (record.status !== MEDIA_STATUS.POSTING) return false;
  if (!record.end_date) return false;
  const diff = daysBetween(today, new Date(record.end_date));
  return diff >= 0 && diff <= POSTING_ENDING_DAYS;
}

export function isNegotiatingFollowupTriggered(
  record: MediaRecord,
  today: Date
): boolean {
  if (record.deleted_at) return false;
  if (record.status !== MEDIA_STATUS.NEGOTIATING) return false;
  return daysBetween(new Date(record.created_at), today) >= NEGOTIATING_FOLLOWUP_DAYS;
}

export function isBarterProgressTriggered(record: MediaRecord): boolean {
  if (record.deleted_at) return false;
  if (record.media_type !== MEDIA_TYPE.BARTER_BANNER) return false;
  if (record.status !== MEDIA_STATUS.NEGOTIATING) return false;
  return true;
}

/** 매체별 트리거된 task_type 목록. */
export function recordTriggersFor(
  record: MediaRecord,
  today: Date
): DailyTaskType[] {
  const types: DailyTaskType[] = [];
  if (isUnofficialUpdateTriggered(record, today))
    types.push(DAILY_TASK_TYPE.UNOFFICIAL_UPDATE);
  if (isPostingEndingTriggered(record, today))
    types.push(DAILY_TASK_TYPE.POSTING_ENDING);
  if (isNegotiatingFollowupTriggered(record, today))
    types.push(DAILY_TASK_TYPE.NEGOTIATING_FOLLOWUP);
  if (isBarterProgressTriggered(record))
    types.push(DAILY_TASK_TYPE.BARTER_PROGRESS);
  return types;
}

/**
 * 지점 단위 discovery_zero 트리거.
 * 이번 달 신규 발굴 0건 + 오늘이 월 15일 이후.
 */
export function isDiscoveryZeroTriggered(
  monthlyDiscoveryCount: number,
  today: Date
): boolean {
  return monthlyDiscoveryCount === 0 && today.getDate() >= DISCOVERY_ZERO_DAY_OF_MONTH;
}
