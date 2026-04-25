import { SCORE_CONFIG } from "@/types";

export const metadata = {
  title: "점수 룰 — 오프라인 매체 관리",
};

export default function ScoringGuidePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          가이드
        </p>
        <h1 className="text-[20px] font-semibold">점수 룰</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          데일리 할 일을 처리하면 점수가 쌓이고, 7일 미처리 시 차감돼요.
        </p>
      </header>

      <Section title="작동 방식">
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>
            <Strong>1. 매일 새벽 03:00</Strong> 시스템이 지점별로 처리해야 할
            할 일을 자동 생성해요.
          </li>
          <li>
            <Strong>2. 평일 14:00</Strong> 지정 슬랙 채널에 그날의 할 일이
            알림으로 가요.
          </li>
          <li>
            <Strong>3. 매체 액션</Strong> (사진 추가 · 상태 변경 · 신규 등록)
            을 하면 관련 할 일이 자동으로 완료 처리돼요.
          </li>
          <li>
            <Strong>4. 모호한 항목</Strong> 은 위젯의 체크박스로 직접 완료
            처리할 수 있어요.
          </li>
          <li>
            <Strong>5. 7일 동안 처리 안 된 할 일</Strong> 은 만료되면서 점수가
            차감돼요.
          </li>
        </ul>
      </Section>

      <Section title="점수표">
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-secondary)] text-left text-xs text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-3 py-2 font-medium">이벤트</th>
                <th className="px-3 py-2 font-medium">설명</th>
                <th className="px-3 py-2 text-right font-medium">점수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white">
              <ScoreRow
                label="일반 할 일 완료"
                desc="비공식 매체 업데이트 · 게시 종료 임박 처리 · 협의중 후속 액션"
                score={SCORE_CONFIG.TASK_COMPLETE}
              />
              <ScoreRow
                label="신규 발굴 완료"
                desc="이번 달 신규 발굴 0건 알림이 떴을 때 후보 1개 등록"
                score={SCORE_CONFIG.TASK_DISCOVERY_COMPLETE}
              />
              <ScoreRow
                label="바터제휴 진행 완료"
                desc="협의중 → 게시중·협의완료·실패 등으로 상태 변경"
                score={SCORE_CONFIG.TASK_BARTER_COMPLETE}
              />
              <ScoreRow
                label="할 일 만료 (7일 미처리)"
                desc="새벽 시스템이 자동으로 만료 처리. 점수 차감."
                score={SCORE_CONFIG.TASK_EXPIRED}
                negative
              />
              <ScoreRow
                label="자발 보너스"
                desc="할 일이 안 떴는데 자발적으로 신규 발굴을 등록한 경우"
                score={SCORE_CONFIG.BONUS_ACTION}
              />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="할 일 종류">
        <div className="space-y-3">
          <TaskType
            title="비공식 매체 업데이트"
            trigger="비공식 + 게시중 매체가 7일 이상 업데이트 안 됐을 때"
            complete="해당 매체에 사진 추가 또는 상태 변경"
            scoreOnComplete={SCORE_CONFIG.TASK_COMPLETE}
          />
          <TaskType
            title="게시 종료 임박"
            trigger="게시중 매체의 종료일이 3일 이내일 때"
            complete="후속 매체 등록 또는 상태를 게시종료로 변경"
            scoreOnComplete={SCORE_CONFIG.TASK_COMPLETE}
          />
          <TaskType
            title="협의중 매체 후속 액션"
            trigger="협의중 상태가 14일 이상 지속될 때"
            complete="상태를 협의완료 / 협의실패 / 게시중 등으로 변경"
            scoreOnComplete={SCORE_CONFIG.TASK_COMPLETE}
          />
          <TaskType
            title="이번 달 신규 발굴 0건"
            trigger="이번 달 신규 발굴이 0건이면서 오늘이 15일 이후일 때"
            complete="신규 발굴 매체 1건 이상 등록"
            scoreOnComplete={SCORE_CONFIG.TASK_DISCOVERY_COMPLETE}
            autoOnly
          />
          <TaskType
            title="바터제휴 진행 체크"
            trigger="바터제휴배너 매체가 협의중 상태일 때"
            complete="해당 매체의 상태를 다른 값으로 변경"
            scoreOnComplete={SCORE_CONFIG.TASK_BARTER_COMPLETE}
          />
        </div>
      </Section>

      <Section title="자주 묻는 것">
        <div className="space-y-4">
          <Faq q="자동 완료가 안 됐어요. 직접 체크해도 되나요?">
            대부분의 할 일은 위젯에서 체크박스로 직접 완료 처리할 수 있어요.
            단, &ldquo;신규 발굴 0건&rdquo; 항목은 실제로 매체를 등록해야만
            완료돼요 (자동 전용).
          </Faq>
          <Faq q="만료까지 계속 N일째 라벨이 늘어나는데 어떻게 해요?">
            처리하지 않으면 매일 카운트가 1씩 올라가요. 7일을 넘기면 자동
            만료되면서 −5점이 차감돼요. 부담스러우면 모호한 항목은 체크박스로
            먼저 완료 처리하고 나중에 실제 액션을 해도 돼요.
          </Faq>
          <Faq q="할 일이 없는 날도 있어요?">
            네. 트리거 조건에 해당하는 매체가 없으면 그날은 할 일이 0건이에요.
            이 경우 슬랙 알림도 가지 않아요.
          </Faq>
          <Faq q="점수는 어디서 볼 수 있나요?">
            지점 페이지의 &ldquo;이번 달 점수&rdquo; 섹션에서 누적 점수를 볼 수
            있고, 홈의 &ldquo;Top 3&rdquo; 와 점수판 페이지에서 전체 지점 랭킹을
            볼 수 있어요.
          </Faq>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-[var(--color-text-primary)]">
      {children}
    </span>
  );
}

function ScoreRow({
  label,
  desc,
  score,
  negative,
}: {
  label: string;
  desc: string;
  score: number;
  negative?: boolean;
}) {
  return (
    <tr>
      <td className="px-3 py-2.5 align-top font-medium text-[var(--color-text-primary)]">
        {label}
      </td>
      <td className="px-3 py-2.5 align-top text-[13px] text-[var(--color-text-secondary)]">
        {desc}
      </td>
      <td
        className={`px-3 py-2.5 text-right align-top font-semibold ${
          negative ? "text-[#C4332F]" : "text-[#1F8B4C]"
        }`}
      >
        {score > 0 ? `+${score}` : score}
      </td>
    </tr>
  );
}

function TaskType({
  title,
  trigger,
  complete,
  scoreOnComplete,
  autoOnly,
}: {
  title: string;
  trigger: string;
  complete: string;
  scoreOnComplete: number;
  autoOnly?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {autoOnly ? (
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
              자동 전용
            </span>
          ) : null}
          <span className="text-xs font-semibold text-[#1F8B4C]">
            +{scoreOnComplete}점
          </span>
        </div>
      </div>
      <dl className="mt-2 space-y-1 text-[13px]">
        <Row label="언제 떠요?" value={trigger} />
        <Row label="어떻게 완료?" value={complete} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="text-[var(--color-text-secondary)]">{value}</dd>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--color-border)] bg-white p-3">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]">
        {q}
      </summary>
      <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
        {children}
      </p>
    </details>
  );
}
