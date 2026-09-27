"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createTask } from "./actions";

interface Committee { id: string; name: string; }

export default function NewTaskForm({ committees }: { committees: Committee[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + مهمة جديدة
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="card mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const res = await createTask(fd);
          if (res?.error) {
            setError(res.error);
          } else {
            formRef.current?.reset();
            setOpen(false);
            router.refresh();
          }
        });
      }}
    >
      <select name="committeeId" required className="border border-[var(--border)] rounded-lg px-3 py-2">
        <option value="">— اختر اللجنة —</option>
        {committees.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="title" required placeholder="عنوان المهمة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
      <input name="assignee" placeholder="اسم المسؤول عن التنفيذ" className="border border-[var(--border)] rounded-lg px-3 py-2" />
      <select name="priority" defaultValue="متوسطة" className="border border-[var(--border)] rounded-lg px-3 py-2">
        <option value="عالية">عالية</option>
        <option value="متوسطة">متوسطة</option>
        <option value="منخفضة">منخفضة</option>
      </select>
      <input name="dueDate" type="date" className="border border-[var(--border)] rounded-lg px-3 py-2" />
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "جارٍ الحفظ..." : "حفظ المهمة"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
      {error && <p className="text-red-600 text-sm md:col-span-2">{error}</p>}
    </form>
  );
}
