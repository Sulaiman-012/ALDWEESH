"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

export async function addRegulation(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح — إضافة اللوائح لمشرف النظام فقط" };

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title) return { error: "عنوان اللائحة مطلوب" };

  const supabase = getSupabaseAdmin();
  await supabase.from("regulations").insert({ title, body, added_by: scope.name });

  revalidatePath("/dashboard/regulations");
  return { ok: true };
}

export async function deleteRegulation(id: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  await supabase.from("regulations").delete().eq("id", id);
  revalidatePath("/dashboard/regulations");
  return { ok: true };
}
