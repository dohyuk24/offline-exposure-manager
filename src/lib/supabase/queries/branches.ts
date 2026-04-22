import type { Branch } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function getBranchBySlug(slug: string): Promise<Branch | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as Branch | null;
}

export async function listActiveBranches(): Promise<Branch[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Branch[];
}
