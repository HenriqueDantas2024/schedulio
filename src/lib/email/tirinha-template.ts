const DIAS_LABEL: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
};

const TURNO_LABEL: Record<string, string> = { M: "Matutino", T: "Tarde", N: "Noturno" };
const TURNO_COLOR: Record<string, string> = {
  M: "#1E40AF",
  T: "#92400E",
  N: "#1E3A5F",
};
const TURNO_BG: Record<string, string> = {
  M: "#DBEAFE",
  T: "#FEF3C7",
  N: "#E0E7FF",
};

interface AulaEmail {
  dia_semana: string;
  turno: string;
  horario_inicio: string;
  horario_fim: string;
  carga_horaria: number;
  materias: { nome: string };
  turmas: { codigo: string; concurso: string; local: string };
}

export function gerarTirinhaHTML(professorNome: string, semanaLabel: string, aulas: AulaEmail[]): string {
  const aulasPorDia = DIAS_LABEL;
  const diasComAula = Object.keys(aulasPorDia).filter(dia => aulas.some(a => a.dia_semana === dia));

  const linhas = diasComAula.map(dia => {
    const aulasNoDia = aulas
      .filter(a => a.dia_semana === dia)
      .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));

    return aulasNoDia.map(a => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#1A1F36;white-space:nowrap;">
          ${aulasPorDia[dia]}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;">
          <span style="background:${TURNO_BG[a.turno]};color:${TURNO_COLOR[a.turno]};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">
            ${TURNO_LABEL[a.turno]}
          </span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#1A1F36;white-space:nowrap;">
          ${a.horario_inicio.slice(0, 5)} – ${a.horario_fim.slice(0, 5)}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#1A1F36;">
          ${a.materias.nome}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;white-space:nowrap;">
          ${a.turmas.codigo} · ${a.turmas.local}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;text-align:center;">
          ${a.carga_horaria}h
        </td>
      </tr>
    `).join("");
  }).join("");

  const totalHoras = aulas.reduce((s, a) => s + Number(a.carga_horaria), 0);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:680px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#1A1F36;padding:24px 32px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:28px;font-weight:900;color:#E8193C;letter-spacing:-1px;">imp</span>
      <div>
        <div style="color:#fff;font-size:13px;font-weight:700;line-height:1.2;">Grade Horária</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px;">Schedulio</div>
      </div>
    </div>

    <!-- Conteúdo -->
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1A1F36;">Olá, ${professorNome}!</h2>
      <p style="margin:0 0 20px;color:#64748B;font-size:14px;">
        Segue sua grade de aulas para a semana de <strong>${semanaLabel}</strong>.
      </p>

      <!-- Tabela -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#F7F8FC;">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">Dia</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">Turno</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">Horário</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">Disciplina</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">Turma</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E2E8F0;">CH</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>

      <!-- Resumo -->
      <div style="margin-top:16px;padding:14px 18px;background:#F7F8FC;border-radius:10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#64748B;">Total de aulas nesta semana</span>
        <span style="font-size:15px;font-weight:800;color:#E8193C;">${aulas.length} aula${aulas.length !== 1 ? "s" : ""} · ${totalHoras}h</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#F7F8FC;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
        Este email foi enviado automaticamente pelo sistema Schedulio.<br>
        Em caso de dúvidas, entre em contato com a coordenação.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
