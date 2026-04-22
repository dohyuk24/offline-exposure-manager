import type { Branch } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function getBranchBySlug(slug: string): Promise<Branch | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as Branch | null;
}

export async function listActiveBranches(): Promise<Branch[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Branch[];
}

export type BranchSummary = Branch & {
  mediaCount: number;
  monthlyScore: number;
  monthlyBudgetUsed: number;
  hasDiscovery: boolean;
};

/**
 * 전 지점 요약 — index 페이지 · 홈 · 사이드바에서 공용.
 * 4개의 병렬 쿼리로 처리하고 메모리에서 집계.
 */
export async function listBranchSummaries(
  yearMonth: string
): Promise<BranchSummary[]> {
  const supabase = await createServerSupabase();

  const [branchesRes, mediaRes, scoresRes, budgetsRes] = await Promise.all([
    supabase
      .from("branches")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("media_records")
      .select("branch_id, is_new_discovery, location_key")
      .is("deleted_at", null),
    supabase
      .from("score_logs")
      .select("branch_id, score")
      .eq("year_month", yearMonth),
    supabase
      .from("budget_logs")
      .select("branch_id, amount")
      .eq("year_month", yearMonth),
  ]);

  if (branchesRes.error) throw branchesRes.error;
  if (mediaRes.error) throw mediaRes.error;
  if (scoresRes.error) throw scoresRes.error;
  if (budgetsRes.error) throw budgetsRes.error;

  // 같은 location_key 는 하나의 매체로 집계 — 월별 히스토리 중복 제거.
  const keysByBranch = new Map<string, Set<string>>();
  const discoveryByBranch = new Map<string, boolean>();
  for (const row of (mediaRes.data ?? []) as {
    branch_id: string;
    is_new_discovery: boolean;
    location_key: string;
  }[]) {
    const keySet = keysByBranch.get(row.branch_id) ?? new Set<string>();
    keySet.add(row.location_key);
    keysByBranch.set(row.branch_id, keySet);
    if (row.is_new_discovery)
      discoveryByBranch.set(row.branch_id, true);
  }

  const scoreByBranch = new Map<string, number>();
  for (const row of (scoresRes.data ?? []) as {
    branch_id: string;
    score: number;
  }[]) {
    scoreByBranch.set(
      row.branch_id,
      (scoreByBranch.get(row.branch_id) ?? 0) + row.score
    );
  }

  const budgetByBranch = new Map<string, number>();
  for (const row of (budgetsRes.data ?? []) as {
    branch_id: string;
    amount: number;
  }[]) {
    budgetByBranch.set(
      row.branch_id,
      (budgetByBranch.get(row.branch_id) ?? 0) + row.amount
    );
  }

  return ((branchesRes.data ?? []) as Branch[]).map((branch) => ({
    ...branch,
    mediaCount: keysByBranch.get(branch.id)?.size ?? 0,
    hasDiscovery: discoveryByBranch.get(branch.id) ?? false,
    monthlyScore: scoreByBranch.get(branch.id) ?? 0,
    monthlyBudgetUsed: budgetByBranch.get(branch.id) ?? 0,
  }));
}
