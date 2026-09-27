"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

const STATUSES = ["جديدة", "قيد المراجعة", "مقبولة", "مرفوضة"];

export async function submitIdea(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return { error: "غير مصرح" };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) return { error: "عنوان الفكرة مطلوب" };

  const supabase = getSupabaseAdmin();
  await supabase.from("ideas").insert({
    submitted_by: scope.name,
    submitted_by_account_id: scope.accountId,
    title,
    description,
    status: "جديدة",
  });

  revalidatePath("/dashboard/ideas");
  return { ok: true };
}

export async function updateIdeaStatus(id: string, status: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !(scope.isExecutive || scope.isAdmin)) return { error: "غير مصرح" };
  if (!STATUSES.includes(status)) return { error: "حالة غير صحيحة" };

  const supabase = getSupabaseAdmin();
  await supabase.from("ideas").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/ideas");
  return { ok: true };
}

export async function updateIdeaResponse(id: string, response: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !(scope.isExecutive || scope.isAdmin)) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  await supabase.from("ideas").update({ response, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/ideas");
  return { ok: true };
}
