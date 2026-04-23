import Link from "next/link";

import {
  listBranchSummaries,
  type BranchSummary,
} from "@/lib/supabase/queries/branches";
import { currentYearMonth } from "@/lib/date";
import { formatError } from "@/lib/format-error";
import { ConnectionError } from "@/components/ui/connection-error";

export default async function RankingPage() {
  const yearMonth = currentYearMonth();

  let summaries: BranchSummary[] = [];
  let connectionError: string | null = null;

  try {
    summaries = await listBranchSummaries(yearMonth);
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Header yearMonth={yearMonth} />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  const sorted = [...summaries].sort(
    (a, b) => b.monthlyScore - a.monthlyScore
  );
  const topThree = sorted.slice(0, 3);
  const restCount = Math.max(0, sorted.length - topThree.length);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Header yearMonth={yearMonth} />

      <Podium topThree={topThree} />

      {restCount > 0 ? (
        <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
          외 <strong>{restCount}개 지점</strong>의 전체 순위는 어드민에서 확인할 수 있어요.
          <br />
          <Link
            href="/admin"
            className="mt-1 inline-block text-[11px] text-[var(--color-text-secondary)] underline"
          >
            어드민 바로가기 →
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function Header({ yearMonth }: { yearMonth: string }) {
  return (
    <header className="text-center">
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        점수판
      </p>
      <h1 className="mt-1 text-[22px] font-semibold">{yearMonth} 랭킹</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        이번 달 상위 3개 지점을 공개합니다.
      </p>
    </header>
  );
}

function Podium({ topThree }: { topThree: BranchSummary[] }) {
  if (topThree.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
        데이터가 없어요.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {topThree.map((branch, index) => (
        <PodiumRow key={branch.id} branch={branch} rank={index + 1} />
      ))}
    </ol>
  );
}

const MEDAL: Record<number, { icon: string; label: string; ringColor: string }> = {
  1: { icon: "🥇", label: "1위", ringColor: "ring-[#EABC44]" },
  2: { icon: "🥈", label: "2위", ringColor: "ring-[#A8B0B6]" },
  3: { icon: "🥉", label: "3위", ringColor: "ring-[#B98652]" },
};

function PodiumRow({
  branch,
  rank,
}: {
  branch: BranchSummary;
  rank: number;
}) {
  const { icon, label, ringColor } = MEDAL[rank];
  return (
    <li
      className={`flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-4 ring-1 ${ringColor}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-3xl" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
            {label}
          </p>
          <Link
            href={`/branches/${branch.slug}`}
            className="truncate text-[16px] font-semibold hover:underline"
          >
            {branch.name}
          </Link>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            매체 {branch.mediaCount}개
            {branch.hasDiscovery ? " · ✨ 이번 달 발굴" : ""}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[22px] font-semibold tabular-nums">
          {branch.monthlyScore}
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">점</p>
      </div>
    </li>
  );
}
