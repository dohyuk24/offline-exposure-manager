type ConnectionErrorProps = {
  title?: string;
  detail?: string;
};

/**
 * Supabase 연결 실패 시 노출하는 폴백 카드.
 * v1 단계에서 .env.local 미설정 상태로 페이지 진입할 때 가이드를 보여준다.
 */
export function ConnectionError({
  title = "데이터에 연결할 수 없어요",
  detail,
}: ConnectionErrorProps) {
  return (
    <div className="rounded-lg border border-dashed border-[#C4332F]/40 bg-[#FFE2DD]/40 p-6 text-sm">
      <p className="mb-2 text-[15px] font-medium text-[#C4332F]">{title}</p>
      <p className="mb-3 text-[var(--color-text-secondary)]">
        <code className="rounded bg-white px-1 py-0.5 text-xs">.env.local</code>
        에 Supabase 환경변수가 설정돼 있는지 확인해주세요.
      </p>
      <ul className="list-disc pl-5 text-xs text-[var(--color-text-tertiary)]">
        <li>
          <code>NEXT_PUBLIC_SUPABASE_URL</code>
        </li>
        <li>
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        </li>
      </ul>
      {detail ? (
        <pre className="mt-3 overflow-auto rounded bg-white/60 p-2 text-[11px] text-[var(--color-text-tertiary)]">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
