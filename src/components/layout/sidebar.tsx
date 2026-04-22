import Link from "next/link";

/**
 * 사이드바 네비게이션 (데스크톱 200px 고정).
 * 모바일에서는 추후 햄버거/하단 탭으로 전환 예정.
 */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-[200px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-4">
      <Link
        href="/"
        className="mb-4 px-2 text-[15px] font-semibold text-[var(--color-text-primary)]"
      >
        오프라인 매체
      </Link>

      <SidebarSection label="대시보드">
        <SidebarLink href="/">전체 현황</SidebarLink>
        <SidebarLink href="/ranking">점수판 · 랭킹</SidebarLink>
      </SidebarSection>

      <SidebarSection label="지점">
        <p className="px-2 text-xs text-[var(--color-text-tertiary)]">
          지점 담당자는 전용 URL로 진입
        </p>
      </SidebarSection>

      <SidebarSection label="가이드">
        <SidebarLink href="/guide/barter-bp">바터제휴 BP</SidebarLink>
        <SidebarLink href="/guide/media">매체별 가이드</SidebarLink>
      </SidebarSection>

      <SidebarSection label="운영">
        <SidebarLink href="/admin">어드민</SidebarLink>
      </SidebarSection>
    </aside>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-t-[0.5px] border-[var(--color-border)] pt-3">
      <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded px-2 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
    >
      {children}
    </Link>
  );
}
