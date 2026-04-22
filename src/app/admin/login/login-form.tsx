"use client";

import { useActionState } from "react";

import { adminLoginAction, type LoginResult } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginResult | null, FormData>(
    adminLoginAction,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
          비밀번호
        </span>
        <input
          type="password"
          name="password"
          autoFocus
          required
          disabled={pending}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </label>

      {state && !state.ok ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-sm text-[#C4332F]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-accent)] py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
