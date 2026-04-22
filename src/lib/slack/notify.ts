/**
 * Slack 알림 중앙 관리 모듈.
 * 모든 Slack 전송은 이 파일을 경유해야 한다. (CLAUDE.md 규칙)
 *
 * 환경변수:
 *   SLACK_MARKETING_WEBHOOK_URL — 마케팅실 공용 채널 웹훅
 *   SLACK_APP_URL              — 알림 링크에 붙일 서비스 base URL
 */

import type { Branch, MediaRecord } from "@/types";

type SlackBlock = {
  type: "section";
  text: { type: "mrkdwn"; text: string };
};

async function postToWebhook(
  webhookUrl: string | undefined,
  payload: { text: string; blocks?: SlackBlock[] }
): Promise<void> {
  if (!webhookUrl) {
    console.warn("[slack] 웹훅 URL 없음 — 알림 전송 건너뜀", payload.text);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[slack] 알림 전송 실패", error);
  }
}

function branchLink(branch: Branch): string {
  const base = process.env.SLACK_APP_URL ?? "";
  return `${base}/branches/${branch.slug}`;
}

/**
 * 신규 발굴 → 마케팅실 공용 채널 알림 + 발견 피드 배너 갱신 트리거.
 */
export async function sendDiscoveryAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  const text = `[${branch.name}] 새 ${record.media_type} 위치 확보! → ${branchLink(branch)}`;
  await postToWebhook(process.env.SLACK_MARKETING_WEBHOOK_URL, { text });
}

/**
 * 공식매체 제안 → 마케팅실 담당자 DM (승인 프로세스).
 */
export async function sendOfficialProposalAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  const text = `[${branch.name}] 공식매체 후보 제안이 올라왔어요. 검토해주세요 → ${branchLink(branch)}`;
  await postToWebhook(process.env.SLACK_MARKETING_WEBHOOK_URL, { text });
  void record;
}

/**
 * 월 N일 이후 업데이트 없는 지점 대상 리마인더.
 */
export async function sendReminderAlert(branch: Branch): Promise<void> {
  const text = `[${branch.name}] 이번 달 매체 현황 업데이트가 아직 없어요. 지금 기록하러 가기 → ${branchLink(branch)}`;
  await postToWebhook(process.env.SLACK_MARKETING_WEBHOOK_URL, { text });
}

/**
 * 바터제휴 성사 알림.
 */
export async function sendBarterSuccessAlert(
  branch: Branch,
  record: MediaRecord
): Promise<void> {
  const condition = record.barter_condition ?? "조건 미기재";
  const text = `[${branch.name}] 바터제휴 성사 — ${condition} → ${branchLink(branch)}`;
  await postToWebhook(process.env.SLACK_MARKETING_WEBHOOK_URL, { text });
}
