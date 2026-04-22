/**
 * 발견 피드 배너 — 전 페이지 상단 고정.
 * 가장 최근 신규 발굴 소식 1건을 노출.
 *
 * v1에서는 서버 데이터 연결 전까지 기본 문구만 표시.
 */

type DiscoveryFeedBarProps = {
  message?: string;
  timeAgo?: string;
};

export function DiscoveryFeedBar({
  message = "아직 이번 주 신규 발굴 소식이 없어요. 오늘 상권을 돌아볼까요?",
  timeAgo,
}: DiscoveryFeedBarProps) {
  return (
    <div className="discovery-feed-bar">
      <span className="discovery-feed-bar__dot" aria-hidden />
      <span className="truncate">{message}</span>
      {timeAgo ? (
        <span className="ml-auto shrink-0 text-[11px] opacity-70">
          {timeAgo}
        </span>
      ) : null}
    </div>
  );
}
