import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "Imagem não enviada" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Você é um extrator de dados de editais de concursos públicos brasileiros.
Analise a imagem e extraia as informações no formato JSON abaixo.
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

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      prompt,
    ]);

    const text = result.response.text().trim();
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}
