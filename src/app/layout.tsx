import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopBar } from "@/components/layout/top-bar";
import { DiscoveryFeedBar } from "@/components/layout/discovery-feed-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { BranchSubNav } from "@/components/branch/branch-sub-nav";

export const metadata: Metadata = {
  title: "오프라인 매체 관리",
  description:
    "버핏서울 지점과 오피스가 함께 쓰는 오프라인 매체 현황 관리 서비스",
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
        <TopBar />
        <BranchSubNav />
        <DiscoveryFeedBar />
        <main className="mx-auto max-w-[1400px] px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-6">
          {children}
        </main>
        <MobileTabBar />
      </body>
    </html>
  );
}
