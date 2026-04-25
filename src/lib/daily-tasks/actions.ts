"use server";

import { revalidatePath } from "next/cache";

import { manualCompleteTask } from "@/lib/daily-tasks/auto-complete";

/**
 * 위젯에서 수동 체크박스 클릭 → task 완료 처리.
 * @param taskId daily_tasks.id
 * @param branchSlug revalidate 할 지점 페이지 slug
 */
export async function manualCompleteTaskAction(
  taskId: string,
  branchSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await manualCompleteTask(taskId);
    revalidatePath(`/branches/${branchSlug}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
