import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import TaskStatusSelect from "./TaskStatusSelect";
import NewTaskForm from "./NewTaskForm";

export default async function TasksPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const supabase = getSupabaseAdmin();

  const { data: allCommittees } = await supabase.from("committees").select("id,name").order("name");
  const editableCommittees = scope.isAdmin
    ? allCommittees || []
    : (allCommittees || []).filter((c) => scope.editCommitteeIds.includes(c.id));

  let query = supabase
    .from("tasks")
    .select("id, title, assignee, priority, status, due_date, committee_id, assignee_account_id")
    .order("created_at", { ascending: false });

  if (!scope.viewAll) {
    if (scope.viewCommitteeIds.length === 0) {
      query = query.eq("assignee_account_id", scope.accountId);
    } else {
      query = query.or(
        `committee_id.in.(${scope.viewCommitteeIds.join(",")}),assignee_account_id.eq.${scope.accountId}`
      );
    }
  }
  const { data: tasks } = await query;
  const committeeName = (id: string) => allCommittees?.find((c) => c.id === id)?.name || id;

  const canEditTask = (t: { committee_id: string; assignee_account_id: string | null }) =>
    scope.isAdmin || scope.editCommitteeIds.includes(t.committee_id) || t.assignee_account_id === scope.accountId;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--primary-dark)" }}>✅ المهام</h1>
      </div>

      {editableCommittees.length > 0 && <NewTaskForm committees={editableCommittees} />}

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>المهمة</th>
              <th>اللجنة</th>
              <th>المسؤول</th>
              <th>الأولوية</th>
              <th>تاريخ الاستحقاق</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {(tasks || []).map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{committeeName(t.committee_id)}</td>
                <td>{t.assignee || "—"}</td>
                <td>{t.priority}</td>
                <td>{t.due_date || "—"}</td>
                <td>
                  {canEditTask(t) ? (
                    <TaskStatusSelect taskId={t.id} status={t.status} />
                  ) : (
                    <span className="text-xs">{t.status}</span>
                  )}
                </td>
              </tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center text-[var(--muted)] py-6">لا توجد مهام حاليًا</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
