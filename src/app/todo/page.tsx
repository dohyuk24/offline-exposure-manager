import Link from "next/link";

import { listActiveBranches } from "@/lib/supabase/queries/branches";
import {
  getTodoOverview,
  type BranchTodoOverview,
} from "@/lib/supabase/queries/daily-tasks";
import { ConnectionError } from "@/components/ui/connection-error";
import { formatError } from "@/lib/format-error";
import { OFFICE_BRANCH_SLUG, sortBranchesByDisplayOrder } from "@/lib/branch-order";
import type { Branch } from "@/types";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금"];

export default async function TodoPage() {
  let branches: Branch[] = [];
  let overview = new Map<string, BranchTodoOverview>();
  let connectionError: string | null = null;
  const today = new Date();

  try {
    const all = await listActiveBranches();
    branches = sortBranchesByDisplayOrder(all).filter(
      (b) => b.slug !== OFFICE_BRANCH_SLUG
    );
    overview = await getTodoOverview(today);
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Header />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  // 전체 합계 (이번 주)
  let totalThisWeekDone = 0;
  let totalThisWeekTotal = 0;
  let totalOpen = 0;
  let totalExpired = 0;
  for (const o of overview.values()) {
    totalThisWeekDone += o.thisWeek.done;
    totalThisWeekTotal += o.thisWeek.total;
    totalOpen += o.last30.open;
    totalExpired += o.last30.expired;
  }
  const overallPct =
    totalThisWeekTotal > 0
      ? Math.round((totalThisWeekDone / totalThisWeekTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Header />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          label="이번 주 처리율"
          value={`${overallPct}%`}
          sub={`${totalThisWeekDone} / ${totalThisWeekTotal}건`}
          tone="accent"
        />
        <SummaryCard
          label="현재 미처리"
          value={`${totalOpen}건`}
          sub="모든 지점 합계 (지난 30일 중)"
          tone="warn"
        />
        <SummaryCard
          label="만료 (지난 30일)"
          value={`${totalExpired}건`}
          sub="7일 안에 처리 안 된 task"
          tone="danger"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">지점별 처리 현황</h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const o = overview.get(branch.id);
            return (
              <li key={branch.id}>
                <BranchCard branch={branch} overview={o} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Header() {
  return (
    <header className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        to-do 관리
      </p>
      <h1 className="text-[22px] font-semibold">지점별 데일리 task 처리 현황</h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        이번 주 진행률 · 월~금 추세 · 30일 누적
      </p>
    </header>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "accent" | "warn" | "danger";
}) {
  const accent =
    tone === "danger"
      ? "#C4332F"
      : tone === "warn"
        ? "#D97706"
        : "var(--color-accent)";
  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-white p-4"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs text-[var(--color-text-tertiary)]">{label}</p>
      <p
        className="mt-1 text-[26px] font-semibold leading-none tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{sub}</p>
    </div>
  );
}

function BranchCard({
  branch,
  overview,
}: {
  branch: Branch;
  overview: BranchTodoOverview | undefined;
}) {
  const thisWeek = overview?.thisWeek ?? { done: 0, total: 0 };
  const last30 = overview?.last30 ?? { done: 0, open: 0, expired: 0, total: 0 };
  const trend = overview?.trendWeekdays ?? [];
  const weekPct =
    thisWeek.total > 0
      ? Math.round((thisWeek.done / thisWeek.total) * 100)
      : null;

  const weekTone =
    weekPct === null
      ? "muted"
      : weekPct >= 80
        ? "ok"
        : weekPct >= 50
          ? "warn"
          : "bad";
  const weekColor =
    weekTone === "ok"
      ? "#10b981"
      : weekTone === "warn"
        ? "#D97706"
        : weekTone === "bad"
          ? "#C4332F"
          : "var(--color-text-tertiary)";

  return (
    <Link
      href={`/branches/${branch.slug}`}
      className="block rounded-lg border border-[var(--color-border)] bg-white p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {branch.name}
        </h3>
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: weekColor }}
        >
          {weekPct === null ? "—" : `${weekPct}%`}
        </span>
      </div>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        이번 주 {thisWeek.done} / {thisWeek.total}건 처리
      </p>

      <div className="mt-3">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
          이번 주 월~금
        </p>
        <div className="flex items-end gap-1">
          {trend.map((cell, idx) => {
            const pct =
              cell.total === 0 ? 0 : (cell.done / cell.total) * 100;
            const cellColor =
              cell.total === 0
                ? "#E5E7EB"
                : pct >= 80
                  ? "#10b981"
                  : pct >= 50
                    ? "#D97706"
                    : "#C4332F";
            // 서버에서 월~금 순서로 5개 날짜를 만들어서 보내주므로,
            // 위치 기반(idx) 으로 라벨링 — 타임존 영향 안 받음.
            const dayLabel = WEEKDAY_LABELS[idx];
            return (
              <div
                key={cell.date}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${cell.date} · ${cell.done}/${cell.total}`}
              >
                <div className="flex h-8 w-full items-end overflow-hidden rounded-sm bg-[var(--color-bg-secondary)]">
                  <div
                    className="w-full transition-all"
                    style={{
                      height: cell.total === 0 ? "8%" : `${Math.max(pct, 8)}%`,
                      backgroundColor: cellColor,
                    }}
                  />
                </div>
                <span className="text-[9px] text-[var(--color-text-tertiary)]">
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-3 text-[11px]">
        <Stat label="처리" value={last30.done} tone="ok" />
        <Stat label="대기" value={last30.open} tone="warn" />
        <Stat label="만료" value={last30.expired} tone="bad" />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok" ? "#10b981" : tone === "warn" ? "#D97706" : "#C4332F";
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[14px] font-semibold tabular-nums"
        style={{ color: value === 0 ? "var(--color-text-tertiary)" : color }}
      >
        {value}
      </span>
      <span className="text-[10px] text-[var(--color-text-tertiary)]">
        {label}
      </span>
    </div>
  );
}
