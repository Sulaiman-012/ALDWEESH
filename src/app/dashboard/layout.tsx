import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "🏠 الرئيسية" },
  { href: "/dashboard/committees", label: "🗂️ اللجان" },
  { href: "/dashboard/tasks", label: "✅ المهام" },
  { href: "/dashboard/minutes", label: "📝 محاضر الاجتماعات" },
  { href: "/dashboard/ideas", label: "💡 الأفكار التطويرية" },
  { href: "/dashboard/regulations", label: "📘 اللوائح" },
  { href: "/dashboard/accounts", label: "👥 الحسابات" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.accountId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-[var(--primary-dark)] text-white p-4 flex flex-col">
        <div className="mb-6">
          <div className="font-bold text-lg">صندوق عائلة الدويش</div>
          <div className="text-xs opacity-75 mt-1">أهلاً، {session.name}</div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 bg-[var(--bg)] p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
