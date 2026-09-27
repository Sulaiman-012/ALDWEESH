"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

export async function saveMinutes(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return { error: "غير مصرح" };

  const committeeId = String(formData.get("committeeId") || "");
  const meetingDate = String(formData.get("meetingDate") || "");
  const attendees = String(formData.get("attendees") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const recsRaw = String(formData.get("recommendations") || "");
  if (!committeeId || !meetingDate) return { error: "اللجنة وتاريخ الاجتماع مطلوبان" };

  const canEdit = scope.isAdmin || scope.editCommitteeIds.includes(committeeId);
  if (!canEdit) return { error: "غير مصرح بإضافة محاضر لهذه اللجنة" };

  const recommendations = recsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({ text, convertedToTaskId: null }));

  const supabase = getSupabaseAdmin();
  await supabase.from("minutes").insert({
    committee_id: committeeId,
    meeting_date: meetingDate,
    attendees,
    summary,
    recommendations,
    created_by: scope.name,
  });

  revalidatePath("/dashboard/minutes");
  return { ok: true };
}

export async function convertRecommendationToTask(
  minuteId: string,
  index: number,
  assignee: string,
  dueDate: string,
  priority: string
) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  const { data: minute } = await supabase
    .from("minutes")
    .select("id, committee_id, recommendations")
    .eq("id", minuteId)
    .single();
  if (!minute) return { error: "المحضر غير موجود" };

  const canEdit = scope.isAdmin || scope.editCommitteeIds.includes(minute.committee_id);
  if (!canEdit) return { error: "غير مصرح" };

  const recs = (minute.recommendations as any[]) || [];
  if (!recs[index] || recs[index].convertedToTaskId) return { error: "توصية غير صالحة أو محوَّلة مسبقًا" };

  let assigneeAccountId: string | null = null;
  if (assignee) {
    const { data: acc } = await supabase.from("accounts").select("id").eq("name", assignee).maybeSingle();
    assigneeAccountId = acc?.id || null;
  }

  const { data: task } = await supabase
    .from("tasks")
    .insert({
      committee_id: minute.committee_id,
      title: recs[index].text,
      assignee,
      assignee_account_id: assigneeAccountId,
      priority: priority || "متوسطة",
      due_date: dueDate || null,
      status: "قيد التنفيذ",
      source_minute_id: minuteId,
    })
    .select("id")
    .single();

  recs[index].convertedToTaskId = task?.id || null;
  await supabase.from("minutes").update({ recommendations: recs }).eq("id", minuteId);

  revalidatePath("/dashboard/minutes");
  revalidatePath("/dashboard/tasks");
  return { ok: true };
}
