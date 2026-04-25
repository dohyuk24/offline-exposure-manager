import Link from "next/link";

import type { DesignSummary } from "@/lib/supabase/queries/distribution-events";

type Props = {
  designs: DesignSummary[];
  branchSlug: string;
  emptyMessage?: string;
};

/** D-OOH 디자인 카드 그리드. 카드 클릭 → 회차 타임라인. */
export function DistributionCardGrid({ designs, branchSlug, emptyMessage }: Props) {
  if (designs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        {emptyMessage ??
          "등록된 디자인이 없어요. + 배포 기록 으로 첫 디자인을 등록해보세요."}
      </div>
    );
  }

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
    >
      {designs.map((d) => (
        <DesignCard key={d.record.id} branchSlug={branchSlug} design={d} />
      ))}
    </div>
  );
}

function DesignCard({
  branchSlug,
  design,
}: {
  branchSlug: string;
  design: DesignSummary;
}) {
  const { record, totalQuantity, eventCount, lastDistributedOn } = design;
  const photo = record.photos?.[0];
  const designName = record.description?.trim() || record.media_type;

  return (
    <Link
      href={`/branches/${branchSlug}/records/${record.id}/distributions`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-white transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[4/3] w-full bg-[var(--color-bg-secondary)]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={designName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-tertiary)]">
            (디자인 사진 없음)
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-[var(--cat-distribution-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--cat-distribution-fg)]">
          {record.media_type}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">
          {designName}
        </p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          누적 {totalQuantity.toLocaleString("ko-KR")}장 · {eventCount}회차
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          {lastDistributedOn
            ? `마지막 ${lastDistributedOn}`
            : "회차 없음"}
        </p>
      </div>
    </Link>
  );
}
