import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { ConnectionError } from "@/components/ui/connection-error";
import { DistributionDiscoverForm } from "@/components/media/distribution-discover-form";
import { formatError } from "@/lib/format-error";
import type { Branch } from "@/types";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function NewDistributionPage({ params }: PageProps) {
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
      <Header title={branch.name} />
      <DistributionDiscoverForm branch={branch} />
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header>
      <h1 className="text-[20px] font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        새 디자인을 등록하면서 첫 회차도 함께 기록해요. 같은 디자인을 재배포하면
        나중에 회차만 추가하면 돼요.
      </p>
    </header>
  );
}
