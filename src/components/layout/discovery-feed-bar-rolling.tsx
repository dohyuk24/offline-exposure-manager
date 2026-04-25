"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { timeAgo } from "@/lib/date";
import { objectMarker } from "@/lib/korean";

export type RollingItem =
  | {
      kind: "discovery";
      branch_name: string;
      branch_slug: string;
      media_type: string;
      created_at: string;
    }
  | {
      kind: "fallback";
      message: string;
    };

type Props = {
  items: RollingItem[];
  /** ms. 디폴트 4000 */
  intervalMs?: number;
};

/**
 * 발견 피드 배너 — 여러 메시지 세로 롤링.
 * items 가 1개면 정적, 2개 이상이면 일정 간격으로 위로 슬라이드.
 */
export function RollingDiscoveryBar({ items, intervalMs = 4000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  return (
    <div className="discovery-feed-bar relative overflow-hidden">
      <span className="discovery-feed-bar__dot" aria-hidden />
      <div className="relative h-[18px] flex-1 overflow-hidden">
        {items.map((item, i) => {
          const offset = (i - index + items.length) % items.length;
          // 현재 = offset 0, 다음 = 1 (아래에서 대기), 이전 = items.length-1 (위로 사라짐)
          const isActive = offset === 0;
          const transform = isActive
            ? "translateY(0)"
            : offset === items.length - 1
              ? "translateY(-100%)"
              : "translateY(100%)";
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center transition-all duration-500 ease-out"
              style={{
                transform,
                opacity: isActive ? 1 : 0,
              }}
              aria-hidden={!isActive}
            >
              <RollingRow item={item} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RollingRow({ item }: { item: RollingItem }) {
  if (item.kind === "fallback") {
    return <span className="truncate">{item.message}</span>;
  }
  return (
    <Link
      href={`/branches/${item.branch_slug}`}
      className="flex w-full items-center gap-2 hover:opacity-90"
    >
      <span className="truncate">
        <strong className="font-semibold">{item.branch_name}점</strong>에서 새{" "}
        {item.media_type}
        {objectMarker(item.media_type)} 확보했어요! 👀
      </span>
      <span className="ml-auto shrink-0 text-[11px] opacity-70">
        {timeAgo(item.created_at)}
      </span>
    </Link>
  );
}
