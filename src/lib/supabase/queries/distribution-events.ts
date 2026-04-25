import type { DistributionEvent, MediaRecord } from "@/types";
import { MEDIA_CATEGORY } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

/** 디자인 1건의 모든 회차 (최신순). */
export async function listEventsByRecord(
  recordId: string
): Promise<DistributionEvent[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("distribution_events")
    .select("*")
    .eq("media_record_id", recordId)
    .order("distributed_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DistributionEvent[];
}

export type DesignSummary = {
  record: MediaRecord;
  totalQuantity: number;
  eventCount: number;
  lastDistributedOn: string | null;
};

/** 지점의 D-OOH 디자인 + 회차 집계. 디자인 카드 그리드용. */
export async function listDesignsForBranch(
  branchId: string
): Promise<DesignSummary[]> {
  const supabase = await createServerSupabase();

  const { data: records, error: recErr } = await supabase
    .from("media_records")
    .select("*")
    .eq("branch_id", branchId)
    .eq("category", MEDIA_CATEGORY.DISTRIBUTION)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (recErr) throw recErr;

  const designs = (records ?? []) as MediaRecord[];
  if (designs.length === 0) return [];

  const { data: events, error: evErr } = await supabase
    .from("distribution_events")
    .select("media_record_id, quantity, distributed_on")
    .in(
      "media_record_id",
      designs.map((r) => r.id)
    );
  if (evErr) throw evErr;

  type EventRow = {
    media_record_id: string;
    quantity: number | null;
    distributed_on: string;
  };

  const totals = new Map<
    string,
    { qty: number; count: number; last: string | null }
  >();
  for (const ev of (events ?? []) as EventRow[]) {
    const e = totals.get(ev.media_record_id) ?? { qty: 0, count: 0, last: null };
    e.qty += ev.quantity ?? 0;
    e.count += 1;
    if (!e.last || ev.distributed_on > e.last) e.last = ev.distributed_on;
    totals.set(ev.media_record_id, e);
  }

  return designs.map((record) => {
    const e = totals.get(record.id);
    return {
      record,
      totalQuantity: e?.qty ?? 0,
      eventCount: e?.count ?? 0,
      lastDistributedOn: e?.last ?? null,
    };
  });
}
