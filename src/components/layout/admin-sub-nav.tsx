"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 어드민 sub-tier nav — 어드민 / 가이드.
 * /admin 또는 /guide/* 경로일 때만 노출.
 */
export function AdminSubNav() {
  const pathname = usePathname();

  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const inGuide = pathname.startsWith("/guide/");
  if (!inAdmin && !inGuide) return null;

  const tabs = [
    {
      href: "/admin",
      label: "어드민",
      isActive: inAdmin,
    },
    {
      href: "/guide/scoring",
      label: "가이드",
      isActive: inGuide,
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
