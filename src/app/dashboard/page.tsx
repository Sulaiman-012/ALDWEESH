import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const supabase = getSupabaseAdmin();
  let query = supabase.from("tasks").select("id, status, priority, committee_id");
  if (!scope.viewAll) {
    if (scope.viewCommitteeIds.length === 0) {
      // لا توجد لجان مسندة لهذا العضو
    } else {
      query = query.in("committee_id", scope.viewCommitteeIds);
    }
  }
  const { data: tasks } = scope.viewAll || scope.viewCommitteeIds.length > 0
    ? await query
    : { data: [] as any[] };

  const total = tasks?.length || 0;
  const done = tasks?.filter((t) => t.status === "مكتملة").length || 0;
  const inProgress = tasks?.filter((t) => t.status === "قيد التنفيذ").length || 0;
  const high = tasks?.filter((t) => t.priority === "عالية" && t.status !== "مكتملة").length || 0;

  const { count: committeesCount } = scope.viewAll
    ? await supabase.from("committees").select("id", { count: "exact", head: true })
    : { count: scope.viewCommitteeIds.length };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--primary-dark)" }}>
            👋 مرحبًا، {scope.name.split(" ")[0] || scope.name}
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            نظرة عامة على أداء {scope.viewAll ? "كل اللجان" : "لجانك"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/tasks" className="btn-primary">+ مهمة جديدة</Link>
          <Link href="/dashboard/ideas" className="btn-ghost">💡 اقتراح فكرة تطويرية</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="اللجان" value={committeesCount ?? 0} />
        <KpiCard label="إجمالي المهام" value={total} />
        <KpiCard label="قيد التنفيذ" value={inProgress} />
        <KpiCard label="مهام عالية الأولوية غير مكتملة" value={high} tone="warn" />
      </div>

      <div className="bg-[var(--panel)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex justify-between text-sm mb-2">
          <span>نسبة الإنجاز</span>
          <span className="font-semibold">{total ? Math.round((done / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${total ? Math.round((done / total) * 100) : 0}%`,
              background: "var(--primary)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number | string; tone?: "warn" }) {
  return (
    <div className="bg-[var(--panel)] rounded-xl border border-[var(--border)] p-4">
      <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
      <div
        className="text-2xl font-bold"
        style={{ color: tone === "warn" ? "#b45309" : "var(--primary-dark)" }}
      >
        {value}
      </div>
    </div>
  );
}
