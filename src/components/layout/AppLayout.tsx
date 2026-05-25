"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/hooks/useUserRole";
import {
  HouseSimple, Users, BookOpenText, CalendarDots,
  EnvelopeSimple, CurrencyDollar, ChartLineUp,
  SignOut, UserCircle,
} from "@phosphor-icons/react";

const allNavItems = [
  { href: "/dashboard",              label: "Início",        icon: HouseSimple,     roles: ["coordenador", "diretor"] },
  { href: "/dashboard/professores",  label: "Professores",   icon: Users,           roles: ["coordenador", "diretor"] },
  { href: "/dashboard/materias",     label: "Matérias",      icon: BookOpenText,    roles: ["coordenador", "diretor"] },
  { href: "/dashboard/turmas",       label: "Grade Horária", icon: CalendarDots,    roles: ["coordenador", "diretor"] },
  { href: "/dashboard/tirinhas",     label: "Comunicados",   icon: EnvelopeSimple,  roles: ["coordenador", "diretor"] },
  { href: "/dashboard/pagamentos",   label: "Pagamentos",    icon: CurrencyDollar,  roles: ["diretor"] },
  { href: "/dashboard/relatorios",   label: "Relatórios",    icon: ChartLineUp,     roles: ["coordenador", "diretor"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUserRole();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const navItems = allNavItems.filter(item =>
    role ? item.roles.includes(role) : item.roles.includes("coordenador")
  );

  const roleLabel = role === "diretor" ? "Diretor" : "Coordenador";
  const emailShort = userEmail ? userEmail.split("@")[0] : "—";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>

      {/* Sidebar */}
      <aside className="flex flex-col w-60 shrink-0 h-full" style={{ backgroundColor: "var(--color-navy)", borderRight: "1px solid var(--color-navy-medium)" }}>

        {/* Logo */}
        <div className="flex items-center justify-center px-6 py-4" style={{ borderBottom: "1px solid var(--color-navy-medium)" }}>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: "#fff", letterSpacing: "-0.5px" }}>Schedulio</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.65)",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-3" style={{ borderTop: "1px solid var(--color-navy-medium)" }}>
          {/* User card */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
              <UserCircle size={16} weight="fill" color="#fff" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "#fff" }}>{emailShort}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{roleLabel}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            <SignOut size={18} weight="regular" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
