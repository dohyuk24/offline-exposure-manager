/**
 * 평일 14:00 KST = 05:00 UTC 호출.
 * 활성 지점 전부에 대해 오늘의 미처리 task 요약을 슬랙으로 발송.
 *
 * 인증: Bearer ${CRON_SECRET}
 */

import { NextResponse } from "next/server";

import { sendDailyTasksToAllBranches } from "@/lib/slack/daily-message";

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

  // 주말 가드 — Vercel Cron 의 `1-5` 표현식이 잘못됐거나 수동 호출 대비.
  const today = new Date();
  const day = today.getDay(); // 0=일, 6=토
  if (day === 0 || day === 6) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "weekend",
      day,
    });
  }

  try {
    const result = await sendDailyTasksToAllBranches(today);
    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/send-daily-slack] failed", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
