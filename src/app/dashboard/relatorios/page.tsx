"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";

interface Turma { id: string; codigo: string; concurso: string; }

interface LinhaRelatorio {
  professor_id: string;
  professor_nome: string;
  total_aulas: number;
  total_horas: number;
  aulas_dadas: number;
  horas_dadas: number;
  detalhes: { materia: string; turma: string; aulas: number; horas: number; dadas: number; horas_dadas: number }[];
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function RelatoriosPage() {
  const supabase = createClient();

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [turmaFiltro, setTurmaFiltro] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("turmas").select("id, codigo, concurso").order("codigo").then(({ data }) => setTurmas(data ?? []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setExpandido(null);

    // Semanas que começam dentro do mês/ano selecionado
    const inicioMes = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const fimMes = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

    const { data: semanas } = await supabase
      .from("semanas")
      .select("id")
      .gte("data_inicio", inicioMes)
      .lte("data_inicio", fimMes);

    if (!semanas || semanas.length === 0) {
      setLinhas([]);
      setLoading(false);
      return;
    }

    const semanaIds = semanas.map(s => s.id);

    let query = supabase
      .from("aulas")
      .select("professor_id, carga_horaria, realizada, professores(nome), materias(nome), turmas(codigo, concurso)")
      .in("semana_id", semanaIds);

    if (turmaFiltro) query = query.eq("turma_id", turmaFiltro);

    const { data: aulas } = await query;

    if (!aulas || aulas.length === 0) {
      setLinhas([]);
      setLoading(false);
      return;
    }

    // Agrupa por professor
    const map = new Map<string, LinhaRelatorio>();

    for (const a of aulas) {
      const prof = Array.isArray(a.professores) ? a.professores[0] : a.professores as { nome: string };
      const mat = Array.isArray(a.materias) ? a.materias[0] : a.materias as { nome: string };
      const tur = Array.isArray(a.turmas) ? a.turmas[0] : a.turmas as { codigo: string; concurso: string };
      if (!prof) continue;

      if (!map.has(a.professor_id)) {
        map.set(a.professor_id, {
          professor_id: a.professor_id,
          professor_nome: prof.nome,
          total_aulas: 0,
          total_horas: 0,
          aulas_dadas: 0,
          horas_dadas: 0,
          detalhes: [],
        });
      }

      const linha = map.get(a.professor_id)!;
      linha.total_aulas += 1;
      linha.total_horas += Number(a.carga_horaria);
      if (a.realizada) { linha.aulas_dadas += 1; linha.horas_dadas += Number(a.carga_horaria); }

      const det = linha.detalhes.find(d => d.materia === (mat?.nome ?? "—") && d.turma === (tur?.codigo ?? "—"));
      if (det) {
        det.aulas += 1;
        det.horas += Number(a.carga_horaria);
        if (a.realizada) { det.dadas += 1; det.horas_dadas += Number(a.carga_horaria); }
      } else {
        linha.detalhes.push({
          materia: mat?.nome ?? "—",
          turma: tur?.codigo ?? "—",
          aulas: 1,
          horas: Number(a.carga_horaria),
          dadas: a.realizada ? 1 : 0,
          horas_dadas: a.realizada ? Number(a.carga_horaria) : 0,
        });
      }
    }

    const resultado = Array.from(map.values()).sort((a, b) => b.total_horas - a.total_horas);
    setLinhas(resultado);
    setLoading(false);
  }, [mes, ano, turmaFiltro]);

  useEffect(() => { load(); }, [load]);

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setMes(d.getMonth());
    setAno(d.getFullYear());
  }

  const totalHoras = linhas.reduce((s, l) => s + l.total_horas, 0);
  const totalAulas = linhas.reduce((s, l) => s + l.total_aulas, 0);
  const totalHorasDadas = linhas.reduce((s, l) => s + l.horas_dadas, 0);
  const totalAulasDadas = linhas.reduce((s, l) => s + l.aulas_dadas, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Relatórios</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Horas e aulas por professor no período selecionado.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <button onClick={() => navMes(-1)} className="p-2 rounded-lg transition-all"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
          </button>
          <div className="px-5 py-2.5 rounded-lg font-semibold text-sm min-w-36 text-center"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
            {MESES[mes]} {ano}
          </div>
          <button onClick={() => navMes(1)} className="p-2 rounded-lg transition-all"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
            <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        {/* Filtro turma */}
        <select
          value={turmaFiltro}
          onChange={e => setTurmaFiltro(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
        >
          <option value="">Todas as turmas</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.concurso}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      ) : linhas.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--color-border)" }}>
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>Nenhuma aula lançada neste período</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Ajuste o mês ou o filtro de turma.</p>
        </div>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Professores ativos", valor: String(linhas.length), sub: null },
              { label: "Aulas lançadas", valor: String(totalAulas), sub: `${totalAulasDadas} dadas` },
              { label: "Horas lançadas", valor: `${Math.round(totalHoras * 100) / 100}h`, sub: `${Math.round(totalHorasDadas * 100) / 100}h dadas` },
              {
                label: "Aproveitamento",
                valor: totalAulas > 0 ? `${Math.round((totalAulasDadas / totalAulas) * 100)}%` : "—",
                sub: null,
              },
            ].map(({ label, valor, sub }) => (
              <div key={label} className="p-5 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>{valor}</p>
                {sub && <p className="text-xs mt-1 font-semibold" style={{ color: "#16A34A" }}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            {/* Cabeçalho */}
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span className="col-span-4">Professor</span>
              <span className="col-span-2 text-center">Lançadas</span>
              <span className="col-span-2 text-center">Dadas</span>
              <span className="col-span-2 text-center">Horas Dadas</span>
              <span className="col-span-2"></span>
            </div>

            {linhas.map((l, i) => (
              <div key={l.professor_id} style={{ borderBottom: i < linhas.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                {/* Linha principal */}
                <div
                  className="grid grid-cols-12 px-5 py-4 items-center cursor-pointer transition-all"
                  style={{ backgroundColor: expandido === l.professor_id ? "var(--color-background)" : "transparent" }}
                  onClick={() => setExpandido(prev => prev === l.professor_id ? null : l.professor_id)}
                  onMouseEnter={e => { if (expandido !== l.professor_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--color-background)"; }}
                  onMouseLeave={e => { if (expandido !== l.professor_id) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                >
                  <span className="col-span-4 font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{l.professor_nome}</span>
                  <span className="col-span-2 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{l.total_aulas}</span>
                  <span className="col-span-2 text-center text-sm font-semibold" style={{ color: l.aulas_dadas === l.total_aulas ? "#16A34A" : "var(--color-text-secondary)" }}>
                    {l.aulas_dadas}
                  </span>
                  <span className="col-span-2 text-center font-bold text-sm" style={{ color: "var(--color-primary)" }}>
                    {Math.round(l.horas_dadas * 100) / 100}h
                  </span>
                  <div className="col-span-2 flex justify-end">
                    {expandido === l.professor_id
                      ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} />
                      : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />
                    }
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expandido === l.professor_id && (
                  <div className="px-5 pb-4" style={{ backgroundColor: "var(--color-background)" }}>
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <th className="py-2 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>Disciplina</th>
                          <th className="py-2 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>Turma</th>
                          <th className="py-2 text-center font-semibold" style={{ color: "var(--color-text-muted)" }}>Lançadas</th>
                          <th className="py-2 text-center font-semibold" style={{ color: "var(--color-text-muted)" }}>Dadas</th>
                          <th className="py-2 text-center font-semibold" style={{ color: "var(--color-text-muted)" }}>Horas Dadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {l.detalhes
                          .sort((a, b) => b.horas - a.horas)
                          .map((d, di) => (
                            <tr key={di} style={{ borderBottom: di < l.detalhes.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                              <td className="py-2" style={{ color: "var(--color-text-primary)" }}>{d.materia}</td>
                              <td className="py-2 font-mono" style={{ color: "var(--color-text-secondary)" }}>{d.turma}</td>
                              <td className="py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>{d.aulas}</td>
                              <td className="py-2 text-center font-semibold" style={{ color: d.dadas === d.aulas ? "#16A34A" : "var(--color-text-secondary)" }}>{d.dadas}</td>
                              <td className="py-2 text-center font-semibold" style={{ color: "var(--color-navy)" }}>{Math.round(d.horas_dadas * 100) / 100}h</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
