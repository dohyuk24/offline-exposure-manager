export default function RankingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">점수판 · 랭킹</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          이번 달 전 지점 랭킹 — 상위 3개 공개, 이하는 어드민 전용
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-12 text-center text-sm text-[var(--color-text-tertiary)]">
        상위 3개 지점 점수 카드가 여기에 들어옵니다.
      </section>
    </div>
  );
}
