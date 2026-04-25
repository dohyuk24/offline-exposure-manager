import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { DiscoveryFeedBar } from "@/components/layout/discovery-feed-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

export const metadata: Metadata = {
  title: "오프라인 매체 관리",
  description:
    "버핏서울 지점과 마케팅실이 함께 쓰는 오프라인 매체 현황 관리 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased">
        <div className="flex min-h-screen">
          {/* 사이드바는 상단 끝까지 */}
          <Sidebar />
          {/* 본문 영역 — 배너는 메인 컬럼 안 (사이드바와 겹치지 않음) */}
          <div className="flex min-w-0 flex-1 flex-col">
            <DiscoveryFeedBar />
            <main className="flex-1 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
              {children}
            </main>
          </div>
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
