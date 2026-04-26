"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Branch } from "@/types";
import type { Session } from "@/lib/auth/temp-session";
import { OFFICE_BRANCH_SLUG } from "@/lib/branch-order";

type Props = {
  branches: Branch[];
  session: Session | null;
};

/**
 * Top-bar 우측 지점 dropdown.
 * - 지점 세션 사용자 → 본인 지점만 노출 (전환 차단)
 * - 오피스 세션 사용자 → 모든 지점 + 오피스 노출
 * - URL/?from 로 active 강조
 */
export function BranchSelector({ branches, session }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 지점 세션이면 자기 지점 강제, 아니면 URL/?from 추론
  const sessionBranch =
    session?.type === "branch" ? session.branchSlug : null;
  const urlSlug = pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const fromParam = searchParams.get("from");
  const activeSlug =
    sessionBranch ?? urlSlug ?? fromParam ?? OFFICE_BRANCH_SLUG;
  const office = branches.find((b) => b.slug === OFFICE_BRANCH_SLUG);
  const current =
    branches.find((b) => b.slug === activeSlug) ?? office ?? null;

  // 지점 사용자는 본인 지점만 list 에. 오피스 사용자는 전체.
  const visibleBranches = sessionBranch
    ? branches.filter((b) => b.slug === sessionBranch)
    : branches;
  const locked = sessionBranch !== null;

  // 외부 클릭 시 닫기
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function selectBranch(slug: string) {
    setOpen(false);
    // 오피스 = HQ 마케팅 dashboard = / (홈)
    if (slug === OFFICE_BRANCH_SLUG) {
      router.push("/");
    } else {
      router.push(`/branches/${slug}`);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !locked && setOpen((p) => !p)}
        disabled={locked}
        className={`flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] ${
          locked ? "cursor-default opacity-90" : "hover:border-[var(--color-accent)]"
        }`}
      >
        <span aria-hidden>🏢</span>
        <span>{current ? current.name : "지점 선택"}</span>
        {!locked ? (
          <span aria-hidden className="text-xs text-[var(--color-text-tertiary)]">
            ▾
          </span>
        ) : null}
      </button>

      {open && !locked ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-lg">
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {visibleBranches.map((b) => {
              const active = b.slug === activeSlug;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => selectBranch(b.slug)}
                    className={`block w-full px-3 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                  >
                    {b.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
