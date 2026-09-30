import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import NewAccountForm from "./NewAccountForm";
import AccountRow from "./AccountRow";
import GrantsManager from "./GrantsManager";
import GenerateJobCodesButton from "./GenerateJobCodesButton";

export default async function AccountsPage() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope) return null;

  if (!scope.isAdmin) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>👥 الحسابات</h1>
        <p className="text-[var(--muted)]">هذه الصفحة متاحة لمشرف النظام فقط.</p>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,phone,job_code,is_admin,is_trustee,is_executive,is_executive_head")
    .order("name");
  const { data: committees } = await supabase.from("committees").select("id,name").order("name");
  const { data: grantsRaw } = await supabase
    .from("account_grants")
    .select("id, role, accounts(name), committees(name)")
    .order("id");

  const grants = (grantsRaw || []).map((g: any) => ({
    id: g.id,
    role: g.role,
    account_name: g.accounts?.name || "",
    committee_name: g.committees?.name || "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--primary-dark)" }}>👥 الحسابات</h1>
        <NewAccountForm />
        <GenerateJobCodesButton />
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>الاسم</th><th>الكود الوظيفي</th><th>الجوال</th><th>الصلاحيات</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {(accounts || []).map((a) => <AccountRow key={a.id} account={a} />)}
            </tbody>
          </table>
        </div>
      </div>

      <GrantsManager grants={grants} accounts={accounts || []} committees={committees || []} />
    </div>
  );
}
