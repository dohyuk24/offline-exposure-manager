/**
 * 데일리 task 생성 + 만료 처리.
 * Cron route 와 어드민 수동 실행에서 호출.
 *
 * 흐름 (지점별):
 *   1. 만료된 open task → expired 로 마킹 + score_logs −5
 *   2. 매체별 트리거 검사 → 새 task insert (또는 기존 carry over count + 1)
 *   3. discovery_zero (지점 단위) 동일 처리
 */

import type { Branch, MediaRecord } from "@/types";
import {
  DAILY_TASK_STATUS,
  DAILY_TASK_TYPE,
  SCORE_ACTION,
  TASK_EXPIRE_SCORE,
} from "@/types";
import { addDays, currentYearMonth, formatYmd } from "@/lib/date";
import { createServerSupabase } from "@/lib/supabase/client";
import { findOpenTask } from "@/lib/supabase/queries/daily-tasks";
import {
  isDiscoveryZeroTriggered,
  recordTriggersFor,
} from "./triggers";

const TASK_EXPIRY_DAYS = 7;

export type GenerateResult = {
  inserted: number;
  carried: number;
  expired: number;
};

export async function generateDailyTasksForBranch(
  branchId: string,
  today: Date
): Promise<GenerateResult> {
  const expired = await expireOverdueTasks(branchId, today);
  const supabase = await createServerSupabase();

  const todayStr = formatYmd(today);
  const expiresStr = formatYmd(addDays(today, TASK_EXPIRY_DAYS));

  let inserted = 0;
  let carried = 0;

  // 매체별 트리거
  const { data: records, error: recErr } = await supabase
    .from("media_records")
    .select("*")
    .eq("branch_id", branchId)
    .is("deleted_at", null);
  if (recErr) throw recErr;

  for (const record of (records ?? []) as MediaRecord[]) {
    const triggered = recordTriggersFor(record, today);
    for (const taskType of triggered) {
      const existing = await findOpenTask(branchId, taskType, record.id);
      if (existing) {
        await supabase
          .from("daily_tasks")
          .update({ carry_over_count: existing.carry_over_count + 1 })
          .eq("id", existing.id);
        carried += 1;
      } else {
        const { error: insErr } = await supabase.from("daily_tasks").insert({
          branch_id: branchId,
          task_type: taskType,
          related_record_id: record.id,
          generated_for: todayStr,
          expires_at: expiresStr,
          status: DAILY_TASK_STATUS.OPEN,
          carry_over_count: 0,
        });
        if (insErr) throw insErr;
        inserted += 1;
      }
    }
  }

  // 지점 단위 discovery_zero
  const yearMonth = currentYearMonth(today);
  const { count: discoveryCount, error: countErr } = await supabase
    .from("media_records")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("is_new_discovery", true)
    .gte("created_at", `${yearMonth}-01T00:00:00Z`)
    .is("deleted_at", null);
  if (countErr) throw countErr;

  if (isDiscoveryZeroTriggered(discoveryCount ?? 0, today)) {
    const existing = await findOpenTask(
      branchId,
      DAILY_TASK_TYPE.DISCOVERY_ZERO,
      null
    );
    if (existing) {
      await supabase
        .from("daily_tasks")
        .update({ carry_over_count: existing.carry_over_count + 1 })
        .eq("id", existing.id);
      carried += 1;
    } else {
      const { error: insErr } = await supabase.from("daily_tasks").insert({
        branch_id: branchId,
        task_type: DAILY_TASK_TYPE.DISCOVERY_ZERO,
        related_record_id: null,
        generated_for: todayStr,
        expires_at: expiresStr,
        status: DAILY_TASK_STATUS.OPEN,
        carry_over_count: 0,
      });
      if (insErr) throw insErr;
      inserted += 1;
    }
  }

  return { inserted, carried, expired };
}

async function expireOverdueTasks(
  branchId: string,
  today: Date
): Promise<number> {
  const supabase = await createServerSupabase();
  const todayStr = formatYmd(today);
  const yearMonth = currentYearMonth(today);

  const { data: overdue, error } = await supabase
    .from("daily_tasks")
    .select("id, related_record_id")
    .eq("branch_id", branchId)
    .eq("status", DAILY_TASK_STATUS.OPEN)
    .lt("expires_at", todayStr);
  if (error) throw error;
  if (!overdue || overdue.length === 0) return 0;

  const ids = overdue.map((t) => (t as { id: string }).id);

  const { error: updateErr } = await supabase
    .from("daily_tasks")
    .update({
      status: DAILY_TASK_STATUS.EXPIRED,
      completed_at: new Date().toISOString(),
    })
    .in("id", ids);
  if (updateErr) throw updateErr;

  const { error: scoreErr } = await supabase.from("score_logs").insert(
    overdue.map((t) => ({
      branch_id: branchId,
      media_record_id: (t as { related_record_id: string | null })
        .related_record_id,
      action: SCORE_ACTION.TASK_EXPIRED,
      score: TASK_EXPIRE_SCORE,
      year_month: yearMonth,
    }))
  );
  if (scoreErr) throw scoreErr;

  return overdue.length;
}

export async function generateDailyTasksForAllBranches(today: Date): Promise<{
  branchCount: number;
  totals: GenerateResult;
}> {
  const supabase = await createServerSupabase();
  const { data: branches, error } = await supabase
    .from("branches")
    .select("id")
    .eq("is_active", true);
  if (error) throw error;

  const totals: GenerateResult = { inserted: 0, carried: 0, expired: 0 };
  let branchCount = 0;
  for (const b of (branches ?? []) as Branch[]) {
    const result = await generateDailyTasksForBranch(b.id, today);
    totals.inserted += result.inserted;
    totals.carried += result.carried;
    totals.expired += result.expired;
    branchCount += 1;
  }
  return { branchCount, totals };
}
