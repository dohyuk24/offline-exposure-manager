import Link from "next/link";

export type ViewMode = "card" | "table";

type Props = {
  /** 현재 페이지의 base URL — 토글 링크 생성용 */
  basePath: string;
  /** 함께 유지할 다른 검색 파람 (cat 등) */
  preserveParams?: Record<string, string | undefined>;
  active: ViewMode;
};

/**
 * 카드 / 테이블 뷰 토글. URL ?view=card|table 로 상태 유지.
 */
export function ViewToggle({ basePath, preserveParams, active }: Props) {
  function buildHref(view: ViewMode): string {
    const params = new URLSearchParams();
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) params.set(k, v);
      }
    }
    // table 이 디폴트 — card 일 때만 명시
    if (view === "card") params.set("view", "card");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="inline-flex items-center gap-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-white text-xs">
      <Link
        href={buildHref("card")}
        className={`px-2.5 py-1.5 ${
          active === "card"
            ? "bg-[var(--color-bg-secondary)] font-medium text-[var(--color-text-primary)]"
            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        }`}
      >
        🃏 카드
      </Link>
      <Link
        href={buildHref("table")}
        className={`border-l border-[var(--color-border)] px-2.5 py-1.5 ${
          active === "table"
            ? "bg-[var(--color-bg-secondary)] font-medium text-[var(--color-text-primary)]"
            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        }`}
      >
        📋 테이블
      </Link>
    </div>
  );
}

export function parseViewMode(raw: string | undefined): ViewMode {
  // 디폴트 = table (사용자 결정). card 는 명시적으로 ?view=card
  return raw === "card" ? "card" : "table";
}
