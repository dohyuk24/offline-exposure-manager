import Link from "next/link";

import type { DesignSummary } from "@/lib/supabase/queries/distribution-events";

type Props = {
  designs: DesignSummary[];
  branchSlug: string;
  emptyMessage?: string;
};

/** D-OOH 디자인 테이블 뷰 — DistributionCardGrid 와 같은 데이터의 컴팩트 행 형태. */
export function DistributionTable({
  designs,
  branchSlug,
  emptyMessage,
}: Props) {
  if (designs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        {emptyMessage ??
          "등록된 디자인이 없어요. + 등록 으로 첫 디자인을 등록해보세요."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[720px] table-fixed text-sm">
        <colgroup>
          <col style={{ width: 64 }} />
          <col style={{ width: 120 }} />
          <col />
          <col style={{ width: 130 }} />
          <col style={{ width: 140 }} />
        </colgroup>
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-3 py-2 font-medium">디자인</th>
            <th className="px-3 py-2 font-medium">종류</th>
            <th className="px-3 py-2 font-medium">주제</th>
            <th className="px-3 py-2 text-right font-medium">마지막 배포</th>
            <th className="px-3 py-2 text-right font-medium">배포수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {designs.map((d) => {
            const photo = d.record.photos?.[0];
            const subject = d.record.description?.trim() ?? "";
            const href = `/branches/${branchSlug}/records/${d.record.id}/distributions`;
            return (
              <tr
                key={d.record.id}
                className="hover:bg-[var(--color-bg-secondary)]"
              >
                <td className="px-3 py-2 align-middle">
                  <Link href={href} className="block">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-10 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-12 items-center justify-center rounded bg-[var(--color-bg-secondary)] text-[10px] text-[var(--color-text-tertiary)]">
                        없음
                      </div>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-2 align-middle">
                  <Link
                    href={href}
                    className="block truncate font-medium text-[var(--color-text-primary)] hover:underline"
                    title={d.record.media_type}
                  >
                    {d.record.media_type}
                  </Link>
                </td>
                <td className="truncate px-3 py-2 align-middle text-[var(--color-text-secondary)]" title={subject || "—"}>
                  {subject || "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right align-middle text-[var(--color-text-tertiary)]">
                  {d.lastDistributedOn ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right align-middle text-[var(--color-text-primary)]">
                  {d.totalQuantity > 0 ? (
                    <>
                      <div className="tabular-nums font-medium">
                        {d.totalQuantity.toLocaleString("ko-KR")}장
                      </div>
                      <div className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                        {d.eventCount}회
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
