import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen flex flex-col md:flex-row">
      <input type="checkbox" id="nav-toggle" className="peer hidden" />

      <header className="md:hidden flex items-center justify-between gap-3 bg-[var(--primary-dark)] text-white px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/logo.webp" alt="شعار عائلة الدويش" width={128} height={70} className="h-8 w-auto shrink-0" />
          <span className="font-bold text-sm truncate">صندوق عائلة الدويش</span>
        </div>
        <label
          htmlFor="nav-toggle"
          className="shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xl leading-none hover:bg-white/10"
          aria-label="فتح القائمة"
        >
          ☰
        </label>
      </header>

      <label
        htmlFor="nav-toggle"
        className="hidden peer-checked:block md:!hidden fixed inset-0 bg-black/40 z-30"
      />

      <aside
        className="hidden peer-checked:flex md:flex md:w-64 md:shrink-0 flex-col bg-[var(--primary-dark)] text-white p-4
                   fixed md:static inset-y-0 right-0 z-40 w-72 max-w-[85%] overflow-y-auto"
      >
        <div className="mb-6 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Image src="/logo.webp" alt="شعار عائلة الدويش" width={144} height={78} className="h-10 w-auto mb-2 hidden md:block" />
            <div className="font-bold text-lg">صندوق عائلة الدويش</div>
            <div className="text-xs opacity-75 mt-1 truncate">أهلاً، {session.name}</div>
          </div>
          <label htmlFor="nav-toggle" className="md:hidden shrink-0 cursor-pointer text-xl leading-none px-2" aria-label="إغلاق القائمة">
            ✕
          </label>
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

      <main className="flex-1 bg-[var(--bg)] p-4 md:p-6 overflow-y-auto overflow-x-auto">{children}</main>
    </div>
  );
}
