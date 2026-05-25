"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Plus, Pencil, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface Turma { id: string; codigo: string; concurso: string; local: string; turno: string; data_inicio: string; status: string; }

const TURNO_LABELS: Record<string, string> = { M: "Matutino", T: "Tarde", N: "Noturno" };
const TURNO_STYLES: Record<string, React.CSSProperties> = {
  M: { backgroundColor: "var(--color-turno-matutino)", color: "var(--color-turno-matutino-text)" },
  T: { backgroundColor: "var(--color-turno-tarde)", color: "var(--color-turno-tarde-text)" },
  N: { backgroundColor: "var(--color-turno-noturno)", color: "var(--color-turno-noturno-text)" },
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [form, setForm] = useState({ codigo: "", concurso: "", local: "", turno: "M", data_inicio: "" });
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("turmas").select("*").order("created_at", { ascending: false });
    setTurmas(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ codigo: "", concurso: "", local: "", turno: "M", data_inicio: "" }); setModalOpen(true); }
  function openEdit(t: Turma) { setEditing(t); setForm({ codigo: t.codigo, concurso: t.concurso, local: t.local, turno: t.turno, data_inicio: t.data_inicio }); setModalOpen(true); }

  async function handleSave() {
    if (!form.codigo.trim() || !form.concurso.trim() || !form.local.trim() || !form.data_inicio) return;
    setSaving(true);
    if (editing) {
      await supabase.from("turmas").update(form).eq("id", editing.id);
      toast.success("Turma atualizada com sucesso.");
    } else {
      await supabase.from("turmas").insert(form);
      toast.success("Turma cadastrada com sucesso.");
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id);
      toast.warning("Clique em excluir novamente para confirmar.", {
        duration: 3000,
        onDismiss: () => setConfirmingDelete(null),
        onAutoClose: () => setConfirmingDelete(null),
      });
      return;
    }
    setConfirmingDelete(null);
    const { error } = await supabase.from("turmas").delete().eq("id", id);
    if (error) toast.error("Erro ao remover turma.");
    else toast.success("Turma removida.");
    load();
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Turmas"
        description={`${turmas.length} turma${turmas.length !== 1 ? "s" : ""} cadastrada${turmas.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push("/dashboard/turmas/importar")}>
              <Sparkles size={15} /> Importar Edital
            </Button>
            <Button onClick={openNew}><Plus size={16} /> Nova Turma</Button>
          </div>
        }
      />

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : turmas.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-sm">Nenhuma turma cadastrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Código", "Concurso", "Local", "Turno", "Início", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {turmas.map((t) => (
                <tr key={t.id}
                  className="transition-colors duration-150"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--color-background)"; (e.currentTarget as HTMLTableRowElement).style.boxShadow = "inset 3px 0 0 var(--color-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLTableRowElement).style.boxShadow = "none"; }}
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: "var(--color-navy)" }}>{t.codigo}</td>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-text-primary)" }}>{t.concurso}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--color-text-secondary)" }}>{t.local}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={TURNO_STYLES[t.turno]}>
                      {TURNO_LABELS[t.turno]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(t.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => router.push(`/dashboard/turmas/${t.id}`)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                        title="Abrir turma"
                      ><ChevronRight size={14} /></button>
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg transition-all"
                        style={{ color: confirmingDelete === t.id ? "var(--color-primary)" : "var(--color-text-muted)", backgroundColor: confirmingDelete === t.id ? "#FEF2F2" : "transparent" }}
                        onMouseEnter={(e) => { if (confirmingDelete !== t.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEF2F2"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}}
                        onMouseLeave={(e) => { if (confirmingDelete !== t.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Turma" : "Nova Turma"}>
        <div className="flex flex-col gap-4">
          <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: PMSAC-4098" />
          <Input label="Concurso" value={form.concurso} onChange={(e) => setForm({ ...form, concurso: e.target.value })} placeholder="Ex: PM-SAC 2025" />
          <Input label="Local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Ex: Águas Claras" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Turno</label>
            <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
            >
              <option value="M">Matutino</option>
              <option value="T">Tarde</option>
              <option value="N">Noturno</option>
            </select>
          </div>
          <Input label="Data de início" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
