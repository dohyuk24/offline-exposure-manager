import type { ScoreLog } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function getBranchMonthlyScore(
  branchId: string,
  yearMonth: string
): Promise<number> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("score_logs")
    .select("score")
    .eq("branch_id", branchId)
    .eq("year_month", yearMonth);

  if (error) throw error;
  return (data ?? []).reduce(
    (sum, row) => sum + (row as { score: number }).score,
    0
  );
}

export async function listBranchScoreLogs(
  branchId: string,
  yearMonth: string
): Promise<ScoreLog[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("score_logs")
    .select("*")
    .eq("branch_id", branchId)
    .eq("year_month", yearMonth)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ScoreLog[];
}
