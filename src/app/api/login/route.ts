import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { accountId, pin } = await req.json();
  if (!accountId || !pin) {
    return NextResponse.json({ error: "الرجاء اختيار الاسم وإدخال الرمز" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: account, error } = await supabase
    .from("accounts")
    .select("id,name,pin_hash,is_admin,is_trustee,is_executive,is_executive_head")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "رمز الدخول غير صحيح" }, { status: 401 });
  }

  const ok = await bcrypt.compare(String(pin), account.pin_hash);
  if (!ok) {
    return NextResponse.json({ error: "رمز الدخول غير صحيح" }, { status: 401 });
  }

  const session = await getSession();
  session.accountId = account.id;
  session.name = account.name;
  session.isAdmin = account.is_admin;
  session.isTrustee = account.is_trustee;
  session.isExecutive = account.is_executive;
  session.isExecutiveHead = account.is_executive_head;
  await session.save();

  return NextResponse.json({ ok: true });
}
