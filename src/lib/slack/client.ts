/**
 * Slack Bot Token 기반 메시지 전송 클라이언트.
 * Webhook 대신 chat.postMessage 를 사용하므로 1개 토큰으로 다수 채널 발송 가능.
 *
 * 환경변수
 *   SLACK_BOT_TOKEN              — xoxb-... bot token
 *   SLACK_TEST_CHANNEL_OVERRIDE  — 값이 있으면 모든 발송이 이 채널로 강제 리다이렉트
 *                                  (v1 테스트 단계에서 사용자 개인 채널로 우선 발송)
 */

const SLACK_API = "https://slack.com/api/chat.postMessage";

export type SlackMessage = {
  channel: string;
  text: string;
  blocks?: unknown[];
  unfurl_links?: boolean;
};

export type SlackPostResult =
  | { ok: true; channel: string; ts: string }
  | { ok: false; error: string; targetChannel: string };

/**
 * chat.postMessage 호출. 테스트 채널 override 가 있으면 channel 을 덮어씀.
 * 토큰 미설정 시 console.warn 후 noop (배포 전 방지).
 */
export async function postSlackMessage(
  message: SlackMessage
): Promise<SlackPostResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn(
      "[slack] SLACK_BOT_TOKEN 미설정 — 발송 스킵",
      message.channel,
      message.text.slice(0, 80)
    );
    return { ok: false, error: "no_token", targetChannel: message.channel };
  }

  const override = process.env.SLACK_TEST_CHANNEL_OVERRIDE?.trim();
  const targetChannel = override || message.channel;

  const body = {
    channel: targetChannel,
    text: message.text,
    blocks: message.blocks,
    unfurl_links: message.unfurl_links ?? false,
  };

  try {
    const res = await fetch(SLACK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      ok: boolean;
      ts?: string;
      channel?: string;
      error?: string;
    };

    if (!json.ok) {
      console.error("[slack] postMessage 실패", json.error, targetChannel);
      return {
        ok: false,
        error: json.error ?? "unknown",
        targetChannel,
      };
    }

    return {
      ok: true,
      channel: json.channel ?? targetChannel,
      ts: json.ts ?? "",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[slack] postMessage 예외", msg, targetChannel);
    return { ok: false, error: msg, targetChannel };
  }
}

/** 슬랙 user group 멘션 토큰. 그룹 ID 가 없으면 빈 문자열. */
export function userGroupMention(groupId: string | null | undefined): string {
  if (!groupId) return "";
  return `<!subteam^${groupId}>`;
}
