"use client";

import { useState, useTransition } from "react";

import type { DistributionEvent } from "@/types";
import {
  deleteDistributionEventAction,
  updateDistributionEventAction,
  type UpdateEventPayload,
} from "@/lib/distribution/actions";

type Props = {
  event: DistributionEvent;
  branchSlug: string;
  recordId: string;
  designName: string;
  /** 디자인 사진 (전 회차 공통). 없으면 fallback 썸네일. */
  photo?: string;
};

export function DistributionEventRow({
  event,
  branchSlug,
  recordId,
  designName,
  photo,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [distributedOn, setDistributedOn] = useState(event.distributed_on);
  const [locationLabel, setLocationLabel] = useState(event.location_label ?? "");
  const [quantity, setQuantity] = useState(
    event.quantity != null ? String(event.quantity) : ""
  );
  const [cost, setCost] = useState(event.cost != null ? String(event.cost) : "");
  const [memo, setMemo] = useState(event.memo ?? "");
  const [flyerTitle, setFlyerTitle] = useState(event.flyer_title ?? "");

  function reset() {
    setDistributedOn(event.distributed_on);
    setLocationLabel(event.location_label ?? "");
    setQuantity(event.quantity != null ? String(event.quantity) : "");
    setCost(event.cost != null ? String(event.cost) : "");
    setMemo(event.memo ?? "");
    setFlyerTitle(event.flyer_title ?? "");
    setErrorMessage(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!distributedOn) {
      setErrorMessage("배포일을 입력해주세요");
      return;
    }
    setErrorMessage(null);

    const payload: UpdateEventPayload = {
      branchSlug,
      recordId,
      eventId: event.id,
      designName,
      distributedOn,
      locationLabel,
      quantity,
      cost,
      memo,
      flyerTitle,
    };
    startTransition(async () => {
      try {
        await updateDistributionEventAction(payload);
        setEditing(false);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(
      `${event.distributed_on} 회차를 삭제할까요? 되돌릴 수 없어요.`
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteDistributionEventAction({
          branchSlug,
          recordId,
          eventId: event.id,
          designName,
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="배포일">
              <input
                type="date"
                value={distributedOn}
                onChange={(e) => setDistributedOn(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="수량 (장)">
              <input
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="배포지">
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="전단 제목">
            <input
              type="text"
              value={flyerTitle}
              onChange={(e) => setFlyerTitle(e.target.value)}
              placeholder="예: 5월 회원 모집 / 그랜드 오픈 안내"
              disabled={isPending}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="비용 (원)">
              <input
                type="number"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="메모">
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          {errorMessage ? (
            <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
              {errorMessage}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                reset();
                setEditing(false);
              }}
              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="ml-auto rounded-md border border-[#C4332F]/30 bg-white px-3 py-1.5 text-xs text-[#C4332F] hover:bg-[#FFE2DD]/40"
            >
              삭제
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          className="h-14 w-14 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-secondary)] text-[10px] text-[var(--color-text-tertiary)]">
          📄
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-medium tabular-nums text-[var(--color-text-secondary)]">
            {event.distributed_on}
          </span>
          {event.quantity ? (
            <span className="text-[12px] text-[var(--color-text-tertiary)]">
              · {event.quantity.toLocaleString("ko-KR")}장
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-text-primary)]">
          {event.location_label || "(배포지 미기재)"}
        </p>
        {event.flyer_title ? (
          <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-tertiary)]">전단</span>{" "}
            {event.flyer_title}
          </p>
        ) : null}
        {event.cost ? (
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            비용 {event.cost.toLocaleString("ko-KR")}원
          </p>
        ) : null}
        {event.memo ? (
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            {event.memo}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 self-start rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
      >
        수정
      </button>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
