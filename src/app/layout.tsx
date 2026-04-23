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
        <DiscoveryFeedBar />
        <div className="flex min-h-[calc(100vh-40px)]">
          <Sidebar />
          {/* pb-24 로 하단 탭바 영역 확보. 데스크톱에선 md:pb-6 */}
          <main className="flex-1 min-w-0 px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
