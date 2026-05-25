"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, GraduationCap, BookOpen, Calendar, BarChart2, Mail } from "lucide-react";
import { useCountUp } from "@/lib/hooks/useCountUp";

function getMondayOf(d: string) {
  const dt = new Date(d + "T00:00:00");
  const diff = dt.getDay() === 0 ? -6 : 1 - dt.getDay();
  dt.setDate(dt.getDate() + diff);
  return dt.toISOString().slice(0, 10);
}
function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

const navLinks = [
  { label: "Professores",  icon: Users,        href: "/dashboard/professores", color: "#1D40B0", bg: "#EEF3FF" },
  { label: "Matérias",     icon: BookOpen,     href: "/dashboard/materias",    color: "#0EA5E9", bg: "#E0F2FE" },
  { label: "Grade Horária",icon: Calendar,     href: "/dashboard/turmas",      color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Comunicados",  icon: Mail,         href: "/dashboard/tirinhas",    color: "#2BBFAA", bg: "#E6F9F7" },
  { label: "Relatórios",   icon: BarChart2,    href: "/dashboard/relatorios",  color: "#8B5CF6", bg: "#EDE9FE" },
];

export default function DashboardHome() {
  const supabase = createClient();

  const [kpis, setKpis]   = useState({ professores: 0, turmas: 0, materias: 0, aulasSemana: 0, pctMes: 0 });
  const [ready, setReady] = useState(false);

  const cProfs    = useCountUp(kpis.professores, 1200, ready);
  const cTurmas   = useCountUp(kpis.turmas,      1200, ready);
  const cMaterias = useCountUp(kpis.materias,    1200, ready);
  const cAulas    = useCountUp(kpis.aulasSemana, 1200, ready);
  const cPct      = useCountUp(kpis.pctMes,      1400, ready);

  // KPIs
  useEffect(() => {
    async function load() {
      const hoje = new Date().toISOString().slice(0, 10);

      const monday = getMondayOf(hoje);
      const saturday = addDays(monday, 5);
      const now = new Date();
      const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const fimMes    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      // Todas as queries independentes em paralelo
      const [
        { count: profs },
        { count: turmas },
        { count: mats },
        { data: semana },
        { data: semsMes },
      ] = await Promise.all([
        supabase.from("professores").select("*", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("turmas").select("*", { count: "exact", head: true }).eq("status", "ativa"),
        supabase.from("materias").select("*", { count: "exact", head: true }),
        supabase.from("semanas").select("id").eq("data_inicio", monday).eq("data_fim", saturday).maybeSingle(),
        supabase.from("semanas").select("id").gte("data_inicio", inicioMes).lte("data_inicio", fimMes),
      ]);

      // Queries dependentes dos IDs de semana — em paralelo entre si
      const [aulasSemanaResult, pctMesResult] = await Promise.all([
        semana
          ? supabase.from("aulas").select("*", { count: "exact", head: true }).eq("semana_id", semana.id)
          : Promise.resolve({ count: 0 }),
        semsMes?.length
          ? Promise.all([
              supabase.from("aulas").select("*", { count: "exact", head: true }).in("semana_id", semsMes.map(s => s.id)),
              supabase.from("aulas").select("*", { count: "exact", head: true }).in("semana_id", semsMes.map(s => s.id)).eq("realizada", true),
            ])
          : Promise.resolve(null),
      ]);

      const aulasSemana = aulasSemanaResult.count ?? 0;
      const pctMes = pctMesResult
        ? (() => { const [tot, dad] = pctMesResult as [{ count: number | null }, { count: number | null }]; return tot.count ? Math.round(((dad.count ?? 0) / tot.count) * 100) : 0; })()
        : 0;

      setKpis({ professores: profs ?? 0, turmas: turmas ?? 0, materias: mats ?? 0, aulasSemana, pctMes });
      setReady(true);
    }
    load();
  }, []);

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden flex flex-col justify-between p-8" style={{ height: 320, background: "linear-gradient(135deg, #0F1D54 0%, #1A2D7A 55%, #2BBFAA 100%)" }}>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight" style={{ color: "#fff" }}>Schedulio</span>
          <span className="text-sm capitalize px-3 py-1.5 rounded-full"
            style={{ color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            {dataAtual}
          </span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            Painel de Coordenação
          </p>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-1">
            Bem-vindo ao Schedulio
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>
            Gestão inteligente de professores, turmas e grade horária.
          </p>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4 px-8 py-6"
        style={{ backgroundColor: "var(--color-background)" }}>
        {([
          { label: "Professores Ativos", valor: cProfs,          Icon: Users,        color: "#1D40B0" },
          { label: "Turmas Ativas",      valor: cTurmas,         Icon: GraduationCap,color: "#0F1D54" },
          { label: "Matérias",           valor: cMaterias,       Icon: BookOpen,     color: "#0EA5E9" },
          { label: "Aulas esta semana",  valor: cAulas,          Icon: Calendar,     color: "#F59E0B" },
          { label: "Concluído no mês",   valor: `${cPct}%`,      Icon: BarChart2,    color: "#10B981" },
        ] as { label: string; valor: string | number; Icon: React.ElementType; color: string }[]).map(({ label, valor, Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: color + "1A" }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "var(--color-navy)" }}>{valor}</p>
          </div>
        ))}
      </div>

      {/* ── Quick access ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--color-text-muted)" }}>Acesso Rápido</p>
        <div className="grid grid-cols-5 gap-3">
          {navLinks.map(({ label, icon: Icon, href, color, bg }) => (
            <a key={href} href={href}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = color;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = `0 8px 24px ${color}28`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--color-border)";
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              <div className="p-3.5 rounded-xl" style={{ backgroundColor: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="font-semibold text-sm text-center"
                style={{ color: "var(--color-navy)" }}>{label}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
