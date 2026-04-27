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
  unofficial_update:
    "마지막 업데이트가 7일 지난 매체가 있어요. 오늘 한 장 새로 찍어 올려주세요!",
  posting_ending:
    "곧 게시가 끝나는 매체가 있네요. 연장이나 정리 한 번 살펴볼까요?",
  negotiating_followup:
    "아직 협의중인 매체가 있네요! 진행상황을 체크해볼까요?",
  discovery_zero:
    "이번 달 신규 발굴이 아직 없어요. 상권 둘러보고 후보를 찾아주세요!",
  barter_progress:
    "진행중인 제휴 건이 있어요. 다음 액션을 정리해두세요.",
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
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const today = todayIso ? new Date(todayIso) : new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const openCount = total - doneCount;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && openCount === 0;

  // 좌측 컬러 보더 — 미처리 있으면 amber/violet, 다 완료면 green
  const borderColor = allDone
    ? "#10b981"
    : openCount > 0
      ? "#5b5fd6"
      : "#9ca3af";

  function handleCheck(taskId: string) {
    setPendingId(taskId);
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

  // 자동 생성된 task 가 0건이어도 "오늘은 할 일 없음"으로 비워두지 않고
  // 가장 자주 해야 하는 활동을 추천 카드로 노출.
  if (total === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">오늘의 할 일</h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {dateLabel}
          </span>
        </div>
        <div
          className="rounded-xl border border-[var(--color-border)] bg-white p-4"
          style={{ borderLeft: "4px solid #10b981" }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-secondary)]">
              💡
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  매체 지면 한 번 확인해보고, 변화 있으면 사진 업데이트해주세요!
                </span>
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                  추천
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                급한 일은 없지만, 지면 한 바퀴 도는 건 늘 좋은 습관이에요.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium">오늘의 할 일</h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {dateLabel}
        </span>
      </div>

      <div
        className="rounded-xl border border-[var(--color-border)] bg-white"
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        {/* KPI strip — 미처리 / 완료 / 진척 */}
        <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
          <KpiCell
            label="미처리"
            value={openCount}
            tone={openCount > 0 ? "warn" : "muted"}
          />
          <KpiCell
            label="완료"
            value={doneCount}
            tone={doneCount > 0 ? "ok" : "muted"}
          />
          <KpiCell
            label="진척"
            value={`${percent}%`}
            tone={allDone ? "ok" : "accent"}
          />
        </div>

        {/* 진척 bar — 굵게 */}
        <div className="h-2 w-full bg-[var(--color-bg-secondary)]">
          <div
            className="h-full transition-all"
            style={{
              width: `${percent}%`,
              backgroundColor: allDone ? "#10b981" : "#5b5fd6",
            }}
          />
        </div>

        <ul className="divide-y divide-[var(--color-border)]">
          {tasks.map((task) => {
            const isDone = task.status === "done";
            const canManual =
              TASK_MANUAL_CHECK_ALLOWED[task.task_type] && !isDone;
            const wasAuto = isDone && task.completed_by === "auto";
            const rule = TASK_SCORE_RULE[task.task_type];
            const carryDays = task.carry_over_count + 1;
            const isOverdue = !isDone && task.carry_over_count >= 1;

            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  isOverdue ? "bg-[#fff8f0]" : ""
                }`}
              >
                <button
                  type="button"
                  disabled={!canManual || pendingId === task.id}
                  onClick={() => canManual && handleCheck(task.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm transition-colors ${
                    isDone
                      ? "border-[#10b981] bg-[#10b981] text-white"
                      : isOverdue
                        ? "border-[#d97706] bg-white"
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[14px] font-medium ${
                        isDone
                          ? "text-[var(--color-text-tertiary)] line-through"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {TASK_TITLE[task.task_type]}
                    </span>

                    {isOverdue ? (
                      <span className="rounded-md bg-[#d97706] px-2 py-0.5 text-[11px] font-semibold text-white">
                        ⚠ {carryDays}일째
                      </span>
                    ) : null}

                    {wasAuto ? (
                      <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        자동
                      </span>
                    ) : null}
                  </div>

                  {renderDetail(task) ? (
                    <p
                      className={`mt-1 text-[12px] ${
                        isDone
                          ? "text-[var(--color-text-tertiary)] line-through"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {renderDetail(task)}
                    </p>
                  ) : null}
                </div>

                <div className="group relative shrink-0">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] text-[11px] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]"
                    aria-label="점수 룰 보기"
                  >
                    i
                  </button>

                  <div className="pointer-events-none invisible absolute right-0 top-7 z-50 w-56 rounded-md border border-[var(--color-border)] bg-white p-3 text-[11px] opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                    <p className="mb-2 font-medium text-[var(--color-text-primary)]">
                      점수 규칙
                    </p>
                    <div className="space-y-1 text-[var(--color-text-secondary)]">
                      <div className="flex justify-between">
                        <span>완료 시</span>
                        <span className="font-medium text-[#10b981]">
                          +{rule.complete}점
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>7일 미처리</span>
                        <span className="font-medium text-[#dc2626]">
                          {rule.expire}점
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

      </div>
    </section>
  );
}

function KpiCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "ok" | "warn" | "accent" | "muted";
}) {
  const valueColor =
    tone === "ok"
      ? "text-[#10b981]"
      : tone === "warn"
        ? "text-[#d97706]"
        : tone === "accent"
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-tertiary)]";
  return (
    <div className="flex flex-col items-center justify-center px-3 py-3">
      <p className={`text-[22px] font-bold leading-none tabular-nums ${valueColor}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-[var(--color-text-tertiary)]">
        {label}
      </p>
    </div>
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
