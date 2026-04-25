import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import {
  getBranchBudgetUsage,
  listBranchBudgetLogs,
} from "@/lib/supabase/queries/budget-logs";
import { currentYearMonth } from "@/lib/date";
import { formatError } from "@/lib/format-error";

import { BudgetWidget } from "@/components/budget/budget-widget";
import { ConnectionError } from "@/components/ui/connection-error";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchBudgetPage({ params }: PageProps) {
  const { branchId } = await params;
  const yearMonth = currentYearMonth();

  let branch: Awaited<ReturnType<typeof getBranchBySlug>> = null;
  let used = 0;
  let logs: Awaited<ReturnType<typeof listBranchBudgetLogs>> = [];
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (branch) {
      [used, logs] = await Promise.all([
        getBranchBudgetUsage(branch.id, yearMonth),
        listBranchBudgetLogs(branch.id, yearMonth),
      ]);
    }
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Header branchId={branchId} />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            예산
          </p>
          <h1 className="text-[20px] font-semibold">{branch.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {yearMonth} 기준
          </p>
        </div>
        <Link
          href={`/branches/${branch.slug}`}
          className="shrink-0 text-xs text-[var(--color-text-tertiary)] hover:underline"
        >
          ← 지점으로
        </Link>
      </header>

      <BudgetWidget allocated={branch.budget_monthly} used={used} />

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">이번 달 사용 내역</h2>
        {logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
            이번 달 예산 사용 내역이 없어요.
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

      <p className="text-center text-[11px] text-[var(--color-text-tertiary)]">
        v2 에서 더 좋은 예산 분석 뷰가 추가될 예정이에요.
      </p>
    </div>
  );
}

function Header({ branchId }: { branchId: string }) {
  return (
    <header>
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        예산
      </p>
      <h1 className="text-[20px] font-semibold">{branchId}</h1>
    </header>
  );
}
