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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  function log(line: string) {
    console.log("[photo-uploader]", line);
    setDebugLog((prev) => [...prev.slice(-4), line]);
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    // 이 첫 로그가 안 찍히면 iOS 가 input onChange 자체를 발화시키지 않은 것.
    setDebugLog(["onChange 발화"]);
    const files = event.target.files;

    if (!files || files.length === 0) {
      log("파일이 없음 — 사용자가 취소했거나 iOS 가 파일을 반환하지 않음");
      return;
    }

    setErrorMessage(null);
    setUploading(true);
    const newUrls: string[] = [];

    try {
      log(`${files.length}개 파일 업로드 시작`);
      const supabase = createBrowserSupabase();

      for (const file of Array.from(files)) {
        log(`${file.name || "(이름 없음)"} · ${Math.round(file.size / 1024)}KB · ${file.type}`);

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
          setErrorMessage(
            `${file.name || "사진"} 이 너무 커요 (${sizeMb}MB, 최대 ${MAX_SIZE_MB}MB)`
          );
          continue;
        }

        const ext = extractExt(file);
        const id = randomId();
        const path = `${branchSlug}/${id}.${ext}`;
        log(`→ ${path}`);

        try {
          const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || undefined,
            });

          if (uploadErr) {
            log(`업로드 실패: ${uploadErr.message}`);
            setErrorMessage(
              uploadErr.message
                ? `업로드 실패: ${uploadErr.message}`
                : "업로드 실패 (이유 불명)"
            );
            continue;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          log(`업로드 예외: ${msg}`);
          setErrorMessage(`업로드 예외: ${msg}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);
        log(`✓ ${publicUrl.slice(0, 60)}...`);
        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        log(`완료: ${newUrls.length}장 추가`);
      } else {
        log("추가된 사진 없음");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`전체 실패: ${msg}`);
      setErrorMessage(`문제가 발생했어요: ${msg}`);
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
        {/*
          iOS Safari 호환성:
          - display:none 은 피한다 (일부 버전에서 picker 가 열리지 않음).
          - multiple 을 제거 — capture + multiple 조합이 iOS 에서 파일을 반환하지 않는 사례 있음.
          - 대신 sr-only 스타일로 시각만 숨김.
        */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled || uploading}
          onChange={handleFileChange}
          className="absolute h-px w-px overflow-hidden opacity-0"
          style={{ clip: "rect(0 0 0 0)", clipPath: "inset(50%)" }}
        />
      </label>

      {errorMessage ? (
        <p className="rounded-md border border-[#C4332F]/40 bg-[#FFE2DD]/40 px-3 py-2 text-xs text-[#C4332F]">
          {errorMessage}
        </p>
      ) : null}

      {debugLog.length > 0 ? (
        <details className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[10px] text-[var(--color-text-tertiary)]">
          <summary className="cursor-pointer">디버그 로그 (펼치기)</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">
            {debugLog.join("\n")}
          </pre>
        </details>
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

/**
 * 파일 확장자 추출. iOS 에서 대문자 .HEIC 로 오거나
 * 이름이 비어있을 수 있어 방어적으로 처리.
 */
function extractExt(file: File): string {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && fromName !== file.name?.toLowerCase()) return fromName;
  const fromType = file.type?.split("/").pop()?.toLowerCase();
  if (fromType === "jpeg") return "jpg";
  return fromType || "jpg";
}

/**
 * crypto.randomUUID 폴백. iOS Safari < 15.4 대응.
 */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
