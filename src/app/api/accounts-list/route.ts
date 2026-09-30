import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// قائمة الأكواد الوظيفية فقط (بدون الاسم) لتعبئة قائمة الدخول — حماية للخصوصية
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("accounts")
    .select("id,job_code")
    .not("job_code", "is", null)
    .order("job_code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ accounts: data });
}
