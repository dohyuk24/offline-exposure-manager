import Link from "next/link";

import { getDiscoveryFeed } from "@/lib/supabase/queries/media-records";
import { currentYearMonth, timeAgo } from "@/lib/date";

/**
 * 발견 피드 배너 — 전 페이지 상단 고정.
 * 가장 최근 신규 발굴 1건 노출 (PRD 5.3.2).
 *
 * 최근 7일 이내 발굴만 유효하게 보여주고, 그 외에는 독려 문구.
 * DB 연결 실패 / 발굴 없음 모두 fallback 문구로 처리.
 */
export async function DiscoveryFeedBar() {
  let item: Awaited<ReturnType<typeof getDiscoveryFeed>>["items"][number] | null = null;

  try {
    const { items } = await getDiscoveryFeed(currentYearMonth(), 1);
    const latest = items[0];
    if (latest && isWithinDays(latest.created_at, 7)) {
      item = latest;
    }
  } catch {
    // env 미설정 등 — 기본 문구로 조용히 폴백.
  }

  if (!item) {
    return (
      <div className="discovery-feed-bar">
        <span className="discovery-feed-bar__dot" aria-hidden />
        <span className="truncate">
          아직 최근 신규 발굴 소식이 없어요. 오늘 상권을 돌아볼까요?
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/branches/${item.branch_slug}`}
      className="discovery-feed-bar hover:opacity-90"
    >
      <span className="discovery-feed-bar__dot" aria-hidden />
      <span className="truncate">
        <strong className="font-semibold">{item.branch_name}</strong>이 새{" "}
        {item.media_type}를 확보했어요! 👀
      </span>
      <span className="ml-auto shrink-0 text-[11px] opacity-70">
        {timeAgo(item.created_at)}
      </span>
    </Link>
  );
}

function isWithinDays(iso: string, days: number, now: Date = new Date()): boolean {
  const diff = now.getTime() - new Date(iso).getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}
