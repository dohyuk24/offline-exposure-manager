/**
 * Slack 알림 중앙 관리 모듈.
 * 모든 Slack 전송은 이 파일을 경유해야 한다. (CLAUDE.md 규칙)
 *
 * v1: Bot Token 기반 (chat.postMessage). webhook URL 시대는 종료.
 * 채널 전송 정책:
 *   - 지점별 알림 → branch.slack_channel
 *   - 마케팅실 공통 알림 → SLACK_MARKETING_CHANNEL_ID 환경변수
 *   - SLACK_TEST_CHANNEL_OVERRIDE 가 있으면 모든 발송이 그 채널로 강제
 */

import type { Branch, MediaRecord } from "@/types";
import { postSlackMessage } from "./client";

function branchLink(branch: Branch): string {
  const base = (process.env.SLACK_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/branches/${branch.slug}`;
}

function marketingChannel(): string {
  return process.env.SLACK_MARKETING_CHANNEL_ID ?? "";
}

/** 신규 발굴 → 마케팅실 채널 알림 + 발견 피드 배너 갱신 트리거. */
export async function sendDiscoveryAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  await postSlackMessage({
    channel: marketingChannel(),
    text: `[${branch.name}] 새 ${record.media_type} 위치 확보! → ${branchLink(branch)}`,
  });
}

/** 공식매체 제안 → 마케팅실 채널. */
export async function sendOfficialProposalAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  await postSlackMessage({
    channel: marketingChannel(),
    text: `[${branch.name}] 공식매체 후보 제안이 올라왔어요. 검토해주세요 → ${branchLink(branch)}`,
  });
  void record;
}

/**
 * 월 N일 이후 업데이트 없는 지점 대상 리마인더.
 * v1 daily 알림 도입 후로는 호출 위치 없음 — 호환 위해 유지.
 */
export async function sendReminderAlert(branch: Branch): Promise<void> {
  await postSlackMessage({
    channel: branch.slack_channel ?? "",
    text: `[${branch.name}] 이번 달 매체 현황 업데이트가 아직 없어요. 지금 기록하러 가기 → ${branchLink(branch)}`,
  });
}

/** 바터제휴 성사 알림 → 마케팅실 채널. */
export async function sendBarterSuccessAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  const condition = record.barter_condition ?? "조건 미기재";
  await postSlackMessage({
    channel: marketingChannel(),
    text: `[${branch.name}] 바터제휴 성사 — ${condition} → ${branchLink(branch)}`,
  });
}
