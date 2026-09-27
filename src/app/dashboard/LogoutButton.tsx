"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="text-sm rounded-lg px-3 py-2 bg-white/10 hover:bg-white/20 transition text-right"
    >
      🚪 تسجيل الخروج
    </button>
  );
}
