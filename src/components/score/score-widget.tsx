type ScoreWidgetProps = {
  totalScore: number;
  rank?: number;
  updateCount?: number;
  discoveryCount?: number;
  barterInProgress?: boolean;
};

/**
 * 점수 위젯 — DESIGN.md 섹션 9.
 */
export function ScoreWidget({
  totalScore,
  rank,
  updateCount = 0,
  discoveryCount = 0,
  barterInProgress,
}: ScoreWidgetProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          이번 달 점수
        </p>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {totalScore}점
          {typeof rank === "number" ? (
            <span className="ml-1 text-[var(--color-text-tertiary)]">
              · 전체 {rank}위
            </span>
          ) : null}
        </p>
      </div>

      <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
        <li className="flex justify-between">
          <span>업데이트 {updateCount}회</span>
          <span className="text-[var(--color-text-tertiary)]">
            +{updateCount}점
          </span>
        </li>
        <li className="flex justify-between">
          <span>신규 발굴 {discoveryCount}건</span>
          <span className="text-[var(--color-text-tertiary)]">
            +{discoveryCount * 5}점
          </span>
        </li>
        {barterInProgress ? (
          <li className="flex justify-between">
            <span>바터 진행 중</span>
            <span className="text-[var(--color-text-tertiary)]">
              (성사 시 +7점)
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
