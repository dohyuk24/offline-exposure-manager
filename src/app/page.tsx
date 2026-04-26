import Link from "next/link";

import {
  listBranchSummaries,
  type BranchSummary,
} from "@/lib/supabase/queries/branches";
import {
  getDiscoveryFeed,
  type DiscoveryFeedItem,
} from "@/lib/supabase/queries/media-records";
import {
  getUnresolvedTasksByBranch,
  type BranchUnresolvedSummary,
} from "@/lib/supabase/queries/daily-tasks";
import { currentYearMonth, timeAgo } from "@/lib/date";
import { formatError } from "@/lib/format-error";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { ConnectionError } from "@/components/ui/connection-error";
import { UnresolvedTasksBanner } from "@/components/daily/unresolved-tasks-banner";

export default async function HomePage() {
  const yearMonth = currentYearMonth();

  let summaries: BranchSummary[] = [];
  let feedItems: DiscoveryFeedItem[] = [];
  let discoveryCount = 0;
  let unresolvedTotal = 0;
  let unresolvedByBranch: BranchUnresolvedSummary[] = [];
  let connectionError: string | null = null;

  try {
    const [s, f, u] = await Promise.all([
      listBranchSummaries(yearMonth),
      getDiscoveryFeed(yearMonth, 5),
      getUnresolvedTasksByBranch(),
    ]);
    summaries = sortBranchesByDisplayOrder(s);
    feedItems = f.items;
    discoveryCount = f.totalCount;
    unresolvedTotal = u.totalCount;
    unresolvedByBranch = u.byBranch;
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

  const totals = aggregate(summaries);
  const topThree = [...summaries]
    .sort((a, b) => b.monthlyScore - a.monthlyScore)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <Header yearMonth={yearMonth} />

      <UnresolvedTasksBanner
        totalCount={unresolvedTotal}
        byBranch={unresolvedByBranch}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label="활성 매체"
          value={`${totals.totalMedia}개`}
          sub={`${summaries.length}개 지점`}
          tone="accent"
        />
        <StatCard
          label="이번 달 예산 집행"
          value={`${totals.budgetPercent}%`}
          sub={`${formatKrw(totals.totalUsed)} / ${formatKrw(
            totals.totalBudget
          )}`}
          tone={
            totals.budgetPercent >= 100
              ? "danger"
              : totals.budgetPercent >= 80
                ? "warn"
                : "default"
          }
        />
        <StatCard
          label="신규 발굴"
          value={`${discoveryCount}건`}
          sub="이번 달 누적"
        />
        <StatCard
          label="미업데이트 지점"
          value={`${totals.dormantCount}개`}
          sub="이번 달 점수 0"
          tone={totals.dormantCount > 0 ? "warn" : "default"}
        />
      </section>

      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <Section title="최근 신규 발굴">
          <DiscoveryList items={feedItems} />
        </Section>

        <Section title="이번 달 Top 3">
          <TopThree topThree={topThree} />
        </Section>
      </div>

      <Section title="지점 현황">
        <BranchGrid summaries={summaries} />
      </Section>
    </div>
  );
}

function Header({ yearMonth }: { yearMonth: string }) {
  return (
    <header>
      <p className="text-sm text-[var(--color-text-secondary)]">
        전 지점 매체·예산·점수 요약 · {yearMonth}
      </p>
    </header>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn" | "danger" | "accent";
}) {
  // 좌측 컬러 보더 + 카드 본문 흰색. tone 별 의미 컬러.
  const accent =
    tone === "danger"
      ? { border: "#dc2626", value: "text-[#dc2626]" }
      : tone === "warn"
        ? { border: "#d97706", value: "text-[#d97706]" }
        : tone === "accent"
          ? { border: "#5b5fd6", value: "text-[var(--color-accent)]" }
          : { border: "#10b981", value: "text-[var(--color-text-primary)]" };
  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-white p-5"
      style={{ borderLeft: `4px solid ${accent.border}` }}
    >
      <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className={`mt-2 text-[28px] font-bold leading-none tabular-nums ${accent.value}`}>
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function DiscoveryList({ items }: { items: DiscoveryFeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        이번 달 아직 신규 발굴이 없어요.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.record_id}
          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate">
              <Link
                href={`/branches/${item.branch_slug}`}
                className="font-medium hover:underline"
              >
                {item.branch_name}
              </Link>
              <span className="mx-1 text-[var(--color-text-tertiary)]">·</span>
              <span className="text-[var(--color-text-secondary)]">
                {item.media_type}
              </span>
            </p>
            {item.description ? (
              <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                {item.description}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-[var(--color-text-tertiary)]">
            {timeAgo(item.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TopThree({ topThree }: { topThree: BranchSummary[] }) {
  if (topThree.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        데이터가 없어요.
      </p>
    );
  }
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <ol className="space-y-2">
      {topThree.map((b, i) => (
        <li
          key={b.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {medal[i]}
            </span>
            <Link
              href={`/branches/${b.slug}`}
              className="text-sm font-medium hover:underline"
            >
              {b.name}
            </Link>
          </div>
          <span className="text-sm font-semibold">{b.monthlyScore}점</span>
        </li>
      ))}
    </ol>
  );
}

function BranchGrid({ summaries }: { summaries: BranchSummary[] }) {
  if (summaries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        지점이 없어요.
      </p>
    );
  }
  return (
    <div
      className="grid gap-3 md:gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
    >
      {summaries.map((b) => (
        <Link
          key={b.id}
          href={`/branches/${b.slug}`}
          className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">{b.name}</p>
            {b.monthlyScore === 0 ? (
              <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                미업데이트
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-tertiary)]">
            <span>매체 {b.mediaCount}</span>
            <span>점수 {b.monthlyScore}</span>
            <span>
              예산{" "}
              {b.budget_monthly > 0
                ? Math.round((b.monthlyBudgetUsed / b.budget_monthly) * 100)
                : 0}
              %
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function aggregate(summaries: BranchSummary[]) {
  const totalMedia = summaries.reduce((a, b) => a + b.mediaCount, 0);
  const totalBudget = summaries.reduce((a, b) => a + b.budget_monthly, 0);
  const totalUsed = summaries.reduce((a, b) => a + b.monthlyBudgetUsed, 0);
  const dormantCount = summaries.filter((b) => b.monthlyScore === 0).length;
  const budgetPercent =
    totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  return { totalMedia, totalBudget, totalUsed, dormantCount, budgetPercent };
}

function formatKrw(value: number): string {
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString("ko-KR")}만원`;
  return `${value.toLocaleString("ko-KR")}원`;
}
