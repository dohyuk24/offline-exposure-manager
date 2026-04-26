import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import { getSession, type Session } from "@/lib/auth/temp-session";
import type { Branch } from "@/types";

import { TopBarUI } from "./top-bar-ui";

/** 상단 navigation bar — 사이드바 대체. 지점 선택은 우측 dropdown. */
export async function TopBar() {
  let branches: Branch[] = [];
  let session: Session | null = null;
  try {
    [branches, session] = await Promise.all([
      listActiveBranches().then(sortBranchesByDisplayOrder),
      getSession(),
    ]);
  } catch {
    branches = [];
    session = null;
  }
  return <TopBarUI branches={branches} session={session} />;
}
