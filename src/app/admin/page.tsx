export default function AdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">어드민</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          마케팅실 전용 · 비밀번호 인증
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-12 text-center text-sm text-[var(--color-text-tertiary)]">
        지점 관리 · 예산 설정 · 점수 기준 · Slack 설정 · 전체 랭킹
      </section>
    </div>
  );
}
