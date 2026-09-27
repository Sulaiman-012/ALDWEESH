import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NewRegulationForm, DeleteRegulationButton } from "./RegulationTools";

export default async function RegulationsPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const supabase = getSupabaseAdmin();
  const { data: regs } = await supabase.from("regulations").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>📘 اللوائح</h1>
      {scope.isAdmin && <NewRegulationForm />}

      <div className="grid grid-cols-1 gap-3">
        {(regs || []).map((r) => (
          <div key={r.id} className="card">
            <div className="flex justify-between items-start">
              <h3 className="font-bold mb-1">{r.title}</h3>
              {scope.isAdmin && <DeleteRegulationButton id={r.id} />}
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.body}</p>
            <p className="text-xs text-[var(--muted)] mt-2">أضافها: {r.added_by}</p>
          </div>
        ))}
        {(!regs || regs.length === 0) && (
          <div className="card text-center text-[var(--muted)]">لا توجد لوائح مضافة بعد</div>
        )}
      </div>
    </div>
  );
}
