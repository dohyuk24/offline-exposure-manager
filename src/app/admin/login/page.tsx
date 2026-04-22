import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/admin-auth";

import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          운영
        </p>
        <h1 className="text-[20px] font-semibold">어드민 로그인</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          마케팅실 전용. 비밀번호로 진입합니다.
        </p>
      </header>

      <LoginForm />
    </div>
  );
}
