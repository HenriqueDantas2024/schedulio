"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle,
  Send, Loader2, DollarSign, Printer,
} from "lucide-react";
import Button from "@/components/ui/Button";

// ── helpers ──────────────────────────────────────────────────────────────────
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
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function r2(n: number) { return Math.round(n * 100) / 100; }

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ── types ─────────────────────────────────────────────────────────────────────
interface LinhaPagamento {
  professor_id: string;
  professor_nome: string;
  professor_email: string;
  valor_hora: number;
  total_horas: number;
  total_valor: number;
  status: "pendente" | "pago";
  pago_em?: string | null;
}

type Aba = "semanal" | "mensal";

// ── component ─────────────────────────────────────────────────────────────────
export default function PagamentosPage() {
  const supabase = createClient();
  const hoje = new Date();

  const [aba, setAba] = useState<Aba>("semanal");
  const [semanaInicio, setSemanaInicio] = useState(() => getMondayOf(hoje.toISOString().slice(0, 10)));
  const semanaFim = addDays(semanaInicio, 5);
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  const [linhas, setLinhas] = useState<LinhaPagamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [feedbackEnvio, setFeedbackEnvio] = useState<Record<string, "ok" | "erro">>({});

  // ── Carregar dados ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFeedbackEnvio({});

    const periodo_inicio = aba === "semanal"
      ? semanaInicio
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

    // Buscar semana(s) do período
    let semanaIds: string[] = [];
    if (aba === "semanal") {
      const { data: s } = await supabase.from("semanas").select("id")
        .eq("data_inicio", semanaInicio).eq("data_fim", semanaFim).maybeSingle();
      if (s) semanaIds = [s.id];
    } else {
      const fimMes = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);
      const { data: ss } = await supabase.from("semanas").select("id")
        .gte("data_inicio", periodo_inicio).lte("data_inicio", fimMes);
      semanaIds = ss?.map(s => s.id) ?? [];
    }

    if (!semanaIds.length) { setLinhas([]); setLoading(false); return; }

    // Aulas realizadas
    const { data: aulas } = await supabase.from("aulas")
      .select("professor_id, carga_horaria, professores(id, nome, email, valor_hora_aula)")
      .in("semana_id", semanaIds)
      .eq("realizada", true);

    if (!aulas?.length) { setLinhas([]); setLoading(false); return; }

    // Agrupar por professor
    const map = new Map<string, LinhaPagamento>();
    for (const a of aulas) {
      const prof = (Array.isArray(a.professores) ? a.professores[0] : a.professores) as
        { id: string; nome: string; email: string; valor_hora_aula: number } | null;
      if (!prof) continue;
      if (!map.has(a.professor_id)) {
        map.set(a.professor_id, {
          professor_id: a.professor_id,
          professor_nome: prof.nome,
          professor_email: prof.email,
          valor_hora: Number(prof.valor_hora_aula ?? 0),
          total_horas: 0,
          total_valor: 0,
          status: "pendente",
        });
      }
      const linha = map.get(a.professor_id)!;
      linha.total_horas = r2(linha.total_horas + Number(a.carga_horaria));
      linha.total_valor = r2(linha.total_horas * linha.valor_hora);
    }

    // Status de pagamento
    const ids = Array.from(map.keys());
    const { data: pagtos } = await supabase.from("pagamentos")
      .select("professor_id, status, pago_em")
      .in("professor_id", ids)
      .eq("periodo_inicio", periodo_inicio)
      .eq("tipo", aba);

    for (const p of pagtos ?? []) {
      const l = map.get(p.professor_id);
      if (l) { l.status = p.status as "pendente" | "pago"; l.pago_em = p.pago_em; }
    }

    setLinhas(Array.from(map.values()).sort((a, b) => b.total_valor - a.total_valor));
    setLoading(false);
  }, [aba, semanaInicio, mes, ano]);

  useEffect(() => { load(); }, [load]);

  // ── Marcar pago / pendente ──────────────────────────────────────────────────
  async function marcarPago(prof: LinhaPagamento) {
    setMarcando(prof.professor_id);
    const periodo_inicio = aba === "semanal"
      ? semanaInicio
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const periodo_fim = aba === "semanal"
      ? semanaFim
      : new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

    const novoStatus = prof.status === "pago" ? "pendente" : "pago";
    await supabase.from("pagamentos").upsert({
      professor_id: prof.professor_id,
      periodo_inicio,
      periodo_fim,
      tipo: aba,
      total_horas: prof.total_horas,
      valor_hora: prof.valor_hora,
      total_valor: prof.total_valor,
      status: novoStatus,
      pago_em: novoStatus === "pago" ? new Date().toISOString() : null,
    }, { onConflict: "professor_id,periodo_inicio,periodo_fim,tipo" });

    setMarcando(null);
    load();
  }

  // ── Enviar email ────────────────────────────────────────────────────────────
  async function enviarEmail(prof: LinhaPagamento) {
    setEnviando(prof.professor_id);
    const periodo_inicio = aba === "semanal"
      ? semanaInicio
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const periodo_fim = aba === "semanal"
      ? semanaFim
      : new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

    const res = await fetch("/api/enviar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professor_id: prof.professor_id,
        periodo_inicio,
        periodo_fim,
        tipo: aba,
        total_horas: prof.total_horas,
        valor_hora: prof.valor_hora,
        total_valor: prof.total_valor,
      }),
    });
    const ok = res.ok;
    setFeedbackEnvio(prev => ({ ...prev, [prof.professor_id]: ok ? "ok" : "erro" }));
    setEnviando(null);
  }

  // ── Derivados ────────────────────────────────────────────────────────────────
  const totalPagar  = linhas.reduce((s, l) => s + l.total_valor, 0);
  const totalHoras  = linhas.reduce((s, l) => s + l.total_horas, 0);
  const totalPagos  = linhas.filter(l => l.status === "pago").length;
  const valorPago   = linhas.filter(l => l.status === "pago").reduce((s, l) => s + l.total_valor, 0);

  const periodoLabel = aba === "semanal"
    ? `${fmtDate(semanaInicio)} a ${fmtDate(semanaFim)}`
    : `${MESES[mes]} ${ano}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Pagamentos</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Cálculo automático: horas realizadas × valor hora/aula por professor.
          </p>
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
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-primary)" }}>IMP Concursos — Grade Horária</p>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>
          Pagamentos — {aba === "semanal" ? "Semanal" : "Mensal"}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {periodoLabel} · Gerado em {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-2 mb-6">
        {(["semanal", "mensal"] as Aba[]).map(t => (
          <button key={t} onClick={() => setAba(t)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
            style={{
              backgroundColor: aba === t ? "var(--color-primary)" : "transparent",
              color: aba === t ? "#fff" : "var(--color-text-secondary)",
              border: `1px solid ${aba === t ? "var(--color-primary)" : "var(--color-border)"}`,
            }}>
            {t === "semanal" ? "Semanal" : "Mensal"}
          </button>
        ))}
      </div>

      {/* Navegação de período */}
      <div className="no-print flex items-center gap-3 mb-6">
        {aba === "semanal" ? (
          <>
            <button onClick={() => setSemanaInicio(p => addDays(p, -7))} aria-label="Semana anterior"
              className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
            <div className="px-5 py-2.5 rounded-lg font-semibold text-sm"
              style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
              {periodoLabel}
            </div>
            <button onClick={() => setSemanaInicio(p => addDays(p, 7))} aria-label="Próxima semana"
              className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { const d = new Date(ano, mes - 1, 1); setMes(d.getMonth()); setAno(d.getFullYear()); }} aria-label="Mês anterior"
              className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
            <div className="px-5 py-2.5 rounded-lg font-semibold text-sm min-w-36 text-center"
              style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
              {periodoLabel}
            </div>
            <button onClick={() => { const d = new Date(ano, mes + 1, 1); setMes(d.getMonth()); setAno(d.getFullYear()); }} aria-label="Próximo mês"
              className="p-2 rounded-lg" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      ) : linhas.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--color-border)" }}>
          <DollarSign size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>Nenhuma aula realizada neste período</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Marque aulas como realizadas na Grade Horária e configure o valor hora/aula dos professores.
          </p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total a Pagar", valor: fmtMoeda(totalPagar), color: "var(--color-primary)" },
              { label: "Horas Realizadas", valor: `${r2(totalHoras)}h`, color: "var(--color-navy)" },
              { label: "Professores", valor: String(linhas.length), color: "#0EA5E9" },
              { label: "Já Pagos", valor: `${totalPagos}/${linhas.length}`, sub: totalPagos > 0 ? fmtMoeda(valorPago) : null, color: "#16A34A" },
            ].map(({ label, valor, sub, color }) => (
              <div key={label} className="p-5 rounded-2xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-2xl font-extrabold" style={{ color }}>{valor}</p>
                {sub && <p className="text-xs mt-1 font-semibold" style={{ color: "#16A34A" }}>{sub} pagos</p>}
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            {/* Cabeçalho */}
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span className="col-span-3">Professor</span>
              <span className="col-span-2 text-center">Valor/Hora</span>
              <span className="col-span-2 text-center">Horas</span>
              <span className="col-span-2 text-center font-bold" style={{ color: "var(--color-navy)" }}>Total</span>
              <span className="col-span-1 text-center">Status</span>
              <span className="col-span-2 no-print" />
            </div>

            {linhas.map((l, i) => (
              <div key={l.professor_id}
                style={{ borderBottom: i < linhas.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div className="grid grid-cols-12 px-5 py-4 items-center"
                  style={{ backgroundColor: l.status === "pago" ? "#F0FDF4" : "transparent" }}>

                  {/* Professor */}
                  <div className="col-span-3">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{l.professor_nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{l.professor_email}</p>
                  </div>

                  {/* Valor/hora */}
                  <div className="col-span-2 text-center">
                    {l.valor_hora > 0
                      ? <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{fmtMoeda(l.valor_hora)}</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>Sem valor</span>
                    }
                  </div>

                  {/* Horas */}
                  <span className="col-span-2 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {r2(l.total_horas)}h
                  </span>

                  {/* Total */}
                  <span className="col-span-2 text-center font-extrabold text-sm" style={{ color: "var(--color-primary)" }}>
                    {fmtMoeda(l.total_valor)}
                  </span>

                  {/* Status badge */}
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: l.status === "pago" ? "#DCFCE7" : "#FEF3C7",
                        color: l.status === "pago" ? "#15803D" : "#92400E",
                      }}>
                      {l.status === "pago" ? <CheckCircle size={10} /> : <Circle size={10} />}
                      {l.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="col-span-2 no-print flex items-center gap-2 justify-end">
                    {/* Feedback envio */}
                    {feedbackEnvio[l.professor_id] === "ok" && (
                      <CheckCircle size={14} style={{ color: "#16A34A" }} />
                    )}

                    {/* Enviar email */}
                    <Button size="sm" variant="ghost"
                      onClick={() => enviarEmail(l)}
                      disabled={enviando !== null || marcando !== null}>
                      {enviando === l.professor_id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Send size={12} />}
                      Enviar
                    </Button>

                    {/* Marcar pago */}
                    <Button size="sm"
                      variant={l.status === "pago" ? "ghost" : "primary"}
                      onClick={() => marcarPago(l)}
                      disabled={marcando !== null || enviando !== null}>
                      {marcando === l.professor_id
                        ? <Loader2 size={12} className="animate-spin" />
                        : l.status === "pago" ? <Circle size={12} /> : <CheckCircle size={12} />}
                      {l.status === "pago" ? "Desfazer" : "Marcar Pago"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
