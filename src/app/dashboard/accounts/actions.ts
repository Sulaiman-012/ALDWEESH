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
  const isAdmin = formData.get("isAdmin") === "on";
  const isTrustee = formData.get("isTrustee") === "on";
  const isExecutive = formData.get("isExecutive") === "on";
  const isExecutiveHead = formData.get("isExecutiveHead") === "on";
  if (!id || !name) return { error: "بيانات ناقصة" };

  const supabase = getSupabaseAdmin();
  await supabase
    .from("accounts")
    .update({
      name,
      phone,
      is_admin: isAdmin,
      is_trustee: isTrustee,
      is_executive: isExecutive,
      is_executive_head: isExecutiveHead,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/dashboard/accounts");
  return { ok: true };
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
