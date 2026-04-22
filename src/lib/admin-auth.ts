import "server-only";

import { createHmac } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 어드민 세션 쿠키 이름. httpOnly 로 저장한다.
 */
export const ADMIN_SESSION_COOKIE = "admin-session";

/**
 * ADMIN_PASSWORD 를 HMAC 키로 사용해 세션 토큰을 계산한다.
 * 비밀번호를 모르면 동일한 토큰을 생성할 수 없으므로 쿠키 위조 방지.
 */
export function computeAdminSessionToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD 환경변수가 없습니다. .env.local 에 설정해주세요."
    );
  }
  return createHmac("sha256", password).update("admin-session-v1").digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  const cookie = store.get(ADMIN_SESSION_COOKIE);
  if (!cookie) return false;
  try {
    return cookie.value === computeAdminSessionToken();
  } catch {
    return false;
  }
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  const token = computeAdminSessionToken();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/**
 * 서버 컴포넌트 / 서버 액션에서 사용. 인증 안 돼있으면 /admin/login 으로 리다이렉트.
 */
export async function requireAdmin(): Promise<void> {
  const { redirect } = await import("next/navigation");
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
