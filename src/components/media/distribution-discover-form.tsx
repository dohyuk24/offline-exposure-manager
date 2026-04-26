"use client";

import { useState, useTransition } from "react";

import type { Branch } from "@/types";
import { MEDIA_TYPE } from "@/types";
import { PhotoUploader } from "./photo-uploader";
import {
  createDesignAndFirstEventAction,
  type CreateDesignAndEventPayload,
} from "@/lib/distribution/actions";

type Props = { branch: Branch };

const D_OOH_TYPES = [
  MEDIA_TYPE.LEAFLET,
  MEDIA_TYPE.SCROLL,
  MEDIA_TYPE.GUERILLA_BANNER,
  MEDIA_TYPE.ETC,
];

/**
 * D-OOH 신규 디자인 등록 + 첫 회차 동시 입력.
 * 사진(필수) + 디자인명(필수) + media_type + 첫 회차 정보.
 */
export function DistributionDiscoverForm({ branch }: Props) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [designName, setDesignName] = useState("");
  const [mediaType, setMediaType] = useState<string>(MEDIA_TYPE.LEAFLET);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [distributedOn, setDistributedOn] = useState(todayStr);
  const [locationLabel, setLocationLabel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [memo, setMemo] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (photos.length === 0) {
      setErrorMessage("디자인 사진을 1장 올려주세요");
      return;
    }
    if (!designName.trim()) {
      setErrorMessage("디자인 이름이 필요해요 (예: 봄 PT 프로모션)");
      return;
    }
    if (!distributedOn) {
      setErrorMessage("배포일을 입력해주세요");
      return;
    }

    setErrorMessage(null);

    const payload: CreateDesignAndEventPayload = {
      branchSlug: branch.slug,
      designName: designName.trim(),
      mediaType,
      photo: photos[0],
      distributedOn,
      locationLabel,
      quantity,
      cost,
      memo,
    };

    startTransition(async () => {
      try {
        await createDesignAndFirstEventAction(payload);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SectionHeader title="디자인" />

      <Row label={<>디자인 사진 <span className="text-[#C4332F]">*</span></>}>
        <PhotoUploader
          value={photos}
          onChange={setPhotos}
          branchSlug={branch.slug}
          disabled={isPending}
        />
      </Row>

      <Row label={<>디자인 이름 <span className="text-[#C4332F]">*</span></>}>
        <input
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="예: 봄 PT 프로모션 전단지"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <Row label="종류">
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        >
          {D_OOH_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Row>

      <Row label={<>배포일 <span className="text-[#C4332F]">*</span></>}>
        <input
          type="date"
          value={distributedOn}
          onChange={(e) => setDistributedOn(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <Row label="배포지">
        <input
          type="text"
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="예: 강남대로 일대"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <Row label="수량 (장 / 매)">
        <input
          type="number"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="예: 1500"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <Row label="비용 (원, 옵션)">
        <input
          type="number"
          inputMode="numeric"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="인쇄/인건비"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      <Row label="메모 (옵션)">
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="배포 이슈, 반응 등"
          disabled={isPending}
          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        />
      </Row>

      {errorMessage ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "등록 중..." : "디자인 + 첫 회차 등록"}
      </button>
    </form>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="border-b border-[var(--color-border)] pb-2 text-sm font-medium text-[var(--color-text-secondary)]">
      {title}
    </h3>
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
