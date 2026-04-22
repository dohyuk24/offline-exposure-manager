import { notFound } from "next/navigation";

import type { Branch, MediaRecord, ScoreLog } from "@/types";
import { MEDIA_CATEGORY, SCORE_ACTION, SCORE_CONFIG } from "@/types";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { listMediaByBranch } from "@/lib/supabase/queries/media-records";
import { getBranchBudgetUsage } from "@/lib/supabase/queries/budget-logs";
import { listBranchScoreLogs } from "@/lib/supabase/queries/score-logs";
import { currentYearMonth } from "@/lib/date";

import { MediaGrid } from "@/components/media/media-grid";
import { BudgetWidget } from "@/components/budget/budget-widget";
import { ScoreWidget } from "@/components/score/score-widget";
import { ConnectionError } from "@/components/ui/connection-error";

type BranchPageProps = {
  params: Promise<{ branchId: string }>;
};

type BranchData = {
  branch: Branch;
  records: MediaRecord[];
  budgetUsed: number;
  scoreLogs: ScoreLog[];
  yearMonth: string;
};

async function loadBranchData(slug: string): Promise<BranchData | null> {
  const branch = await getBranchBySlug(slug);
  if (!branch) return null;

  const yearMonth = currentYearMonth();
  const [records, budgetUsed, scoreLogs] = await Promise.all([
    listMediaByBranch(branch.id),
    getBranchBudgetUsage(branch.id, yearMonth),
    listBranchScoreLogs(branch.id, yearMonth),
  ]);

  return { branch, records, budgetUsed, scoreLogs, yearMonth };
}

export default async function BranchPage({ params }: BranchPageProps) {
  const { branchId } = await params;

  let data: BranchData | null = null;
  let connectionError: string | null = null;

  try {
    data = await loadBranchData(branchId);
  } catch (err) {
    connectionError = err instanceof Error ? err.message : String(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            지점
          </p>
          <h1 className="text-[20px] font-semibold">{branchId}</h1>
        </header>
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!data) notFound();

  const { branch, records, budgetUsed, scoreLogs, yearMonth } = data;

  const officialRecords = records.filter(
    (r) => r.category === MEDIA_CATEGORY.OFFICIAL
  );
  const ownedAndUnofficialRecords = records.filter(
    (r) => r.category !== MEDIA_CATEGORY.OFFICIAL
  );

  const summary = summarizeScore(scoreLogs);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          지점
        </p>
        <h1 className="text-[20px] font-semibold">{branch.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {yearMonth} 기준 현황
        </p>
      </header>

      <Section title="공식매체 (OOH)">
        <MediaGrid
          records={officialRecords}
          emptyMessage="등록된 공식매체가 없어요. 상권에서 후보를 발견하면 제안해주세요."
        />
      </Section>

      <Section title="비공식매체 · 자체보유">
        <MediaGrid
          records={ownedAndUnofficialRecords}
          emptyMessage="등록된 매체가 없어요. 새 매체를 기록해볼까요?"
        />
      </Section>

      <Section title="예산">
        <BudgetWidget allocated={branch.budget_monthly} used={budgetUsed} />
      </Section>

      <Section title="이번 달 점수">
        <ScoreWidget
          totalScore={summary.total}
          updateCount={summary.updateCount}
          discoveryCount={summary.discoveryCount}
          barterInProgress={summary.barterInProgress}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {children}
    </section>
  );
}

function summarizeScore(logs: ScoreLog[]): {
  total: number;
  updateCount: number;
  discoveryCount: number;
  barterInProgress: boolean;
} {
  let total = 0;
  let updateCount = 0;
  let discoveryCount = 0;
  let barterSuccessCount = 0;

  for (const log of logs) {
    total += log.score;
    if (log.action === SCORE_ACTION.UPDATE) updateCount += 1;
    else if (log.action === SCORE_ACTION.NEW_DISCOVERY) discoveryCount += 1;
    else if (log.action === SCORE_ACTION.BARTER_SUCCESS) barterSuccessCount += 1;
  }

  void SCORE_CONFIG; // 추후 점수 가중치 연동 시 사용
  return {
    total,
    updateCount,
    discoveryCount,
    barterInProgress: barterSuccessCount === 0,
  };
}
