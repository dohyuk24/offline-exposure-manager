"use client";

import { useState, useTransition } from "react";

import type { DailyTaskType } from "@/types";
import { DAILY_TASK_TYPE, TASK_MANUAL_CHECK_ALLOWED } from "@/types";
import type { DailyTaskWithRecord } from "@/lib/supabase/queries/daily-tasks";
import { manualCompleteTaskAction } from "@/lib/daily-tasks/actions";

type Props = {
  branchSlug: string;
  tasks: DailyTaskWithRecord[];
  /** 서버에서 today 를 넘겨주면 라벨 일관성 유지. 없으면 클라이언트 today */
  todayIso?: string;
};

const TASK_TITLE: Record<DailyTaskType, string> = {
  unofficial_update: "자체 보유 매체 사진 갱신",
  posting_ending: "게시 종료 임박",
  negotiating_followup: "협의중 매체 후속 액션",
  discovery_zero: "이번 달 신규 발굴 0건",
  barter_progress: "바터제휴 진행 체크",
};

const TASK_SCORE_RULE: Record<DailyTaskType, { complete: number; expire: number }> = {
  unofficial_update: { complete: 1, expire: -5 },
  posting_ending: { complete: 1, expire: -5 },
  negotiating_followup: { complete: 1, expire: -5 },
  discovery_zero: { complete: 5, expire: -5 },
  barter_progress: { complete: 7, expire: -5 },
};

export function DailyTaskCard({ branchSlug, tasks: initial, todayIso }: Props) {
  const [tasks, setTasks] = useState<DailyTaskWithRecord[]>(initial);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const today = todayIso ? new Date(todayIso) : new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;

  function handleCheck(taskId: string) {
    setPendingId(taskId);
    // optimistic — 즉시 done 으로
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "done" as const,
              completed_at: new Date().toISOString(),
              completed_by: "manual" as const,
            }
          : t
      )
    );
    startTransition(async () => {
      const result = await manualCompleteTaskAction(taskId, branchSlug);
      if (!result.ok) {
        // 실패 시 revert
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: "open" as const, completed_at: null, completed_by: null }
              : t
          )
        );
        alert(`완료 처리 실패: ${result.error}`);
      }
      setPendingId(null);
    });
  }

  if (total === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium">오늘의 할 일</h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {dateLabel}
          </span>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
          오늘은 할 일이 없어요 ☀️
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-medium">오늘의 할 일</h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {dateLabel} · 진척 {doneCount}/{total}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        <div className="h-1 w-full bg-[var(--color-bg-secondary)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>

        <ul className="divide-y divide-[var(--color-border)]">
          {tasks.map((task) => {
            const isDone = task.status === "done";
            const canManual =
              TASK_MANUAL_CHECK_ALLOWED[task.task_type] && !isDone;
            const wasAuto = isDone && task.completed_by === "auto";
            const tooltipOpen = openTooltip === task.id;
            const rule = TASK_SCORE_RULE[task.task_type];

            return (
              <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  disabled={!canManual || pendingId === task.id}
                  onClick={() => canManual && handleCheck(task.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                    isDone
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] bg-white"
                  } ${
                    canManual
                      ? "cursor-pointer hover:border-[var(--color-accent)]"
                      : "cursor-default"
                  } ${pendingId === task.id ? "opacity-50" : ""}`}
                  aria-label={isDone ? "완료됨" : "완료 처리"}
                  title={
                    wasAuto
                      ? "액션으로 자동 완료됨"
                      : isDone
                        ? "완료됨"
                        : canManual
                          ? "클릭으로 완료 처리"
                          : "자동 완료 task (매체 액션 시 자동 처리)"
                  }
                >
                  {isDone ? "✓" : ""}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm ${
                        isDone
                          ? "text-[var(--color-text-tertiary)] line-through"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {TASK_TITLE[task.task_type]}
                    </span>

                    {!isDone && task.carry_over_count >= 1 ? (
                      <span className="rounded-full bg-[#FFE2DD] px-2 py-0.5 text-[10px] font-medium text-[#C4332F]">
                        ⚠ {task.carry_over_count + 1}일째 미처리
                      </span>
                    ) : null}

                    {wasAuto ? (
                      <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        자동 완료
                      </span>
                    ) : null}
                  </div>

                  {renderDetail(task) ? (
                    <p
                      className={`mt-0.5 text-xs ${
                        isDone
                          ? "text-[var(--color-text-tertiary)] line-through"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {renderDetail(task)}
                    </p>
                  ) : null}
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTooltip(tooltipOpen ? null : task.id)
                    }
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    aria-label="점수 룰 보기"
                  >
                    i
                  </button>

                  {tooltipOpen ? (
                    <div className="absolute right-0 top-7 z-10 w-56 rounded-md border border-[var(--color-border)] bg-white p-3 text-[11px] shadow-lg">
                      <p className="mb-2 font-medium text-[var(--color-text-primary)]">
                        점수 규칙
                      </p>
                      <div className="space-y-1 text-[var(--color-text-secondary)]">
                        <div className="flex justify-between">
                          <span>완료 시</span>
                          <span className="font-medium text-[#1F8B4C]">
                            +{rule.complete}점
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>7일 미처리</span>
                          <span className="font-medium text-[#C4332F]">
                            {rule.expire}점
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenTooltip(null)}
                        className="mt-2 text-[10px] text-[var(--color-text-tertiary)] underline"
                      >
                        닫기
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-[11px] text-[var(--color-text-tertiary)]">
          <span>
            {pending ? "처리 중..." : "액션 시 자동 완료. 모호한 항목만 체크해주세요."}
          </span>
          <a
            href="/guide/scoring"
            className="text-[var(--color-text-secondary)] underline"
          >
            점수 룰 자세히
          </a>
        </div>
      </div>
    </section>
  );
}

function renderDetail(task: DailyTaskWithRecord): string {
  if (task.task_type === DAILY_TASK_TYPE.DISCOVERY_ZERO) {
    return "순회 시 후보 1개 등록해보세요";
  }
  const r = task.related_record;
  if (!r) return "";
  const label = r.description?.trim() ? r.description : r.media_type;

  if (task.task_type === DAILY_TASK_TYPE.POSTING_ENDING && r.end_date) {
    const endDate = new Date(r.end_date);
    const today = new Date();
    const days = Math.max(
      0,
      Math.ceil(
        (endDate.getTime() -
          new Date(today.getFullYear(), today.getMonth(), today.getDate())
            .getTime()) /
          86_400_000
      )
    );
    return `${label} · ${r.end_date} 종료 (D-${days})`;
  }

  return label;
}
