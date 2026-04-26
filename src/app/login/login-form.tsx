"use client";

import { useState, useTransition } from "react";

import type { Branch } from "@/types";
import {
  loginAsBranchAction,
  loginAsOfficeAction,
} from "@/lib/auth/actions";

type Props = {
  branches: Branch[];
};

export function LoginForm({ branches }: Props) {
  const defaultSlug = branches[0]?.slug ?? "";
  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOffice() {
    setError(null);
    startTransition(async () => {
      try {
        await loginAsOfficeAction();
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function handleBranch() {
    if (!selectedSlug) {
      setError("지점을 선택해주세요");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await loginAsBranchAction(selectedSlug);
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={handleOffice}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <span aria-hidden>🏢</span>
        <span>오피스로 로그인</span>
      </button>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4 space-y-3">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          또는 지점으로 로그인
        </p>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          disabled={isPending || branches.length === 0}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        >
          {branches.length === 0 ? (
            <option value="">지점 데이터 없음</option>
          ) : (
            branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={handleBranch}
          disabled={isPending || !selectedSlug}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
        >
          이 지점으로 로그인
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
