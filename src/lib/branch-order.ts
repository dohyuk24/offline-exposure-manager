/**
 * 지점 노출 순서 — 사용자 운영 우선순위 기준 14개.
 *
 * 적용 위치:
 *   - 사이드바 / 모바일 탭바 지점 목록
 *   - /branches 모든 지점 그리드
 *   - 홈 페이지 지점 현황 카드
 *   - 어드민 지점 테이블
 *
 * 적용 안 함:
 *   - /ranking — 점수순 그대로
 *
 * 변경: 이 배열만 수정하면 모든 노출 위치 동기화.
 * 14개 외 지점이 있으면 (마이그레이션 잔재 등) 배열 뒤로 이동.
 */
export const BRANCH_DISPLAY_ORDER: readonly string[] = [
  "yeoksam-arc",
  "dogok",
  "sindorim",
  "nonhyeon",
  "pangyo",
  "gangbyeon",
  "gasan",
  "samsung",
  "gwanghwamun",
  "hanti",
  "magok",
  "pangyo-venture",
  "yeoksam-gfc",
  "hapjeong",
];

const ORDER_INDEX: Map<string, number> = new Map(
  BRANCH_DISPLAY_ORDER.map((slug, i) => [slug, i])
);

/**
 * 지점 배열을 사용자 운영 순서로 정렬. 미명시 지점은 뒤로 (이름순).
 * 입력 배열 변형 X — 새 배열 반환.
 */
export function sortBranchesByDisplayOrder<T extends { slug: string; name: string }>(
  branches: T[]
): T[] {
  return [...branches].sort((a, b) => {
    const ai = ORDER_INDEX.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = ORDER_INDEX.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, "ko");
  });
}
