import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { gerarTirinhaHTML } from "@/lib/email/tirinha-template";

const resend = new Resend(process.env.RESEND_API_KEY);

async function createSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { semana_inicio, semana_fim, professor_ids } = body as {
    semana_inicio: string;
    semana_fim: string;
    professor_ids?: string[];
  };

  if (!semana_inicio || !semana_fim) {
    return NextResponse.json({ error: "semana_inicio e semana_fim são obrigatórios" }, { status: 400 });
  }

  // Busca a semana pelo intervalo
  const { data: semana } = await supabase
    .from("semanas")
    .select("id")
    .eq("inicio", semana_inicio)
    .eq("fim", semana_fim)
    .single();

  if (!semana) {
    return NextResponse.json({ error: "Semana não encontrada" }, { status: 404 });
  }

  // Busca aulas da semana com todos os relacionamentos
  let query = supabase
    .from("aulas")
    .select(`
      id,
      dia_semana,
      turno,
      horario_inicio,
      horario_fim,
      carga_horaria,
      professor_id,
      professores (id, nome, email),
      materias (nome),
      turmas (codigo, concurso, local)
    `)
    .eq("semana_id", semana.id);

  if (professor_ids && professor_ids.length > 0) {
    query = query.in("professor_id", professor_ids);
  }

  const { data: aulas, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!aulas || aulas.length === 0) {
    return NextResponse.json({ enviados: 0, falhas: 0, detalhes: [] });
  }

  // Agrupa aulas por professor
  const porProfessor = new Map<string, { professor: { id: string; nome: string; email: string }; aulas: typeof aulas }>();

  for (const aula of aulas) {
    const prof = Array.isArray(aula.professores) ? aula.professores[0] : aula.professores;
    if (!prof || !prof.email) continue;

    if (!porProfessor.has(prof.id)) {
      porProfessor.set(prof.id, { professor: prof as { id: string; nome: string; email: string }, aulas: [] });
    }
    porProfessor.get(prof.id)!.aulas.push(aula);
  }

  const semanaLabel = `${new Date(semana_inicio + "T00:00:00").toLocaleDateString("pt-BR")} a ${new Date(semana_fim + "T00:00:00").toLocaleDateString("pt-BR")}`;

  const resultados: { professor: string; email: string; status: "ok" | "erro"; erro?: string }[] = [];

  for (const { professor, aulas: aulasProf } of porProfessor.values()) {
    const html = gerarTirinhaHTML(
      professor.nome,
      semanaLabel,
      aulasProf.map(a => ({
        dia_semana: a.dia_semana,
        turno: a.turno,
        horario_inicio: a.horario_inicio,
        horario_fim: a.horario_fim,
        carga_horaria: a.carga_horaria,
        materias: Array.isArray(a.materias) ? a.materias[0] : a.materias as { nome: string },
        turmas: Array.isArray(a.turmas) ? a.turmas[0] : a.turmas as { codigo: string; concurso: string; local: string },
      }))
    );

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: professor.email,
        subject: `Sua grade de aulas — semana de ${semanaLabel}`,
        html,
      });
      resultados.push({ professor: professor.nome, email: professor.email, status: "ok" });
    } catch (err) {
      resultados.push({
        professor: professor.nome,
        email: professor.email,
        status: "erro",
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const enviados = resultados.filter(r => r.status === "ok").length;
  const falhas = resultados.filter(r => r.status === "erro").length;

  return NextResponse.json({ enviados, falhas, detalhes: resultados });
}
