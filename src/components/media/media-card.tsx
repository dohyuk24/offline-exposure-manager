import Link from "next/link";

import type { MediaRecord, MediaType } from "@/types";
import { CategoryBadge, StatusBadge } from "@/components/ui/status-badge";

const FALLBACK_THUMB: Record<MediaType, { icon: string; bg: string }> = {
  현수막: { icon: "🪧", bg: "#F0F0EF" },
  족자: { icon: "📜", bg: "#F0F0EF" },
  전단지: { icon: "📄", bg: "#F0F0EF" },
  OOH: { icon: "🏙️", bg: "#EBF3FB" },
  바터제휴배너: { icon: "🤝", bg: "#EDFAF4" },
  기타: { icon: "📍", bg: "#F0F0EF" },
};

type MediaCardProps = {
  record: MediaRecord;
  /** 클릭 시 이동할 경로. 없으면 일반 article 로 렌더. */
  href?: string;
};

/**
 * 매체 갤러리 카드 — DESIGN.md 섹션 4.
 * href 가 있으면 Link 로 감싸서 클릭 네비게이션.
 */
export function MediaCard({ record, href }: MediaCardProps) {
  const hasPhoto = record.photos?.length > 0;
  const fallback = FALLBACK_THUMB[record.media_type];
  const dateRange = formatDateRange(record.start_date, record.end_date);

  const cardClass = [
    "media-card group block overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
    href ? "cursor-pointer" : "",
    record.is_new_discovery ? "border-t-2 border-t-[#448361]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div
        className="relative flex h-[160px] w-full items-center justify-center overflow-hidden bg-[var(--color-bg-secondary)]"
        style={{ backgroundColor: fallback.bg }}
      >
        {hasPhoto ? (
          // next/image 최적화는 다음 브랜치에서 붙임 — 우선 <img>로 스텁
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.photos[0]}
            alt={record.description ?? record.media_type}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl" aria-hidden>
            {fallback.icon}
          </span>
        )}
        {record.is_new_discovery ? (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[#448361]">
            ✨ 신규 발굴
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <CategoryBadge category={record.category} />
          <StatusBadge status={record.status} />
        </div>

        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">
          {record.description ?? record.media_type}
        </h3>
        <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
          {dateRange}
        </p>

        <div className="flex gap-3 text-xs text-[var(--color-text-tertiary)]">
          {typeof record.cost === "number" && record.cost > 0 ? (
            <span>💰 {Math.round(record.cost / 10000)}만원</span>
          ) : null}
          {hasPhoto ? <span>📷 사진 {record.photos.length}장</span> : null}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <article className={cardClass}>{inner}</article>;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "기간 미정";
  if (start && end) return `${start} ~ ${end}`;
  return start ?? end ?? "";
}
