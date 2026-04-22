/**
 * 현재 시각 기준 'YYYY-MM' 문자열. 예: '2026-04'
 * score_logs · budget_logs 의 year_month 컬럼 포맷과 일치.
 */
export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
