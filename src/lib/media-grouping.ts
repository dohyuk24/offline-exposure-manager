import type { MediaRecord } from "@/types";

/**
 * 같은 location_key 를 공유하는 레코드 중 **최신 1건만** 남긴다.
 * 지점 페이지 카드 그리드에서 중복 노출을 방지하기 위함.
 * 정렬은 최신 updated_at 내림차순.
 */
export function groupByLocationLatest(
  records: MediaRecord[]
): MediaRecord[] {
  const byKey = new Map<string, MediaRecord>();
  for (const r of records) {
    const existing = byKey.get(r.location_key);
    if (!existing || r.created_at > existing.created_at) {
      byKey.set(r.location_key, r);
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at)
  );
}

/**
 * location_key 별로 레코드 개수를 센다. 히스토리 배지 표시용.
 */
export function countByLocation(
  records: MediaRecord[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.location_key, (map.get(r.location_key) ?? 0) + 1);
  }
  return map;
}
