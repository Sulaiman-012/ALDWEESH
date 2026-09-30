"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCommitteeCodePrefix } from "./actions";

export default function CommitteeCodeForm({
  committeeId,
  codePrefix,
}: {
  committeeId: string;
  codePrefix: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(codePrefix || "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    const fd = new FormData();
    fd.set("committeeId", committeeId);
    fd.set("codePrefix", value);
    startTransition(async () => {
      const res = await updateCommitteeCodePrefix(fd);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <label className="text-xs text-[var(--muted)]">رمز اللجنة:</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="مثال: INV"
        maxLength={6}
        className="border border-[var(--border)] rounded-md px-2 py-0.5 text-xs w-20 uppercase"
      />
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="btn-ghost text-xs px-2 py-0.5"
      >
        حفظ
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
