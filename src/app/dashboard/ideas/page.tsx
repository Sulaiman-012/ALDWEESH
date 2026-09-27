import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import NewIdeaForm from "./NewIdeaForm";
import IdeaControls from "./IdeaControls";

const STATUS_COLOR: Record<string, string> = {
  "جديدة": "#6b7684",
  "قيد المراجعة": "#b45309",
  "مقبولة": "#0f6b4c",
  "مرفوضة": "#b91c1c",
};

export default async function IdeasPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const canManage = scope.isExecutive || scope.isAdmin;
  const supabase = getSupabaseAdmin();

  let query = supabase.from("ideas").select("*").order("created_at", { ascending: false });
  if (!canManage) query = query.eq("submitted_by_account_id", scope.accountId);
  const { data: ideas } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--primary-dark)" }}>💡 الأفكار التطويرية</h1>
      </div>
      <NewIdeaForm />

      {!canManage && (
        <p className="text-xs text-[var(--muted)] mb-3">تظهر لك هنا الأفكار التي أرسلتها أنت فقط.</p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {(ideas || []).map((i) => (
          <div key={i.id} className="card">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{i.title}</h3>
                  <span
                    className="text-xs rounded-full px-2 py-0.5 text-white"
                    style={{ background: STATUS_COLOR[i.status] || "#6b7684" }}
                  >
                    {i.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)] mb-1">{i.description}</p>
                <p className="text-xs text-[var(--muted)]">بواسطة: {i.submitted_by}</p>
                {i.response && !canManage && (
                  <p className="text-xs mt-2 bg-[var(--bg)] rounded-md p-2">رد الإدارة التنفيذية: {i.response}</p>
                )}
              </div>
              {canManage && <IdeaControls id={i.id} status={i.status} response={i.response || ""} />}
            </div>
          </div>
        ))}
        {(!ideas || ideas.length === 0) && (
          <div className="card text-center text-[var(--muted)]">لا توجد أفكار بعد</div>
        )}
      </div>
    </div>
  );
}
