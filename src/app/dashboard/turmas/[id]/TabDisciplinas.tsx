"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2, UserPlus, UserMinus } from "lucide-react";

interface TurmaMateria {
  id: string;
  materia_id: string;
  carga_horaria_total: number;
  materias: { nome: string };
  professores: { professor_id: string; professores: { id: string; nome: string } }[];
}

interface Materia { id: string; nome: string; }
interface Professor { id: string; nome: string; }

export default function TabDisciplinas({ turmaId }: { turmaId: string }) {
  const [turmasMaterias, setTurmasMaterias] = useState<TurmaMateria[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDisc, setModalDisc] = useState(false);
  const [modalProf, setModalProf] = useState<{ open: boolean; turmaMateria: TurmaMateria | null }>({ open: false, turmaMateria: null });
  const [selectedMateria, setSelectedMateria] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [selectedProf, setSelectedProf] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function load() {
    const [{ data: tm }, { data: mat }, { data: prof }] = await Promise.all([
      supabase.from("turma_materias").select("*, materias(nome)").eq("turma_id", turmaId).order("created_at"),
      supabase.from("materias").select("*").order("nome"),
      supabase.from("professores").select("*").order("nome"),
    ]);

    const ids = (tm ?? []).map((t: { id: string }) => t.id);
    let profMap: Record<string, { professor_id: string; professores: { id: string; nome: string } }[]> = {};

    if (ids.length > 0) {
      const { data: tmp } = await supabase
        .from("turma_materia_professores")
        .select("turma_id, materia_id, professor_id, professores(id, nome)")
        .eq("turma_id", turmaId);

      (tmp ?? []).forEach((r: { materia_id: string; professor_id: string; professores: { id: string; nome: string } | { id: string; nome: string }[] }) => {
        const key = r.materia_id;
        if (!profMap[key]) profMap[key] = [];
        const prof = Array.isArray(r.professores) ? r.professores[0] : r.professores;
        if (prof) profMap[key].push({ professor_id: r.professor_id, professores: prof });
      });
    }

    const enriched = (tm ?? []).map((t: TurmaMateria) => ({
      ...t,
      professores: profMap[t.materia_id] ?? [],
    }));

    setTurmasMaterias(enriched);
    setMaterias(mat ?? []);
    setProfessores(prof ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAddDisc() {
    if (!selectedMateria || !cargaHoraria) return;
    setSaving(true);
    await supabase.from("turma_materias").insert({ turma_id: turmaId, materia_id: selectedMateria, carga_horaria_total: parseFloat(cargaHoraria) });
    setSaving(false);
    setModalDisc(false);
    setSelectedMateria(""); setCargaHoraria("");
    load();
  }

  async function handleRemoveDisc(id: string) {
    if (!confirm("Remover esta disciplina da turma?")) return;
    await supabase.from("turma_materias").delete().eq("id", id);
    load();
  }

  async function handleAddProf() {
    if (!selectedProf || !modalProf.turmaMateria) return;
    setSaving(true);
    await supabase.from("turma_materia_professores").insert({
      turma_id: turmaId,
      materia_id: modalProf.turmaMateria.materia_id,
      professor_id: selectedProf,
    });
    setSaving(false);
    setSelectedProf("");
    load();
    setModalProf({ open: true, turmaMateria: { ...modalProf.turmaMateria } });
  }

  async function handleRemoveProf(materiaId: string, professorId: string) {
    await supabase.from("turma_materia_professores")
      .delete()
      .eq("turma_id", turmaId)
      .eq("materia_id", materiaId)
      .eq("professor_id", professorId);
    load();
    setModalProf({ open: false, turmaMateria: null });
  }

  const materiasDisponiveis = materias.filter(m => !turmasMaterias.find(tm => tm.materia_id === m.id));

  if (loading) return <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {turmasMaterias.length} disciplina{turmasMaterias.length !== 1 ? "s" : ""} configurada{turmasMaterias.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setModalDisc(true)} disabled={materiasDisponiveis.length === 0}>
          <Plus size={14} /> Adicionar Disciplina
        </Button>
      </div>

      {turmasMaterias.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-sm">Nenhuma disciplina configurada.</p>
          <p className="text-xs mt-1">Adicione as disciplinas definidas pelo edital.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {turmasMaterias.map((tm) => (
            <div key={tm.id} className="p-4 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{tm.materias.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{tm.carga_horaria_total}h no total</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setModalProf({ open: true, turmaMateria: tm })}>
                    <UserPlus size={12} /> Professores
                  </Button>
                  <button onClick={() => handleRemoveDisc(tm.id)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDE8EC"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                  ><Trash2 size={13} /></button>
                </div>
              </div>
              {tm.professores.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tm.professores.map((p) => (
                    <span key={p.professor_id} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {p.professores.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: adicionar disciplina */}
      <Modal open={modalDisc} onClose={() => setModalDisc(false)} title="Adicionar Disciplina">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Disciplina</label>
            <select value={selectedMateria} onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
            >
              <option value="">Selecione...</option>
              {materiasDisponiveis.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Carga horária total (h)</label>
            <input type="number" value={cargaHoraria} onChange={(e) => setCargaHoraria(e.target.value)} placeholder="Ex: 50"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalDisc(false)}>Cancelar</Button>
            <Button onClick={handleAddDisc} disabled={saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: gerenciar professores */}
      <Modal open={modalProf.open} onClose={() => setModalProf({ open: false, turmaMateria: null })} title={`Professores — ${modalProf.turmaMateria?.materias.nome}`}>
        <div className="flex flex-col gap-4">
          {modalProf.turmaMateria && (
            <>
              <div className="flex flex-col gap-2">
                {turmasMaterias.find(t => t.id === modalProf.turmaMateria?.id)?.professores.map((p) => (
                  <div key={p.professor_id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{p.professores.nome}</span>
                    <button onClick={() => handleRemoveProf(modalProf.turmaMateria!.materia_id, p.professor_id)}
                      className="p-1 rounded transition-all" style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                    ><UserMinus size={13} /></button>
                  </div>
                ))}
                {(turmasMaterias.find(t => t.id === modalProf.turmaMateria?.id)?.professores.length ?? 0) === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: "var(--color-text-muted)" }}>Nenhum professor vinculado.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                <select value={selectedProf} onChange={(e) => setSelectedProf(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                >
                  <option value="">Selecionar professor...</option>
                  {professores
                    .filter(p => !turmasMaterias.find(t => t.id === modalProf.turmaMateria?.id)?.professores.find(tp => tp.professor_id === p.id))
                    .map(p => <option key={p.id} value={p.id}>{p.nome}</option>)
                  }
                </select>
                <Button size="sm" onClick={handleAddProf} disabled={!selectedProf || saving}>
                  <UserPlus size={13} /> Vincular
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
