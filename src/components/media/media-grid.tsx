import type { MediaRecord } from "@/types";
import { MediaCard } from "@/components/media/media-card";

type MediaGridProps = {
  records: MediaRecord[];
  emptyMessage?: string;
};

/**
 * 매체 카드 그리드 레이아웃 — 모바일 1열, 태블릿 2열, 데스크톱 3열.
 * DESIGN.md 섹션 2.3 기준.
 */
export function MediaGrid({
  records,
  emptyMessage = "등록된 매체가 없어요.",
}: MediaGridProps) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className="grid gap-4 md:gap-5"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      }}
    >
      {records.map((record) => (
        <MediaCard key={record.id} record={record} />
      ))}
    </div>
  );
}
