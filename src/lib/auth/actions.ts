"use server";

import { redirect } from "next/navigation";

import {
  clearSession,
  setBranchSession,
  setOfficeSession,
} from "./temp-session";

export async function loginAsOfficeAction(): Promise<void> {
  await setOfficeSession();
  redirect("/");
}

export async function loginAsBranchAction(slug: string): Promise<void> {
  if (!slug) throw new Error("지점 slug 가 필요해요");
  await setBranchSession(slug);
  redirect(`/branches/${slug}`);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
