import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { getCurrentUser } from "@/lib/auth/profile";
import type { Branch, UserProfile } from "@/types";

import { TopBarUI } from "./top-bar-ui";

/** 상단 navigation bar — 사이드바 대체. 지점 선택은 우측 dropdown. */
export async function TopBar() {
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
  return <TopBarUI branches={branches} user={user} />;
}
