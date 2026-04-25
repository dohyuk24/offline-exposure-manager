"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Branch, MediaRecord } from "@/types";
import { MEDIA_CATEGORY, MEDIA_STATUS, MEDIA_TYPE } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";
import { currentYearMonth } from "@/lib/date";

export type CreateDesignAndEventPayload = {
  branchSlug: string;
  designName: string; // → media_records.description
  mediaType: string; // 전단지 / 족자
  photo: string; // 디자인 사진 (1장)
  /* 첫 회차 */
  distributedOn: string; // yyyy-mm-dd
  locationLabel: string;
  quantity: string;
  cost: string;
  memo: string;
};

/**
 * D-OOH 디자인 신규 등록 + 첫 회차 동시 생성.
 */
export async function createDesignAndFirstEventAction(
  payload: CreateDesignAndEventPayload
): Promise<void> {
  const supabase = await createServerSupabase();

  const { data: branchRow, error: branchErr } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", payload.branchSlug)
    .maybeSingle();
  if (branchErr) throw branchErr;
  if (!branchRow) throw new Error("지점을 찾을 수 없어요");
  const branch = branchRow as Branch;

  // media_record 1건 (디자인) — category=D-OOH, status=게시중
  const { data: recordRow, error: insertRecErr } = await supabase
    .from("media_records")
    .insert({
      branch_id: branch.id,
      category: MEDIA_CATEGORY.DISTRIBUTION,
      media_type: payload.mediaType || MEDIA_TYPE.LEAFLET,
      status: MEDIA_STATUS.POSTING,
      description: payload.designName,
      photos: [payload.photo],
      is_new_discovery: false,
    })
    .select()
    .single();
  if (insertRecErr) throw insertRecErr;
  const record = recordRow as MediaRecord;

  // distribution_events 1건 (첫 회차)
  const qty = parseInt(payload.quantity || "0", 10) || 0;
  const cost = parseInt(payload.cost || "0", 10) || 0;
  const { error: insertEvErr } = await supabase
    .from("distribution_events")
    .insert({
      media_record_id: record.id,
      distributed_on: payload.distributedOn,
      location_label: payload.locationLabel || null,
      quantity: qty > 0 ? qty : null,
      cost: cost > 0 ? cost : null,
      memo: payload.memo || null,
    });
  if (insertEvErr) throw insertEvErr;

  // 비용 → budget_logs (D-OOH 는 P-OOH 가 아니므로 누적 대상 — PR E 정책)
  if (cost > 0) {
    await supabase.from("budget_logs").insert({
      branch_id: branch.id,
      media_record_id: record.id,
      amount: cost,
      memo: `[D-OOH 첫 회차] ${payload.designName}`,
      year_month: currentYearMonth(),
    });
  }

  revalidatePath(`/branches/${branch.slug}`);
  revalidatePath(`/branches/${branch.slug}/budget`);
  revalidatePath("/branches");
  revalidatePath("/");

  redirect(
    `/branches/${branch.slug}?feedback=${encodeURIComponent(
      `${payload.designName} 디자인을 ${qty.toLocaleString("ko-KR")}장 배포로 기록했어요 🎉`
    )}`
  );
}

export type AddEventPayload = {
  branchSlug: string;
  recordId: string;
  designName: string; // 피드백 메시지용
  distributedOn: string;
  locationLabel: string;
  quantity: string;
  cost: string;
  memo: string;
};

/** 기존 디자인에 회차 추가. */
export async function addDistributionEventAction(
  payload: AddEventPayload
): Promise<void> {
  const supabase = await createServerSupabase();

  const { data: branchRow, error: branchErr } = await supabase
    .from("branches")
    .select("id")
    .eq("slug", payload.branchSlug)
    .maybeSingle();
  if (branchErr) throw branchErr;
  if (!branchRow) throw new Error("지점을 찾을 수 없어요");
  const branchId = (branchRow as { id: string }).id;

  const qty = parseInt(payload.quantity || "0", 10) || 0;
  const cost = parseInt(payload.cost || "0", 10) || 0;

  const { error: insertErr } = await supabase
    .from("distribution_events")
    .insert({
      media_record_id: payload.recordId,
      distributed_on: payload.distributedOn,
      location_label: payload.locationLabel || null,
      quantity: qty > 0 ? qty : null,
      cost: cost > 0 ? cost : null,
      memo: payload.memo || null,
    });
  if (insertErr) throw insertErr;

  // media_records.updated_at 갱신 (자동 완료 task 트리거 + 그리드 정렬용)
  await supabase
    .from("media_records")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.recordId);

  if (cost > 0) {
    await supabase.from("budget_logs").insert({
      branch_id: branchId,
      media_record_id: payload.recordId,
      amount: cost,
      memo: `[D-OOH 회차 추가] ${payload.designName}`,
      year_month: currentYearMonth(),
    });
  }

  revalidatePath(`/branches/${payload.branchSlug}`);
  revalidatePath(
    `/branches/${payload.branchSlug}/records/${payload.recordId}/distributions`
  );
  revalidatePath(`/branches/${payload.branchSlug}/budget`);
}
