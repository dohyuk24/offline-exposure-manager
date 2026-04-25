import Link from "next/link";

import { listBranchSummaries, type BranchSummary } from "@/lib/supabase/queries/branches";
import { currentYearMonth } from "@/lib/date";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { ConnectionError } from "@/components/ui/connection-error";
import { formatError } from "@/lib/format-error";

export default async function BranchesIndexPage() {
  const yearMonth = currentYearMonth();

  let summaries: BranchSummary[] = [];
  let connectionError: string | null = null;

  try {
    summaries = sortBranchesByDisplayOrder(await listBranchSummaries(yearMonth));
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-[20px] font-semibold">지점</h1>
        </header>
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">지점</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {yearMonth} 기준 · 지점 카드를 눌러 상세 페이지로 이동
        </p>
      </header>

      <div
        className="grid gap-4 md:gap-5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {summaries.map((branch) => (
          <BranchSummaryCard key={branch.id} branch={branch} />
        ))}
      </div>
    </div>
  );
}

function BranchSummaryCard({ branch }: { branch: BranchSummary }) {
  const budgetRatio =
    branch.budget_monthly > 0
      ? branch.monthlyBudgetUsed / branch.budget_monthly
      : 0;
  const budgetPercent = Math.round(budgetRatio * 100);
  const overBudget = branch.monthlyBudgetUsed > branch.budget_monthly;

  return (
    <Link
      href={`/branches/${branch.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {branch.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            /{branch.slug}
          </p>
        </div>
        {branch.hasDiscovery ? (
          <span className="shrink-0 rounded-full bg-[var(--discovery-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--discovery-fg)]">
            ✨ 발굴
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="매체" value={`${branch.mediaCount}건`} />
        <Stat label="점수" value={`${branch.monthlyScore}점`} />
        <Stat
          label="예산"
          value={`${budgetPercent}%`}
          tone={overBudget ? "danger" : budgetRatio >= 0.8 ? "warn" : "default"}
        />
      </dl>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn" | "danger";
}) {
  const valueColor =
    tone === "danger"
      ? "text-[#C4332F]"
      : tone === "warn"
        ? "text-[#9F6B53]"
        : "text-[var(--color-text-primary)]";

  return (
    <div className="rounded bg-[var(--color-bg-secondary)] px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {label}
      </dt>
      <dd className={`mt-0.5 text-sm font-medium ${valueColor}`}>{value}</dd>
    </div>
  );
}
