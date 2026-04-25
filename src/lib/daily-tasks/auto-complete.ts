/**
 * 매체 액션 후 호출 — 해당 매체와 연결된 open task 들을 재평가하고
 * 트리거 조건을 더 이상 만족하지 않는 task 를 자동 완료 처리.
 *
 * 점수 부여: task_type 별 SCORE_CONFIG.TASK_* 값 사용.
 * 점수 로그 action 도 task_type 에 따라 분기 (task_complete / task_discovery / task_barter).
 */

import type { DailyTask, MediaRecord, ScoreAction } from "@/types";
import {
  DAILY_TASK_COMPLETED_BY,
  DAILY_TASK_STATUS,
  DAILY_TASK_TYPE,
  SCORE_ACTION,
  TASK_COMPLETE_SCORE,
} from "@/types";
import { currentYearMonth } from "@/lib/date";
import { createServerSupabase } from "@/lib/supabase/client";
import {
  findOpenTask,
  listOpenTasksByRecord,
} from "@/lib/supabase/queries/daily-tasks";
import { recordTriggersFor } from "./triggers";

/**
 * 매체 등록·수정 후 호출. 해당 record 의 모든 open task 를 재평가.
 * 트리거가 더 이상 만족되지 않는 task → 자동 완료 + 점수 부여.
 */
export async function autoCompleteForRecord(
  record: MediaRecord,
  now: Date = new Date()
): Promise<{ completed: number }> {
  const openTasks = await listOpenTasksByRecord(record.id);
  if (openTasks.length === 0) return { completed: 0 };

  const stillTriggered = new Set(recordTriggersFor(record, now));
  const toComplete = openTasks.filter((t) => !stillTriggered.has(t.task_type));

  let completed = 0;
  for (const task of toComplete) {
    await completeTask(task, "auto", now);
    completed += 1;
  }
  return { completed };
}

/**
 * 신규 발굴 등록 후 호출. 해당 지점의 discovery_zero open task 를 자동 완료.
 */
export async function autoCompleteDiscoveryZero(
  branchId: string,
  now: Date = new Date()
): Promise<{ completed: boolean }> {
  const existing = await findOpenTask(
    branchId,
    DAILY_TASK_TYPE.DISCOVERY_ZERO,
    null
  );
  if (!existing) return { completed: false };
  await completeTask(existing, "auto", now);
  return { completed: true };
}

/**
 * 위젯에서 수동 체크박스 클릭으로 task 완료.
 */
export async function manualCompleteTask(
  taskId: string,
  now: Date = new Date()
): Promise<void> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("status", DAILY_TASK_STATUS.OPEN)
    .maybeSingle();
  if (error) throw error;
  if (!data) return; // already done/expired
  await completeTask(data as DailyTask, "manual", now);
}

async function completeTask(
  task: DailyTask,
  by: "auto" | "manual",
  now: Date
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error: updateErr } = await supabase
    .from("daily_tasks")
    .update({
      status: DAILY_TASK_STATUS.DONE,
      completed_at: now.toISOString(),
      completed_by:
        by === "auto"
          ? DAILY_TASK_COMPLETED_BY.AUTO
          : DAILY_TASK_COMPLETED_BY.MANUAL,
    })
    .eq("id", task.id)
    .eq("status", DAILY_TASK_STATUS.OPEN); // race-safe
  if (updateErr) throw updateErr;

  const score = TASK_COMPLETE_SCORE[task.task_type];
  const action = scoreActionFor(task.task_type);

  const { error: scoreErr } = await supabase.from("score_logs").insert({
    branch_id: task.branch_id,
    media_record_id: task.related_record_id,
    action,
    score,
    year_month: currentYearMonth(now),
  });
  if (scoreErr) throw scoreErr;
}

function scoreActionFor(taskType: DailyTask["task_type"]): ScoreAction {
  if (taskType === DAILY_TASK_TYPE.DISCOVERY_ZERO) return SCORE_ACTION.TASK_DISCOVERY;
  if (taskType === DAILY_TASK_TYPE.BARTER_PROGRESS) return SCORE_ACTION.TASK_BARTER;
  return SCORE_ACTION.TASK_COMPLETE;
}
