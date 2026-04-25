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

/**
 * 위젯용: open task + 오늘 완료된 done task 를 매체 정보와 join 하여 반환.
 * 진척률 (X/Y) 계산을 위해 오늘 완료분도 포함.
 */
export type DailyTaskWithRecord = DailyTask & {
  related_record: {
    id: string;
    description: string | null;
    media_type: string;
    end_date: string | null;
    status: string;
  } | null;
};

/**
 * 홈 마케팅실용 배너: 지점별 open task 카운트.
 * count 0 인 지점은 결과에서 제외.
 */
export type BranchUnresolvedSummary = {
  branch_id: string;
  branch_name: string;
  branch_slug: string;
  count: number;
};

export async function getUnresolvedTasksByBranch(): Promise<{
  totalCount: number;
  byBranch: BranchUnresolvedSummary[];
}> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("branch_id, branches!inner(name, slug)")
    .eq("status", DAILY_TASK_STATUS.OPEN);
  if (error) throw error;

  const map = new Map<string, BranchUnresolvedSummary>();
  for (const row of (data ?? []) as unknown[]) {
    const r = row as {
      branch_id: string;
      branches: { name: string; slug: string } | { name: string; slug: string }[];
    };
    const b = Array.isArray(r.branches) ? r.branches[0] : r.branches;
    const existing = map.get(r.branch_id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(r.branch_id, {
        branch_id: r.branch_id,
        branch_name: b.name,
        branch_slug: b.slug,
        count: 1,
      });
    }
  }

  const byBranch = Array.from(map.values()).sort((a, b) => b.count - a.count);
  const totalCount = byBranch.reduce((sum, b) => sum + b.count, 0);
  return { totalCount, byBranch };
}

export async function getTasksForWidget(
  branchId: string,
  today: Date
): Promise<DailyTaskWithRecord[]> {
  const supabase = await createServerSupabase();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toISOString();

  const baseSelect =
    "*, related_record:media_records!related_record_id(id, description, media_type, end_date, status)";

  const [openRes, doneRes] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select(baseSelect)
      .eq("branch_id", branchId)
      .eq("status", DAILY_TASK_STATUS.OPEN)
      .order("carry_over_count", { ascending: false }),
    supabase
      .from("daily_tasks")
      .select(baseSelect)
      .eq("branch_id", branchId)
      .eq("status", "done")
      .gte("completed_at", todayStart),
  ]);

  if (openRes.error) throw openRes.error;
  if (doneRes.error) throw doneRes.error;

  const normalize = (rows: unknown[]): DailyTaskWithRecord[] =>
    rows.map((row) => {
      const r = row as DailyTaskWithRecord & {
        related_record:
          | DailyTaskWithRecord["related_record"]
          | DailyTaskWithRecord["related_record"][];
      };
      const rel = Array.isArray(r.related_record)
        ? (r.related_record[0] ?? null)
        : r.related_record;
      return { ...r, related_record: rel };
    });

  return [...normalize(openRes.data ?? []), ...normalize(doneRes.data ?? [])];
}
