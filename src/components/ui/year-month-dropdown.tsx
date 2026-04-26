"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  current: string;
  options: string[];
  /** 변경할 검색 파람 키 — 디폴트 'ym' */
  paramKey?: string;
};

/** 연월 선택 dropdown — `?{paramKey}=YYYY-MM` 으로 navigate. */
export function YearMonthDropdown({
  current,
  options,
  paramKey = "ym",
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams);
    next.set(paramKey, e.target.value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
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
