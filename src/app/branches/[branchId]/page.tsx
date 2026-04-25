import Link from "next/link";
import { notFound } from "next/navigation";

import type { Branch, MediaRecord } from "@/types";
import { MEDIA_CATEGORY } from "@/types";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { listMediaByBranch } from "@/lib/supabase/queries/media-records";
import {
  getTasksForWidget,
  type DailyTaskWithRecord,
} from "@/lib/supabase/queries/daily-tasks";
import { currentYearMonth } from "@/lib/date";

import { MediaGrid } from "@/components/media/media-grid";
import { DailyTaskCard } from "@/components/daily/daily-task-card";
import { BranchTabs } from "@/components/branch/branch-tabs";
import { ConnectionError } from "@/components/ui/connection-error";
import { MicroFeedback } from "@/components/ui/micro-feedback";
import { formatError } from "@/lib/format-error";
import {
  countByLocation,
  groupByLocationLatest,
} from "@/lib/media-grouping";

type BranchPageProps = {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ feedback?: string }>;
};

type BranchData = {
  branch: Branch;
  records: MediaRecord[];
  dailyTasks: DailyTaskWithRecord[];
  yearMonth: string;
  todayIso: string;
};

async function loadBranchData(slug: string): Promise<BranchData | null> {
  const branch = await getBranchBySlug(slug);
  if (!branch) return null;

  const yearMonth = currentYearMonth();
  const today = new Date();
  const [records, dailyTasks] = await Promise.all([
    listMediaByBranch(branch.id),
    getTasksForWidget(branch.id, today),
  ]);

  return {
    branch,
    records,
    dailyTasks,
    yearMonth,
    todayIso: today.toISOString(),
  };
}

export default async function BranchPage({
  params,
  searchParams,
}: BranchPageProps) {
  const { branchId } = await params;
  const { feedback } = await searchParams;

  let data: BranchData | null = null;
  let connectionError: string | null = null;

  try {
    data = await loadBranchData(branchId);
  } catch (err) {
    connectionError = formatError(err);
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

  const { branch, records, dailyTasks, yearMonth, todayIso } = data;

  // 같은 location_key 를 공유하는 월별 레코드는 최신 1건만 카드로 노출.
  // 히스토리는 카드 클릭 후 수정 페이지에서 확인.
  const latestByLocation = groupByLocationLatest(records);
  const historyCounts = countByLocation(records);

  const officialRecords = latestByLocation.filter(
    (r) => r.category === MEDIA_CATEGORY.OFFICIAL
  );
  const ownedAndUnofficialRecords = latestByLocation.filter(
    (r) => r.category !== MEDIA_CATEGORY.OFFICIAL
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            관리
          </p>
          <h1 className="text-[20px] font-semibold">{branch.name}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {yearMonth} 기준 매체 관리
          </p>
        </div>
        <Link
          href={`/branches/${branch.slug}/discover`}
          className="shrink-0 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          ✨ 신규 매체 발굴
        </Link>
      </header>

      <BranchTabs branchSlug={branch.slug} active="manage" />

      <DailyTaskCard
        branchSlug={branch.slug}
        tasks={dailyTasks}
        todayIso={todayIso}
      />

      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        💡 기존 매체는 카드를 눌러 업데이트할 수 있어요.
      </p>

      <Section title="공식매체 (OOH)">
        <MediaGrid
          records={officialRecords}
          branchSlug={branch.slug}
          historyCounts={historyCounts}
          emptyMessage="등록된 공식매체가 없어요. 상권에서 후보를 발견하면 제안해주세요."
        />
      </Section>

      <Section title="비공식매체 · 자체보유">
        <MediaGrid
          records={ownedAndUnofficialRecords}
          branchSlug={branch.slug}
          historyCounts={historyCounts}
          emptyMessage="등록된 매체가 없어요. 새 매체를 기록해볼까요?"
        />
      </Section>

      {feedback ? <MicroFeedback key={feedback} message={feedback} /> : null}
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
