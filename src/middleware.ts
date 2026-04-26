/**
 * 글로벌 미들웨어
 * 1) 로그인 안 했으면 /login 으로
 * 2) 지점 세션이 자기 지점/가이드 외 영역 접근하면 자기 지점으로 redirect
 *    (오피스 페이지·어드민·다른 지점 차단)
 */

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATH = new Set<string>(["/login"]);
const PUBLIC_PREFIX = ["/api/", "/_next/", "/auth/"];

function parseSession(value: string | undefined):
  | { type: "office" }
  | { type: "branch"; slug: string }
  | null {
  if (!value) return null;
  if (value === "office") return { type: "office" };
  if (value.startsWith("branch:")) {
    const slug = value.slice("branch:".length);
    if (slug) return { type: "branch", slug };
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATH.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIX.some((p) => pathname.startsWith(p)))
    return NextResponse.next();

  const session = parseSession(req.cookies.get("app_session")?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 지점 세션 — 자기 지점 + /guide 외 접근 차단
  if (session.type === "branch") {
    const ownPath = `/branches/${session.slug}`;
    const isOwnBranch =
      pathname === ownPath || pathname.startsWith(`${ownPath}/`);
    const isGuide = pathname.startsWith("/guide/");
    if (!isOwnBranch && !isGuide) {
      const url = req.nextUrl.clone();
      url.pathname = ownPath;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
