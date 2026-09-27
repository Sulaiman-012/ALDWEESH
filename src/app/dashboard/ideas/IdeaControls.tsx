"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateIdeaStatus, updateIdeaResponse } from "./actions";

const STATUSES = ["جديدة", "قيد المراجعة", "مقبولة", "مرفوضة"];

export default function IdeaControls({ id, status, response }: { id: string; status: string; response: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [val, setVal] = useState(response || "");

  return (
    <div className="flex flex-col gap-2">
      <select
        className="border border-[var(--border)] rounded-md px-2 py-1 text-xs bg-white"
        value={status}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          startTransition(async () => {
            await updateIdeaStatus(id, v);
            router.refresh();
          });
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <input
          className="border border-[var(--border)] rounded-md px-2 py-1 text-xs flex-1"
          placeholder="رد الإدارة التنفيذية"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button
          className="btn-ghost text-xs px-2 py-1"
          disabled={pending}
          onClick={() => startTransition(async () => { await updateIdeaResponse(id, val); router.refresh(); })}
        >
          حفظ
        </button>
      </div>
    </div>
  );
}
