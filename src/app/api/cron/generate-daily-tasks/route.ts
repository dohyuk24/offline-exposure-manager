/**
 * 매일 새벽 03:00 KST = 18:00 UTC (전날) 호출.
 * Vercel Cron 또는 외부 스케줄러에서 트리거.
 *
 * 인증: `Authorization: Bearer ${CRON_SECRET}` 헤더 필수.
 *   - Vercel Cron 은 자동으로 이 헤더를 넣어줌.
 *   - 로컬 테스트: `curl -H "Authorization: Bearer local-secret" http://localhost:3000/api/cron/generate-daily-tasks`
 */

import { NextResponse } from "next/server";

import { generateDailyTasksForAllBranches } from "@/lib/daily-tasks/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date();
  try {
    const result = await generateDailyTasksForAllBranches(today);
    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/generate-daily-tasks] failed", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
