import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import {
  getMediaRecord,
  listMediaHistory,
} from "@/lib/supabase/queries/media-records";
import { ConnectionError } from "@/components/ui/connection-error";
import { MediaHistoryTimeline } from "@/components/media/media-history-timeline";
import { formatError } from "@/lib/format-error";

import { EditForm } from "./edit-form";

type PageProps = {
  params: Promise<{ branchId: string; recordId: string }>;
};

export default async function EditMediaPage({ params }: PageProps) {
  const { branchId, recordId } = await params;

  try {
    const branch = await getBranchBySlug(branchId);
    if (!branch) notFound();

    const record = await getMediaRecord(recordId);
    if (!record || record.branch_id !== branch.id) notFound();

    const history = await listMediaHistory(record.location_key, record.id);

    return (
      <div className="mx-auto max-w-xl space-y-8">
        <header className="space-y-2">
          <Link
            href={`/branches/${branch.slug}`}
            className="text-xs text-[var(--color-text-tertiary)] hover:underline"
          >
            ← {branch.name}으로 돌아가기
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                매체 수정
              </p>
              <h1 className="text-[20px] font-semibold">
                {record.description ?? record.media_type}
              </h1>
              {history.length > 0 ? (
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                  같은 위치 기록 {history.length + 1}건째 (이전 {history.length}건)
                </p>
              ) : null}
            </div>
            <Link
              href={`/branches/${branch.slug}/new?from=${record.id}`}
              className="shrink-0 rounded-lg border border-[var(--color-accent)] px-3 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]"
            >
              + 이어서 기록
            </Link>
          </div>
        </header>

        <EditForm branch={branch} record={record} />

        <section className="space-y-3">
          <h2 className="text-[15px] font-medium">히스토리</h2>
          <MediaHistoryTimeline records={history} />
        </section>
      </div>
    );
  } catch (err) {
    const detail = formatError(err);
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-[20px] font-semibold">매체 수정</h1>
        <ConnectionError detail={detail} />
      </div>
    );
  }
}

