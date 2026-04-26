"use client";

import { useState, useTransition } from "react";

import {
  addDistributionEventAction,
  type AddEventPayload,
} from "@/lib/distribution/actions";

type Props = {
  branchSlug: string;
  recordId: string;
  designName: string;
};

/**
 * 기존 D-OOH 디자인에 회차 추가. timeline 페이지 상단에 inline 노출.
 */
export function DistributionEventForm({
  branchSlug,
  recordId,
  designName,
}: Props) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [distributedOn, setDistributedOn] = useState(todayStr);
  const [locationLabel, setLocationLabel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [memo, setMemo] = useState("");
  const [flyerTitle, setFlyerTitle] = useState("");
  const [open, setOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!distributedOn) {
      setErrorMessage("배포일을 입력해주세요");
      return;
    }
    setErrorMessage(null);

    const payload: AddEventPayload = {
      branchSlug,
      recordId,
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
        await addDistributionEventAction(payload);
        // 성공 시 form reset + 닫기
        setLocationLabel("");
        setQuantity("");
        setCost("");
        setMemo("");
        setFlyerTitle("");
        setOpen(false);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]"
      >
        + 새 회차 추가
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-[var(--color-border)] bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">새 회차</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="text-xs text-[var(--color-text-tertiary)] hover:underline"
        >
          접기
        </button>
      </div>

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
            placeholder="예: 1500"
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
          placeholder="예: 강남대로 일대"
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
        <Field label="비용 (원, 옵션)">
          <input
            type="number"
            inputMode="numeric"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="메모 (옵션)">
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "추가 중..." : "회차 추가"}
      </button>
    </form>
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
