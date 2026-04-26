import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { ConnectionError } from "@/components/ui/connection-error";
import {
  DiscoverForm,
  type DiscoverIntent,
} from "@/components/media/discover-form";
import { formatError } from "@/lib/format-error";
import type { Branch } from "@/types";

type PageProps = {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ intent?: string }>;
};

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const { branchId } = await params;
  const { intent: intentRaw } = await searchParams;
  const intent: DiscoverIntent =
    intentRaw === "affiliated" ? "affiliated" : "paid";

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
        <Header title={branchId} intent={intent} />
        <ConnectionError detail={connectionError} />
      </div>
    );
  }

  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Header title={branch.name} slug={branch.slug} intent={intent} />
      <DiscoverForm branch={branch} intent={intent} />
    </div>
  );
}

function Header({
  title,
  slug,
  intent,
}: {
  title: string;
  slug?: string;
  intent: DiscoverIntent;
}) {
  const labelTop =
    intent === "affiliated" ? "제휴매체 등록" : "공식매체 등록";
  const subtitle =
    intent === "affiliated"
      ? "비용 대신 혜택·관계로 확보한 외부 매체. 주고받은 혜택을 같이 적어주세요."
      : "버스 정류장·지하철역·건물 협의 등 공식 확보한 지면을 등록해요.";

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
          {labelTop}
        </p>
        <h1 className="text-[20px] font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {subtitle}
        </p>
      </div>
    </header>
  );
}
