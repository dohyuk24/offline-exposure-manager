import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { ConnectionError } from "@/components/ui/connection-error";
import { DiscoverForm } from "@/components/media/discover-form";
import { formatError } from "@/lib/format-error";
import type { Branch } from "@/types";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function DiscoverPage({ params }: PageProps) {
  const { branchId } = await params;

  let branch: Branch | null = null;
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
  } catch (err) {
    connectionError = formatError(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Header title={branchId} />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Header title={branch.name} slug={branch.slug} />
      <DiscoverForm branch={branch} />
    </div>
  );
}

function Header({ title, slug }: { title: string; slug?: string }) {
  return (
    <header className="space-y-2">
      <Link
        href={slug ? `/branches/${slug}` : "/branches"}
        className="text-xs text-[var(--color-text-tertiary)] hover:underline"
      >
        ← 지점으로 돌아가기
      </Link>
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          신규 매체 발굴
        </p>
        <h1 className="text-[20px] font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          현장에서 바로 기록 — 사진 + 위치만 있으면 OK
        </p>
      </div>
    </header>
  );
}
