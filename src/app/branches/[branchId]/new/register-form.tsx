"use client";

import { useState, useTransition } from "react";

import {
  MediaForm,
  type MediaFormValues,
} from "@/components/media/media-form";
import type { Branch } from "@/types";

import {
  registerMediaAction,
  type RegisterMediaPayload,
} from "./actions";

type RegisterFormProps = {
  branch: Branch;
  initialValues?: Partial<MediaFormValues>;
  /** 기존 레코드 히스토리 이어가기일 때 부모 location_key */
  locationKey?: string;
};

/**
 * MediaForm 을 Server Action 에 연결하는 클라이언트 래퍼.
 * useTransition 으로 pending 상태 관리 + 에러 노출.
 */
export function RegisterForm({
  branch,
  initialValues,
  locationKey,
}: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isContinuation = Boolean(locationKey);

  function handleSubmit(values: MediaFormValues) {
    setErrorMessage(null);

    const payload: RegisterMediaPayload = {
      branchSlug: branch.slug,
      category: values.category,
      media_type: values.media_type,
      status: values.status,
      description: values.description,
      size: values.size,
      content_type: values.content_type,
      start_date: values.start_date,
      end_date: values.end_date,
      cost: values.cost,
      barter_condition: values.barter_condition,
      is_new_discovery: values.is_new_discovery,
      photos: values.photos,
      locationKey,
    };

    startTransition(async () => {
      try {
        await registerMediaAction(payload);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <MediaForm
      branchSlug={branch.slug}
      onSubmit={handleSubmit}
      submitting={isPending}
      errorMessage={errorMessage}
      initialValues={initialValues}
      submitLabel={isContinuation ? "이어서 기록하기" : "등록하기"}
    />
  );
}
