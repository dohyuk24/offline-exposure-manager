/**
 * 데일리 슬랙 메시지 생성 + 지점별 발송.
 * 평일 14시 KST cron 에서 호출.
 */

import type { Branch, DailyTaskType } from "@/types";
import { DAILY_TASK_TYPE } from "@/types";
import type { DailyTaskWithRecord } from "@/lib/supabase/queries/daily-tasks";
import { getTasksForWidget } from "@/lib/supabase/queries/daily-tasks";
import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { daysBetween } from "@/lib/date";
import { postSlackMessage, userGroupMention } from "./client";

const TASK_GROUP_TITLE: Record<DailyTaskType, string> = {
  unofficial_update: "공식매체 사진 갱신",
  posting_ending: "게시 종료 임박",
  negotiating_followup: "협의중 매체 후속 액션",
  discovery_zero: "이번 달 신규 발굴 0건",
  barter_progress: "제휴매체 진행 체크",
};

const TASK_GROUP_ORDER: DailyTaskType[] = [
  DAILY_TASK_TYPE.UNOFFICIAL_UPDATE,
  DAILY_TASK_TYPE.POSTING_ENDING,
  DAILY_TASK_TYPE.NEGOTIATING_FOLLOWUP,
  DAILY_TASK_TYPE.BARTER_PROGRESS,
  DAILY_TASK_TYPE.DISCOVERY_ZERO,
];

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function branchUrl(branch: Branch): string {
  const base = (process.env.SLACK_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/branches/${branch.slug}`;
}

/** 날짜 라벨: '4/26 (월)' */
function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`;
}

function taskBullet(task: DailyTaskWithRecord, today: Date): string {
  const carryDays = task.carry_over_count + 1;
  const carryNote = task.carry_over_count >= 1 ? ` — ${carryDays}일째 미처리 ⚠` : "";

  if (task.task_type === DAILY_TASK_TYPE.DISCOVERY_ZERO) {
    return `  • 순회 시 후보 1개 등록해보세요${carryNote}`;
  }

  const r = task.related_record;
  if (!r) return `  • (매체 정보 없음)${carryNote}`;
  const label = r.description?.trim() ? r.description : r.media_type;

  if (task.task_type === DAILY_TASK_TYPE.POSTING_ENDING && r.end_date) {
    const days = Math.max(0, daysBetween(today, new Date(r.end_date)));
    return `  • ${label} — ${r.end_date} 종료 (D-${days})`;
  }

  if (task.task_type === DAILY_TASK_TYPE.NEGOTIATING_FOLLOWUP) {
    return `  • ${label} — 14일 이상 협의중${carryNote}`;
  }

  return `  • ${label}${carryNote}`;
}

/**
 * 지점 1곳의 open task 들을 슬랙 메시지 텍스트로 변환.
 * open task 0건이면 null (= 발송 안 함).
 */
export function buildDailyMessageForBranch(
  branch: Branch,
  openTasks: DailyTaskWithRecord[],
  today: Date
): string | null {
  if (openTasks.length === 0) return null;

  const groups: Record<DailyTaskType, DailyTaskWithRecord[]> = {
    unofficial_update: [],
    posting_ending: [],
    negotiating_followup: [],
    discovery_zero: [],
    barter_progress: [],
  };
  for (const t of openTasks) groups[t.task_type].push(t);

  const mention = userGroupMention(branch.slack_user_group_id);
  const header = `${mention ? `${mention} ` : ""}오늘의 매체 관리 할 일 · ${formatDateLabel(today)}`;
  const subheader = `📍 ${branch.name} 지점 · 미처리 ${openTasks.length}건`;

  const sections: string[] = [];
  for (const type of TASK_GROUP_ORDER) {
    const list = groups[type];
    if (list.length === 0) continue;
    const title = `☐ ${TASK_GROUP_TITLE[type]} (${list.length}건)`;
    const bullets = list.map((t) => taskBullet(t, today)).join("\n");
    sections.push(`${title}\n${bullets}`);
  }

  const link = `→ 앱에서 처리: ${branchUrl(branch)}`;

  return [header, "", subheader, "", sections.join("\n\n"), "", link].join("\n");
}

export type SendResult = {
  branchCount: number;
  sent: number;
  skipped: number;
  failed: { branch: string; error: string }[];
};

/**
 * 활성 지점 전부에 대해 데일리 메시지 발송.
 * - open task 0건 → skip
 * - slack_channel 미설정 + override 도 미설정 → skip + 경고
 */
export async function sendDailyTasksToAllBranches(today: Date): Promise<SendResult> {
  const branches = await listActiveBranches();
  const result: SendResult = {
    branchCount: branches.length,
    sent: 0,
    skipped: 0,
    failed: [],
  };

  const override = process.env.SLACK_TEST_CHANNEL_OVERRIDE?.trim();

  for (const branch of branches) {
    const openTasks = (await getTasksForWidget(branch.id, today)).filter(
      (t) => t.status === "open"
    );

    if (openTasks.length === 0) {
      result.skipped += 1;
      continue;
    }

    if (!branch.slack_channel && !override) {
      console.warn(
        "[slack/daily] 채널 미설정 — 스킵",
        branch.slug
      );
      result.skipped += 1;
      continue;
    }

    const text = buildDailyMessageForBranch(branch, openTasks, today);
    if (!text) {
      result.skipped += 1;
      continue;
    }

    const post = await postSlackMessage({
      channel: branch.slack_channel ?? "",
      text,
    });

    if (post.ok) {
      result.sent += 1;
    } else {
      result.failed.push({ branch: branch.slug, error: post.error });
    }
  }

  return result;
}
