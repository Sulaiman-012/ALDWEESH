import { createClient } from "@supabase/supabase-js";

// عميل Supabase بصلاحية service role — يُستخدم فقط داخل الخادم
// (API routes / Server Components)، ولا يصل إليه المتصفح أبدًا.
// يتجاوز RLS، لذلك كل التحقق من الصلاحيات يتم في كود التطبيق نفسه.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "متغيرات البيئة SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY غير معرّفة"
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
