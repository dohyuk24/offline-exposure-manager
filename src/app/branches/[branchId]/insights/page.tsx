import { notFound } from "next/navigation";

import type { ScoreLog } from "@/types";
import { SCORE_ACTION } from "@/types";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { listBranchScoreLogs } from "@/lib/supabase/queries/score-logs";
import { currentYearMonth } from "@/lib/date";
import { formatError } from "@/lib/format-error";

import { ScoreWidget } from "@/components/score/score-widget";
import { BranchTabs } from "@/components/branch/branch-tabs";
import { ConnectionError } from "@/components/ui/connection-error";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchInsightsPage({ params }: PageProps) {
  const { branchId } = await params;
  const yearMonth = currentYearMonth();

  let branch: Awaited<ReturnType<typeof getBranchBySlug>> = null;
  let scoreLogs: ScoreLog[] = [];
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (branch) {
      scoreLogs = await listBranchScoreLogs(branch.id, yearMonth);
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

  const summary = summarizeScore(scoreLogs);

  return (
    <div className="space-y-6">
      <BranchTabs branchSlug={branch.slug} active="insights" />
      <p className="text-sm text-[var(--color-text-secondary)]">
        이번 달 점수와 활동 누적을 확인해요 · {yearMonth}
      </p>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">이번 달 점수</h2>
        <ScoreWidget
          totalScore={summary.total}
          updateCount={summary.updateCount}
          discoveryCount={summary.discoveryCount}
          barterInProgress={summary.barterInProgress}
        />
      </section>

      <p className="text-center text-[11px] text-[var(--color-text-tertiary)]">
        v2 에서 월별 추이 / 누적 점수 / 다른 지점과 비교 차트가 추가될 예정이에요.
      </p>
    </div>
  );
}

function Header({ branchId }: { branchId: string }) {
  return (
    <header>
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        현황
      </p>
      <h1 className="text-[20px] font-semibold">{branchId}</h1>
    </header>
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
    if (
      log.action === SCORE_ACTION.UPDATE ||
      log.action === SCORE_ACTION.TASK_COMPLETE ||
      log.action === SCORE_ACTION.DISTRIBUTION_EVENT
    ) {
      updateCount += 1;
    } else if (
      log.action === SCORE_ACTION.NEW_DISCOVERY ||
      log.action === SCORE_ACTION.TASK_DISCOVERY ||
      log.action === SCORE_ACTION.BONUS_DISCOVERY ||
      log.action === SCORE_ACTION.DISTRIBUTION_DESIGN_NEW
    ) {
      discoveryCount += 1;
    } else if (
      log.action === SCORE_ACTION.BARTER_SUCCESS ||
      log.action === SCORE_ACTION.TASK_BARTER
    ) {
      barterSuccessCount += 1;
    }
  }

  return {
    total,
    updateCount,
    discoveryCount,
    barterInProgress: barterSuccessCount === 0,
  };
}
