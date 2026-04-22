import type { MediaRecord } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";

export async function listMediaByBranch(
  branchId: string
): Promise<MediaRecord[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("media_records")
    .select("*")
    .eq("branch_id", branchId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MediaRecord[];
}

export async function getMediaRecord(id: string): Promise<MediaRecord | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("media_records")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as MediaRecord | null;
}
