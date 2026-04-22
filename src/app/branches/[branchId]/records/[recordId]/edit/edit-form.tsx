"use client";

import { useState, useTransition } from "react";

import {
  MediaForm,
  type MediaFormValues,
} from "@/components/media/media-form";
import type { Branch, MediaRecord } from "@/types";

import { updateMediaAction, deleteMediaAction } from "./actions";

type EditFormProps = {
  branch: Branch;
  record: MediaRecord;
};

export function EditForm({ branch, record }: EditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialValues: Partial<MediaFormValues> = {
    category: record.category,
    media_type: record.media_type,
    status: record.status,
    description: record.description ?? "",
    size: record.size ?? "",
    content_type: record.content_type ?? "",
    start_date: record.start_date ?? "",
    end_date: record.end_date ?? "",
    cost:
      typeof record.cost === "number" && record.cost > 0
        ? String(record.cost)
        : "",
    barter_condition: record.barter_condition ?? "",
    is_new_discovery: record.is_new_discovery,
    photos: record.photos ?? [],
  };

  function handleSubmit(values: MediaFormValues) {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await updateMediaAction({
          recordId: record.id,
          branchSlug: branch.slug,
          ...values,
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT"))
          return;
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleDelete() {
    if (!confirm("이 매체를 삭제할까요? 나중에 복구할 수 있어요.")) return;
    setErrorMessage(null);
    startDeleteTransition(async () => {
      try {
        await deleteMediaAction({
          recordId: record.id,
          branchSlug: branch.slug,
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT"))
          return;
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="space-y-4">
      <MediaForm
        branchSlug={branch.slug}
        onSubmit={handleSubmit}
        submitting={isPending}
        errorMessage={errorMessage}
        initialValues={initialValues}
        submitLabel="저장하기"
      />

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || isPending}
        className="w-full rounded-lg border border-[#C4332F]/40 bg-white px-4 py-2.5 text-sm font-medium text-[#C4332F] hover:bg-[#FFE2DD]/40 disabled:opacity-50"
      >
        {isDeleting ? "삭제 중..." : "매체 삭제"}
      </button>
    </div>
  );
}
