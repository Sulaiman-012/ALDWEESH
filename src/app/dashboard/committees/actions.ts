"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

export async function updateCommitteeCodePrefix(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const committeeId = String(formData.get("committeeId") || "");
  const codePrefix = String(formData.get("codePrefix") || "")
    .trim()
    .toUpperCase();
  if (!committeeId) return { error: "بيانات ناقصة" };
  if (codePrefix && !/^[A-Z]{2,6}$/.test(codePrefix)) {
    return { error: "رمز اللجنة يجب أن يكون 2-6 أحرف إنجليزية فقط" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("committees")
    .update({ code_prefix: codePrefix })
    .eq("id", committeeId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/committees");
  return { ok: true };
}

export async function addEvaluation(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !(scope.isExecutive || scope.isAdmin)) {
    return { error: "التقييم متاح للإدارة التنفيذية فقط" };
  }

  const committeeId = String(formData.get("committeeId") || "");
  const score = Number(formData.get("score") || 0);
  const period = String(formData.get("period") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!committeeId || score < 1 || score > 10) return { error: "الرجاء اختيار اللجنة وتقييم من 1 إلى 10" };

  const supabase = getSupabaseAdmin();
  await supabase.from("committee_evaluations").insert({
    committee_id: committeeId,
    evaluated_by: scope.name,
    score,
    period,
    notes,
  });

  revalidatePath("/dashboard/committees");
  return { ok: true };
}
