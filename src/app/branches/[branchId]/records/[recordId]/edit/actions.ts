"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { Branch, MediaRecord } from "@/types";
import { MEDIA_CATEGORY } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";
import { currentYearMonth } from "@/lib/date";
import { autoCompleteForRecord } from "@/lib/daily-tasks/auto-complete";

export type UpdateMediaPayload = {
  recordId: string;
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
  photos: string[];
};

/**
 * 기존 매체 레코드 수정.
 * 점수는 변동하지 않는다 (단순 보정).
 * 예산 로그는 cost 변경 시 기존 로그를 upsert.
 */
export async function updateMediaAction(
  payload: UpdateMediaPayload
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

  const costNum = parseInt(payload.cost || "0", 10) || 0;

  const { data: updatedRow, error: updateErr } = await supabase
    .from("media_records")
    .update({
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
      is_new_discovery: payload.is_new_discovery,
      photos: payload.photos ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.recordId)
    .eq("branch_id", branch.id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 수정된 record 의 트리거가 더 이상 만족 안 되는 open task 자동 완료.
  if (updatedRow) await autoCompleteForRecord(updatedRow as MediaRecord);

  // 예산 로그 동기화 — 이번 달에 해당 레코드로 기록된 로그만 재계산.
  const yearMonth = currentYearMonth();
  await supabase
    .from("budget_logs")
    .delete()
    .eq("media_record_id", payload.recordId)
    .eq("year_month", yearMonth);

  const shouldLogBudget =
    costNum > 0 &&
    (payload.category === MEDIA_CATEGORY.OWNED ||
      payload.category === MEDIA_CATEGORY.UNOFFICIAL);
  if (shouldLogBudget) {
    await supabase.from("budget_logs").insert({
      branch_id: branch.id,
      media_record_id: payload.recordId,
      amount: costNum,
      memo: payload.description || null,
      year_month: yearMonth,
    });
  }

  revalidatePath(`/branches/${branch.slug}`);
  revalidatePath("/branches");
  revalidatePath("/");

  redirect(
    `/branches/${branch.slug}?feedback=${encodeURIComponent("수정 완료했어요")}`
  );
}

/**
 * 소프트 딜리트 — deleted_at 세팅 + 관련 예산 로그 제거.
 * 점수 로그는 히스토리 보존 차원에서 유지.
 */
export async function deleteMediaAction(payload: {
  recordId: string;
  branchSlug: string;
}): Promise<void> {
  const supabase = await createServerSupabase();

  const { data: branchRow, error: branchErr } = await supabase
    .from("branches")
    .select("id, slug")
    .eq("slug", payload.branchSlug)
    .maybeSingle();
  if (branchErr) throw branchErr;
  if (!branchRow) throw new Error("지점을 찾을 수 없어요");

  const { data: deletedRow, error: updateErr } = await supabase
    .from("media_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", payload.recordId)
    .eq("branch_id", (branchRow as { id: string }).id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  // 삭제된 매체에 걸린 open task 도 자동 완료 (deleted_at 이 트리거를 false 로)
  if (deletedRow) await autoCompleteForRecord(deletedRow as MediaRecord);

  // 이번 달 관련 예산 로그 정리 (추후 월간 집계 오염 방지)
  const yearMonth = currentYearMonth();
  await supabase
    .from("budget_logs")
    .delete()
    .eq("media_record_id", payload.recordId)
    .eq("year_month", yearMonth);

  revalidatePath(`/branches/${payload.branchSlug}`);
  revalidatePath("/branches");
  revalidatePath("/");

  redirect(
    `/branches/${payload.branchSlug}?feedback=${encodeURIComponent("매체 삭제했어요")}`
  );
}
