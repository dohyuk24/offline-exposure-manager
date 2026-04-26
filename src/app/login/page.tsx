import { redirect } from "next/navigation";

import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { getSession } from "@/lib/auth/temp-session";
import { OFFICE_BRANCH_SLUG } from "@/lib/branch-order";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.type === "office") redirect("/");
    if (session.type === "branch") redirect(`/branches/${session.branchSlug}`);
  }

  const all = await listActiveBranches().catch(() => []);
  const sorted = sortBranchesByDisplayOrder(all);
  const branches = sorted.filter((b) => b.slug !== OFFICE_BRANCH_SLUG);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-6 px-4">
      <header className="text-center">
        <p className="text-3xl">🪧</p>
        <h1 className="mt-2 text-[20px] font-semibold">오프라인 매체 관리</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          임시 로그인 (계정 시스템 도입 전)
        </p>
      </header>

      <LoginForm branches={branches} />

      <p className="text-center text-[11px] text-[var(--color-text-tertiary)]">
        오피스 = 전체 권한 · 지점 = 해당 지점만 접근
      </p>
    </div>
  );
}
