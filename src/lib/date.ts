/**
 * 현재 시각 기준 'YYYY-MM' 문자열. 예: '2026-04'
 * score_logs · budget_logs 의 year_month 컬럼 포맷과 일치.
 */
export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * 대략적인 "N 전" 문구. 발견 피드·알림 UI에서 사용.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return iso.slice(0, 10);
}
