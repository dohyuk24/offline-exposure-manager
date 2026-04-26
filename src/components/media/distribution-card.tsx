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
  const {
    record,
    lastDistributedOn,
    lastEventQuantity,
    lastEventLocation,
    lastEventFlyerTitle,
  } = design;
  const photo = record.photos?.[0];
  const lastLoc = lastEventLocation?.trim() ?? "";
  const lastFlyer = lastEventFlyerTitle?.trim() ?? "";

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
            alt={record.media_type}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-tertiary)]">
            (디자인 사진 없음)
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {record.media_type}
        </p>
        <div className="space-y-0.5 text-[11px] text-[var(--color-text-tertiary)]">
          <p>
            <span className="text-[var(--color-text-secondary)]">최근 배포</span>{" "}
            {lastDistributedOn ?? "—"}
            {lastEventQuantity != null
              ? ` · ${lastEventQuantity.toLocaleString("ko-KR")}장`
              : ""}
          </p>
          {lastLoc ? (
            <p className="line-clamp-1">
              <span className="text-[var(--color-text-secondary)]">배포지</span>{" "}
              {lastLoc}
            </p>
          ) : null}
          {lastFlyer ? (
            <p className="line-clamp-1">
              <span className="text-[var(--color-text-secondary)]">전단</span>{" "}
              {lastFlyer}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
