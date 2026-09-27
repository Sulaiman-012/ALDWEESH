import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SessionData } from "@/lib/session";

export interface GrantRow {
  committee_id: string;
  role: "head" | "secretary" | "member";
  committee_name?: string;
}

export interface Scope {
  accountId: string;
  name: string;
  isAdmin: boolean;
  isTrustee: boolean;
  isExecutive: boolean;
  isExecutiveHead: boolean;
  viewAll: boolean;
  grants: GrantRow[];
  viewCommitteeIds: string[];
  editCommitteeIds: string[];
}

// يبني نطاق صلاحيات المستخدم الحالي بنفس منطق التطبيق الأصلي:
// المشرف/عضو مجلس الأمناء/الإدارة التنفيذية يرون كل اللجان،
// وباقي الأعضاء يرون فقط اللجان المسندة لهم عبر account_grants.
export async function buildScope(session: SessionData): Promise<Scope | null> {
  if (!session.accountId) return null;
  const supabase = getSupabaseAdmin();
  const { data: grants } = await supabase
    .from("account_grants")
    .select("committee_id, role, committees(name)")
    .eq("account_id", session.accountId);

  const grantRows: GrantRow[] = (grants || []).map((g: any) => ({
    committee_id: g.committee_id,
    role: g.role,
    committee_name: g.committees?.name,
  }));

  const viewAll = !!(session.isAdmin || session.isTrustee || session.isExecutive);
  const editIds = grantRows
    .filter((g) => g.role === "head" || g.role === "secretary")
    .map((g) => g.committee_id);
  const viewIds = [...new Set(grantRows.map((g) => g.committee_id))];

  return {
    accountId: session.accountId,
    name: session.name || "",
    isAdmin: !!session.isAdmin,
    isTrustee: !!session.isTrustee,
    isExecutive: !!session.isExecutive,
    isExecutiveHead: !!session.isExecutiveHead,
    viewAll,
    grants: grantRows,
    viewCommitteeIds: viewIds,
    editCommitteeIds: session.isAdmin ? [] : editIds, // isAdmin تعني تحرير الكل، يُتحقق منه بشكل منفصل
  };
}
