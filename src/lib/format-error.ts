/**
 * Supabase 에러 등 non-Error 객체도 JSON 으로 직렬화해서
 * "[object Object]" 가 노출되지 않도록 한다.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return Object.prototype.toString.call(err);
    }
  }
  return String(err);
}
