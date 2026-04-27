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
 * 'YYYY-MM-DD' 문자열 (KST 기준). daily_tasks.generated_for/expires_at 포맷.
 *
 * cron 이 03:00 KST = 18:00 UTC 에 도는데 서버가 UTC 라
 * 로컬 필드를 그대로 쓰면 '하루 전 UTC 날짜' 가 저장되는 문제가 있어
 * 항상 KST 기준 날짜로 직렬화한다.
 */
export function formatYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 날짜에 N일을 더한 새 Date. */
export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** 두 날짜의 자정 기준 일수 차이 (b - a). */
export function daysBetween(a: Date, b: Date): number {
  const aDay = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bDay = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((bDay - aDay) / 86_400_000);
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
