export default function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">전체 현황</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          전 지점 오프라인 매체 현황 요약 — 마케팅실용 홈
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-12 text-center text-sm text-[var(--color-text-tertiary)]">
        전 지점 요약 카드 (활성 매체 수 · 업데이트 여부 · 예산 소진율)가 여기에
        들어옵니다.
      </section>
    </div>
  );
}
