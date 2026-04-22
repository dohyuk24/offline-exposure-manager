import type { MediaRecord } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function listMediaByBranch(
  branchId: string
): Promise<MediaRecord[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("media_records")
    .select("*")
    .eq("branch_id", branchId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MediaRecord[];
}

export async function getMediaRecord(id: string): Promise<MediaRecord | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("media_records")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as MediaRecord | null;
}

/**
 * 같은 location_key 를 공유하는 레코드 히스토리.
 * 최신순 정렬. `excludeId` 지정 시 해당 레코드는 제외.
 */
export async function listMediaHistory(
  locationKey: string | null | undefined,
  excludeId?: string
): Promise<MediaRecord[]> {
  // location_key 가 없는 레코드는 히스토리 그룹이 없음 (마이그레이션 미적용 등).
  if (!locationKey) return [];

  const supabase = await createServerSupabase();
  let query = supabase
    .from("media_records")
    .select("*")
    .eq("location_key", locationKey)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaRecord[];
}
