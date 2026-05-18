"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Professor { id: string; nome: string; email: string; ativo: boolean; }

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("professores").select("*").order("nome");
    setProfessores(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setNome(""); setEmail(""); setModalOpen(true); }
  function openEdit(p: Professor) { setEditing(p); setNome(p.nome); setEmail(p.email); setModalOpen(true); }

  async function handleSave() {
    if (!nome.trim() || !email.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from("professores").update({ nome, email }).eq("id", editing.id);
    } else {
      await supabase.from("professores").insert({ nome, email });
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este professor?")) return;
    await supabase.from("professores").delete().eq("id", id);
    load();
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Professores"
        description={`${professores.length} professor${professores.length !== 1 ? "es" : ""} cadastrado${professores.length !== 1 ? "s" : ""}`}
        action={<Button onClick={openNew}><Plus size={16} /> Novo Professor</Button>}
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
      ) : professores.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          <p className="text-sm">Nenhum professor cadastrado ainda.</p>
          <p className="text-xs mt-1">Clique em "Novo Professor" para começar.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Nome</th>
                <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Email</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {professores.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-background)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-text-primary)" }}>{p.nome}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--color-text-secondary)" }}>{p.email}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDE8EC"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Professor" : "Novo Professor"}>
        <div className="flex flex-col gap-4">
          <Input label="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Leandro Pereira" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@email.com" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
