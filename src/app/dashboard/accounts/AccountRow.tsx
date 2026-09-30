"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { updateAccountFlags, resetPin, deleteAccount } from "./actions";

interface Account {
  id: string; name: string; phone: string | null; job_code: string | null;
  is_admin: boolean; is_trustee: boolean; is_executive: boolean; is_executive_head: boolean;
}

export default function AccountRow({ account }: { account: Account }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pinMsg, setPinMsg] = useState("");
  const [formError, setFormError] = useState("");

  if (!editing) {
    return (
      <tr>
        <td>{account.name}</td>
        <td className="text-xs font-mono">{account.job_code || "—"}</td>
        <td>{account.phone || "—"}</td>
        <td className="text-xs">
          {account.is_admin && "مشرف النظام · "}
          {account.is_trustee && "مجلس الأمناء · "}
          {account.is_executive && (account.is_executive_head ? "رئيس الإدارة التنفيذية" : "الإدارة التنفيذية")}
        </td>
        <td className="flex gap-2 items-center flex-wrap py-2">
          <button className="btn-ghost text-xs px-2 py-1" onClick={() => setEditing(true)}>تعديل</button>
          <button
            className="btn-ghost text-xs px-2 py-1"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await resetPin(account.id);
                if (res?.pin) setPinMsg(`الرمز الجديد: ${res.pin}`);
                router.refresh();
              })
            }
          >
            إعادة تعيين الرمز
          </button>
          <button
            className="text-xs text-red-600"
            disabled={pending}
            onClick={() => {
              if (!confirm(`حذف حساب ${account.name}؟`)) return;
              startTransition(async () => { await deleteAccount(account.id); router.refresh(); });
            }}
          >
            حذف
          </button>
          {pinMsg && <span className="text-xs font-bold">{pinMsg}</span>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5}>
        <form
          ref={formRef}
          className="flex flex-wrap items-center gap-2 py-2"
          action={(fd) => {
            setFormError("");
            startTransition(async () => {
              const res = await updateAccountFlags(fd);
              if (res?.error) {
                setFormError(res.error);
                return;
              }
              setEditing(false);
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="id" value={account.id} />
          <input name="name" defaultValue={account.name} className="border border-[var(--border)] rounded-md px-2 py-1 text-sm w-36" />
          <input
            name="jobCode"
            defaultValue={account.job_code || ""}
            placeholder="الكود الوظيفي"
            className="border border-[var(--border)] rounded-md px-2 py-1 text-sm w-24 uppercase"
          />
          <input name="phone" defaultValue={account.phone || ""} placeholder="الجوال" className="border border-[var(--border)] rounded-md px-2 py-1 text-sm w-32" />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isAdmin" defaultChecked={account.is_admin} /> مشرف</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isTrustee" defaultChecked={account.is_trustee} /> مجلس أمناء</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isExecutive" defaultChecked={account.is_executive} /> إدارة تنفيذية</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isExecutiveHead" defaultChecked={account.is_executive_head} /> رئيسها</label>
          <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">حفظ</button>
          <button type="button" className="btn-ghost text-xs px-2 py-1" onClick={() => setEditing(false)}>إلغاء</button>
          {formError && <span className="text-xs text-red-600 w-full">{formError}</span>}
        </form>
      </td>
    </tr>
  );
}
