"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { convertRecommendationToTask } from "./actions";

export default function RecommendationRow({
  minuteId, index, text, convertedToTaskId, canEdit,
}: { minuteId: string; index: number; text: string; convertedToTaskId: string | null; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("متوسطة");
  const [pending, startTransition] = useTransition();

  return (
    <li className="border-b border-[var(--border)] py-2 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">• {text}</span>
        {convertedToTaskId ? (
          <span className="text-xs text-[var(--primary)] shrink-0">✔ حُوِّلت إلى مهمة</span>
        ) : canEdit ? (
          <button className="btn-ghost text-xs px-2 py-1 shrink-0" onClick={() => setOpen((v) => !v)}>
            تحويل إلى مهمة
          </button>
        ) : null}
      </div>
      {open && (
        <div className="flex flex-wrap gap-2 mt-2">
          <input
            placeholder="اسم المسؤول"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="border border-[var(--border)] rounded-md px-2 py-1 text-xs"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border border-[var(--border)] rounded-md px-2 py-1 text-xs"
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-[var(--border)] rounded-md px-2 py-1 text-xs">
            <option value="عالية">عالية</option>
            <option value="متوسطة">متوسطة</option>
            <option value="منخفضة">منخفضة</option>
          </select>
          <button
            disabled={pending}
            className="btn-primary text-xs px-2 py-1"
            onClick={() =>
              startTransition(async () => {
                await convertRecommendationToTask(minuteId, index, assignee, dueDate, priority);
                setOpen(false);
                router.refresh();
              })
            }
          >
            {pending ? "جارٍ الإنشاء..." : "إنشاء المهمة"}
          </button>
        </div>
      )}
    </li>
  );
}
