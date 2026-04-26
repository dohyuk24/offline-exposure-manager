import Link from "next/link";

import type { BranchUnresolvedSummary } from "@/lib/supabase/queries/daily-tasks";

type Props = {
  totalCount: number;
  byBranch: BranchUnresolvedSummary[];
  /** 상위 N 개만 본문에 노출 (기본 5) */
  topN?: number;
};

/**
 * 오피스용 미처리 task 요약 배너 (홈 상단).
 * count 0 이면 렌더하지 않음.
 */
export function UnresolvedTasksBanner({ totalCount, byBranch, topN = 5 }: Props) {
  if (totalCount === 0 || byBranch.length === 0) return null;

  const top = byBranch.slice(0, topN);
  const rest = byBranch.length - top.length;

  return (
    <section className="rounded-lg border border-[#E0B884] bg-[#FFF6E8] px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-[#7A4F1E]">
          오늘 미처리 {totalCount}건
        </span>
        <span className="text-xs text-[#9F6B53]">
          {byBranch.length}개 지점에서 처리 대기 중
        </span>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {top.map((b) => (
          <li key={b.branch_id}>
            <Link
              href={`/branches/${b.branch_slug}`}
              className="text-[#7A4F1E] hover:underline"
            >
              <span className="font-medium">{b.branch_name}</span>{" "}
              <span className="text-[#9F6B53]">{b.count}</span>
            </Link>
          </li>
        ))}
        {rest > 0 ? (
          <li className="text-[#9F6B53]">외 {rest}개 지점</li>
        ) : null}
      </ul>
    </section>
  );
}
