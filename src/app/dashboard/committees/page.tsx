import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import EvaluationSection from "./EvaluationSection";
import CommitteeCodeForm from "./CommitteeCodeForm";

export default async function CommitteesPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const supabase = getSupabaseAdmin();
  let query = supabase.from("committees").select("id,name,purpose,code_prefix").order("name");
  if (!scope.viewAll) {
    if (scope.viewCommitteeIds.length === 0) {
      return (
        <div>
          <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>🗂️ اللجان</h1>
          <p className="text-[var(--muted)]">لا توجد لجان مسندة لحسابك حاليًا.</p>
        </div>
      );
    }
    query = query.in("id", scope.viewCommitteeIds);
  }
  const { data: committees } = await query;

  const { data: allGrants } = await supabase
    .from("account_grants")
    .select("committee_id, role, accounts(name)");

  const grantsByCommittee: Record<string, { role: string; name: string }[]> = {};
  (allGrants || []).forEach((g: any) => {
    if (!grantsByCommittee[g.committee_id]) grantsByCommittee[g.committee_id] = [];
    grantsByCommittee[g.committee_id].push({ role: g.role, name: g.accounts?.name || "" });
  });

  const roleLabel: Record<string, string> = { head: "رئيس", secretary: "سكرتير", member: "عضو" };

  const { data: evalRows } = await supabase
    .from("committee_evaluations")
    .select("id, committee_id, score, notes, period, evaluated_by, created_at")
    .order("created_at", { ascending: false });
  const evalsByCommittee: Record<string, any[]> = {};
  (evalRows || []).forEach((e) => {
    if (!evalsByCommittee[e.committee_id]) evalsByCommittee[e.committee_id] = [];
    evalsByCommittee[e.committee_id].push(e);
  });
  const canEvaluate = scope.isExecutive || scope.isAdmin;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>🗂️ اللجان</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(committees || []).map((c) => (
          <div key={c.id} className="card">
            <h2 className="font-bold mb-1">{c.name}</h2>
            <p className="text-sm text-[var(--muted)] mb-3">{c.purpose}</p>
            <div className="flex flex-wrap gap-1">
              {(grantsByCommittee[c.id] || []).map((g, i) => (
                <span
                  key={i}
                  className="text-xs rounded-full px-2 py-0.5 bg-[var(--bg)] border border-[var(--border)]"
                >
                  {roleLabel[g.role]}: {g.name}
                </span>
              ))}
            </div>
            <EvaluationSection
              committeeId={c.id}
              evaluations={evalsByCommittee[c.id] || []}
              canEvaluate={canEvaluate}
            />
            {scope.isAdmin && (
              <CommitteeCodeForm committeeId={c.id} codePrefix={(c as any).code_prefix || ""} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
