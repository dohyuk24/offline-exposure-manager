"use client";

import { useRouter } from "next/navigation";

type Props = {
  current: string;
  options: string[];
};

/** 점수판 연월 선택. 변경 시 /ranking?ym=YYYY-MM 으로 이동. */
export function YearMonthDropdown({ current, options }: Props) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`/ranking?ym=${e.target.value}`)}
      className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
      aria-label="연월 선택"
    >
      {options.map((ym) => (
        <option key={ym} value={ym}>
          {ym}
        </option>
      ))}
    </select>
  );
}
