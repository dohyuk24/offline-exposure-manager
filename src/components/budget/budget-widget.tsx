type BudgetWidgetProps = {
  /** 월 할당 예산 (원) */
  allocated: number;
  /** 이번 달 사용액 (원) */
  used: number;
};

/**
 * 예산 위젯 — DESIGN.md 섹션 8.
 * 80% 이상 경고색, 100% 초과 시 "예산 초과" 표시.
 */
export function BudgetWidget({ allocated, used }: BudgetWidgetProps) {
  const ratio = allocated > 0 ? used / allocated : 0;
  const percent = Math.round(ratio * 100);
  const remaining = allocated - used;
  const isOver = used > allocated;
  const isWarning = ratio >= 0.8;

  const barColor = isOver
    ? "#C4332F"
    : isWarning
      ? "#C4332F"
      : "var(--color-accent)";
  const trackWidth = Math.min(100, Math.max(0, percent));

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
      <p className="mb-3 text-sm font-medium text-[var(--color-text-primary)]">
        이번 달 예산
      </p>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${trackWidth}%`, backgroundColor: barColor }}
        />
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">
        사용 {formatKrw(used)} / 할당 {formatKrw(allocated)}
      </p>
      <p
        className={`mt-1 text-sm ${isOver ? "text-[#C4332F]" : "text-[var(--color-text-tertiary)]"}`}
      >
        {isOver
          ? `예산 초과 ${formatKrw(Math.abs(remaining))}`
          : `잔액 ${formatKrw(remaining)} 남음 (${percent}%)`}
      </p>
    </div>
  );
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}
