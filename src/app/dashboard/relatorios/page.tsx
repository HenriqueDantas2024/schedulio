"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  BarChart2, Users, BookOpen, Calendar, GraduationCap, Printer,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtH(t: string) { return t?.slice(0, 5) ?? ""; }
function r2(n: number) { return Math.round(n * 100) / 100; }

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_LABEL: Record<string, string> = { segunda:"Segunda", terca:"Terça", quarta:"Quarta", quinta:"Quinta", sexta:"Sexta", sabado:"Sábado" };
const DIAS_ORDER = ["segunda","terca","quarta","quinta","sexta","sabado"];

// ─── interfaces ───────────────────────────────────────────────────────────────
interface Turma { id: string; codigo: string; concurso: string; }

interface LinhaRelatorio {
  professor_id: string; professor_nome: string;
  total_aulas: number; total_horas: number;
  aulas_dadas: number; horas_dadas: number;
  detalhes: { materia: string; turma: string; aulas: number; horas: number; dadas: number; horas_dadas: number }[];
}

interface LinhaTurma {
  turma_id: string; turma_codigo: string; turma_concurso: string;
  total_aulas: number; total_horas: number;
  aulas_dadas: number; horas_dadas: number;
  materias: { nome: string; aulas: number; horas: number; dadas: number; horas_dadas: number }[];
}

interface AulaGrade {
  id: string; dia_semana: string; horario_inicio: string; horario_fim: string;
  professor_nome: string; materia_nome: string; turma_codigo: string; realizada: boolean;
}

interface LinhaMateria {
  materia_id: string; materia_nome: string;
  total_aulas: number; total_horas: number; aulas_dadas: number;
  professores: string[];
  por_turma: { turma: string; aulas: number; horas: number; dadas: number }[];
}

type Aba = "professores" | "turmas" | "grade" | "materias";

// ─── stat card ────────────────────────────────────────────────────────────────
function Card({ label, valor, sub }: { label: string; valor: string; sub?: string | null }) {
  return (
    <div className="p-5 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>{valor}</p>
      {sub && <p className="text-xs mt-1 font-semibold" style={{ color: "#16A34A" }}>{sub}</p>}
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────
function Empty({ text = "Nenhuma aula lançada neste período" }: { text?: string }) {
  return (
    <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--color-border)" }}>
      <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
      <p className="font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>{text}</p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Ajuste os filtros e tente novamente.</p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const supabase = createClient();
  const hoje = new Date();

  // shared
  const [aba, setAba] = useState<Aba>("professores");
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [turmaFiltro, setTurmaFiltro] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // tab: professores
  const [loadingProfs, setLoadingProfs] = useState(true);
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [professorFiltro, setProfessorFiltro] = useState("");
  const [expandidoProf, setExpandidoProf] = useState<string | null>(null);

  // tab: por turma
  const [loadingTurmaTab, setLoadingTurmaTab] = useState(false);
  const [linhasTurmas, setLinhasTurmas] = useState<LinhaTurma[]>([]);
  const [expandidoTurma, setExpandidoTurma] = useState<string | null>(null);

  // tab: grade completa
  const [semanaInicio, setSemanaInicio] = useState(() => getMondayOf(hoje.toISOString().slice(0, 10)));
  const semanaFim = addDays(semanaInicio, 5);
  const [gradeAulas, setGradeAulas] = useState<AulaGrade[]>([]);
  const [loadingGrade, setLoadingGrade] = useState(false);

  // tab: por matéria
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [linhasMaterias, setLinhasMaterias] = useState<LinhaMateria[]>([]);
  const [expandidoMateria, setExpandidoMateria] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("turmas").select("id, codigo, concurso").order("codigo")
      .then(({ data }) => setTurmas(data ?? []));
  }, []);

  // ── load helpers ──────────────────────────────────────────────────────────
  async function getSemanaIds(m: number, a: number) {
    const inicioMes = `${a}-${String(m + 1).padStart(2, "0")}-01`;
    const fimMes = new Date(a, m + 1, 0).toISOString().slice(0, 10);
    const { data } = await supabase.from("semanas").select("id").gte("data_inicio", inicioMes).lte("data_inicio", fimMes);
    return data?.map(s => s.id) ?? [];
  }

  // ── tab: professores ──────────────────────────────────────────────────────
  const loadProfessores = useCallback(async () => {
    setLoadingProfs(true); setExpandidoProf(null);
    const ids = await getSemanaIds(mes, ano);
    if (!ids.length) { setLinhas([]); setLoadingProfs(false); return; }
    let q = supabase.from("aulas")
      .select("professor_id, carga_horaria, realizada, professores(nome), materias(nome), turmas(codigo, concurso)")
      .in("semana_id", ids);
    if (turmaFiltro) q = q.eq("turma_id", turmaFiltro);
    const { data: aulas } = await q;
    const map = new Map<string, LinhaRelatorio>();
    for (const a of aulas ?? []) {
      const prof = (Array.isArray(a.professores) ? a.professores[0] : a.professores) as { nome: string } | null;
      const mat  = (Array.isArray(a.materias)    ? a.materias[0]    : a.materias)    as { nome: string } | null;
      const tur  = (Array.isArray(a.turmas)       ? a.turmas[0]      : a.turmas)      as { codigo: string } | null;
      if (!prof) continue;
      if (!map.has(a.professor_id)) map.set(a.professor_id, { professor_id: a.professor_id, professor_nome: prof.nome, total_aulas: 0, total_horas: 0, aulas_dadas: 0, horas_dadas: 0, detalhes: [] });
      const linha = map.get(a.professor_id)!;
      linha.total_aulas++; linha.total_horas += Number(a.carga_horaria);
      if (a.realizada) { linha.aulas_dadas++; linha.horas_dadas += Number(a.carga_horaria); }
      const det = linha.detalhes.find(d => d.materia === (mat?.nome ?? "—") && d.turma === (tur?.codigo ?? "—"));
      if (det) { det.aulas++; det.horas += Number(a.carga_horaria); if (a.realizada) { det.dadas++; det.horas_dadas += Number(a.carga_horaria); } }
      else linha.detalhes.push({ materia: mat?.nome ?? "—", turma: tur?.codigo ?? "—", aulas: 1, horas: Number(a.carga_horaria), dadas: a.realizada ? 1 : 0, horas_dadas: a.realizada ? Number(a.carga_horaria) : 0 });
    }
    setLinhas(Array.from(map.values()).sort((a, b) => b.total_horas - a.total_horas));
    setLoadingProfs(false);
  }, [mes, ano, turmaFiltro]);

  // ── tab: por turma ────────────────────────────────────────────────────────
  const loadTurmas = useCallback(async () => {
    setLoadingTurmaTab(true); setExpandidoTurma(null);
    const ids = await getSemanaIds(mes, ano);
    if (!ids.length) { setLinhasTurmas([]); setLoadingTurmaTab(false); return; }
    const { data: aulas } = await supabase.from("aulas")
      .select("turma_id, carga_horaria, realizada, turmas(codigo, concurso), materias(nome)")
      .in("semana_id", ids);
    const map = new Map<string, LinhaTurma>();
    for (const a of aulas ?? []) {
      const tur = (Array.isArray(a.turmas)    ? a.turmas[0]    : a.turmas)    as { codigo: string; concurso: string } | null;
      const mat = (Array.isArray(a.materias)  ? a.materias[0]  : a.materias)  as { nome: string } | null;
      if (!tur) continue;
      if (!map.has(a.turma_id)) map.set(a.turma_id, { turma_id: a.turma_id, turma_codigo: tur.codigo, turma_concurso: tur.concurso, total_aulas: 0, total_horas: 0, aulas_dadas: 0, horas_dadas: 0, materias: [] });
      const linha = map.get(a.turma_id)!;
      linha.total_aulas++; linha.total_horas += Number(a.carga_horaria);
      if (a.realizada) { linha.aulas_dadas++; linha.horas_dadas += Number(a.carga_horaria); }
      const m = linha.materias.find(x => x.nome === (mat?.nome ?? "—"));
      if (m) { m.aulas++; m.horas += Number(a.carga_horaria); if (a.realizada) { m.dadas++; m.horas_dadas += Number(a.carga_horaria); } }
      else linha.materias.push({ nome: mat?.nome ?? "—", aulas: 1, horas: Number(a.carga_horaria), dadas: a.realizada ? 1 : 0, horas_dadas: a.realizada ? Number(a.carga_horaria) : 0 });
    }
    setLinhasTurmas(Array.from(map.values()).sort((a, b) => a.turma_codigo.localeCompare(b.turma_codigo)));
    setLoadingTurmaTab(false);
  }, [mes, ano]);

  // ── tab: grade completa ───────────────────────────────────────────────────
  const loadGrade = useCallback(async () => {
    setLoadingGrade(true);
    const { data: semana } = await supabase.from("semanas").select("id")
      .eq("data_inicio", semanaInicio).eq("data_fim", semanaFim).maybeSingle();
    if (!semana) { setGradeAulas([]); setLoadingGrade(false); return; }
    let q = supabase.from("aulas")
      .select("id, dia_semana, horario_inicio, horario_fim, realizada, professores(nome), materias(nome), turmas(codigo)")
      .eq("semana_id", semana.id).order("horario_inicio");
    if (turmaFiltro) q = q.eq("turma_id", turmaFiltro);
    const { data: aulas } = await q;
    setGradeAulas((aulas ?? []).map(a => ({
      id: a.id, dia_semana: a.dia_semana,
      horario_inicio: a.horario_inicio, horario_fim: a.horario_fim, realizada: a.realizada,
      professor_nome: ((Array.isArray(a.professores) ? a.professores[0] : a.professores) as { nome: string } | null)?.nome ?? "—",
      materia_nome:   ((Array.isArray(a.materias)    ? a.materias[0]    : a.materias)    as { nome: string } | null)?.nome ?? "—",
      turma_codigo:   ((Array.isArray(a.turmas)       ? a.turmas[0]      : a.turmas)      as { codigo: string } | null)?.codigo ?? "—",
    })));
    setLoadingGrade(false);
  }, [semanaInicio, semanaFim, turmaFiltro]);

  // ── tab: por matéria ──────────────────────────────────────────────────────
  const loadMaterias = useCallback(async () => {
    setLoadingMaterias(true); setExpandidoMateria(null);
    const ids = await getSemanaIds(mes, ano);
    if (!ids.length) { setLinhasMaterias([]); setLoadingMaterias(false); return; }
    let q = supabase.from("aulas")
      .select("materia_id, carga_horaria, realizada, materias(nome), professores(nome), turmas(codigo)")
      .in("semana_id", ids);
    if (turmaFiltro) q = q.eq("turma_id", turmaFiltro);
    const { data: aulas } = await q;
    const map = new Map<string, LinhaMateria>();
    for (const a of aulas ?? []) {
      const mat  = (Array.isArray(a.materias)   ? a.materias[0]   : a.materias)   as { nome: string } | null;
      const prof = (Array.isArray(a.professores) ? a.professores[0] : a.professores) as { nome: string } | null;
      const tur  = (Array.isArray(a.turmas)      ? a.turmas[0]     : a.turmas)     as { codigo: string } | null;
      if (!mat) continue;
      if (!map.has(a.materia_id)) map.set(a.materia_id, { materia_id: a.materia_id, materia_nome: mat.nome, total_aulas: 0, total_horas: 0, aulas_dadas: 0, professores: [], por_turma: [] });
      const linha = map.get(a.materia_id)!;
      linha.total_aulas++; linha.total_horas += Number(a.carga_horaria);
      if (a.realizada) linha.aulas_dadas++;
      if (prof?.nome && !linha.professores.includes(prof.nome)) linha.professores.push(prof.nome);
      const pt = linha.por_turma.find(p => p.turma === (tur?.codigo ?? "—"));
      if (pt) { pt.aulas++; pt.horas += Number(a.carga_horaria); if (a.realizada) pt.dadas++; }
      else linha.por_turma.push({ turma: tur?.codigo ?? "—", aulas: 1, horas: Number(a.carga_horaria), dadas: a.realizada ? 1 : 0 });
    }
    setLinhasMaterias(Array.from(map.values()).sort((a, b) => b.total_horas - a.total_horas));
    setLoadingMaterias(false);
  }, [mes, ano, turmaFiltro]);

  // ── effects ───────────────────────────────────────────────────────────────
  useEffect(() => { loadProfessores(); }, [loadProfessores]);
  useEffect(() => { if (aba === "turmas")   loadTurmas();    }, [aba, loadTurmas]);
  useEffect(() => { if (aba === "grade")    loadGrade();     }, [aba, loadGrade]);
  useEffect(() => { if (aba === "materias") loadMaterias();  }, [aba, loadMaterias]);

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setMes(d.getMonth()); setAno(d.getFullYear());
  }

  // ── derived (professores tab) ─────────────────────────────────────────────
  const linhasFiltradas = professorFiltro ? linhas.filter(l => l.professor_id === professorFiltro) : linhas;
  const totAulas      = linhasFiltradas.reduce((s, l) => s + l.total_aulas, 0);
  const totHoras      = linhasFiltradas.reduce((s, l) => s + l.total_horas, 0);
  const totDadas      = linhasFiltradas.reduce((s, l) => s + l.aulas_dadas, 0);
  const totHorasDadas = linhasFiltradas.reduce((s, l) => s + l.horas_dadas, 0);

  // ── derived (grade completa) ──────────────────────────────────────────────
  const timeSlots = [...new Set(gradeAulas.map(a => `${a.horario_inicio}|${a.horario_fim}`))].sort();
  const cellMap = new Map<string, AulaGrade[]>();
  for (const a of gradeAulas) {
    const key = `${a.dia_semana}|${a.horario_inicio}|${a.horario_fim}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(a);
  }

  // ─── tab button style ─────────────────────────────────────────────────────
  const tabStyle = (t: Aba) => ({
    backgroundColor: aba === t ? "var(--color-primary)" : "transparent",
    color: aba === t ? "#fff" : "var(--color-text-secondary)",
    border: `1px solid ${aba === t ? "var(--color-primary)" : "var(--color-border)"}`,
  });

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Relatórios</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Visão consolidada por professor, turma, grade e matéria.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)"; }}
        >
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* Print-only header */}
      <div className="print-only mb-6" style={{ borderBottom: "2px solid var(--color-navy)", paddingBottom: "12px" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-primary)" }}>Schedulio — Grade Horária</p>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>
          Relatório: {{ professores: "Professores", turmas: "Por Turma", grade: "Grade Completa", materias: "Por Matéria" }[aba]}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {aba !== "grade"
            ? `${MESES[mes]} ${ano}`
            : `Semana de ${fmtDate(semanaInicio)} a ${fmtDate(semanaFim)}`}
          {turmaFiltro ? ` · ${turmas.find(t => t.id === turmaFiltro)?.codigo ?? ""}` : " · Todas as turmas"}
          {" · "}Gerado em {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-2 mb-6 flex-wrap">
        {([
          { id: "professores", label: "Professores", Icon: Users },
          { id: "turmas",      label: "Por Turma",   Icon: GraduationCap },
          { id: "grade",       label: "Grade Completa", Icon: Calendar },
          { id: "materias",    label: "Por Matéria", Icon: BookOpen },
        ] as { id: Aba; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tabStyle(id)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Shared filters (mês + turma) — hidden on grade tab (has own week nav) ── */}
      {aba !== "grade" && (
        <div className="no-print flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => navMes(-1)} aria-label="Mês anterior" className="p-2 rounded-lg"
              style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
            <div className="px-5 py-2.5 rounded-lg font-semibold text-sm min-w-36 text-center"
              style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
              {MESES[mes]} {ano}
            </div>
            <button onClick={() => navMes(1)} aria-label="Próximo mês" className="p-2 rounded-lg"
              style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>

          <select value={turmaFiltro} onChange={e => { setTurmaFiltro(e.target.value); setProfessorFiltro(""); }}
            className="px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}>
            <option value="">Todas as turmas</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.concurso}</option>)}
          </select>

          {aba === "professores" && (
            <select value={professorFiltro} onChange={e => setProfessorFiltro(e.target.value)}
              className="px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
              disabled={linhas.length === 0}>
              <option value="">Todos os professores</option>
              {linhas.map(l => <option key={l.professor_id} value={l.professor_id}>{l.professor_nome}</option>)}
            </select>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: PROFESSORES
      ════════════════════════════════════════════════════════════════════ */}
      {aba === "professores" && (
        loadingProfs ? <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
        : linhas.length === 0 ? <Empty />
        : <>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card label="Professores"   valor={String(linhasFiltradas.length)} />
            <Card label="Aulas lançadas" valor={String(totAulas)} sub={`${totDadas} dadas`} />
            <Card label="Aulas faltam"  valor={String(totAulas - totDadas)} />
            <Card label="Horas dadas"   valor={`${r2(totHorasDadas)}h`} />
            <Card label="Horas faltam"  valor={`${r2(totHoras - totHorasDadas)}h`}
              sub={totAulas > 0 ? `${Math.round((totDadas / totAulas) * 100)}% concluído` : null} />
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span className="col-span-3">Professor</span>
              <span className="col-span-2 text-center">Lançadas</span>
              <span className="col-span-2 text-center">Dadas</span>
              <span className="col-span-2 text-center">Faltam</span>
              <span className="col-span-2 text-center">Horas Dadas</span>
              <span className="col-span-1" />
            </div>

            {linhasFiltradas.map((l, i) => {
              const faltam = l.total_aulas - l.aulas_dadas;
              const hFaltam = r2(l.total_horas - l.horas_dadas);
              return (
                <div key={l.professor_id} style={{ borderBottom: i < linhasFiltradas.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div className="grid grid-cols-12 px-5 py-4 items-center cursor-pointer transition-all"
                    style={{ backgroundColor: expandidoProf === l.professor_id ? "var(--color-background)" : "transparent" }}
                    onClick={() => setExpandidoProf(p => p === l.professor_id ? null : l.professor_id)}
                    onMouseEnter={e => { if (expandidoProf !== l.professor_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--color-background)"; }}
                    onMouseLeave={e => { if (expandidoProf !== l.professor_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}>
                    <span className="col-span-3 font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{l.professor_nome}</span>
                    <span className="col-span-2 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{l.total_aulas}</span>
                    <span className="col-span-2 text-center text-sm font-semibold" style={{ color: l.aulas_dadas === l.total_aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{l.aulas_dadas}</span>
                    <div className="col-span-2 text-center">
                      {faltam > 0
                        ? <span className="inline-flex flex-col items-center"><span className="text-sm font-bold" style={{ color: "#D97706" }}>{faltam}</span><span className="text-xs" style={{ color: "#D97706" }}>{hFaltam}h</span></span>
                        : <span className="text-sm font-semibold" style={{ color: "#16A34A" }}>—</span>}
                    </div>
                    <span className="col-span-2 text-center font-bold text-sm" style={{ color: "var(--color-primary)" }}>{r2(l.horas_dadas)}h</span>
                    <div className="col-span-1 flex justify-end">
                      {expandidoProf === l.professor_id ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />}
                    </div>
                  </div>

                  {expandidoProf === l.professor_id && (
                    <div className="px-5 pb-4" style={{ backgroundColor: "var(--color-background)" }}>
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                            {["Disciplina","Turma","Lançadas","Dadas","Faltam","Horas Dadas","Horas Faltam"].map(h => (
                              <th key={h} className={`py-2 font-semibold ${h === "Disciplina" || h === "Turma" ? "text-left" : "text-center"}`} style={{ color: "var(--color-text-muted)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {l.detalhes.sort((a, b) => b.horas - a.horas).map((d, di) => {
                            const dFaltam = d.aulas - d.dadas;
                            const dHFaltam = r2(d.horas - d.horas_dadas);
                            return (
                              <tr key={di} style={{ borderBottom: di < l.detalhes.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                                <td className="py-2" style={{ color: "var(--color-text-primary)" }}>{d.materia}</td>
                                <td className="py-2 font-mono" style={{ color: "var(--color-text-secondary)" }}>{d.turma}</td>
                                <td className="py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>{d.aulas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: d.dadas === d.aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{d.dadas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: dFaltam > 0 ? "#D97706" : "#16A34A" }}>{dFaltam > 0 ? dFaltam : "—"}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: "var(--color-navy)" }}>{r2(d.horas_dadas)}h</td>
                                <td className="py-2 text-center font-semibold" style={{ color: dHFaltam > 0 ? "#D97706" : "#16A34A" }}>{dHFaltam > 0 ? `${dHFaltam}h` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: POR TURMA
      ════════════════════════════════════════════════════════════════════ */}
      {aba === "turmas" && (
        loadingTurmaTab ? <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
        : linhasTurmas.length === 0 ? <Empty />
        : <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card label="Turmas"        valor={String(linhasTurmas.length)} />
            <Card label="Total de aulas" valor={String(linhasTurmas.reduce((s, t) => s + t.total_aulas, 0))} />
            <Card label="Horas dadas"   valor={`${r2(linhasTurmas.reduce((s, t) => s + t.horas_dadas, 0))}h`} />
            <Card label="Concluído"
              valor={(() => { const tot = linhasTurmas.reduce((s, t) => s + t.total_aulas, 0); const dad = linhasTurmas.reduce((s, t) => s + t.aulas_dadas, 0); return tot > 0 ? `${Math.round((dad / tot) * 100)}%` : "—"; })()}
            />
          </div>

          <div className="flex flex-col gap-4">
            {linhasTurmas.map(t => {
              const pct = t.total_aulas > 0 ? Math.round((t.aulas_dadas / t.total_aulas) * 100) : 0;
              return (
                <div key={t.turma_id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                  {/* header da turma */}
                  <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    style={{ backgroundColor: "var(--color-surface)" }}
                    onClick={() => setExpandidoTurma(p => p === t.turma_id ? null : t.turma_id)}>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--color-navy)" }}>{t.turma_codigo}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.turma_concurso}</p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <span style={{ color: "var(--color-text-secondary)" }}><strong>{t.total_aulas}</strong> aulas</span>
                        <span style={{ color: "#16A34A" }}><strong>{t.aulas_dadas}</strong> dadas</span>
                        <span style={{ color: "var(--color-primary)" }}><strong>{r2(t.horas_dadas)}h</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* progress bar */}
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#16A34A" : "var(--color-primary)" }} />
                      </div>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: pct === 100 ? "#16A34A" : "var(--color-primary)" }}>{pct}%</span>
                      {expandidoTurma === t.turma_id ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />}
                    </div>
                  </div>

                  {expandidoTurma === t.turma_id && (
                    <div className="px-5 py-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                            {["Disciplina","Lançadas","Dadas","Faltam","Horas Dadas","Horas Faltam","Concluído"].map(h => (
                              <th key={h} className={`py-2 font-semibold ${h === "Disciplina" ? "text-left" : "text-center"}`} style={{ color: "var(--color-text-muted)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.materias.sort((a, b) => b.horas - a.horas).map((m, mi) => {
                            const mFaltam = m.aulas - m.dadas;
                            const mHFaltam = r2(m.horas - m.horas_dadas);
                            const mPct = m.aulas > 0 ? Math.round((m.dadas / m.aulas) * 100) : 0;
                            return (
                              <tr key={mi} style={{ borderBottom: mi < t.materias.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                                <td className="py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>{m.nome}</td>
                                <td className="py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>{m.aulas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: m.dadas === m.aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{m.dadas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: mFaltam > 0 ? "#D97706" : "#16A34A" }}>{mFaltam > 0 ? mFaltam : "—"}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: "var(--color-navy)" }}>{r2(m.horas_dadas)}h</td>
                                <td className="py-2 text-center font-semibold" style={{ color: mHFaltam > 0 ? "#D97706" : "#16A34A" }}>{mHFaltam > 0 ? `${mHFaltam}h` : "—"}</td>
                                <td className="py-2 text-center">
                                  <span className="font-bold" style={{ color: mPct === 100 ? "#16A34A" : "var(--color-primary)" }}>{mPct}%</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: GRADE COMPLETA
      ════════════════════════════════════════════════════════════════════ */}
      {aba === "grade" && (
        <>
          {/* Controls */}
          <div className="no-print flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={() => setSemanaInicio(p => addDays(p, -7))} aria-label="Semana anterior"
                className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
              </button>
              <div className="px-5 py-2.5 rounded-lg font-semibold text-sm"
                style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
                {fmtDate(semanaInicio)} a {fmtDate(semanaFim)}
              </div>
              <button onClick={() => setSemanaInicio(p => addDays(p, 7))} aria-label="Próxima semana"
                className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            <select value={turmaFiltro} onChange={e => setTurmaFiltro(e.target.value)}
              className="px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}>
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.concurso}</option>)}
            </select>
          </div>

          {loadingGrade ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
          ) : gradeAulas.length === 0 ? (
            <Empty text="Nenhuma aula lançada nesta semana" />
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
              <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface)" }}>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wide w-28" style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>Horário</th>
                    {DIAS_ORDER.map(dia => (
                      <th key={dia} className="px-3 py-3 text-center font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>
                        {DIAS_LABEL[dia]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, si) => {
                    const [ini, fim] = slot.split("|");
                    return (
                      <tr key={slot} style={{ borderBottom: si < timeSlots.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                        <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--color-navy)", borderRight: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", whiteSpace: "nowrap" }}>
                          {fmtH(ini)}–{fmtH(fim)}
                        </td>
                        {DIAS_ORDER.map(dia => {
                          const key = `${dia}|${ini}|${fim}`;
                          const aulas = cellMap.get(key) ?? [];
                          return (
                            <td key={dia} className="px-3 py-2 align-top" style={{ borderRight: "1px solid var(--color-border)", verticalAlign: "top" }}>
                              {aulas.length === 0 ? (
                                <span style={{ color: "var(--color-text-muted)" }}>—</span>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {aulas.map(a => (
                                    <div key={a.id} className="rounded-lg px-2 py-1.5"
                                      style={{
                                        backgroundColor: a.realizada ? "#F0FDF4" : "var(--color-background)",
                                        border: `1px solid ${a.realizada ? "#BBF7D0" : "var(--color-border)"}`,
                                      }}>
                                      <p className="font-semibold leading-tight" style={{ color: "var(--color-navy)" }}>{a.materia_nome}</p>
                                      <p className="leading-tight mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{a.professor_nome}</p>
                                      {!turmaFiltro && <p className="font-mono leading-tight mt-0.5" style={{ color: "var(--color-text-muted)" }}>{a.turma_codigo}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: POR MATÉRIA
      ════════════════════════════════════════════════════════════════════ */}
      {aba === "materias" && (
        loadingMaterias ? <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
        : linhasMaterias.length === 0 ? <Empty />
        : <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card label="Matérias"      valor={String(linhasMaterias.length)} />
            <Card label="Total de aulas" valor={String(linhasMaterias.reduce((s, m) => s + m.total_aulas, 0))} />
            <Card label="Total de horas" valor={`${r2(linhasMaterias.reduce((s, m) => s + m.total_horas, 0))}h`} />
            <Card label="Concluído"
              valor={(() => { const tot = linhasMaterias.reduce((s, m) => s + m.total_aulas, 0); const dad = linhasMaterias.reduce((s, m) => s + m.aulas_dadas, 0); return tot > 0 ? `${Math.round((dad / tot) * 100)}%` : "—"; })()}
            />
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span className="col-span-4">Matéria</span>
              <span className="col-span-2 text-center">Aulas</span>
              <span className="col-span-2 text-center">Dadas</span>
              <span className="col-span-2 text-center">Horas</span>
              <span className="col-span-1 text-center">%</span>
              <span className="col-span-1" />
            </div>

            {linhasMaterias.map((m, i) => {
              const pct = m.total_aulas > 0 ? Math.round((m.aulas_dadas / m.total_aulas) * 100) : 0;
              return (
                <div key={m.materia_id} style={{ borderBottom: i < linhasMaterias.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div className="grid grid-cols-12 px-5 py-4 items-center cursor-pointer transition-all"
                    style={{ backgroundColor: expandidoMateria === m.materia_id ? "var(--color-background)" : "transparent" }}
                    onClick={() => setExpandidoMateria(p => p === m.materia_id ? null : m.materia_id)}
                    onMouseEnter={e => { if (expandidoMateria !== m.materia_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--color-background)"; }}
                    onMouseLeave={e => { if (expandidoMateria !== m.materia_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}>
                    <div className="col-span-4">
                      <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{m.materia_nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{m.professores.slice(0, 2).join(", ")}{m.professores.length > 2 ? ` +${m.professores.length - 2}` : ""}</p>
                    </div>
                    <span className="col-span-2 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{m.total_aulas}</span>
                    <span className="col-span-2 text-center text-sm font-semibold" style={{ color: m.aulas_dadas === m.total_aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{m.aulas_dadas}</span>
                    <span className="col-span-2 text-center font-bold text-sm" style={{ color: "var(--color-primary)" }}>{r2(m.total_horas)}h</span>
                    <span className="col-span-1 text-center font-bold text-sm" style={{ color: pct === 100 ? "#16A34A" : "var(--color-primary)" }}>{pct}%</span>
                    <div className="col-span-1 flex justify-end">
                      {expandidoMateria === m.materia_id ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />}
                    </div>
                  </div>

                  {expandidoMateria === m.materia_id && (
                    <div className="px-5 pb-4" style={{ backgroundColor: "var(--color-background)" }}>
                      {/* Professores */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Professores que lecionam</p>
                        <div className="flex flex-wrap gap-2">
                          {m.professores.map(p => (
                            <span key={p} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-navy)" }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Por turma */}
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                            {["Turma","Aulas","Dadas","Faltam","Horas","Concluído"].map(h => (
                              <th key={h} className={`py-2 font-semibold ${h === "Turma" ? "text-left" : "text-center"}`} style={{ color: "var(--color-text-muted)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {m.por_turma.map((pt, pti) => {
                            const ptFaltam = pt.aulas - pt.dadas;
                            const ptPct = pt.aulas > 0 ? Math.round((pt.dadas / pt.aulas) * 100) : 0;
                            return (
                              <tr key={pti} style={{ borderBottom: pti < m.por_turma.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                                <td className="py-2 font-mono font-semibold" style={{ color: "var(--color-navy)" }}>{pt.turma}</td>
                                <td className="py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>{pt.aulas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: pt.dadas === pt.aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{pt.dadas}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: ptFaltam > 0 ? "#D97706" : "#16A34A" }}>{ptFaltam > 0 ? ptFaltam : "—"}</td>
                                <td className="py-2 text-center font-semibold" style={{ color: "var(--color-primary)" }}>{r2(pt.horas)}h</td>
                                <td className="py-2 text-center font-bold" style={{ color: ptPct === 100 ? "#16A34A" : "var(--color-primary)" }}>{ptPct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
