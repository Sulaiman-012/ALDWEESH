"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { buildScope } from "@/lib/scope";

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function createAccount(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const isAdmin = formData.get("isAdmin") === "on";
  const isTrustee = formData.get("isTrustee") === "on";
  const isExecutive = formData.get("isExecutive") === "on";
  const isExecutiveHead = formData.get("isExecutiveHead") === "on";
  if (!name) return { error: "الاسم مطلوب" };

  const pin = randomPin();
  const pinHash = await bcrypt.hash(pin, 10);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("accounts").insert({
    name,
    phone,
    pin_hash: pinHash,
    is_admin: isAdmin,
    is_trustee: isTrustee,
    is_executive: isExecutive,
    is_executive_head: isExecutiveHead,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/accounts");
  return { ok: true, pin };
}

export async function updateAccountFlags(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const jobCode = String(formData.get("jobCode") || "").trim().toUpperCase();
  const isAdmin = formData.get("isAdmin") === "on";
  const isTrustee = formData.get("isTrustee") === "on";
  const isExecutive = formData.get("isExecutive") === "on";
  const isExecutiveHead = formData.get("isExecutiveHead") === "on";
  if (!id || !name) return { error: "بيانات ناقصة" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("accounts")
    .update({
      name,
      phone,
      job_code: jobCode || null,
      is_admin: isAdmin,
      is_trustee: isTrustee,
      is_executive: isExecutive,
      is_executive_head: isExecutiveHead,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505" || /duplicate/i.test(error.message)) {
      return { error: "هذا الكود الوظيفي مستخدم مسبقًا لحساب آخر" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/accounts");
  return { ok: true };
}

function resolveJobCodePrefix(
  account: { id: string; is_admin: boolean; is_trustee: boolean; is_executive: boolean },
  grantsByAccount: Record<string, { committee_id: string; role: string }[]>,
  committeePrefix: Record<string, string>
): string | null {
  const grants = grantsByAccount[account.id] || [];
  const chosen =
    grants.find((g) => g.role === "head") ||
    grants.find((g) => g.role === "secretary") ||
    grants.find((g) => g.role === "member");
  if (chosen) {
    const prefix = committeePrefix[chosen.committee_id];
    if (prefix) return prefix;
  }
  if (account.is_trustee) return "TRU";
  if (account.is_executive) return "EXE";
  if (account.is_admin) return "ADM";
  return "GEN";
}

export async function generateMissingJobCodes() {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, job_code, is_admin, is_trustee, is_executive")
    .order("created_at", { ascending: true });
  const { data: grants } = await supabase
    .from("account_grants")
    .select("account_id, committee_id, role")
    .order("id", { ascending: true });
  const { data: committees } = await supabase.from("committees").select("id, code_prefix");

  const committeePrefix: Record<string, string> = {};
  (committees || []).forEach((c: any) => {
    committeePrefix[c.id] = (c.code_prefix || "").trim().toUpperCase();
  });

  const grantsByAccount: Record<string, { committee_id: string; role: string }[]> = {};
  (grants || []).forEach((g: any) => {
    if (!grantsByAccount[g.account_id]) grantsByAccount[g.account_id] = [];
    grantsByAccount[g.account_id].push({ committee_id: g.committee_id, role: g.role });
  });

  // نجهّز آخر رقم تسلسلي مستخدم لكل بادئة من الأكواد الموجودة مسبقًا
  const nextSerial: Record<string, number> = {};
  (accounts || []).forEach((a: any) => {
    const m = String(a.job_code || "").match(/^([A-Z]+)-(\d+)$/);
    if (!m) return;
    const prefix = m[1];
    const n = parseInt(m[2], 10);
    nextSerial[prefix] = Math.max(nextSerial[prefix] || 0, n);
  });

  let generated = 0;
  let skipped = 0;
  for (const a of accounts || []) {
    if (a.job_code) continue;
    const prefix = resolveJobCodePrefix(a, grantsByAccount, committeePrefix);
    if (!prefix) {
      skipped++;
      continue;
    }
    const n = (nextSerial[prefix] || 0) + 1;
    nextSerial[prefix] = n;
    const code = `${prefix}-${String(n).padStart(3, "0")}`;
    const { error } = await supabase.from("accounts").update({ job_code: code }).eq("id", a.id);
    if (error) {
      skipped++;
    } else {
      generated++;
    }
  }

  revalidatePath("/dashboard/accounts");
  return { ok: true, generated, skipped };
}

export async function resetPin(accountId: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const pin = randomPin();
  const pinHash = await bcrypt.hash(pin, 10);
  const supabase = getSupabaseAdmin();
  await supabase.from("accounts").update({ pin_hash: pinHash }).eq("id", accountId);

  revalidatePath("/dashboard/accounts");
  return { ok: true, pin };
}

export async function deleteAccount(accountId: string) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };
  if (accountId === scope.accountId) return { error: "لا يمكنك حذف حسابك الحالي" };

  const supabase = getSupabaseAdmin();
  await supabase.from("accounts").delete().eq("id", accountId);
  revalidatePath("/dashboard/accounts");
  return { ok: true };
}

export async function addGrant(formData: FormData) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const accountId = String(formData.get("accountId") || "");
  const committeeId = String(formData.get("committeeId") || "");
  const role = String(formData.get("role") || "member");
  if (!accountId || !committeeId) return { error: "بيانات ناقصة" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("account_grants")
    .upsert({ account_id: accountId, committee_id: committeeId, role }, { onConflict: "account_id,committee_id,role" });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/accounts");
  return { ok: true };
}

export async function removeGrant(grantId: number) {
  const session = await getSession();
  const scope = await buildScope(session);
  if (!scope || !scope.isAdmin) return { error: "غير مصرح" };

  const supabase = getSupabaseAdmin();
  await supabase.from("account_grants").delete().eq("id", grantId);
  revalidatePath("/dashboard/accounts");
  return { ok: true };
}
