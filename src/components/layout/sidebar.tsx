import { listActiveBranches } from "@/lib/supabase/queries/branches";
import { sortBranchesByDisplayOrder } from "@/lib/branch-order";
import type { Branch } from "@/types";

import { SidebarUI } from "./sidebar-ui";

/**
 * 사이드바 (서버 컴포넌트). 활성 지점 목록을 DB 에서 fetch 해서
 * 클라이언트 SidebarUI 에 prop 으로 전달.
 *
 * 활성 페이지 강조 + 섹션 토글 등 인터랙션은 SidebarUI 내부.
 */
export async function Sidebar() {
  let branches: Branch[] = [];
  try {
    branches = sortBranchesByDisplayOrder(await listActiveBranches());
  } catch {
    branches = [];
  }
  return <SidebarUI branches={branches} />;
}
