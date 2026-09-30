"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateMissingJobCodes } from "./actions";

export default function GenerateJobCodesButton() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function run() {
    setMsg("");
    startTransition(async () => {
      const res = await generateMissingJobCodes();
      if (res?.error) setMsg(res.error);
      else setMsg(`تم توليد ${res?.generated ?? 0} كود جديد${res?.skipped ? ` (تخطّي ${res.skipped})` : ""}`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <button type="button" disabled={pending} onClick={run} className="btn-ghost text-xs px-3 py-1.5">
        {pending ? "جارٍ التوليد..." : "توليد الأكواد الوظيفية لكل الحسابات الناقصة"}
      </button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}
