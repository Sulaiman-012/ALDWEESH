"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createAccount } from "./actions";

export default function NewAccountForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [newPin, setNewPin] = useState<{ name: string; pin: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ إضافة حساب جديد</button>;
  }

  return (
    <div className="card mb-6">
      <form
        ref={formRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        action={(fd) => {
          setError("");
          setNewPin(null);
          const name = String(fd.get("name") || "");
          startTransition(async () => {
            const res = await createAccount(fd);
            if (res?.error) setError(res.error);
            else {
              formRef.current?.reset();
              setNewPin({ name, pin: res.pin! });
              router.refresh();
            }
          });
        }}
      >
        <input name="name" required placeholder="الاسم الكامل" className="border border-[var(--border)] rounded-lg px-3 py-2" />
        <input name="phone" placeholder="رقم الجوال (اختياري)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAdmin" /> مشرف النظام</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isTrustee" /> مجلس الأمناء</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isExecutive" /> الإدارة التنفيذية</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isExecutiveHead" /> رئيس الإدارة التنفيذية</label>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" disabled={pending} className="btn-primary">{pending ? "جارٍ الحفظ..." : "إنشاء الحساب"}</button>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إغلاق</button>
        </div>
        {error && <p className="text-red-600 text-sm md:col-span-2">{error}</p>}
      </form>
      {newPin && (
        <div className="mt-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] p-3 text-sm">
          تم إنشاء حساب <b>{newPin.name}</b> — رمز الدخول: <span className="tracking-widest font-bold">{newPin.pin}</span>
          <br />
          <span className="text-xs text-[var(--muted)]">سجّله الآن وأرسله للعضو، فلن يظهر مرة أخرى.</span>
        </div>
      )}
    </div>
  );
}
