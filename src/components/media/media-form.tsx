"use client";

import { useState } from "react";
import {
  CONTENT_TYPE,
  MEDIA_CATEGORY,
  MEDIA_STATUS,
  MEDIA_TYPE,
  MEDIA_TYPE_BY_CATEGORY,
  type MediaCategory,
  type MediaStatus,
  type MediaType,
  type ContentType,
} from "@/types";

import { PhotoUploader } from "./photo-uploader";

export type MediaFormValues = {
  category: MediaCategory;
  media_type: MediaType;
  status: MediaStatus;
  description: string;
  size: string;
  content_type: ContentType | "";
  start_date: string;
  end_date: string;
  cost: string;
  barter_condition: string;
  is_new_discovery: boolean;
  photos: string[];
};

const INITIAL: MediaFormValues = {
  category: MEDIA_CATEGORY.PAID,
  media_type: MEDIA_TYPE.BANNER,
  status: MEDIA_STATUS.POSTING,
  description: "",
  size: "",
  content_type: "",
  start_date: "",
  end_date: "",
  cost: "",
  barter_condition: "",
  is_new_discovery: false,
  photos: [],
};

type MediaFormProps = {
  onSubmit?: (values: MediaFormValues) => void | Promise<void>;
  submitting?: boolean;
  errorMessage?: string | null;
  initialValues?: Partial<MediaFormValues>;
  submitLabel?: string;
  /** 사진 업로드 시 Storage path prefix 로 사용 (지점 slug) */
  branchSlug: string;
};

/**
 * 매체 등록/수정 폼 — DESIGN.md 섹션 7.
 */
export function MediaForm({
  onSubmit,
  submitting,
  errorMessage,
  initialValues,
  submitLabel = "등록하기",
  branchSlug,
}: MediaFormProps) {
  const [values, setValues] = useState<MediaFormValues>({
    ...INITIAL,
    ...initialValues,
    photos: initialValues?.photos ?? [],
  });

  const update = <K extends keyof MediaFormValues>(
    key: K,
    value: MediaFormValues[K]
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const isBarter = values.media_type === MEDIA_TYPE.BARTER_BANNER;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSubmit?.(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhotoUploader
        value={values.photos}
        onChange={(next) => update("photos", next)}
        branchSlug={branchSlug}
        disabled={submitting}
      />

      <Row label="구분">
        <Select
          value={values.category}
          onChange={(v) => update("category", v as MediaCategory)}
          options={Object.values(MEDIA_CATEGORY)}
        />
      </Row>

      <Row label="매체 종류">
        <Select
          value={values.media_type}
          onChange={(v) => update("media_type", v as MediaType)}
          options={typeOptionsForEdit(values.category, values.media_type)}
        />
      </Row>

      <Row label="상태">
        <Select
          value={values.status}
          onChange={(v) => update("status", v as MediaStatus)}
          options={Object.values(MEDIA_STATUS)}
        />
      </Row>

      <Row label="설명">
        <Input
          value={values.description}
          onChange={(v) => update("description", v)}
          placeholder="매체 위치, 비고 등"
        />
      </Row>

      <Row label="규격 / 사이즈">
        <Input
          value={values.size}
          onChange={(v) => update("size", v)}
          placeholder="예: 2m × 1m"
        />
      </Row>

      <Row label="유형">
        <Select
          value={values.content_type}
          onChange={(v) => update("content_type", v as ContentType | "")}
          options={["", ...Object.values(CONTENT_TYPE)]}
        />
      </Row>

      <Row label="시작일">
        <Input
          type="date"
          value={values.start_date}
          onChange={(v) => update("start_date", v)}
        />
      </Row>

      <Row label="종료일">
        <Input
          type="date"
          value={values.end_date}
          onChange={(v) => update("end_date", v)}
        />
      </Row>

      <Row label="비용 (원)">
        <Input
          type="number"
          inputMode="numeric"
          value={values.cost}
          onChange={(v) => update("cost", v)}
          placeholder="0"
        />
      </Row>

      {isBarter ? (
        <Row label="바터 조건">
          <Input
            value={values.barter_condition}
            onChange={(v) => update("barter_condition", v)}
            placeholder="상호 제공 조건"
          />
        </Row>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-sm text-[#C4332F]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[var(--color-accent)] py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={props.type ?? "text"}
      inputMode={props.inputMode}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
    />
  );
}

/**
 * 카테고리별 종류 옵션. 기존 레코드가 카테고리에 속하지 않는 레거시 type
 * (예: P-OOH 의 'OOH', '현수막') 을 들고 있으면 옵션 맨 끝에 추가해 select 깨지지 않게.
 */
function typeOptionsForEdit(
  category: MediaCategory,
  current: MediaType
): readonly string[] {
  const base = MEDIA_TYPE_BY_CATEGORY[category];
  if (base.includes(current)) return base;
  return [...base, current];
}

function Select(props: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
    >
      {props.options.map((option) => (
        <option key={option} value={option}>
          {option || "선택"}
        </option>
      ))}
    </select>
  );
}
