"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import TabDisciplinas from "./TabDisciplinas";
import TabGrade from "./TabGrade";

const TURNO_LABELS: Record<string, string> = { M: "Matutino", T: "Tarde", N: "Noturno" };
const TURNO_STYLES: Record<string, React.CSSProperties> = {
  M: { backgroundColor: "var(--color-turno-matutino)", color: "var(--color-turno-matutino-text)" },
  T: { backgroundColor: "var(--color-turno-tarde)", color: "var(--color-turno-tarde-text)" },
  N: { backgroundColor: "var(--color-turno-noturno)", color: "var(--color-turno-noturno-text)" },
};

interface Turma {
  id: string;
  codigo: string;
  concurso: string;
  local: string;
  turno: string;
  data_inicio: string;
  status: string;
}

export default function TurmaDetailClient({ turma }: { turma: Turma }) {
  const router = useRouter();
  const [aba, setAba] = useState<"disciplinas" | "grade">("disciplinas");

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/turmas")}
          className="flex items-center gap-1.5 text-sm mb-4 transition-all"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          <ArrowLeft size={14} /> Voltar para Turmas
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>
                {turma.concurso}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={TURNO_STYLES[turma.turno]}>
                {TURNO_LABELS[turma.turno]}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <span className="font-mono font-bold">{turma.codigo}</span> · {turma.local} · Início: {new Date(turma.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--color-border)" }}>
        {[
          { key: "disciplinas", label: "Disciplinas", icon: BookOpen },
          { key: "grade", label: "Grade Semanal", icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key as "disciplinas" | "grade")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: aba === key ? "var(--color-surface)" : "transparent",
              color: aba === key ? "var(--color-navy)" : "var(--color-text-muted)",
              boxShadow: aba === key ? "var(--shadow-card)" : "none",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "disciplinas" && <TabDisciplinas turmaId={turma.id} />}
      {aba === "grade" && <TabGrade turmaId={turma.id} turno={turma.turno} />}
    </div>
  );
}
