import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import NewMinutesForm from "./NewMinutesForm";
import RecommendationRow from "./RecommendationRow";

export default async function MinutesPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  const supabase = getSupabaseAdmin();
  const { data: allCommittees } = await supabase.from("committees").select("id,name").order("name");
  const editableCommittees = scope.isAdmin
    ? allCommittees || []
    : (allCommittees || []).filter((c) => scope.editCommitteeIds.includes(c.id));

  let query = supabase
    .from("minutes")
    .select("id, committee_id, meeting_date, attendees, summary, recommendations, created_by")
    .order("meeting_date", { ascending: false });
  if (!scope.viewAll) {
    if (scope.viewCommitteeIds.length === 0) return (
      <div>
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>📝 محاضر الاجتماعات</h1>
        <p className="text-[var(--muted)]">لا توجد لجان مسندة لحسابك حاليًا.</p>
      </div>
    );
    query = query.in("committee_id", scope.viewCommitteeIds);
  }
  const { data: minutes } = await query;
  const committeeName = (id: string) => allCommittees?.find((c) => c.id === id)?.name || id;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>📝 محاضر الاجتماعات</h1>
      {editableCommittees.length > 0 && <NewMinutesForm committees={editableCommittees} />}

      <div className="flex flex-col gap-4">
        {(minutes || []).map((m) => {
          const canEdit = scope.isAdmin || scope.editCommitteeIds.includes(m.committee_id);
          const recs = (m.recommendations as any[]) || [];
          return (
            <div key={m.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{committeeName(m.committee_id)}</h3>
                  <p className="text-xs text-[var(--muted)]">{m.meeting_date} · دوّنه: {m.created_by}</p>
                </div>
              </div>
              {m.attendees && <p className="text-sm mb-1"><b>الحضور:</b> {m.attendees}</p>}
              {m.summary && <p className="text-sm mb-2">{m.summary}</p>}
              {recs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-1">التوصيات</p>
                  <ul>
                    {recs.map((r, i) => (
                      <RecommendationRow
                        key={i}
                        minuteId={m.id}
                        index={i}
                        text={r.text}
                        convertedToTaskId={r.convertedToTaskId}
                        canEdit={canEdit}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        {(!minutes || minutes.length === 0) && (
          <div className="card text-center text-[var(--muted)]">لا توجد محاضر بعد</div>
        )}
      </div>
    </div>
  );
}
