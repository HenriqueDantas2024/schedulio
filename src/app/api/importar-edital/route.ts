import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PROMPT_BASE = `Você é um extrator de dados de editais de concursos públicos brasileiros.
Extraia as informações no formato JSON abaixo.
Retorne APENAS o JSON puro, sem markdown, sem explicação, sem \`\`\`.

{
  "concurso": "nome do órgão/concurso",
  "cargo": "cargo do concurso",
  "carga_horaria_total": número (somente o número, sem texto),
  "valor": número decimal (somente o número, sem R$),
  "disciplinas": [
    { "nome": "nome da disciplina", "carga_horaria": número }
  ]
}

Regras:
- disciplinas: extraia TODAS as linhas da tabela com nome e CH (carga horária)
- Se não encontrar algum campo, use null
- Ignore a coluna de professores
- carga_horaria de cada disciplina deve ser número inteiro`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx");

  const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    let responseText: string;

    if (isDocx) {
      const mammoth = await import("mammoth");
      const extracted = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      if (!extracted.value.trim()) {
        return NextResponse.json({ error: "Não foi possível extrair texto do documento." }, { status: 400 });
      }
      const result = await model.generateContent([
        PROMPT_BASE + "\n\nDocumento:\n" + extracted.value.slice(0, 30000),
      ]);
      responseText = result.response.text().trim();
    } else {
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType } },
        PROMPT_BASE,
      ]);
      responseText = result.response.text().trim();
    }

    const json = JSON.parse(responseText);
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
