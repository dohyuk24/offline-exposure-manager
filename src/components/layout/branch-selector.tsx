"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Branch } from "@/types";
import { OFFICE_BRANCH_SLUG } from "@/lib/branch-order";

type Props = {
  branches: Branch[];
};

/**
 * Top-bar 우측 지점 dropdown.
 * - /branches/[slug] 일 때 → 해당 지점 표시
 * - 그 외 (홈·랭킹·어드민·가이드) → '오피스' 표시 (default = HQ 모드)
 * - '오피스' 클릭 → / 로 이동 (마케팅 dashboard)
 * - 다른 지점 클릭 → /branches/[slug] 이동
 */
export function BranchSelector({ branches }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // pathname 으로 현재 지점 추출. 없으면 office 가 active.
  const urlSlug = pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const activeSlug = urlSlug ?? OFFICE_BRANCH_SLUG;
  const office = branches.find((b) => b.slug === OFFICE_BRANCH_SLUG);
  const current =
    branches.find((b) => b.slug === activeSlug) ?? office ?? null;

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
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)]"
      >
        <span aria-hidden>🏢</span>
        <span>{current ? current.name : "지점 선택"}</span>
        <span aria-hidden className="text-xs text-[var(--color-text-tertiary)]">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-lg">
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {branches.map((b) => {
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
