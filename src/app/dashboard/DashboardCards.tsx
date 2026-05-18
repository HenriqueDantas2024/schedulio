"use client";

import { Users, GraduationCap, BookOpen, Calendar, type LucideIcon } from "lucide-react";

const cards: { label: string; icon: LucideIcon; href: string; color: string }[] = [
  { label: "Professores", icon: Users, href: "/dashboard/professores", color: "var(--color-primary)" },
  { label: "Turmas", icon: GraduationCap, href: "/dashboard/turmas", color: "var(--color-navy)" },
  { label: "Matérias", icon: BookOpen, href: "/dashboard/materias", color: "var(--color-success)" },
  { label: "Grade Horária", icon: Calendar, href: "/dashboard/grade", color: "var(--color-warning)" },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      {cards.map(({ label, icon: Icon, href, color }) => (
        <a
          key={href}
          href={href}
          className="flex items-center gap-4 p-5 rounded-2xl transition-all"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-elevated)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
        >
          <div className="p-3 rounded-xl" style={{ backgroundColor: color + "18" }}>
            <Icon size={22} style={{ color }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{label}</span>
        </a>
      ))}
    </div>
  );
}
