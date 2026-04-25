import Link from "next/link";

import type { MediaCategory } from "@/types";
import { MEDIA_CATEGORY } from "@/types";

export type CategoryTabValue = "all" | MediaCategory;

type Props = {
  branchSlug: string;
  active: CategoryTabValue;
  /** 탭별 카운트 표시 (옵션) */
  counts?: Partial<Record<MediaCategory, number>>;
};

const TABS: { value: CategoryTabValue; label: string; short: string }[] = [
  { value: "all", label: "전체", short: "전체" },
  { value: MEDIA_CATEGORY.PAID, label: "P-OOH (유가 옥외)", short: "P-OOH" },
  { value: MEDIA_CATEGORY.OWNED, label: "O-OOH (자체 보유)", short: "O-OOH" },
  { value: MEDIA_CATEGORY.DISTRIBUTION, label: "D-OOH (배포형)", short: "D-OOH" },
  { value: MEDIA_CATEGORY.AFFILIATED, label: "A-OOH (제휴)", short: "A-OOH" },
];

/**
 * 관리 탭 안에서 매체 카테고리 별로 화면을 좁히는 sub-tab.
 * 라우트는 그대로 두고 ?cat= URL 파람만 변경.
 */
export function CategorySubTabs({ branchSlug, active, counts }: Props) {
  return (
    <nav className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => {
          const isActive = tab.value === active;
          const count =
            tab.value === "all"
              ? undefined
              : counts?.[tab.value as MediaCategory];
          const href =
            tab.value === "all"
              ? `/branches/${branchSlug}`
              : `/branches/${branchSlug}?cat=${tab.value}`;
          return (
            <li key={tab.value}>
              <Link
                href={href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-[var(--color-accent)] font-medium text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
                {count !== undefined ? (
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      isActive
                        ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function parseCategoryTab(raw: string | undefined): CategoryTabValue {
  if (raw === MEDIA_CATEGORY.PAID) return MEDIA_CATEGORY.PAID;
  if (raw === MEDIA_CATEGORY.OWNED) return MEDIA_CATEGORY.OWNED;
  if (raw === MEDIA_CATEGORY.DISTRIBUTION) return MEDIA_CATEGORY.DISTRIBUTION;
  if (raw === MEDIA_CATEGORY.AFFILIATED) return MEDIA_CATEGORY.AFFILIATED;
  return "all";
}
