import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginButtons } from "./login-buttons";
import { getCurrentUser } from "@/lib/auth/profile";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;

  // 이미 로그인 상태면 next 또는 홈으로
  const user = await getCurrentUser();
  if (user) redirect(next || "/");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-8 px-4">
      <header className="text-center">
        <p className="text-2xl">🪧</p>
        <h1 className="mt-2 text-[20px] font-semibold">오프라인 매체 관리</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          버핏서울 임직원 전용. 슬랙 계정으로 로그인하세요.
        </p>
      </header>

      <LoginButtons next={next ?? "/"} />

      {error ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          로그인 실패: {decodeURIComponent(error)}
        </p>
      ) : null}

      <Link
        href="/"
        className="text-xs text-[var(--color-text-tertiary)] hover:underline"
      >
        나중에 (게스트로 둘러보기)
      </Link>
    </div>
  );
}
