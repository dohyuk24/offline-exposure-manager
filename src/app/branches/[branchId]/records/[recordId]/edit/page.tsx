import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { getMediaRecord } from "@/lib/supabase/queries/media-records";
import { ConnectionError } from "@/components/ui/connection-error";

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

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <Link
            href={`/branches/${branch.slug}`}
            className="text-xs text-[var(--color-text-tertiary)] hover:underline"
          >
            ← {branch.name}으로 돌아가기
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              매체 수정
            </p>
            <h1 className="text-[20px] font-semibold">
              {record.description ?? record.media_type}
            </h1>
          </div>
        </header>

        <EditForm branch={branch} record={record} />
      </div>
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-[20px] font-semibold">매체 수정</h1>
        <ConnectionError detail={detail} />
      </div>
    );
  }
}
