"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { Branch, UserProfile } from "@/types";

type Props = {
  branches: Branch[];
  user: UserProfile | null;
};

type SectionKey = "dashboard" | "branches" | "guide" | "ops";

const DEFAULT_OPEN: Record<SectionKey, boolean> = {
  dashboard: true,
  branches: true,
  guide: false,
  ops: false,
};

export function SidebarUI({ branches, user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(DEFAULT_OPEN);

  function toggle(key: SectionKey) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-4 min-h-screen">
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 px-3 text-[15px] font-semibold text-[var(--color-text-primary)] hover:opacity-80"
      >
        <span aria-hidden>🪧</span>
        <span>오프라인 매체</span>
      </Link>

      <Section
        label="대시보드"
        isOpen={open.dashboard}
        onToggle={() => toggle("dashboard")}
      >
        <NavItem href="/" pathname={pathname} label="전체 현황" />
        <NavItem href="/ranking" pathname={pathname} label="점수판 · 랭킹" />
        <NavItem
          href="/branches"
          pathname={pathname}
          label="모든 지점"
          exact
        />
      </Section>

      <Section
        label="지점"
        isOpen={open.branches}
        onToggle={() => toggle("branches")}
        count={branches.length}
      >
        {branches.length === 0 ? (
          <p className="px-3 py-1 text-[11px] text-[var(--color-text-tertiary)]">
            DB 연결 후 표시
          </p>
        ) : (
          <div className="mt-0.5 max-h-[42vh] overflow-y-auto">
            {branches.map((b) => (
              <NavItem
                key={b.id}
                href={`/branches/${b.slug}`}
                pathname={pathname}
                label={b.name}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        label="가이드"
        isOpen={open.guide}
        onToggle={() => toggle("guide")}
      >
        <NavItem
          href="/guide/scoring"
          pathname={pathname}
          label="점수 룰"
        />
        <NavItem
          href="/guide/barter-bp"
          pathname={pathname}
          label="바터제휴 BP"
        />
        <NavItem
          href="/guide/media"
          pathname={pathname}
          label="매체별 가이드"
        />
      </Section>

      <Section
        label="운영"
        isOpen={open.ops}
        onToggle={() => toggle("ops")}
      >
        <NavItem href="/admin" pathname={pathname} label="어드민" />
      </Section>

      <div className="mt-auto border-t border-[var(--color-border)] pt-3">
        {user ? (
          <div className="space-y-1 px-2">
            <p className="truncate text-[12px] font-medium text-[var(--color-text-primary)]">
              {user.display_name ?? user.email ?? "사용자"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
              {user.role}
            </p>
            <Link
              href="/auth/signout"
              className="mt-1 inline-block text-[11px] text-[var(--color-text-tertiary)] hover:underline"
            >
              로그아웃
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="block rounded px-3 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
          >
            로그인
          </Link>
        )}
      </div>
    </aside>
  );
}

function Section({
  label,
  isOpen,
  onToggle,
  count,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]"
      >
        <span
          className={`inline-block transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          ▸
        </span>
        <span>{label}</span>
        {count !== undefined ? (
          <span className="ml-auto rounded-full bg-[var(--color-bg-tertiary)] px-1.5 text-[10px] font-normal text-[var(--color-text-tertiary)]">
            {count}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <nav className="mt-0.5 flex flex-col gap-0.5">{children}</nav>
      ) : null}
    </div>
  );
}

function NavItem({
  href,
  pathname,
  label,
  nested = false,
  exact = false,
}: {
  href: string;
  pathname: string;
  label: string;
  nested?: boolean;
  exact?: boolean;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  const sizeClass = nested
    ? "py-1 pl-7 pr-2 text-[13px]"
    : "px-3 py-1.5 text-sm";

  const stateClass = isActive
    ? "bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]"
    : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]";

  return (
    <Link
      href={href}
      className={`block rounded ${sizeClass} ${stateClass}`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
