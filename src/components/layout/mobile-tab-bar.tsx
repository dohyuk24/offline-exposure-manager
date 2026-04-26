"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: string;
};

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/todo", label: "to-do", icon: "✓" },
  { href: "/admin", label: "어드민", icon: "⚙️" },
];

/**
 * 모바일 하단 고정 탭바. 데스크톱(`md:`)에선 숨김.
 * 사이드바의 주요 목적지를 네 개 탭으로 압축.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
              active
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
          >
            <span className="text-[18px] leading-none" aria-hidden>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // /branches 탭은 /branches/* 전체에 대해 활성화
  return pathname === href || pathname.startsWith(href + "/");
}
