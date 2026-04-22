import type { BudgetLog } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

/**
 * 지점의 특정 월 예산 사용액 합계를 구한다.
 * yearMonth 포맷: 'YYYY-MM'
 */
export async function getBranchBudgetUsage(
  branchId: string,
  yearMonth: string
): Promise<number> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("budget_logs")
    .select("amount")
    .eq("branch_id", branchId)
    .eq("year_month", yearMonth);

  if (error) throw error;
  return (data ?? []).reduce(
    (sum, row) => sum + (row as { amount: number }).amount,
    0
  );
}

export async function listBranchBudgetLogs(
  branchId: string,
  yearMonth: string
): Promise<BudgetLog[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("budget_logs")
    .select("*")
    .eq("branch_id", branchId)
    .eq("year_month", yearMonth)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BudgetLog[];
}
