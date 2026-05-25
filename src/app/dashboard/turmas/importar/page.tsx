"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { Upload, ArrowLeft, Sparkles, Trash2, Plus, Loader2 } from "lucide-react";

interface Disciplina { nome: string; carga_horaria: number; }

interface EditalExtraido {
  concurso: string | null;
  cargo: string | null;
  carga_horaria_total: number | null;
  valor: number | null;
  disciplinas: Disciplina[];
}

type Etapa = "upload" | "processando" | "revisao";

export default function ImportarEditalPage() {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const [extraido, setExtraido] = useState<EditalExtraido | null>(null);
  const [form, setForm] = useState({ codigo: "", concurso: "", cargo: "", local: "", turno: "M", data_inicio: "" });
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [saving, setSaving] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem (JPG, PNG ou WEBP)."); return; }
    setFileObj(file);
    setPreview(URL.createObjectURL(file));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  async function processarImagem() {
    if (!fileObj) return;
    setEtapa("processando");

    const fd = new FormData();
    fd.append("image", fileObj);

    try {
      const res = await fetch("/api/importar-edital", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");

      setExtraido(data);
      setForm(f => ({
        ...f,
        concurso: data.concurso ?? "",
        cargo: data.cargo ?? "",
      }));
      setDisciplinas((data.disciplinas ?? []).map((d: Disciplina) => ({ nome: d.nome ?? "", carga_horaria: d.carga_horaria ?? 0 })));
      setEtapa("revisao");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao processar imagem.");
      setEtapa("upload");
    }
  }

  function updateDisciplina(idx: number, field: keyof Disciplina, value: string | number) {
    setDisciplinas(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  function removeDisciplina(idx: number) {
    setDisciplinas(prev => prev.filter((_, i) => i !== idx));
  }

  function addDisciplina() {
    setDisciplinas(prev => [...prev, { nome: "", carga_horaria: 0 }]);
  }

  async function handleSalvar() {
    if (!form.codigo.trim() || !form.concurso.trim() || !form.local.trim() || !form.data_inicio) {
      toast.error("Preencha Código, Concurso, Local e Data de início."); return;
    }
    if (disciplinas.length === 0) { toast.error("Adicione ao menos uma disciplina."); return; }
    setSaving(true);

    const { data: turma, error: tErr } = await supabase
      .from("turmas")
      .insert({ codigo: form.codigo, concurso: form.concurso, local: form.local, turno: form.turno, data_inicio: form.data_inicio })
      .select("id")
      .single();

    if (tErr || !turma) { toast.error("Erro ao criar turma."); setSaving(false); return; }

    for (const disc of disciplinas) {
      if (!disc.nome.trim()) continue;

      let { data: materia } = await supabase.from("materias").select("id").ilike("nome", disc.nome.trim()).maybeSingle();

      if (!materia) {
        const { data: nova } = await supabase.from("materias").insert({ nome: disc.nome.trim() }).select("id").single();
        materia = nova;
      }

      if (materia) {
        await supabase.from("turma_materias").insert({ turma_id: turma.id, materia_id: materia.id, carga_horaria_total: disc.carga_horaria });
      }
    }

    toast.success("Turma criada com sucesso!");
    router.push(`/dashboard/turmas/${turma.id}`);
  }

  if (etapa === "upload") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          <ArrowLeft size={15} /> Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Importar Edital</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Envie o print do edital e a IA extrai as disciplinas automaticamente.
          </p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-4 py-16"
          style={{
            borderColor: dragging ? "var(--color-primary)" : "var(--color-border)",
            backgroundColor: dragging ? "var(--color-primary-light)" : "var(--color-surface)",
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--color-primary-light)" }}>
            <Upload size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
              {preview ? "Trocar imagem" : "Clique ou arraste a imagem aqui"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>JPG, PNG ou WEBP</p>
          </div>
          {preview && (
            <img src={preview} alt="Preview" className="rounded-xl max-h-48 object-contain shadow" />
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        <div className="flex justify-end mt-6">
          <Button onClick={processarImagem} disabled={!fileObj}>
            <Sparkles size={15} /> Extrair com IA
          </Button>
        </div>
      </div>
    );
  }

  if (etapa === "processando") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: "var(--color-primary-light)" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg" style={{ color: "var(--color-navy)" }}>Analisando o edital...</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>A IA está extraindo as disciplinas. Aguarde alguns segundos.</p>
        </div>
      </div>
    );
  }

  const totalCH = disciplinas.reduce((s, d) => s + (Number(d.carga_horaria) || 0), 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => setEtapa("upload")} className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        <ArrowLeft size={15} /> Nova imagem
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Revisar dados extraídos</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Confira e ajuste os dados antes de criar a turma.</p>
        </div>
        <Button onClick={handleSalvar} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : "Criar Turma"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dados da turma */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>Dados da Turma</h2>

          {[
            { label: "Código", key: "codigo", placeholder: "Ex: SEDES-01" },
            { label: "Concurso / Órgão", key: "concurso", placeholder: "Ex: SEDES/DF" },
            { label: "Cargo", key: "cargo", placeholder: "Ex: Especialista em Assistência Social" },
            { label: "Local", key: "local", placeholder: "Ex: Brasília" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Turno</label>
            <select value={form.turno} onChange={(e) => setForm(f => ({ ...f, turno: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
            >
              <option value="M">Matutino</option>
              <option value="T">Tarde</option>
              <option value="N">Noturno</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Data de início</label>
            <input type="date" value={form.data_inicio} onChange={(e) => setForm(f => ({ ...f, data_inicio: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
            />
          </div>

          {extraido && (
            <div className="mt-2 p-4 rounded-xl text-sm flex flex-col gap-1" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <p className="font-semibold">Detectado pelo IA:</p>
              {extraido.carga_horaria_total && <p>Carga total: {extraido.carga_horaria_total}h</p>}
              {extraido.valor && <p>Valor: {extraido.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>}
            </div>
          )}
        </div>

        {/* Disciplinas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Disciplinas <span style={{ color: "var(--color-text-muted)" }}>({disciplinas.length}) — {totalCH}h total</span>
            </h2>
            <button onClick={addDisciplina} className="flex items-center gap-1 text-xs font-semibold transition-colors px-2 py-1 rounded-lg"
              style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {disciplinas.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <input
                  value={d.nome}
                  onChange={(e) => updateDisciplina(i, "nome", e.target.value)}
                  placeholder="Nome da disciplina"
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                  style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                />
                <input
                  type="number"
                  value={d.carga_horaria}
                  onChange={(e) => updateDisciplina(i, "carga_horaria", Number(e.target.value))}
                  placeholder="CH"
                  className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                  style={{ border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
                />
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>h</span>
                <button onClick={() => removeDisciplina(i)} className="p-1 rounded-lg transition-all" style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEF2F2"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                ><Trash2 size={13} /></button>
              </div>
            ))}

            {disciplinas.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Nenhuma disciplina. Clique em "Adicionar" para inserir manualmente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
