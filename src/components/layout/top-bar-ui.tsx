"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Branch } from "@/types";
import type { Session } from "@/lib/auth/temp-session";
import { OFFICE_BRANCH_SLUG } from "@/lib/branch-order";
import { logoutAction } from "@/lib/auth/actions";

import { BranchSelector } from "./branch-selector";

type Props = {
  branches: Branch[];
  session: Session | null;
};

type NavItem = { href: string; label: string; exact?: boolean };

// 오피스 모드 (또는 비-지점 페이지) — 전체 nav
const FULL_NAV: NavItem[] = [
  { href: "/", label: "전체 현황", exact: true },
  { href: "/admin", label: "어드민" },
  { href: "/guide/scoring", label: "가이드" },
];

export function TopBarUI({ branches, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 지점 세션이면 강제로 그 지점 컨텍스트 (다른 지점/오피스 접근 차단)
  const sessionBranch =
    session?.type === "branch" ? session.branchSlug : null;

  // 컨텍스트 슬러그 — 세션 우선 → URL → ?from
  const urlSlug = pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const fromParam = searchParams.get("from");
  const contextSlug = sessionBranch ?? urlSlug ?? fromParam ?? null;
  const isRestricted =
    contextSlug !== null && contextSlug !== OFFICE_BRANCH_SLUG;

  const navItems: NavItem[] = isRestricted
    ? [
        { href: `/branches/${contextSlug}`, label: "매체 관리" },
        {
          href: `/guide/scoring?from=${contextSlug}`,
          label: "가이드",
        },
      ]
    : FULL_NAV;

  // 로고 클릭 — 지점 세션이면 자기 지점, 오피스/no-session 면 홈
  const logoHref = sessionBranch ? `/branches/${sessionBranch}` : "/";

  // 세션 라벨 (사용자 표시)
  const sessionLabel = !session
    ? null
    : session.type === "office"
      ? "오피스"
      : branches.find((b) => b.slug === session.branchSlug)?.name ??
        session.branchSlug;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex h-14 items-center gap-6 px-4 md:px-6">
        <Link
          href={logoHref}
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)] hover:opacity-80"
        >
          <span aria-hidden>🪧</span>
          <span className="hidden sm:inline">오프라인 매체 관리</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {sessionLabel ? (
            <>
              <span className="hidden items-center gap-1 text-xs text-[var(--color-text-secondary)] md:inline-flex">
                <span aria-hidden>🙂</span>
                <span>{sessionLabel}</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-secondary)]"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              로그인
            </Link>
          )}
          <BranchSelector branches={branches} session={session} />
        </div>
      </div>
    </header>
  );
}
