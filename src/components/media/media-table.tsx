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

function dDayLabel(endDate: string | null): {
  label: string;
  tone: "default" | "warn" | "danger";
} | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const days = Math.floor(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())) /
      86_400_000
  );
  if (days < 0) return { label: `${endDate}`, tone: "default" };
  if (days === 0) return { label: "오늘 종료", tone: "danger" };
  if (days <= 3) return { label: `D-${days} (${endDate})`, tone: "danger" };
  if (days <= 7) return { label: `D-${days}`, tone: "warn" };
  return { label: endDate, tone: "default" };
}

function timeAgo(iso: string): string {
  const diff = TODAY.getTime() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return iso.slice(0, 10);
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
      <table className="w-full min-w-[720px] table-fixed text-sm">
        <colgroup>
          <col style={{ width: 80 }} />
          <col />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 100 }} />
        </colgroup>
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-left text-[11px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-3 py-2 font-medium">사진</th>
            <th className="px-3 py-2 font-medium">매체 / 위치</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">종류</th>
            <th className="px-3 py-2 font-medium">종료</th>
            <th className="px-3 py-2 text-right font-medium">업데이트</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {records.map((r) => {
            const photo = r.photos?.[0];
            const label = r.description?.trim() || r.media_type;
            const dday = dDayLabel(r.end_date);
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
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-14 items-center justify-center rounded bg-[var(--color-bg-secondary)] text-[10px] text-[var(--color-text-tertiary)]">
                        없음
                      </div>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-2 align-middle">
                  <Link
                    href={`/branches/${branchSlug}/records/${r.id}/edit`}
                    className="font-medium text-[var(--color-text-primary)] hover:underline"
                  >
                    {label}
                  </Link>
                  {history > 1 ? (
                    <span className="ml-2 rounded-full bg-[var(--color-bg-secondary)] px-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                      히스토리 {history}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-middle">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2 align-middle text-[var(--color-text-secondary)]">
                  {r.media_type}
                </td>
                <td className="px-3 py-2 align-middle">
                  {dday ? (
                    <span
                      className={
                        dday.tone === "danger"
                          ? "font-medium text-[#C4332F]"
                          : dday.tone === "warn"
                            ? "font-medium text-[#9F6B53]"
                            : "text-[var(--color-text-tertiary)]"
                      }
                    >
                      {dday.label}
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-tertiary)]">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right align-middle text-[var(--color-text-tertiary)]">
                  {timeAgo(r.updated_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
