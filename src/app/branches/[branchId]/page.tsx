type BranchPageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchPage({ params }: BranchPageProps) {
  const { branchId } = await params;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          지점
        </p>
        <h1 className="text-[20px] font-semibold">{branchId}</h1>
      </header>

      <section className="space-y-2">
        <h2 className="text-[15px] font-medium">공식매체 (OOH)</h2>
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
          공식매체 현황 · 제안 리스트
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-medium">비공식매체 · 자체보유</h2>
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
          매체 카드 그리드
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-medium">예산</h2>
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
          예산 위젯
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-medium">이번 달 점수</h2>
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
          점수 위젯
        </div>
      </section>
    </div>
  );
}
