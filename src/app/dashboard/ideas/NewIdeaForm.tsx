"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { submitIdea } from "./actions";

export default function NewIdeaForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ اقتراح فكرة تطويرية</button>;
  }

  return (
    <form
      ref={formRef}
      className="card mb-6 flex flex-col gap-3"
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const res = await submitIdea(fd);
          if (res?.error) setError(res.error);
          else { formRef.current?.reset(); setOpen(false); router.refresh(); }
        });
      }}
    >
      <input name="title" required placeholder="عنوان الفكرة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
      <textarea name="description" placeholder="اشرح فكرتك بالتفصيل" className="border border-[var(--border)] rounded-lg px-3 py-2" rows={3} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "جارٍ الإرسال..." : "إرسال الفكرة"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
