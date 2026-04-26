import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import {
  getBranchBudgetUsage,
  listBranchBudgetLogs,
} from "@/lib/supabase/queries/budget-logs";
import { currentYearMonth } from "@/lib/date";
import { formatError } from "@/lib/format-error";
import { createServerSupabase } from "@/lib/supabase/client";

import { BudgetWidget } from "@/components/budget/budget-widget";
import { ConnectionError } from "@/components/ui/connection-error";
import { YearMonthDropdown } from "@/components/ui/year-month-dropdown";

const YM_RE = /^\d{4}-\d{2}$/;

type PageProps = {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ ym?: string }>;
};

async function listBudgetYearMonths(branchId: string): Promise<string[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("budget_logs")
      .select("year_month")
      .eq("branch_id", branchId)
      .order("year_month", { ascending: false });
    if (error) throw error;
    const set = new Set(
      ((data ?? []) as { year_month: string }[]).map((r) => r.year_month)
    );
    return Array.from(set);
  } catch {
    return [];
  }
}

export default async function BranchBudgetPage({
  params,
  searchParams,
}: PageProps) {
  const { branchId } = await params;
  const { ym: ymRaw } = await searchParams;

  const today = currentYearMonth();
  const yearMonth = ymRaw && YM_RE.test(ymRaw) ? ymRaw : today;

  let branch: Awaited<ReturnType<typeof getBranchBySlug>> = null;
  let used = 0;
  let logs: Awaited<ReturnType<typeof listBranchBudgetLogs>> = [];
  let availableMonths: string[] = [];
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (branch) {
      [used, logs, availableMonths] = await Promise.all([
        getBranchBudgetUsage(branch.id, yearMonth),
        listBranchBudgetLogs(branch.id, yearMonth),
        listBudgetYearMonths(branch.id),
      ]);
    }
  } catch (err) {
    connectionError = formatError(err);
  }

  // 옵션: 사용 내역 있는 월 + 이번 달 + 선택된 월
  const optionSet = new Set(availableMonths);
  optionSet.add(today);
  optionSet.add(yearMonth);
  const monthOptions = Array.from(optionSet).sort().reverse();

  if (connectionError) {
    return (
      <div className="space-y-6">
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#E0B884] bg-[#FFF6E8] px-4 py-3 text-sm text-[#7A4F1E]">
        🚧 <strong>공사 중</strong> · 마케팅실 예산 관리 시스템과 연동 예정. 현재 화면은 미리보기예요.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-text-secondary)]">
          월별 사용 내역과 잔액을 확인해요
        </p>
        <YearMonthDropdown current={yearMonth} options={monthOptions} />
      </div>

      <BudgetWidget allocated={branch.budget_monthly} used={used} />

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">{yearMonth} 사용 내역</h2>
        {logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
            {yearMonth} 예산 사용 내역이 없어요.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--color-text-primary)]">
                    {log.memo || "(메모 없음)"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                    {log.created_at.slice(0, 10)}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-[var(--color-text-primary)]">
                  {log.amount.toLocaleString("ko-KR")}원
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
