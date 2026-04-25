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

export type UpdateEventPayload = {
  branchSlug: string;
  recordId: string;
  eventId: string;
  designName: string;
  distributedOn: string;
  locationLabel: string;
  quantity: string;
  cost: string;
  memo: string;
};

/**
 * 회차 수정. 비용 변경 시 budget_logs 도 동기화 (해당 event 의 기존 로그 삭제 후 재삽입).
 */
export async function updateDistributionEventAction(
  payload: UpdateEventPayload
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

  const { error: updateErr } = await supabase
    .from("distribution_events")
    .update({
      distributed_on: payload.distributedOn,
      location_label: payload.locationLabel || null,
      quantity: qty > 0 ? qty : null,
      cost: cost > 0 ? cost : null,
      memo: payload.memo || null,
    })
    .eq("id", payload.eventId)
    .eq("media_record_id", payload.recordId);
  if (updateErr) throw updateErr;

  await supabase
    .from("media_records")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.recordId);

  // 기존 budget_logs 정리: 이 record + 이번 달 + memo 가 회차 관련된 것 — 안전하게 못 잡음.
  // 단순화: distribution event 와 budget_log 를 1:1 로 묶지 않고, "이 record 의 이번 달 모든 event"
  // 비용 합계를 재계산해서 갱신. 보수적으로 — 같은 메모 prefix 만 정리.
  const yearMonth = currentYearMonth();
  await supabase
    .from("budget_logs")
    .delete()
    .eq("media_record_id", payload.recordId)
    .eq("year_month", yearMonth)
    .like("memo", "[D-OOH%");

  // 이번 달의 모든 event 비용을 다시 budget_logs 에 한 줄로 누적
  const { data: events } = await supabase
    .from("distribution_events")
    .select("cost, distributed_on")
    .eq("media_record_id", payload.recordId);
  const monthEvents = ((events ?? []) as { cost: number | null; distributed_on: string }[])
    .filter((e) => e.distributed_on?.startsWith(yearMonth));
  const totalCost = monthEvents.reduce((s, e) => s + (e.cost ?? 0), 0);
  if (totalCost > 0) {
    await supabase.from("budget_logs").insert({
      branch_id: branchId,
      media_record_id: payload.recordId,
      amount: totalCost,
      memo: `[D-OOH ${yearMonth} 회차 합계] ${payload.designName}`,
      year_month: yearMonth,
    });
  }

  revalidatePath(`/branches/${payload.branchSlug}`);
  revalidatePath(
    `/branches/${payload.branchSlug}/records/${payload.recordId}/distributions`
  );
  revalidatePath(`/branches/${payload.branchSlug}/budget`);
}

export type DeleteEventPayload = {
  branchSlug: string;
  recordId: string;
  eventId: string;
  designName: string;
};

/**
 * 회차 삭제. budget_logs 도 동일 정책으로 재계산.
 */
export async function deleteDistributionEventAction(
  payload: DeleteEventPayload
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

  const { error: deleteErr } = await supabase
    .from("distribution_events")
    .delete()
    .eq("id", payload.eventId)
    .eq("media_record_id", payload.recordId);
  if (deleteErr) throw deleteErr;

  await supabase
    .from("media_records")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.recordId);

  // budget_logs 재계산 (update 와 동일 로직)
  const yearMonth = currentYearMonth();
  await supabase
    .from("budget_logs")
    .delete()
    .eq("media_record_id", payload.recordId)
    .eq("year_month", yearMonth)
    .like("memo", "[D-OOH%");

  const { data: events } = await supabase
    .from("distribution_events")
    .select("cost, distributed_on")
    .eq("media_record_id", payload.recordId);
  const monthEvents = ((events ?? []) as { cost: number | null; distributed_on: string }[])
    .filter((e) => e.distributed_on?.startsWith(yearMonth));
  const totalCost = monthEvents.reduce((s, e) => s + (e.cost ?? 0), 0);
  if (totalCost > 0) {
    await supabase.from("budget_logs").insert({
      branch_id: branchId,
      media_record_id: payload.recordId,
      amount: totalCost,
      memo: `[D-OOH ${yearMonth} 회차 합계] ${payload.designName}`,
      year_month: yearMonth,
    });
  }

  revalidatePath(`/branches/${payload.branchSlug}`);
  revalidatePath(
    `/branches/${payload.branchSlug}/records/${payload.recordId}/distributions`
  );
  revalidatePath(`/branches/${payload.branchSlug}/budget`);
}
