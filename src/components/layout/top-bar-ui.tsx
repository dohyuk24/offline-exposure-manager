"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Branch, UserProfile } from "@/types";
import { OFFICE_BRANCH_SLUG } from "@/lib/branch-order";

import { BranchSelector } from "./branch-selector";

type Props = {
  branches: Branch[];
  user: UserProfile | null;
};

type NavItem = { href: string; label: string; exact?: boolean };

// 오피스 모드 (또는 비-지점 페이지) — 전체 nav
const FULL_NAV: NavItem[] = [
  { href: "/", label: "전체 현황", exact: true },
  { href: "/ranking", label: "점수판" },
  { href: "/admin", label: "어드민" },
  { href: "/guide/scoring", label: "가이드" },
];

// 일반 지점 페이지 — 가이드만 (지점별 페이지 자체에 머물게)
const RESTRICTED_NAV: NavItem[] = [
  { href: "/guide/scoring", label: "가이드" },
];

export function TopBarUI({ branches, user }: Props) {
  const pathname = usePathname();

  // 현재 보고 있는 지점 (없거나 office 면 full, 그 외면 restricted)
  const currentSlug = pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const isRestricted =
    currentSlug !== null && currentSlug !== OFFICE_BRANCH_SLUG;
  const navItems = isRestricted ? RESTRICTED_NAV : FULL_NAV;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex h-14 items-center gap-6 px-4 md:px-6">
        {/* 로고 */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold text-[var(--color-text-primary)] hover:opacity-80"
        >
          <span aria-hidden>🪧</span>
          <span className="hidden sm:inline">오프라인 매체 관리</span>
        </Link>

        {/* 메인 nav (가로) — 오피스/홈/관리 페이지에선 full, 일반 지점 안에선 restricted */}
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

        {/* 우측: 사용자 + 지점 dropdown */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <span className="hidden items-center gap-1 text-xs text-[var(--color-text-secondary)] md:inline-flex">
              <span aria-hidden>🙂</span>
              <span>{user.display_name ?? user.email ?? "사용자"}</span>
            </span>
          ) : (
            <Link
              href="/login"
              className="hidden text-xs text-[var(--color-accent)] hover:underline md:inline"
            >
              로그인
            </Link>
          )}
          <BranchSelector branches={branches} />
        </div>
      </div>
    </header>
  );
}
