import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { getMediaRecord } from "@/lib/supabase/queries/media-records";
import { listEventsByRecord } from "@/lib/supabase/queries/distribution-events";
import { ConnectionError } from "@/components/ui/connection-error";
import { DistributionEventForm } from "@/components/media/distribution-event-form";
import { DistributionEventRow } from "@/components/media/distribution-event-row";
import { formatError } from "@/lib/format-error";
import { MEDIA_CATEGORY } from "@/types";
import type { Branch, MediaRecord, DistributionEvent } from "@/types";

type PageProps = {
  params: Promise<{ branchId: string; recordId: string }>;
};

export default async function DistributionTimelinePage({ params }: PageProps) {
  const { branchId, recordId } = await params;

  let branch: Branch | null = null;
  let record: MediaRecord | null = null;
  let events: DistributionEvent[] = [];
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (branch) {
      record = await getMediaRecord(recordId);
      if (record && record.branch_id === branch.id) {
        events = await listEventsByRecord(recordId);
      }
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

  if (!branch || !record) notFound();
  if (record.category !== MEDIA_CATEGORY.DISTRIBUTION) {
    // D-OOH 가 아닌데 이 페이지로 들어온 경우 — 매체 수정 페이지로 리다이렉트 안내
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          이 매체는 배포형(D-OOH) 이 아니에요. 일반 매체 수정 페이지로 이동하세요.
        </p>
        <Link
          href={`/branches/${branch.slug}/records/${record.id}/edit`}
          className="inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          매체 수정으로 이동
        </Link>
      </div>
    );
  }

  const designName = record.description?.trim() || record.media_type;
  const totalQty = events.reduce((s, e) => s + (e.quantity ?? 0), 0);
  const photo = record.photos?.[0];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <Link
          href={`/branches/${branch.slug}`}
          className="text-xs text-[var(--color-text-tertiary)] hover:underline"
        >
          ← 지점으로 돌아가기
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              D-OOH 디자인 · {record.media_type}
            </p>
            <h1 className="text-[20px] font-semibold">{designName}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              누적 {totalQty.toLocaleString("ko-KR")}장 · {events.length}회차
            </p>
          </div>
          <Link
            href={`/branches/${branch.slug}/records/${record.id}/edit`}
            className="shrink-0 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            디자인 수정
          </Link>
        </div>
      </header>

      {photo ? (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={designName}
            className="h-auto w-full object-contain"
          />
        </div>
      ) : null}

      <DistributionEventForm
        branchSlug={branch.slug}
        recordId={record.id}
        designName={designName}
      />

      <section className="space-y-2">
        <h2 className="text-[15px] font-medium">배포 이력</h2>
        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
            회차 없음. 위에서 첫 회차를 추가해주세요.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
            {events.map((ev) => (
              <DistributionEventRow
                key={ev.id}
                event={ev}
                branchSlug={branch.slug}
                recordId={record.id}
                designName={designName}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Header({ branchId }: { branchId: string }) {
  return (
    <header>
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        D-OOH 디자인
      </p>
      <h1 className="text-[20px] font-semibold">{branchId}</h1>
    </header>
  );
}
