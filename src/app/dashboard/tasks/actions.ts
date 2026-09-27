"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

const STATUSES = ["قيد التنفيذ", "متأخرة", "مكتملة"];

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !STATUSES.includes(status)) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, committee_id, assignee_account_id")
    .eq("id", taskId)
    .single();
  if (!task) return { error: "المهمة غير موجودة" };

  const canEditCommittee = scope.isAdmin || scope.editCommitteeIds.includes(task.committee_id);
  const isMine = task.assignee_account_id === scope.accountId;
  if (!canEditCommittee && !isMine) return { error: "غير مصرح بتعديل هذه المهمة" };

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "مكتملة") patch.completed_at = new Date().toISOString();
  else patch.completed_at = null;

  await supabase.from("tasks").update(patch).eq("id", taskId);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createTask(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return { error: "غير مصرح" };

  const committeeId = String(formData.get("committeeId") || "");
  const title = String(formData.get("title") || "").trim();
  const assignee = String(formData.get("assignee") || "").trim();
  const priority = String(formData.get("priority") || "متوسطة");
  const dueDate = String(formData.get("dueDate") || "") || null;

  if (!title || !committeeId) return { error: "عنوان المهمة واللجنة مطلوبان" };
  const canEdit = scope.isAdmin || scope.editCommitteeIds.includes(committeeId);
  if (!canEdit) return { error: "غير مصرح بإضافة مهام لهذه اللجنة" };

  const supabase = getSupabaseAdmin();
  let assigneeAccountId: string | null = null;
  if (assignee) {
    const { data: acc } = await supabase.from("accounts").select("id").eq("name", assignee).maybeSingle();
    assigneeAccountId = acc?.id || null;
  }

  await supabase.from("tasks").insert({
    committee_id: committeeId,
    title,
    assignee,
    assignee_account_id: assigneeAccountId,
    priority,
    due_date: dueDate,
    status: "قيد التنفيذ",
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}
