"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Send, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface Professor {
  id: string;
  nome: string;
  email: string;
}

interface AulaResumo {
  professor_id: string;
  count: number;
  carga_total: number;
}

interface ResultadoEnvio {
  professor: string;
  email: string;
  status: "ok" | "erro";
  erro?: string;
}

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

function formatDateBR(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TirinhasPage() {
  const supabase = createClient();

  const [semanaInicio, setSemanaInicio] = useState(() => getMondayOf(new Date().toISOString().slice(0, 10)));
  const semanaFim = addDays(semanaInicio, 5);

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [aulasMap, setAulasMap] = useState<Record<string, AulaResumo>>({});
  const [semanaExiste, setSemanaExiste] = useState(false);
  const [loading, setLoading] = useState(true);

  const [enviando, setEnviando] = useState<string | "todos" | null>(null);
  const [resultado, setResultado] = useState<{ enviados: number; falhas: number; detalhes: ResultadoEnvio[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setResultado(null);

    const [{ data: profs }, { data: semana }] = await Promise.all([
      supabase.from("professores").select("id, nome, email").order("nome"),
      supabase.from("semanas").select("id").eq("data_inicio", semanaInicio).eq("data_fim", semanaFim).maybeSingle(),
    ]);

    setProfessores(profs ?? []);
    setSemanaExiste(!!semana);

    if (semana) {
      const { data: aulas } = await supabase
        .from("aulas")
        .select("professor_id, carga_horaria")
        .eq("semana_id", semana.id);

      const map: Record<string, AulaResumo> = {};
      (aulas ?? []).forEach(a => {
        if (!map[a.professor_id]) map[a.professor_id] = { professor_id: a.professor_id, count: 0, carga_total: 0 };
        map[a.professor_id].count += 1;
        map[a.professor_id].carga_total += Number(a.carga_horaria);
      });
      setAulasMap(map);
    } else {
      setAulasMap({});
    }

    setLoading(false);
  }, [semanaInicio]);

  useEffect(() => { load(); }, [load]);

  async function enviar(professorId?: string) {
    setEnviando(professorId ?? "todos");
    setResultado(null);

    const body: Record<string, unknown> = { semana_inicio: semanaInicio, semana_fim: semanaFim };
    if (professorId) body.professor_ids = [professorId];

    const res = await fetch("/api/enviar-tirinhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setResultado(data);
    setEnviando(null);

    if (data.enviados > 0 && data.falhas === 0) {
      toast.success(`${data.enviados} e-mail${data.enviados !== 1 ? "s" : ""} enviado${data.enviados !== 1 ? "s" : ""} com sucesso!`);
    } else if (data.falhas > 0) {
      toast.warning(`${data.enviados} enviado${data.enviados !== 1 ? "s" : ""}, ${data.falhas} falha${data.falhas !== 1 ? "s" : ""}.`);
    } else {
      toast.error("Nenhum e-mail foi enviado.");
    }
  }

  const professoresComAula = professores.filter(p => aulasMap[p.id]);
  const semanaLabel = `${formatDateBR(semanaInicio)} a ${formatDateBR(semanaFim)}`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Tirinhas</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Envie a grade semanal por e-mail para cada professor.
        </p>
      </div>

      {/* Navegação de semana */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setSemanaInicio(prev => addDays(prev, -7))}
          aria-label="Semana anterior"
          className="p-2 rounded-lg transition-all"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <ChevronLeft size={16} style={{ color: "var(--color-text-muted)" }} />
        </button>

        <div className="px-5 py-2.5 rounded-lg font-semibold text-sm" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-navy)" }}>
          {semanaLabel}
        </div>

        <button
          onClick={() => setSemanaInicio(prev => addDays(prev, 7))}
          aria-label="Próxima semana"
          className="p-2 rounded-lg transition-all"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : !semanaExiste || professoresComAula.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--color-border)" }}>
          <Mail size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>Nenhuma aula lançada nesta semana</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Monte a grade na aba "Turmas" antes de enviar as tirinhas.</p>
        </div>
      ) : (
        <>
          {/* Botão enviar tudo */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {professoresComAula.length} professor{professoresComAula.length !== 1 ? "es" : ""} com aula nesta semana
            </p>
            <Button
              onClick={() => enviar()}
              disabled={enviando !== null}
            >
              {enviando === "todos" ? (
                <><Loader2 size={14} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={14} /> Enviar para todos</>
              )}
            </Button>
          </div>

          {/* Lista de professores */}
          <div className="flex flex-col gap-3">
            {professoresComAula.map(prof => {
              const resumo = aulasMap[prof.id];
              const detalhe = resultado?.detalhes.find(d => d.email === prof.email);

              return (
                <div key={prof.id} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>{prof.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {prof.email} · {resumo.count} aula{resumo.count !== 1 ? "s" : ""} · {resumo.carga_total}h
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {detalhe && (
                      detalhe.status === "ok"
                        ? <CheckCircle size={16} style={{ color: "#16A34A" }} />
                        : <XCircle size={16} style={{ color: "var(--color-primary)" }} />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => enviar(prof.id)}
                      disabled={enviando !== null}
                    >
                      {enviando === prof.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      Enviar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resultado do envio */}
          {resultado && (
            <div className="mt-5 p-4 rounded-xl"
              style={{
                backgroundColor: resultado.falhas === 0 ? "#F0FDF4" : "#FFF7ED",
                border: `1px solid ${resultado.falhas === 0 ? "#BBF7D0" : "#FED7AA"}`,
              }}>
              <p className="font-semibold text-sm" style={{ color: resultado.falhas === 0 ? "#15803D" : "#C2410C" }}>
                {resultado.falhas === 0
                  ? `✓ ${resultado.enviados} e-mail${resultado.enviados !== 1 ? "s" : ""} enviado${resultado.enviados !== 1 ? "s" : ""} com sucesso!`
                  : `${resultado.enviados} enviado${resultado.enviados !== 1 ? "s" : ""}, ${resultado.falhas} falha${resultado.falhas !== 1 ? "s" : ""}.`
                }
              </p>
              {resultado.detalhes.filter(d => d.status === "erro").map(d => (
                <p key={d.email} className="text-xs mt-1" style={{ color: "#C2410C" }}>
                  ✗ {d.professor}: {d.erro}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
