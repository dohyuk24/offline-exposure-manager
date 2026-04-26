import Link from "next/link";

import type { BranchUnresolvedSummary } from "@/lib/supabase/queries/daily-tasks";
import type { Branch } from "@/types";

type Props = {
  totalCount: number;
  byBranch: BranchUnresolvedSummary[];
  /** 14개 활성 지점 전체 (미처리 0건 포함). 없으면 byBranch 만 노출. */
  allBranches?: Branch[];
};

type BranchCell = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

/**
 * 오피스용 일별 진행 현황 배너 (홈 상단).
 * 14개 지점 모두 노출 — 미처리 있는 지점은 주황 / 완료 지점은 ✓ 회색.
 * 미처리 있을 때만 컨테이너 노출 (다 끝났으면 표시 안 함).
 */
export function UnresolvedTasksBanner({
  totalCount,
  byBranch,
  allBranches,
}: Props) {
  if (totalCount === 0) return null;

  // 14개 지점 모두 cell 로 매핑 — allBranches 없으면 byBranch fallback.
  const countMap = new Map(byBranch.map((b) => [b.branch_id, b.count]));
  const baseList: BranchCell[] = allBranches?.length
    ? allBranches.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: countMap.get(b.id) ?? 0,
      }))
    : byBranch.map((b) => ({
        id: b.branch_id,
        name: b.branch_name,
        slug: b.branch_slug,
        count: b.count,
      }));

  // 정렬: 미처리 많은 순 → 완료 지점은 마지막에 가나다순
  const cells = baseList.sort((a, b) => {
    if (a.count > 0 && b.count === 0) return -1;
    if (a.count === 0 && b.count > 0) return 1;
    if (a.count !== b.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "ko");
  });

  const totalBranches = cells.length;
  const pendingBranches = cells.filter((c) => c.count > 0).length;

  return (
    <section className="rounded-lg border border-[#E0B884] bg-[#FFF6E8] px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-[#7A4F1E]">
          오늘 미처리 {totalCount}건
        </span>
        <span className="text-xs text-[#9F6B53]">
          {totalBranches}개 지점 중 {pendingBranches}개 진행 대기 ·{" "}
          {totalBranches - pendingBranches}개 완료
        </span>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {cells.map((c) => (
          <li key={c.id}>
            <Link
              href={`/branches/${c.slug}`}
              className={`flex items-center justify-between rounded-md border px-2 py-1.5 transition-colors ${
                c.count > 0
                  ? "border-[#E0B884] bg-white text-[#7A4F1E] hover:bg-[#FFEFD6]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]"
              }`}
            >
              <span className="truncate font-medium">{c.name}</span>
              <span
                className={`ml-1 shrink-0 tabular-nums ${
                  c.count > 0 ? "font-semibold" : ""
                }`}
              >
                {c.count > 0 ? `${c.count}건` : "✓"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
