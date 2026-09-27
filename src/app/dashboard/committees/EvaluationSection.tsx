"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { addEvaluation } from "./actions";

interface Evaluation { id: string; score: number; notes: string; period: string; evaluated_by: string; created_at: string; }

export default function EvaluationSection({
  committeeId, evaluations, canEvaluate,
}: { committeeId: string; evaluations: Evaluation[]; canEvaluate: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const avg = evaluations.length
    ? Math.round((evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length) * 10) / 10
    : null;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">
          تقييم الإدارة التنفيذية {avg !== null && <span className="text-[var(--primary)]">({avg}/10)</span>}
        </span>
        {canEvaluate && (
          <button className="text-xs btn-ghost px-2 py-1" onClick={() => setOpen((v) => !v)}>
            {open ? "إغلاق" : "+ إضافة تقييم"}
          </button>
        )}
      </div>

      {open && (
        <form
          ref={formRef}
          className="flex flex-wrap gap-2 mb-2"
          action={(fd) => {
            setError("");
            fd.set("committeeId", committeeId);
            startTransition(async () => {
              const res = await addEvaluation(fd);
              if (res?.error) setError(res.error);
              else { formRef.current?.reset(); setOpen(false); router.refresh(); }
            });
          }}
        >
          <select name="score" required className="border border-[var(--border)] rounded-md px-2 py-1 text-xs">
            <option value="">الدرجة (1-10)</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input name="period" placeholder="الفترة (مثال: الربع الأول)" className="border border-[var(--border)] rounded-md px-2 py-1 text-xs" />
          <input name="notes" placeholder="ملاحظات" className="border border-[var(--border)] rounded-md px-2 py-1 text-xs flex-1 min-w-[120px]" />
          <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">حفظ</button>
          {error && <p className="text-red-600 text-xs w-full">{error}</p>}
        </form>
      )}

      <ul className="flex flex-col gap-1">
        {evaluations.map((e) => (
          <li key={e.id} className="text-xs text-[var(--muted)]">
            {e.period && `${e.period} — `}{e.score}/10 {e.notes && `— ${e.notes}`} <span className="opacity-70">({e.evaluated_by})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
