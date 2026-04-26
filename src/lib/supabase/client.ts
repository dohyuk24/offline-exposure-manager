/**
 * Supabase 클라이언트 팩토리
 * - browser: 클라이언트 컴포넌트 / 브라우저 환경
 * - server:  서버 컴포넌트 · Route Handler · Server Action
 *
 * 환경변수는 .env.example 참조.
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function readEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요."
    );
  }
  return { url, anonKey };
}

export function createBrowserSupabase(): SupabaseClient {
  const { url, anonKey } = readEnv();
  return createBrowserClient(url, anonKey);
}

/**
 * cookies() 의존이 없는 익명 서버 클라이언트.
 *
 * unstable_cache() 내부에서는 cookies() / headers() 등 dynamic data source 를
 * 못 쓰기 때문에, 캐시 가능한 read 쿼리(branches, public feed) 전용.
 *
 * RLS 가 꺼진 상태에서 anon key 로 read-only 사용. 쓰기는 createServerSupabase 사용.
 */
export function createAnonSupabase(): SupabaseClient {
  const { url, anonKey } = readEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

/**
 * 서버 전용 클라이언트 — Server Component · Route Handler · Server Action에서만 사용.
 * next/headers 의존 때문에 런타임 import 로 가드한다.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const { url, anonKey } = readEnv();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트 렌더 중엔 set 호출이 무시될 수 있음 — 미들웨어에서 재시도.
        }
      },
    },
  });
}
