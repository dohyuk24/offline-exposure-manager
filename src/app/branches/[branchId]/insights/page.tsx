import Link from "next/link";
import { notFound } from "next/navigation";

import type { ScoreLog } from "@/types";
import { SCORE_ACTION } from "@/types";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import {
  listBranchScoreLogs,
} from "@/lib/supabase/queries/score-logs";
import {
  listBranchSummaries,
  type BranchSummary,
} from "@/lib/supabase/queries/branches";
import { currentYearMonth } from "@/lib/date";
import { formatError } from "@/lib/format-error";

import { ScoreWidget } from "@/components/score/score-widget";
import { ConnectionError } from "@/components/ui/connection-error";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchInsightsPage({ params }: PageProps) {
  const { branchId } = await params;
  const yearMonth = currentYearMonth();

  let branch: Awaited<ReturnType<typeof getBranchBySlug>> = null;
  let scoreLogs: ScoreLog[] = [];
  let summaries: BranchSummary[] = [];
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (branch) {
      [scoreLogs, summaries] = await Promise.all([
        listBranchScoreLogs(branch.id, yearMonth),
        listBranchSummaries(yearMonth),
      ]);
    }
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  const summary = summarizeScore(scoreLogs);

  const sorted = [...summaries].sort(
    (a, b) => b.monthlyScore - a.monthlyScore
  );
  const topThree = sorted.slice(0, 3);
  const myRank = sorted.findIndex((s) => s.id === branch!.id) + 1;
  const inTop3 = myRank > 0 && myRank <= 3;

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        이번 달 점수와 활동 누적을 확인해요 · {yearMonth}
      </p>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium">이번 달 점수</h2>
          {myRank > 0 ? (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              전체 <strong className="text-[var(--color-text-secondary)]">
                {myRank}
              </strong>위 / {sorted.length}개 지점
            </span>
          ) : null}
        </div>
        <ScoreWidget
          totalScore={summary.total}
          updateCount={summary.updateCount}
          discoveryCount={summary.discoveryCount}
          barterInProgress={summary.barterInProgress}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">이번 달 Top 3</h2>
        <TopThreeList
          topThree={topThree}
          currentBranchId={branch.id}
        />
        {!inTop3 && myRank > 0 ? (
          <p className="text-center text-[12px] text-[var(--color-text-tertiary)]">
            🔥 우리 지점은 {myRank}위. Top 3 까지 {topThree[2]?.monthlyScore - summary.total}점 더 필요해요.
          </p>
        ) : null}
      </section>
    </div>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

function TopThreeList({
  topThree,
  currentBranchId,
}: {
  topThree: BranchSummary[];
  currentBranchId: string;
}) {
  if (topThree.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        데이터가 없어요.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {topThree.map((b, i) => {
        const isMine = b.id === currentBranchId;
        return (
          <li
            key={b.id}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
              isMine
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                : "border-[var(--color-border)] bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {MEDAL[i]}
              </span>
              <Link
                href={`/branches/${b.slug}`}
                className={`text-sm font-medium hover:underline ${
                  isMine ? "text-[var(--color-accent)]" : ""
                }`}
              >
                {b.name}
                {isMine ? " (우리 지점)" : ""}
              </Link>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums ${
                isMine ? "text-[var(--color-accent)]" : ""
              }`}
            >
              {b.monthlyScore}점
            </span>
          </li>
        );
      })}
    </ol>
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
