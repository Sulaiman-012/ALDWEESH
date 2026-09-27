"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { addRegulation, deleteRegulation } from "./actions";

export function NewRegulationForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ إضافة لائحة</button>;
  }

  return (
    <form
      ref={formRef}
      className="card mb-6 flex flex-col gap-3"
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const res = await addRegulation(fd);
          if (res?.error) setError(res.error);
          else { formRef.current?.reset(); setOpen(false); router.refresh(); }
        });
      }}
    >
      <input name="title" required placeholder="عنوان اللائحة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
      <textarea name="body" placeholder="نص اللائحة" className="border border-[var(--border)] rounded-lg px-3 py-2" rows={5} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "جارٍ الحفظ..." : "حفظ اللائحة"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}

export function DeleteRegulationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="text-xs text-red-600"
      disabled={pending}
      onClick={() => {
        if (!confirm("حذف هذه اللائحة؟")) return;
        startTransition(async () => { await deleteRegulation(id); router.refresh(); });
      }}
    >
      حذف
    </button>
  );
}
