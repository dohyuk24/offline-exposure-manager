"use server";

import { redirect } from "next/navigation";

import { setAdminSession } from "@/lib/admin-auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

/**
 * 어드민 비밀번호 검증 후 세션 쿠키 발급.
 * v1 은 단일 비밀번호. 추후 계정 기반으로 대체 예정.
 */
export async function adminLoginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      ok: false,
      error: "서버에 ADMIN_PASSWORD 가 설정돼 있지 않아요.",
    };
  }
  if (password !== expected) {
    return { ok: false, error: "비밀번호가 맞지 않아요." };
  }

  await setAdminSession();
  redirect("/admin");
}
