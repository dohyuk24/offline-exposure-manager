"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Branch, MediaRecord } from "@/types";
import {
  MEDIA_CATEGORY,
  MEDIA_STATUS,
  MEDIA_TYPE,
  SCORE_ACTION,
  SCORE_CONFIG,
} from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";
import { currentYearMonth } from "@/lib/date";
import {
  sendBarterSuccessAlert,
  sendDiscoveryAlert,
  sendOfficialProposalAlert,
} from "@/lib/slack/notify";

export type RegisterMediaPayload = {
  branchSlug: string;
  category: string;
  media_type: string;
  status: string;
  description: string;
  size: string;
  content_type: string;
  start_date: string;
  end_date: string;
  cost: string;
  barter_condition: string;
  is_new_discovery: boolean;
  /** 기존 레코드 히스토리 이어가기 시 부모 location_key */
  locationKey?: string;
};

export async function registerMediaAction(
  payload: RegisterMediaPayload
): Promise<void> {
  const supabase = await createServerSupabase();
  const yearMonth = currentYearMonth();

  // 1. 지점 조회
  const { data: branchRow, error: branchErr } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", payload.branchSlug)
    .maybeSingle();
  if (branchErr) throw branchErr;
  if (!branchRow) throw new Error("지점을 찾을 수 없어요");
  const branch = branchRow as Branch;

  // 2. 행동 분류
  const isContinuation = Boolean(payload.locationKey);
  // 히스토리 이어가기는 절대 "신규 발굴"이 아니다 — 강제로 false.
  const isNewDiscovery = isContinuation ? false : payload.is_new_discovery;
  const isBarterSuccess =
    payload.media_type === MEDIA_TYPE.BARTER_BANNER &&
    (payload.status === MEDIA_STATUS.POSTING ||
      payload.status === MEDIA_STATUS.NEGOTIATED);
  const isOfficialProposal =
    payload.category === MEDIA_CATEGORY.OFFICIAL &&
    (payload.status === MEDIA_STATUS.IDEA ||
      payload.status === MEDIA_STATUS.NEGOTIATING);

  const costNum = parseInt(payload.cost || "0", 10) || 0;

  // 3. 매체 레코드 insert
  const insertPayload: Record<string, unknown> = {
    branch_id: branch.id,
    category: payload.category,
    media_type: payload.media_type,
    status: payload.status,
    description: payload.description || null,
    size: payload.size || null,
    content_type: payload.content_type || null,
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    cost: costNum > 0 ? costNum : null,
    barter_condition: payload.barter_condition || null,
    is_new_discovery: isNewDiscovery,
  };
  // 히스토리 이어가기면 부모 location_key 를 그대로 상속.
  // 신규 레코드면 생략 → DB default (gen_random_uuid) 가 독립 키를 부여.
  if (payload.locationKey) {
    insertPayload.location_key = payload.locationKey;
  }

  const { data: recordRow, error: insertErr } = await supabase
    .from("media_records")
    .insert(insertPayload)
    .select()
    .single();
  if (insertErr) throw insertErr;
  const record = recordRow as MediaRecord;

  // 4. 점수 로그
  let scoreAction: string = SCORE_ACTION.UPDATE;
  let scorePoints: number = SCORE_CONFIG.UPDATE;
  if (isNewDiscovery) {
    scoreAction = SCORE_ACTION.NEW_DISCOVERY;
    scorePoints = SCORE_CONFIG.NEW_DISCOVERY;
  } else if (isBarterSuccess) {
    scoreAction = SCORE_ACTION.BARTER_SUCCESS;
    scorePoints = SCORE_CONFIG.BARTER_SUCCESS;
  }
  await supabase.from("score_logs").insert({
    branch_id: branch.id,
    media_record_id: record.id,
    action: scoreAction,
    score: scorePoints,
    year_month: yearMonth,
  });

  // 5. 예산 로그 (자체보유·비공식 + 비용 > 0 일 때만)
  if (
    costNum > 0 &&
    (payload.category === MEDIA_CATEGORY.OWNED ||
      payload.category === MEDIA_CATEGORY.UNOFFICIAL)
  ) {
    await supabase.from("budget_logs").insert({
      branch_id: branch.id,
      media_record_id: record.id,
      amount: costNum,
      memo: payload.description || null,
      year_month: yearMonth,
    });
  }

  // 6. Slack 알림 (실패해도 등록은 성공 처리)
  try {
    if (isNewDiscovery) {
      await sendDiscoveryAlert(branch, record);
    } else if (isBarterSuccess) {
      await sendBarterSuccessAlert(branch, record);
    } else if (isOfficialProposal) {
      await sendOfficialProposalAlert(branch, record);
    }
  } catch (err) {
    console.error("[register] Slack 알림 실패", err);
  }

  // 7. 이번 달 등록 건수 집계 (피드백 문구용)
  const { count: monthCount } = await supabase
    .from("media_records")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branch.id)
    .is("deleted_at", null)
    .gte("created_at", `${yearMonth}-01T00:00:00Z`);

  const feedback = buildFeedback({
    branchName: branch.name,
    mediaType: record.media_type,
    isNewDiscovery,
    isBarterSuccess,
    isContinuation,
    monthCount: monthCount ?? 1,
  });

  // 8. 캐시 무효화 + 리다이렉트
  revalidatePath(`/branches/${branch.slug}`);
  revalidatePath("/branches");
  revalidatePath("/");

  redirect(
    `/branches/${branch.slug}?feedback=${encodeURIComponent(feedback)}`
  );
}

function buildFeedback({
  branchName,
  mediaType,
  isNewDiscovery,
  isBarterSuccess,
  isContinuation,
  monthCount,
}: {
  branchName: string;
  mediaType: string;
  isNewDiscovery: boolean;
  isBarterSuccess: boolean;
  isContinuation: boolean;
  monthCount: number;
}): string {
  if (isNewDiscovery) {
    return `새 매체 발굴! ${branchName} 이번 달 ${monthCount}번째 신규 확보예요 ✨`;
  }
  if (isBarterSuccess) {
    return `바터제휴 성사! ${branchName} 예산 아끼면서 노출 확보했어요 👍`;
  }
  if (isContinuation) {
    return `${branchName} ${mediaType} 이어서 기록했어요! 이번 달 ${monthCount}번째 업데이트 🎉`;
  }
  return `${branchName} ${mediaType} 기록 완료! 이번 달 ${monthCount}번째 기록이에요 🎉`;
}
