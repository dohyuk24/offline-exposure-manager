"use client";

import { useRef, useState } from "react";

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
 * - 📷 카메라: capture="environment" 후면 카메라
 * - 🖼 갤러리: multiple 기본 선택
 * - 📁 파일: 시스템 피커 (iOS 카메라 회귀 대응 fallback)
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

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const systemRef = useRef<HTMLInputElement>(null);

  function log(line: string) {
    console.log("[photo-uploader]", line);
    setDebugLog((prev) => [...prev.slice(-5), line]);
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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
        log(
          `${file.name || "(이름 없음)"} · ${Math.round(file.size / 1024)}KB · ${file.type}`
        );

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

  const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
  };

  const busy = disabled || uploading;
  const buttonBase =
    "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-[var(--color-border)] bg-white px-3 py-4 text-sm hover:bg-[var(--color-bg-tertiary)] disabled:pointer-events-none disabled:opacity-60";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
        <div className="mb-3 text-center text-sm text-[var(--color-text-tertiary)]">
          {uploading ? "업로드 중..." : "사진 추가"}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className={buttonBase}
          >
            <span className="text-xl" aria-hidden>
              📷
            </span>
            <span>카메라</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
            className={buttonBase}
          >
            <span className="text-xl" aria-hidden>
              🖼
            </span>
            <span>갤러리</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => systemRef.current?.click()}
            className={buttonBase}
          >
            <span className="text-xl" aria-hidden>
              📁
            </span>
            <span>파일</span>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-[var(--color-text-tertiary)]">
          JPG · PNG · WebP · HEIC · 최대 {MAX_SIZE_MB}MB
        </p>
        <p className="mt-1 text-center text-[11px] text-[var(--color-text-tertiary)]">
          카메라가 안 되면 📁 파일 → "사진 찍기"
        </p>

        {/* 실제 input 들 — sr-only */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={busy}
          onChange={handleFileChange}
          style={srOnly}
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={handleFileChange}
          style={srOnly}
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={systemRef}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={handleFileChange}
          style={srOnly}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

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
                disabled={busy}
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

function extractExt(file: File): string {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && fromName !== file.name?.toLowerCase()) return fromName;
  const fromType = file.type?.split("/").pop()?.toLowerCase();
  if (fromType === "jpeg") return "jpg";
  return fromType || "jpg";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
