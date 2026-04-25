import type { MediaStatus, MediaCategory } from "@/types";

const STATUS_STYLE: Record<MediaStatus, { bg: string; fg: string }> = {
  게시중: { bg: "var(--badge-posting-bg)", fg: "var(--badge-posting-fg)" },
  게시종료: { bg: "var(--badge-ended-bg)", fg: "var(--badge-ended-fg)" },
  협의중: {
    bg: "var(--badge-negotiating-bg)",
    fg: "var(--badge-negotiating-fg)",
  },
  협의실패: { bg: "var(--badge-failed-bg)", fg: "var(--badge-failed-fg)" },
  아이디어: { bg: "var(--badge-idea-bg)", fg: "var(--badge-idea-fg)" },
  미진행: {
    bg: "var(--badge-not-started-bg)",
    fg: "var(--badge-not-started-fg)",
  },
  협의완료: {
    bg: "var(--badge-negotiated-bg)",
    fg: "var(--badge-negotiated-fg)",
  },
};

const CATEGORY_STYLE: Record<MediaCategory, { bg: string; fg: string }> = {
  "P-OOH": { bg: "var(--cat-paid-bg)", fg: "var(--cat-paid-fg)" },
  "A-OOH": {
    bg: "var(--cat-affiliated-bg)",
    fg: "var(--cat-affiliated-fg)",
  },
  "D-OOH": {
    bg: "var(--cat-distribution-bg)",
    fg: "var(--cat-distribution-fg)",
  },
  "O-OOH": { bg: "var(--cat-owned-bg)", fg: "var(--cat-owned-fg)" },
};

export function StatusBadge({ status }: { status: MediaStatus }) {
  const { bg, fg } = STATUS_STYLE[status];
  return (
    <span className="status-badge" style={{ backgroundColor: bg, color: fg }}>
      {status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: MediaCategory }) {
  const { bg, fg } = CATEGORY_STYLE[category];
  return (
    <span className="status-badge" style={{ backgroundColor: bg, color: fg }}>
      {category}
    </span>
  );
}
