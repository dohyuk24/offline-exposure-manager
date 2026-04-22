import Link from "next/link";
import { notFound } from "next/navigation";

import { getBranchBySlug } from "@/lib/supabase/queries/branches";
import { getMediaRecord } from "@/lib/supabase/queries/media-records";
import { ConnectionError } from "@/components/ui/connection-error";
import type { Branch } from "@/types";
import type { MediaFormValues } from "@/components/media/media-form";

import { RegisterForm } from "./register-form";

type PageProps = {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function RegisterMediaPage({
  params,
  searchParams,
}: PageProps) {
  const { branchId } = await params;
  const { from } = await searchParams;

  let branch: Branch | null = null;
  let sourceRecord: Awaited<ReturnType<typeof getMediaRecord>> = null;
  let connectionError: string | null = null;

  try {
    branch = await getBranchBySlug(branchId);
    if (from && branch) {
      sourceRecord = await getMediaRecord(from);
    }
  } catch (err) {
    connectionError = err instanceof Error ? err.message : String(err);
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

  // 히스토리 이어가기 조건: from 지정 + 같은 지점 소속 레코드
  const isContinuation =
    !!sourceRecord && sourceRecord.branch_id === branch.id;

  const initialValues: Partial<MediaFormValues> | undefined = isContinuation
    ? {
        category: sourceRecord!.category,
        media_type: sourceRecord!.media_type,
        status: sourceRecord!.status,
        description: sourceRecord!.description ?? "",
        size: sourceRecord!.size ?? "",
        content_type: sourceRecord!.content_type ?? "",
        // 새 기간은 사용자가 다시 입력
        start_date: "",
        end_date: "",
        cost:
          typeof sourceRecord!.cost === "number" && sourceRecord!.cost > 0
            ? String(sourceRecord!.cost)
            : "",
        barter_condition: sourceRecord!.barter_condition ?? "",
        is_new_discovery: false,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Header
        title={branch.name}
        slug={branch.slug}
        subtitle={isContinuation ? "이어서 기록" : "매체 등록"}
      />

      {isContinuation ? (
        <div className="rounded-lg border border-[var(--discovery-border)] bg-[var(--discovery-bg)] px-4 py-3 text-sm text-[var(--discovery-fg)]">
          <strong className="font-semibold">
            {sourceRecord!.description ?? sourceRecord!.media_type}
          </strong>{" "}
          위치의 히스토리에 이어서 기록해요. 기존 내용이 채워져 있고, 기간은 새로
          입력하세요.
        </div>
      ) : null}

      <RegisterForm
        branch={branch}
        initialValues={initialValues}
        locationKey={isContinuation ? sourceRecord!.location_key : undefined}
      />
    </div>
  );
}

function Header({
  title,
  slug,
  subtitle = "매체 등록",
}: {
  title: string;
  slug?: string;
  subtitle?: string;
}) {
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
          {subtitle}
        </p>
        <h1 className="text-[20px] font-semibold">{title}</h1>
      </div>
    </header>
  );
}
