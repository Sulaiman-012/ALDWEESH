"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateTaskStatus } from "./actions";

const STATUSES = ["قيد التنفيذ", "متأخرة", "مكتملة"];

export default function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="border border-[var(--border)] rounded-md px-2 py-1 text-xs bg-white"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        startTransition(async () => {
          await updateTaskStatus(taskId, v);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
