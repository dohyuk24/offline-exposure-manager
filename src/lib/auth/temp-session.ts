/**
 * 임시 세션 시스템 — Slack OAuth (PR N2~N4) 셋업 전 단계.
 * 단순 쿠키 기반: 'office' 또는 'branch:{slug}' 형태.
 * 비밀번호 없음, 클릭으로 로그인 (내부 임시 테스트 용도).
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "app_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export type SessionType = "office" | "branch";

export type Session =
  | { type: "office" }
  | { type: "branch"; branchSlug: string };

function parse(value: string | undefined): Session | null {
  if (!value) return null;
  if (value === "office") return { type: "office" };
  if (value.startsWith("branch:")) {
    const slug = value.slice("branch:".length);
    if (slug) return { type: "branch", branchSlug: slug };
  }
  return null;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return parse(store.get(COOKIE_NAME)?.value);
}

export async function setOfficeSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "office", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function setBranchSession(slug: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `branch:${slug}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
