"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2, ChevronLeft, ChevronRight, Copy, CheckCircle2, Circle } from "lucide-react";

const DIAS = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terça" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sábado" },
];

const TURNO_STYLES: Record<string, React.CSSProperties> = {
  M: { backgroundColor: "var(--color-turno-matutino)", color: "var(--color-turno-matutino-text)" },
  T: { backgroundColor: "var(--color-turno-tarde)", color: "var(--color-turno-tarde-text)" },
  N: { backgroundColor: "var(--color-turno-noturno)", color: "var(--color-turno-noturno-text)" },
};

interface Aula {
  id: string;
  dia_semana: string;
  turno: string;
  horario_inicio: string;
  horario_fim: string;
  carga_horaria: number;
  professor_id: string;
  materia_id: string;
  realizada: boolean;
  professores: { nome: string };
  materias: { nome: string };
}

interface TurmaMateria {
  materia_id: string;
  carga_horaria_total: number;
  materias: { nome: string };
  professores: { professor_id: string; professores: { id: string; nome: string } }[];
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function calcCarga(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100;
}

export default function TabGrade({ turmaId, turno }: { turmaId: string; turno: string }) {
  const [semanaInicio, setSemanaInicio] = useState<Date>(getMonday(new Date()));
  const [semanaId, setSemanaId] = useState<string | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [turmasMaterias, setTurmasMaterias] = useState<TurmaMateria[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [modal, setModal] = useState(false);
  const [diaModal, setDiaModal] = useState("");
  const [form, setForm] = useState({ materia_id: "", professor_id: "", turno, horario_inicio: "", horario_fim: "" });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const semanaFim = addDays(semanaInicio, 5);
  const semanaLabel = `${semanaInicio.toLocaleDateString("pt-BR")} a ${semanaFim.toLocaleDateString("pt-BR")}`;

  const load = useCallback(async () => {
    setLoading(true);
    const isoInicio = semanaInicio.toISOString().split("T")[0];
    const isoFim = semanaFim.toISOString().split("T")[0];

    const { data: semana } = await supabase
      .from("semanas")
      .select("id")
      .eq("data_inicio", isoInicio)
      .eq("data_fim", isoFim)
      .maybeSingle();

    setSemanaId(semana?.id ?? null);

    const [{ data: aulasData }, { data: tmData }] = await Promise.all([
      semana
        ? supabase.from("aulas").select("*, professores(nome), materias(nome)").eq("semana_id", semana.id).eq("turma_id", turmaId).order("horario_inicio")
        : Promise.resolve({ data: [] }),
      supabase.from("turma_materias").select("*, materias(nome)").eq("turma_id", turmaId),
    ]);

    const tmIds = (tmData ?? []).map((t: { materia_id: string }) => t.materia_id);
    let profMap: Record<string, { professor_id: string; professores: { id: string; nome: string } }[]> = {};
    if (tmIds.length > 0) {
      const { data: tmp } = await supabase
        .from("turma_materia_professores")
        .select("materia_id, professor_id, professores(id, nome)")
        .eq("turma_id", turmaId);
      (tmp ?? []).forEach((r: { materia_id: string; professor_id: string; professores: { id: string; nome: string } | { id: string; nome: string }[] }) => {
        if (!profMap[r.materia_id]) profMap[r.materia_id] = [];
        const prof = Array.isArray(r.professores) ? r.professores[0] : r.professores;
        if (prof) profMap[r.materia_id].push({ professor_id: r.professor_id, professores: prof });
      });
    }

    setAulas((aulasData ?? []) as Aula[]);
    setTurmasMaterias((tmData ?? []).map((t: TurmaMateria) => ({ ...t, professores: profMap[t.materia_id] ?? [] })));
    setLoading(false);
  }, [semanaInicio]);

  useEffect(() => { load(); }, [load]);

  async function getOrCreateSemana(): Promise<string> {
    if (semanaId) return semanaId;
    const isoInicio = semanaInicio.toISOString().split("T")[0];
    const isoFim = semanaFim.toISOString().split("T")[0];
    const { data } = await supabase.from("semanas").insert({ data_inicio: isoInicio, data_fim: isoFim }).select("id").single();
    return data!.id;
  }

  async function handleAddAula() {
    if (!form.materia_id || !form.professor_id || !form.horario_inicio || !form.horario_fim) return;
    setSaving(true);
    const sid = await getOrCreateSemana();
    const carga = calcCarga(form.horario_inicio, form.horario_fim);
    await supabase.from("aulas").insert({
      semana_id: sid,
      turma_id: turmaId,
      professor_id: form.professor_id,
      materia_id: form.materia_id,
      dia_semana: diaModal,
      turno: form.turno,
      horario_inicio: form.horario_inicio,
      horario_fim: form.horario_fim,
      carga_horaria: carga,
    });
    setSaving(false);
    setModal(false);
    setForm({ materia_id: "", professor_id: "", turno, horario_inicio: "", horario_fim: "" });
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("aulas").delete().eq("id", id);
    load();
  }

  async function handleToggleRealizada(id: string, atual: boolean) {
    await supabase.from("aulas").update({ realizada: !atual }).eq("id", id);
    setAulas(prev => prev.map(a => a.id === id ? { ...a, realizada: !atual } : a));
  }

  async function handleCopiarSemana() {
    if (!semanaId || aulas.length === 0) return;
    if (!confirm("Copiar todas as aulas desta semana para a próxima?")) return;
    setCopying(true);
    const proxInicio = addDays(semanaInicio, 7);
    const proxFim = addDays(semanaFim, 7);
    const isoProxInicio = proxInicio.toISOString().split("T")[0];
    const isoProxFim = proxFim.toISOString().split("T")[0];

    let { data: proxSemana } = await supabase.from("semanas").select("id").eq("data_inicio", isoProxInicio).maybeSingle();
    if (!proxSemana) {
      const { data } = await supabase.from("semanas").insert({ data_inicio: isoProxInicio, data_fim: isoProxFim }).select("id").single();
      proxSemana = data;
    }

    const novasAulas = aulas.map(a => ({
      semana_id: proxSemana!.id,
      turma_id: turmaId,
      professor_id: a.professor_id,
      materia_id: a.materia_id,
      dia_semana: a.dia_semana,
      turno: a.turno,
      horario_inicio: a.horario_inicio,
      horario_fim: a.horario_fim,
      carga_horaria: a.carga_horaria,
    }));

    await supabase.from("aulas").insert(novasAulas);
    setCopying(false);
    setSemanaInicio(proxInicio);
  }

  const professoresDaMateria = turmasMaterias.find(t => t.materia_id === form.materia_id)?.professores ?? [];

  const aulasPorMateria = turmasMaterias.map(tm => {
    const total = tm.carga_horaria_total;
    const agendadas = aulas.filter(a => a.materia_id === tm.materia_id).length;
    return { nome: tm.materias.nome, total, agendadas };
  });

  return (
    <div>
      {/* Navegação de semana */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSemanaInicio(addDays(semanaInicio, -7))} className="p-1.5 rounded-lg transition-all" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          ><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Semana de {semanaLabel}</span>
          <button onClick={() => setSemanaInicio(addDays(semanaInicio, 7))} className="p-1.5 rounded-lg transition-all" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          ><ChevronRight size={16} /></button>
        </div>
        {aulas.length > 0 && (
          <Button size="sm" variant="ghost" onClick={handleCopiarSemana} disabled={copying}>
            <Copy size={13} /> {copying ? "Copiando..." : "Copiar para próxima semana"}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      ) : (
        <>
          {/* Grade por dia */}
          <div className="flex flex-col gap-3 mb-6">
            {DIAS.map(({ key, label }) => {
              const aulasHoje = aulas.filter(a => a.dia_semana === key);
              return (
                <div key={key} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "var(--color-background)", borderBottom: aulasHoje.length > 0 ? "1px solid var(--color-border)" : "none" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{label}</span>
                    <button
                      onClick={() => { setDiaModal(key); setForm({ materia_id: "", professor_id: "", turno, horario_inicio: "", horario_fim: "" }); setModal(true); }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
                      style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      disabled={turmasMaterias.length === 0}
                    >
                      <Plus size={12} /> Adicionar aula
                    </button>
                  </div>
                  {aulasHoje.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 transition-all" style={{ borderBottom: "1px solid var(--color-border)", opacity: a.realizada ? 0.6 : 1 }}>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold" style={a.realizada ? { backgroundColor: "#D1FAE5", color: "#065F46" } : TURNO_STYLES[a.turno]}>
                          {a.horario_inicio.slice(0, 5)} – {a.horario_fim.slice(0, 5)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", textDecoration: a.realizada ? "line-through" : "none" }}>{a.professores.nome}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.materias.nome} · 1 aula</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleRealizada(a.id, a.realizada)}
                          title={a.realizada ? "Marcar como não realizada" : "Marcar como realizada"}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: a.realizada ? "#16A34A" : "var(--color-text-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = a.realizada ? "#D1FAE5" : "#F0FDF4"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          {a.realizada ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDE8EC"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Progresso de aulas */}
          {aulasPorMateria.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-secondary)" }}>Aulas agendadas no curso</p>
              <div className="flex flex-col gap-2.5">
                {aulasPorMateria.map(({ nome, total, agendadas }) => {
                  const pct = total > 0 ? Math.min((agendadas / total) * 100, 100) : 0;
                  return (
                    <div key={nome}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{nome}</span>
                        <span className="text-xs" style={{ color: agendadas >= total ? "#16A34A" : "var(--color-text-muted)" }}>
                          {agendadas} / {total} aula{total !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: agendadas >= total ? "#16A34A" : "var(--color-primary)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal adicionar aula */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Adicionar aula — ${DIAS.find(d => d.key === diaModal)?.label}`}>
        <div className="flex flex-col gap-4">
          {turmasMaterias.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>Configure as disciplinas da turma primeiro.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Disciplina</label>
                <select value={form.materia_id} onChange={(e) => setForm({ ...form, materia_id: e.target.value, professor_id: "" })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                >
                  <option value="">Selecione...</option>
                  {turmasMaterias.map(tm => <option key={tm.materia_id} value={tm.materia_id}>{tm.materias.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Professor</label>
                <select value={form.professor_id} onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                  disabled={!form.materia_id}
                >
                  <option value="">Selecione...</option>
                  {professoresDaMateria.map(p => <option key={p.professor_id} value={p.professor_id}>{p.professores.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Início</label>
                  <input type="time" value={form.horario_inicio} onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Fim</label>
                  <input type="time" value={form.horario_fim} onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                  />
                </div>
              </div>
              {form.horario_inicio && form.horario_fim && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Carga horária calculada: <strong>{calcCarga(form.horario_inicio, form.horario_fim)}h</strong>
                </p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
                <Button onClick={handleAddAula} disabled={saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
