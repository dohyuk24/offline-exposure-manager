/**
 * Supabase OAuth 콜백 endpoint.
 * Slack OAuth 후 Supabase 가 ?code=... 로 redirect → 세션 교환 → 본 페이지로 이동.
 */

import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/auth/profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent("코드 없음")}`
    );
  }

  const supabase = await createServerSupabase();
  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(exchangeErr.message)}`
    );
  }

  // 신규 사용자면 user_profiles 자동 생성
  await ensureUserProfile();

  // 안전한 redirect — 외부 URL 차단
  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${url.origin}${safeNext}`);
}
