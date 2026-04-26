"use client";

import { usePathname } from "next/navigation";

/**
 * 인증 전 페이지 (/login, /auth/*) 에서는 nav chrome 을 숨긴다.
 * Server Component (TopBar 등) 를 children prop 으로 받아 RSC 호환 유지.
 */
export function ConditionalChrome({
  topBar,
  subNav,
  feed,
  tabBar,
}: {
  topBar: React.ReactNode;
  subNav: React.ReactNode;
  feed: React.ReactNode;
  tabBar: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome =
    pathname === "/login" || pathname.startsWith("/auth/");

  if (hideChrome) return null;

  return (
    <>
      {topBar}
      {subNav}
      {feed}
      {tabBar}
    </>
  );
}
