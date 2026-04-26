import { unstable_cache } from "next/cache";

import type { MediaRecord } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

/** media 변경 시 invalidate. 매체 등록/수정/삭제 actions 에서 revalidateTag(MEDIA_CACHE_TAG). */
export const MEDIA_CACHE_TAG = "media";

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
export type DiscoveryFeedItem = {
  record_id: string;
  branch_name: string;
  branch_slug: string;
  media_type: string;
  description: string | null;
  created_at: string;
};

/**
 * 이번 달 신규 발굴 피드.
 * 홈 대시보드 · 상단 발견 피드 배너에서 사용.
 * count 는 범위 내 전체 건수, items 는 상위 limit 건.
 */
export const getDiscoveryFeed = unstable_cache(
  async (
    yearMonth: string,
    limit = 5
  ): Promise<{ items: DiscoveryFeedItem[]; totalCount: number }> => {
    const supabase = await createServerSupabase();
    const { data, error, count } = await supabase
      .from("media_records")
      .select(
        "id, media_type, description, created_at, branches!inner(name, slug)",
        { count: "exact" }
      )
      .eq("is_new_discovery", true)
      .gte("created_at", `${yearMonth}-01T00:00:00Z`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const items: DiscoveryFeedItem[] = (data ?? []).map((row) => {
      const b = row.branches as unknown as
        | { name: string; slug: string }
        | { name: string; slug: string }[];
      const branch = Array.isArray(b) ? b[0] : b;
      return {
        record_id: (row as { id: string }).id,
        branch_name: branch.name,
        branch_slug: branch.slug,
        media_type: (row as { media_type: string }).media_type,
        description: (row as { description: string | null }).description,
        created_at: (row as { created_at: string }).created_at,
      };
    });

    return { items, totalCount: count ?? 0 };
  },
  ["media:discovery-feed"],
  { tags: [MEDIA_CACHE_TAG], revalidate: 600 }
);

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
