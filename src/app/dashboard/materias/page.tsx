"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Materia { id: string; nome: string; }

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Materia | null>(null);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("materias").select("*").order("nome");
    setMaterias(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setNome(""); setModalOpen(true); }
  function openEdit(m: Materia) { setEditing(m); setNome(m.nome); setModalOpen(true); }

  async function handleSave() {
    if (!nome.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from("materias").update({ nome }).eq("id", editing.id);
      toast.success("Matéria atualizada com sucesso.");
    } else {
      await supabase.from("materias").insert({ nome });
      toast.success("Matéria cadastrada com sucesso.");
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
    const { error } = await supabase.from("materias").delete().eq("id", id);
    if (error) toast.error("Erro ao remover matéria.");
    else toast.success("Matéria removida.");
    load();
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Matérias"
        description={`${materias.length} matéria${materias.length !== 1 ? "s" : ""} cadastrada${materias.length !== 1 ? "s" : ""}`}
        action={<Button onClick={openNew}><Plus size={16} /> Nova Matéria</Button>}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={2} />
      ) : materias.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-sm">Nenhuma matéria cadastrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Nome da Matéria</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m.id}
                  className="transition-colors duration-150"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--color-background)";
                    (e.currentTarget as HTMLTableRowElement).style.boxShadow = "inset 3px 0 0 var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLTableRowElement).style.boxShadow = "none";
                  }}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-text-primary)" }}>{m.nome}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg transition-all"
                        style={{ color: confirmingDelete === m.id ? "var(--color-primary)" : "var(--color-text-muted)", backgroundColor: confirmingDelete === m.id ? "#FEF2F2" : "transparent" }}
                        onMouseEnter={(e) => { if (confirmingDelete !== m.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEF2F2"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}}
                        onMouseLeave={(e) => { if (confirmingDelete !== m.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Matéria" : "Nova Matéria"}>
        <div className="flex flex-col gap-4">
          <Input label="Nome da matéria" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Direito Administrativo" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
