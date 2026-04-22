"use client";

import { useEffect, useState } from "react";

type MicroFeedbackProps = {
  message: string;
  /** 노출 시간 (ms) — 기본 3500 */
  durationMs?: number;
  onDone?: () => void;
};

/**
 * 업로드 완료 즉시 노출되는 맥락형 피드백 토스트.
 * DESIGN.md 섹션 6 기준. 3.5초 후 자동 소멸.
 */
export function MicroFeedback({
  message,
  durationMs = 3500,
  onDone,
}: MicroFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDone]);

  if (!visible) return null;

  return <div className="micro-feedback">{message}</div>;
}
