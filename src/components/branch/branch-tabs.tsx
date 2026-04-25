import Link from "next/link";

type Props = {
  branchSlug: string;
  active: "manage" | "insights" | "budget";
};

const TABS: ReadonlyArray<{ key: Props["active"]; label: string; href: (slug: string) => string }> = [
  { key: "manage", label: "관리", href: (s) => `/branches/${s}` },
  { key: "insights", label: "현황", href: (s) => `/branches/${s}/insights` },
  { key: "budget", label: "예산", href: (s) => `/branches/${s}/budget` },
];

/**
 * 지점 페이지 sub-tab. 헤더 아래에 노출.
 * 액션 페이지(/new, /records/[id]/edit)에는 노출 안 함.
 */
export function BranchTabs({ branchSlug, active }: Props) {
  return (
    <nav className="border-b border-[var(--color-border)]">
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href(branchSlug)}
                className={`inline-block border-b-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-[var(--color-accent)] font-medium text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
