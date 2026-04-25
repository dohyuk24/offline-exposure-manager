/**
 * 인증·권한 헬퍼 — 현재 사용자 + 프로필 자동 생성.
 *
 * 흐름:
 *   1) Supabase Auth 가 OAuth 후 auth.users 에 사용자 생성
 *   2) ensureUserProfile() 가 user_profiles 행이 없으면 자동 INSERT
 *      - email 이 INITIAL_ADMIN_EMAILS 에 있으면 role='admin'
 *      - 그 외 role='viewer' (지점 0개 — 어드민이 수동 부여)
 */

import type { UserProfile, UserRole } from "@/types";
import { USER_ROLE } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

function isInitialAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.INITIAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** 현재 인증된 사용자 + user_profiles 행. 미인증 시 null. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (profile ?? null) as UserProfile | null;
}

/**
 * 인증 사용자에 대해 user_profiles 행이 없으면 자동 생성.
 * 미인증 상태면 null. 호출 후 항상 UserProfile 반환 또는 null.
 */
export async function ensureUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing as UserProfile;

  const role: UserRole = isInitialAdmin(user.email)
    ? USER_ROLE.ADMIN
    : USER_ROLE.VIEWER;

  // OAuth provider 메타데이터에서 슬랙 ID / 표시이름 추출
  // (Supabase 의 slack_oidc provider 는 user.user_metadata 에 sub 등 적재)
  const meta = user.user_metadata ?? {};
  const slackUserId = (meta.sub ?? meta.provider_id ?? null) as string | null;
  const displayName = (meta.full_name ??
    meta.name ??
    user.email?.split("@")[0] ??
    null) as string | null;

  const { data: inserted, error } = await supabase
    .from("user_profiles")
    .insert({
      id: user.id,
      email: user.email,
      display_name: displayName,
      slack_user_id: slackUserId,
      role,
      is_active: true,
    })
    .select()
    .single();
  if (error) {
    console.error("[auth] user_profiles 자동 생성 실패", error);
    return null;
  }
  return inserted as UserProfile;
}
