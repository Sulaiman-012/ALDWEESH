"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AccountOption {
  id: string;
  job_code: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountId, setAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts-list")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => setError("تعذّر تحميل قائمة الأسماء"));
  }, []);

  async function submit() {
    setError("");
    if (!accountId) {
      setError("الرجاء اختيار الكود الوظيفي");
      return;
    }
    if (pin.trim().length !== 4) {
      setError("رمز الدخول 4 أرقام");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, pin: pin.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "تعذّر الدخول");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm bg-[var(--panel)] rounded-2xl shadow-lg p-8 border border-[var(--border)]">
        <Image
          src="/logo.webp"
          alt="شعار عائلة الدويش"
          width={160}
          height={87}
          className="mx-auto mb-3 h-14 w-auto"
          priority
        />
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: "var(--primary-dark)" }}>
          صندوق عائلة الدويش
        </h1>
        <p className="text-center text-sm text-[var(--muted)] mb-6">تسجيل الدخول إلى لوحة المهام</p>

        <label className="block text-sm mb-1 font-medium">الكود الوظيفي</label>
        <select
          className="w-full mb-4 border border-[var(--border)] rounded-lg px-3 py-2 bg-white"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">— اختر الكود الوظيفي —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.job_code}
            </option>
          ))}
        </select>

        <label className="block text-sm mb-1 font-medium">رمز الدخول (4 أرقام)</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          className="w-full mb-4 border border-[var(--border)] rounded-lg px-3 py-2 text-center tracking-[0.5em] text-lg"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-lg py-2.5 font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
        <p className="text-xs text-[var(--muted)] text-center mt-4">
          لو ما عندك رمز أو نسيته، تواصل مع مسؤول النظام
        </p>
      </div>
    </div>
  );
}
