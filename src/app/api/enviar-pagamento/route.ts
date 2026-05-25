import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

function gerarPagamentoHTML(
  nome: string,
  periodo: string,
  tipo: string,
  total_aulas: number,
  valor_de_entrada: number,
  total_valor: number
): string {
  const fmtMoeda = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const tipoLabel = tipo === "semanal" ? "Semanal" : "Mensal";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resumo de Pagamento — Schedulio</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a2744; color: #fff; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; opacity: 0.7; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; margin-bottom: 20px; }
    .card { background: #f8f9fc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; }
    .card-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-row .label { color: #6b7280; }
    .card-row .value { font-weight: 600; color: #1a2744; }
    .total-row { background: #1a2744; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .total-row .label { color: rgba(255,255,255,0.7); font-size: 14px; }
    .total-row .value { color: #fff; font-size: 20px; font-weight: 700; }
    .footer { text-align: center; padding: 20px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Schedulio</h1>
      <p>Resumo de Pagamento ${tipoLabel}</p>
    </div>
    <div class="body">
      <p class="greeting">Olá, <strong>${nome}</strong>!</p>
      <p style="font-size:14px;color:#6b7280;margin-bottom:20px;">
        Segue o resumo do seu pagamento referente ao período <strong>${periodo}</strong>.
      </p>
      <div class="card">
        <div class="card-row">
          <span class="label">Período</span>
          <span class="value">${periodo}</span>
        </div>
        <div class="card-row">
          <span class="label">Tipo</span>
          <span class="value">${tipoLabel}</span>
        </div>
        <div class="card-row">
          <span class="label">Aulas ministradas</span>
          <span class="value">${total_aulas}</span>
        </div>
        <div class="card-row">
          <span class="label">Valor de entrada</span>
          <span class="value">${fmtMoeda(valor_de_entrada)}</span>
        </div>
      </div>
      <div class="total-row">
        <span class="label">Total a receber</span>
        <span class="value">${fmtMoeda(total_valor)}</span>
      </div>
    </div>
    <div class="footer">
      Schedulio &bull; Este é um email automático, não responda.
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { professor_id, periodo_inicio, periodo_fim, tipo, total_aulas, valor_de_entrada, total_valor } = body as {
    professor_id: string;
    periodo_inicio: string;
    periodo_fim: string;
    tipo: string;
    total_aulas: number;
    valor_de_entrada: number;
    total_valor: number;
  };

  if (!professor_id || !periodo_inicio || !periodo_fim || !tipo) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const { data: professor, error: profError } = await supabase
    .from("professores")
    .select("nome, email")
    .eq("id", professor_id)
    .single();

  if (profError || !professor) {
    return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
  }

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR");

  const periodo = `${fmtDate(periodo_inicio)} a ${fmtDate(periodo_fim)}`;
  const html = gerarPagamentoHTML(professor.nome, periodo, tipo, total_aulas, valor_de_entrada, total_valor);

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: professor.email,
      subject: `Resumo de pagamento — ${periodo}`,
      html,
    });

    return NextResponse.json({ ok: true, professor: professor.nome, email: professor.email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
