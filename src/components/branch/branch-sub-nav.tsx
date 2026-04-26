"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 매체관리 sub-tier nav (top bar 아래 두 번째 줄).
 * 표시 조건: /branches/[slug]/* (단 /budget 제외) 또는 /guide/* (?from 으로 컨텍스트 보존)
 * 항목: 지면관리 / 점수판 / 가이드
 */
export function BranchSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 컨텍스트 슬러그 추출 — URL 우선, 없으면 ?from
  const urlSlug = pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const fromSlug = searchParams.get("from");
  const slug = urlSlug ?? fromSlug;
  if (!slug) return null;

  const branchPath = `/branches/${slug}`;
  const budgetPath = `${branchPath}/budget`;
  const insightsPath = `${branchPath}/insights`;

  // 매체관리(상위) active 일 때만 sub tier 노출. 예산관리 active 면 숨김.
  const isMediaContext =
    (pathname === branchPath ||
      (pathname.startsWith(`${branchPath}/`) &&
        !pathname.startsWith(budgetPath))) ||
    pathname.startsWith("/guide/");
  if (!isMediaContext) return null;

  const tabs = [
    {
      href: branchPath,
      label: "지면관리",
      isActive:
        (pathname === branchPath ||
          (pathname.startsWith(`${branchPath}/`) &&
            !pathname.startsWith(insightsPath) &&
            !pathname.startsWith(budgetPath))) &&
        !pathname.startsWith("/guide/"),
    },
    {
      href: insightsPath,
      label: "점수판",
      isActive: pathname.startsWith(insightsPath),
    },
    {
      href: `/guide/scoring?from=${slug}`,
      label: "가이드",
      isActive: pathname.startsWith("/guide/"),
    },
  ];

  return (
    <nav className="sticky top-14 z-10 border-b border-[var(--color-border)] bg-white">
      <div className="flex items-center gap-1 px-4 md:px-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative inline-flex items-center px-3 py-2.5 text-sm transition-colors ${
              tab.isActive
                ? "font-medium text-[var(--color-accent)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {tab.label}
            {tab.isActive ? (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]" />
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
