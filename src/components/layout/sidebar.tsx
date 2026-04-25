import Link from "next/link";

import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import type { Branch } from "@/types";

/**
 * 사이드바 네비게이션 (데스크톱 200px 고정).
 * 모바일에서는 추후 햄버거/하단 탭으로 전환 예정.
 *
 * "지점" 섹션은 DB에서 활성 지점 목록을 로드해 링크로 노출.
 */
export async function Sidebar() {
  let branches: Branch[] = [];
  try {
    branches = sortBranchesByDisplayOrder(await listActiveBranches());
  } catch {
    // env 미설정 · DB 불가 시엔 지점 섹션만 비움.
    branches = [];
  }

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
        <SidebarLink href="/branches">모든 지점</SidebarLink>
        {branches.length === 0 ? (
          <p className="px-2 py-1 text-[11px] text-[var(--color-text-tertiary)]">
            DB 연결 후 지점이 표시됩니다
          </p>
        ) : (
          <div className="mt-1 max-h-[40vh] overflow-y-auto">
            {branches.map((branch) => (
              <SidebarLink
                key={branch.id}
                href={`/branches/${branch.slug}`}
                nested
              >
                {branch.name}
              </SidebarLink>
            ))}
          </div>
        )}
      </SidebarSection>

      <SidebarSection label="가이드">
        <SidebarLink href="/guide/scoring">점수 룰</SidebarLink>
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
  nested = false,
}: {
  href: string;
  children: React.ReactNode;
  nested?: boolean;
}) {
  const sizeClass = nested
    ? "py-1 pl-4 pr-2 text-[13px]"
    : "px-2 py-1.5 text-sm";
  return (
    <Link
      href={href}
      className={`block rounded text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] ${sizeClass}`}
    >
      {children}
    </Link>
  );
}
