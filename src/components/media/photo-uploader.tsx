"use client";

import { useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase/client";

const BUCKET = "media-photos";
const MAX_SIZE_MB = 10;

type PhotoUploaderProps = {
  value: string[];
  onChange: (next: string[]) => void;
  branchSlug: string;
  disabled?: boolean;
};

/**
 * 브라우저에서 Supabase Storage 로 이미지 업로드.
 * 모바일: capture="environment" 로 후면 카메라 우선 호출.
 * 데스크톱: 파일 선택창.
 *
 * 버킷: media-photos (public read)
 */
export function PhotoUploader({
  value,
  onChange,
  branchSlug,
  disabled,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setUploading(true);

    const newUrls: string[] = [];

    try {
      const supabase = createBrowserSupabase();

      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setErrorMessage(`${file.name} 은(는) ${MAX_SIZE_MB}MB 를 초과해요`);
          continue;
        }

        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${branchSlug}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadErr) {
          setErrorMessage(`업로드 실패: ${uploadErr.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) onChange([...value, ...newUrls]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removePhoto(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      <label
        className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 text-sm text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-tertiary)] ${
          disabled || uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span className="text-2xl" aria-hidden>
          📷
        </span>
        <span>
          {uploading ? "업로드 중..." : "탭하여 사진 추가 (카메라 / 갤러리)"}
        </span>
        <span className="text-[11px]">
          JPG · PNG · WebP · HEIC, 최대 {MAX_SIZE_MB}MB
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={disabled || uploading}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {errorMessage}
        </p>
      ) : null}

      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="업로드된 사진"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                disabled={disabled || uploading}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-black/80"
                aria-label="사진 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
