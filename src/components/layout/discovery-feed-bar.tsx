import { getDiscoveryFeed } from "@/lib/supabase/queries/media-records";
import { currentYearMonth } from "@/lib/date";

import {
  RollingDiscoveryBar,
  type RollingItem,
} from "./discovery-feed-bar-rolling";

const FALLBACK_MESSAGES = [
  "오늘 상권을 한 바퀴 돌아볼까요?",
  "미업데이트 지면이 있다면 오늘 갱신해주세요.",
  "이번 달 신규 발굴 목표를 채워주세요.",
  "게시 종료 임박 매체는 후속 디자인을 준비할 시점이에요.",
  "새 매체 후보를 발견하면 ✨ 신규 발굴 으로 등록해주세요.",
  "지점별 미처리 할 일은 홈 상단에서 확인할 수 있어요.",
];

/**
 * 발견 피드 배너 — 메인 컬럼 상단 고정 (PRD §5.3.2).
 * 최근 7일 이내 신규 발굴 최대 3건 + 부족하면 fallback 문구로 채워서
 * RollingDiscoveryBar (client) 가 4초 간격 세로 롤링.
 */
export async function DiscoveryFeedBar() {
  const items: RollingItem[] = [];

  try {
    const { items: feed } = await getDiscoveryFeed(currentYearMonth(), 3);
    for (const it of feed) {
      if (!isWithinDays(it.created_at, 7)) continue;
      items.push({
        kind: "discovery",
        branch_name: it.branch_name,
        branch_slug: it.branch_slug,
        media_type: it.media_type,
        created_at: it.created_at,
      });
    }
  } catch {
    // env 미설정 등 — fallback 만 노출.
  }

  // 3개 슬롯을 최대한 채움. 발굴 1~2 건이면 fallback 으로 이어붙임.
  let fallbackIdx = 0;
  while (items.length < 3 && fallbackIdx < FALLBACK_MESSAGES.length) {
    items.push({ kind: "fallback", message: FALLBACK_MESSAGES[fallbackIdx] });
    fallbackIdx += 1;
  }

  return <RollingDiscoveryBar items={items} />;
}

function isWithinDays(iso: string, days: number, now: Date = new Date()): boolean {
  const diff = now.getTime() - new Date(iso).getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}
