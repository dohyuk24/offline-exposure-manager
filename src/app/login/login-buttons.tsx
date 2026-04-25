"use client";

import { useState, useTransition } from "react";

import { createBrowserSupabase } from "@/lib/supabase/client";

type Props = { next: string };

/**
 * Slack OAuth 로그인 트리거. Supabase Auth → Slack 으로 redirect.
 */
export function LoginButtons({ next }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSlack() {
    setError(null);
    startTransition(async () => {
      const supabase = createBrowserSupabase();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signinErr } = await supabase.auth.signInWithOAuth({
        provider: "slack_oidc",
        options: { redirectTo },
      });
      if (signinErr) {
        setError(signinErr.message);
      }
      // 성공 시 Supabase 가 자동으로 Slack 로그인 페이지로 redirect.
    });
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleSlack}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-text-primary)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <span aria-hidden>💬</span>
        <span>{isPending ? "이동 중..." : "슬랙으로 로그인"}</span>
      </button>

      {error ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {error}
        </p>
      ) : null}

      <p className="text-center text-[11px] text-[var(--color-text-tertiary)]">
        버핏서울 슬랙 워크스페이스 멤버만 로그인 가능
      </p>
    </div>
  );
}
