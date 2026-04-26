"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabase } from "@/lib/supabase/client";
import { logoutAction } from "@/lib/auth/actions";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function createBranchAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const budgetRaw = String(formData.get("budget_monthly") ?? "500000");
  const slackChannel = String(formData.get("slack_channel") ?? "").trim();
  const slackUserGroupId = String(
    formData.get("slack_user_group_id") ?? ""
  ).trim();

  if (!name) throw new Error("지점 이름이 필요해요");
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  if (!slug) throw new Error("슬러그를 비울 수 없어요");
  const budget = parseInt(budgetRaw, 10);
  if (Number.isNaN(budget) || budget < 0)
    throw new Error("예산은 0 이상 숫자여야 해요");

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("branches").insert({
    name,
    slug,
    budget_monthly: budget,
    slack_channel: slackChannel || null,
    slack_user_group_id: slackUserGroupId || null,
    is_active: true,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateBranchAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const budgetRaw = String(formData.get("budget_monthly") ?? "500000");
  const slackChannel = String(formData.get("slack_channel") ?? "").trim();
  const slackUserGroupId = String(
    formData.get("slack_user_group_id") ?? ""
  ).trim();

  if (!id) throw new Error("지점 id 가 필요해요");
  if (!name) throw new Error("지점 이름이 필요해요");
  const budget = parseInt(budgetRaw, 10);
  if (Number.isNaN(budget) || budget < 0)
    throw new Error("예산은 0 이상 숫자여야 해요");

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("branches")
    .update({
      name,
      budget_monthly: budget,
      slack_channel: slackChannel || null,
      slack_user_group_id: slackUserGroupId || null,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleBranchActiveAction(
  formData: FormData
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const nextActiveRaw = formData.get("is_active");
  if (!id) throw new Error("지점 id 가 필요해요");

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("branches")
    .update({ is_active: nextActiveRaw === "true" })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  await logoutAction();
}
