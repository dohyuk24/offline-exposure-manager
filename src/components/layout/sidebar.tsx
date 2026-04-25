import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { getCurrentUser } from "@/lib/auth/profile";
import type { Branch, UserProfile } from "@/types";

import { SidebarUI } from "./sidebar-ui";

/**
 * 사이드바 (서버 컴포넌트). 활성 지점 + 현재 사용자 프로필을 fetch 해서
 * 클라이언트 SidebarUI 에 prop 으로 전달.
 */
export async function Sidebar() {
  let branches: Branch[] = [];
  let user: UserProfile | null = null;
  try {
    [branches, user] = await Promise.all([
      listActiveBranches().then(sortBranchesByDisplayOrder),
      getCurrentUser(),
    ]);
  } catch {
    branches = [];
    user = null;
  }
  return <SidebarUI branches={branches} user={user} />;
}
