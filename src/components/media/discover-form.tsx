"use client";

import { useState, useTransition } from "react";

import {
  MEDIA_CATEGORY,
  MEDIA_STATUS,
  MEDIA_TYPE_BY_CATEGORY,
  type MediaType,
} from "@/types";
import type { Branch } from "@/types";

import { PhotoUploader } from "./photo-uploader";
import {
  registerMediaAction,
  type RegisterMediaPayload,
} from "@/app/branches/[branchId]/new/actions";

export type DiscoverIntent = "paid" | "affiliated";

type Props = {
  branch: Branch;
  intent?: DiscoverIntent;
};

/**
 * 신규 매체 등록 컴팩트 폼.
 *
 * intent="paid" (기본): 공식매체 — status=아이디어 + is_new_discovery=true
 * intent="affiliated": 제휴매체 — status=협의중 + 제휴 조건 항상 노출
 */
export function DiscoverForm({ branch, intent = "paid" }: Props) {
  const isAffiliated = intent === "affiliated";
  const targetCategory = isAffiliated
    ? MEDIA_CATEGORY.AFFILIATED
    : MEDIA_CATEGORY.PAID;
  const targetStatus = isAffiliated
    ? MEDIA_STATUS.NEGOTIATING
    : MEDIA_STATUS.IDEA;
  const typeOptions = MEDIA_TYPE_BY_CATEGORY[targetCategory];
  const [photos, setPhotos] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>(typeOptions[0]);
  const [locationLabel, setLocationLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cost, setCost] = useState("");
  const [size, setSize] = useState("");
  const [barterCondition, setBarterCondition] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const photoMissing = photos.length === 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (photoMissing) {
      setErrorMessage("사진을 1장 이상 올려주세요");
      return;
    }
    setErrorMessage(null);

    // 위치 + 설명을 description 한 컬럼에 저장 (DB 스키마 변경 없이 통합)
    const description = [locationLabel.trim(), detail.trim()]
      .filter(Boolean)
      .join(" — ");

    const payload: RegisterMediaPayload = {
      branchSlug: branch.slug,
      category: targetCategory,
      media_type: mediaType,
      status: targetStatus,
      description,
      size,
      content_type: "",
      start_date: startDate,
      end_date: endDate,
      cost,
      barter_condition: barterCondition,
      is_new_discovery: !isAffiliated,
      photos,
    };

    startTransition(async () => {
      try {
        await registerMediaAction(payload);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const isBarter = mediaType === "바터제휴배너";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          사진 <span className="text-[#C4332F]">*</span>
        </label>
        <PhotoUploader
          value={photos}
          onChange={setPhotos}
          branchSlug={branch.slug}
          disabled={isPending}
        />
      </div>

      <Row
        label={
          <>
            종류 <span className="text-[#C4332F]">*</span>
          </>
        }
      >
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as MediaType)}
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        >
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Row>

      <Row label="위치">
        <input
          type="text"
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="예: 강남대로 sk자이 앞"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
          나중에 같은 위치를 다시 찾기 쉽게 적어주세요.
        </p>
      </Row>

      <Row label="설명">
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={
            isAffiliated
              ? "어떤 매체인지, 협의 배경 등 자유 메모"
              : "지면 특징, 주변 환경, 제약 등 자유 메모"
          }
          rows={3}
          disabled={isPending}
          className="w-full resize-y rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="계약 시작일">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Row>
        <Row label="계약 종료일">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Row>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Row label="사이즈">
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="예: 2m × 1m"
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Row>
        <Row label="비용 (원)">
          <input
            type="number"
            inputMode="numeric"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Row>
      </div>

      {isBarter || isAffiliated ? (
        <Row label={isAffiliated ? "주고받은 혜택" : "바터 조건"}>
          <input
            type="text"
            value={barterCondition}
            onChange={(e) => setBarterCondition(e.target.value)}
            placeholder={
              isAffiliated
                ? "예: 상호 노출 / 무료 PT 1회 제공"
                : "상호 제공 조건"
            }
            disabled={isPending}
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />
        </Row>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || photoMissing}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending
          ? "등록 중..."
          : isAffiliated
            ? "🤝 제휴매체 등록"
            : "✨ 공식매체 등록"}
      </button>

      <p className="text-center text-[11px] text-[var(--color-text-tertiary)]">
        {isAffiliated
          ? "제휴매체 · 상태=협의중 으로 자동 등록돼요. 카드에서 게시중·완료로 진행 변경하세요."
          : "공식매체 · 상태=아이디어 로 자동 등록돼요. 나중에 매체 카드에서 카테고리·상태를 바꿀 수 있어요."}
      </p>
    </form>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--color-text-primary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
