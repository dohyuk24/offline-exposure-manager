import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { ConnectionError } from "@/components/ui/connection-error";
import type { Branch } from "@/types";

import { RegisterForm } from "./register-form";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function RegisterMediaPage({ params }: PageProps) {
  const { branchId } = await params;

  let branch: Branch | null = null;
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
  } catch (err) {
    connectionError = err instanceof Error ? err.message : String(err);
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Header branchId={branchId} />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Header branchId={branch.name} slug={branch.slug} />
      <RegisterForm branch={branch} />
    </div>
  );
}

function Header({ branchId, slug }: { branchId: string; slug?: string }) {
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
          매체 등록
        </p>
        <h1 className="text-[20px] font-semibold">{branchId}</h1>
      </div>
    </header>
  );
}
