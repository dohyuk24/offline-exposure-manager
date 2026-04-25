import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/login`, { status: 303 });
}

// GET 도 허용 (간단 링크 클릭 지원). 운영 시엔 POST 권장.
export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}
