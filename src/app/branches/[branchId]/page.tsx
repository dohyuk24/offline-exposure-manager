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
import {
  listDesignsForBranch,
  type DesignSummary,
} from "@/lib/supabase/queries/distribution-events";
import { currentYearMonth } from "@/lib/date";

import { MediaGrid } from "@/components/media/media-grid";
import { MediaTable } from "@/components/media/media-table";
import { DistributionCardGrid } from "@/components/media/distribution-card";
import { DistributionTable } from "@/components/media/distribution-table";
import { DailyTaskCard } from "@/components/daily/daily-task-card";
import {
  CategorySubTabs,
  parseCategoryTab,
} from "@/components/branch/category-sub-tabs";
import { ViewToggle, parseViewMode } from "@/components/branch/view-toggle";
import { ConnectionError } from "@/components/ui/connection-error";
import { MicroFeedback } from "@/components/ui/micro-feedback";
import { formatError } from "@/lib/format-error";
import {
  countByLocation,
  groupByLocationLatest,
} from "@/lib/media-grouping";

type BranchPageProps = {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ feedback?: string; cat?: string; view?: string }>;
};

type BranchData = {
  branch: Branch;
  records: MediaRecord[];
  designs: DesignSummary[];
  dailyTasks: DailyTaskWithRecord[];
  yearMonth: string;
  todayIso: string;
};

async function loadBranchData(slug: string): Promise<BranchData | null> {
  const branch = await getBranchBySlug(slug);
  if (!branch) return null;

  const yearMonth = currentYearMonth();
  const today = new Date();
  const [records, designs, dailyTasks] = await Promise.all([
    listMediaByBranch(branch.id),
    listDesignsForBranch(branch.id),
    getTasksForWidget(branch.id, today),
  ]);

  return {
    branch,
    records,
    designs,
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
  const { feedback, cat, view } = await searchParams;
  const activeCat = parseCategoryTab(cat);
  const activeView = parseViewMode(view);

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

  const { branch, records, designs, dailyTasks, yearMonth, todayIso } = data;

  // 같은 location_key 를 공유하는 월별 레코드는 최신 1건만 카드로 노출.
  // 히스토리는 카드 클릭 후 수정 페이지에서 확인.
  const latestByLocation = groupByLocationLatest(records);
  const historyCounts = countByLocation(records);

  const paidRecords = latestByLocation.filter(
    (r) => r.category === MEDIA_CATEGORY.PAID
  );
  const affiliatedRecords = latestByLocation.filter(
    (r) => r.category === MEDIA_CATEGORY.AFFILIATED
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-text-secondary)]">
        공식·배포형·제휴 매체를 등록·업데이트해요 · {yearMonth}
      </p>

      <DailyTaskCard
        branchSlug={branch.slug}
        tasks={dailyTasks}
        todayIso={todayIso}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <CategorySubTabs
          branchSlug={branch.slug}
          active={activeCat}
          counts={{
            [MEDIA_CATEGORY.PAID]: paidRecords.length,
            [MEDIA_CATEGORY.DISTRIBUTION]: designs.length,
            [MEDIA_CATEGORY.AFFILIATED]: affiliatedRecords.length,
          }}
        />
        <div className="pb-2">
          <ViewToggle
            basePath={`/branches/${branch.slug}`}
            preserveParams={{ cat: cat ?? undefined }}
            active={activeView}
          />
        </div>
      </div>

      <p className="text-[12px] text-[var(--color-text-tertiary)]">
        💡 기존 매체는 카드를 눌러 업데이트할 수 있어요.
      </p>

      {activeCat === "all" || activeCat === MEDIA_CATEGORY.PAID ? (
        <SectionWithCta
          title="공식매체"
          tooltip="버스 정류장·지하철역 등에 위치한 광고 지면, 또는 지점이 건물·상가 등과 공식 협의하여 확보한 지면"
          cta={{
            href: `/branches/${branch.slug}/discover?intent=paid`,
            label: "+ 등록",
          }}
        >
          {activeView === "table" ? (
            <MediaTable
              records={paidRecords}
              branchSlug={branch.slug}
              historyCounts={historyCounts}
              emptyMessage="등록된 공식매체가 없어요. 후보를 발견하면 + 등록 으로 추가하세요."
            />
          ) : (
            <MediaGrid
              records={paidRecords}
              branchSlug={branch.slug}
              historyCounts={historyCounts}
              emptyMessage="등록된 공식매체가 없어요. 후보를 발견하면 + 등록 으로 추가하세요."
            />
          )}
        </SectionWithCta>
      ) : null}

      {activeCat === "all" || activeCat === MEDIA_CATEGORY.DISTRIBUTION ? (
        <SectionWithCta
          title="배포형매체"
          tooltip="전단지, 족자, 게릴라 현수막 등의 지점 주도 액션"
          cta={{
            href: `/branches/${branch.slug}/distributions/new`,
            label: "+ 등록",
          }}
        >
          {activeView === "table" ? (
            <DistributionTable designs={designs} branchSlug={branch.slug} />
          ) : (
            <DistributionCardGrid designs={designs} branchSlug={branch.slug} />
          )}
        </SectionWithCta>
      ) : null}

      {activeCat === "all" || activeCat === MEDIA_CATEGORY.AFFILIATED ? (
        <SectionWithCta
          title="제휴매체"
          tooltip="비용 대신 혜택·관계·가치 교환으로 확보한 제휴 매체"
          cta={{
            href: `/branches/${branch.slug}/discover?intent=affiliated`,
            label: "+ 등록",
          }}
        >
          {activeView === "table" ? (
            <MediaTable
              records={affiliatedRecords}
              branchSlug={branch.slug}
              historyCounts={historyCounts}
              emptyMessage="등록된 제휴 매체가 없어요. 비용 대신 혜택·관계로 확보한 매체를 + 등록 으로 기록해주세요."
            />
          ) : (
            <MediaGrid
              records={affiliatedRecords}
              branchSlug={branch.slug}
              historyCounts={historyCounts}
              emptyMessage="등록된 제휴 매체가 없어요. 비용 대신 혜택·관계로 확보한 매체를 + 등록 으로 기록해주세요."
            />
          )}
        </SectionWithCta>
      ) : null}

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

function SectionWithCta({
  title,
  tooltip,
  cta,
  children,
}: {
  title: string;
  tooltip?: string;
  cta: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-medium">{title}</h2>
          {tooltip ? (
            <span
              className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              title={tooltip}
              aria-label={tooltip}
            >
              i
            </span>
          ) : null}
        </div>
        <Link
          href={cta.href}
          className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]"
        >
          {cta.label}
        </Link>
      </div>
      {children}
    </section>
  );
}
