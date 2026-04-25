import type { DailyTask, DailyTaskType } from "@/types";
import { DAILY_TASK_STATUS } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function listOpenTasksByBranch(
  branchId: string
): Promise<DailyTask[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("branch_id", branchId)
    .eq("status", DAILY_TASK_STATUS.OPEN)
    .order("generated_for", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DailyTask[];
}

/**
 * 지정 지점·타입·관련 레코드의 open task 1건 조회.
 * generate cron 의 carry over 판정용.
 */
export async function findOpenTask(
  branchId: string,
  taskType: DailyTaskType,
  relatedRecordId: string | null
): Promise<DailyTask | null> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("daily_tasks")
    .select("*")
    .eq("branch_id", branchId)
    .eq("task_type", taskType)
    .eq("status", DAILY_TASK_STATUS.OPEN);
  if (relatedRecordId === null) {
    query = query.is("related_record_id", null);
  } else {
    query = query.eq("related_record_id", relatedRecordId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as DailyTask | null;
}

/**
 * 특정 매체와 연결된 모든 open task 조회.
 * 매체 액션 후 자동 완료 매핑에 사용.
 */
export async function listOpenTasksByRecord(
  recordId: string
): Promise<DailyTask[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("related_record_id", recordId)
    .eq("status", DAILY_TASK_STATUS.OPEN);
  if (error) throw error;
  return (data ?? []) as DailyTask[];
}
