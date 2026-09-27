"use client";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { addGrant, removeGrant } from "./actions";

interface Grant { id: number; role: string; account_name: string; committee_name: string; }
interface Option { id: string; name: string; }

const ROLE_LABEL: Record<string, string> = { head: "رئيس", secretary: "سكرتير", member: "عضو" };

export default function GrantsManager({
  grants, accounts, committees,
}: { grants: Grant[]; accounts: Option[]; committees: Option[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card">
      <h2 className="font-bold mb-3">تفويضات الأعضاء على اللجان</h2>
      <form
        ref={formRef}
        className="flex flex-wrap gap-2 mb-4"
        action={(fd) => {
          startTransition(async () => {
            await addGrant(fd);
            formRef.current?.reset();
            router.refresh();
          });
        }}
      >
        <select name="accountId" required className="border border-[var(--border)] rounded-md px-2 py-1 text-sm">
          <option value="">— العضو —</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select name="committeeId" required className="border border-[var(--border)] rounded-md px-2 py-1 text-sm">
          <option value="">— اللجنة —</option>
          {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="role" className="border border-[var(--border)] rounded-md px-2 py-1 text-sm">
          <option value="member">عضو</option>
          <option value="secretary">سكرتير</option>
          <option value="head">رئيس</option>
        </select>
        <button type="submit" disabled={pending} className="btn-primary text-sm px-3 py-1">إضافة</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {grants.map((g) => (
          <span key={g.id} className="text-xs rounded-full px-3 py-1 bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2">
            {ROLE_LABEL[g.role]} {g.account_name} — {g.committee_name}
            <button
              className="text-red-600"
              onClick={() => startTransition(async () => { await removeGrant(g.id); router.refresh(); })}
            >
              ✕
            </button>
          </span>
        ))}
        {grants.length === 0 && <span className="text-xs text-[var(--muted)]">لا توجد تفويضات بعد</span>}
      </div>
    </div>
  );
}
