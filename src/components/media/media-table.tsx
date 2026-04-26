import Link from "next/link";

import type { MediaRecord } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = {
  records: MediaRecord[];
  branchSlug: string;
  historyCounts?: Map<string, number>;
  emptyMessage?: string;
};

const TODAY = new Date();

function periodLabel(start: string | null, end: string | null): {
  label: string;
  tone: "default" | "warn" | "danger";
} {
  if (!start && !end) return { label: "—", tone: "default" };
  if (start && end) {
    const endD = new Date(end);
    const days = Math.floor(
      (Date.UTC(endD.getFullYear(), endD.getMonth(), endD.getDate()) -
        Date.UTC(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())) /
        86_400_000
    );
    if (days >= 0 && days <= 3) {
      return { label: `${start} ~ ${end} (D-${days})`, tone: "danger" };
    }
    if (days >= 0 && days <= 7) {
      return { label: `${start} ~ ${end} (D-${days})`, tone: "warn" };
    }
    return { label: `${start} ~ ${end}`, tone: "default" };
  }
  return { label: end ?? start ?? "—", tone: "default" };
}

function costLabel(cost: number | null): string {
  if (cost == null || cost === 0) return "—";
  return cost.toLocaleString("ko-KR");
}

/**
 * 매체 테이블 뷰 (P / O / A 카테고리). MediaGrid 와 같은 데이터를 컴팩트한 행으로.
 */
export function MediaTable({
  records,
  branchSlug,
  historyCounts,
  emptyMessage = "등록된 매체가 없어요.",
}: Props) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[760px] table-fixed text-sm">
        <colgroup>
          <col style={{ width: 64 }} />
          <col />
          <col style={{ width: 88 }} />
          <col style={{ width: 96 }} />
          <col style={{ width: 220 }} />
          <col style={{ width: 120 }} />
        </colgroup>
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-3 py-2 font-medium">사진</th>
            <th className="px-3 py-2 font-medium">매체 / 위치</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">종류</th>
            <th className="px-3 py-2 font-medium">기간</th>
            <th className="px-3 py-2 text-right font-medium">비용</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {records.map((r) => {
            const photo = r.photos?.[0];
            const label = r.description?.trim() || r.media_type;
            const period = periodLabel(r.start_date, r.end_date);
            const history = historyCounts?.get(r.location_key) ?? 1;

            return (
              <tr
                key={r.id}
                className="hover:bg-[var(--color-bg-secondary)]"
              >
                <td className="px-3 py-2 align-middle">
                  <Link
                    href={`/branches/${branchSlug}/records/${r.id}/edit`}
                    className="block"
                  >
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
                    href={`/branches/${branchSlug}/records/${r.id}/edit`}
                    className="block truncate font-medium text-[var(--color-text-primary)] hover:underline"
                    title={label}
                  >
                    {label}
                  </Link>
                  {history > 1 ? (
                    <span className="mt-0.5 inline-block rounded-full bg-[var(--color-bg-secondary)] px-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                      히스토리 {history}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-middle">
                  <StatusBadge status={r.status} />
                </td>
                <td className="truncate px-3 py-2 align-middle text-[var(--color-text-secondary)]">
                  {r.media_type}
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-middle">
                  <span
                    className={
                      period.tone === "danger"
                        ? "font-medium text-[#C4332F]"
                        : period.tone === "warn"
                          ? "font-medium text-[#9F6B53]"
                          : "text-[var(--color-text-secondary)]"
                    }
                  >
                    {period.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right align-middle tabular-nums text-[var(--color-text-secondary)]">
                  {costLabel(r.cost)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
