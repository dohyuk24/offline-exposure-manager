import type { MediaRecord } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";

type MediaHistoryTimelineProps = {
  records: MediaRecord[];
};

/**
 * 같은 위치(location_key)의 과거 레코드 타임라인.
 * 최신순으로 정렬된 records 를 받아 간단한 수직 리스트로 렌더.
 */
export function MediaHistoryTimeline({ records }: MediaHistoryTimelineProps) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        이 위치의 과거 기록이 아직 없어요.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {records.map((record) => (
        <li
          key={record.id}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status} />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {formatDate(record.created_at)}
              </span>
            </div>
            {record.photos?.length > 0 ? (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                📷 {record.photos.length}장
              </span>
            ) : null}
          </div>
          {record.description ? (
            <p className="text-sm text-[var(--color-text-primary)]">
              {record.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {formatPeriod(record.start_date, record.end_date)}
            {typeof record.cost === "number" && record.cost > 0
              ? ` · 💰 ${Math.round(record.cost / 10000)}만원`
              : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "기간 미정";
  if (start && end) return `${start} ~ ${end}`;
  return start ?? end ?? "";
}
