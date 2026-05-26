import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT_BASE = `Você é um extrator de dados de editais de concursos públicos brasileiros.
Extraia as informações no formato JSON abaixo.
Retorne APENAS o JSON puro, sem markdown, sem explicação, sem aspas triplas.

{
  "concurso": "nome do órgão/concurso",
  "cargo": "cargo do concurso",
  "carga_horaria_total": numero inteiro ou null,
  "valor": numero decimal ou null,
  "disciplinas": [
    { "nome": "nome da disciplina", "carga_horaria": numero inteiro }
  ]
}

Regras:
- disciplinas: extraia TODAS as linhas com nome e CH (carga horária)
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

  try {
    let responseText: string;

    if (isDocx) {
      const mammoth = await import("mammoth");
      const extracted = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      if (!extracted.value.trim()) {
        return NextResponse.json({ error: "Não foi possível extrair texto do documento." }, { status: 400 });
      }

      const result = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{
          role: "user",
          content: PROMPT_BASE + "\n\nDocumento:\n" + extracted.value.slice(0, 20000),
        }],
        temperature: 0,
      });
      responseText = result.choices[0].message.content ?? "";
    } else {
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "image/jpeg";

      const result = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: PROMPT_BASE },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
        temperature: 0,
      });
      responseText = result.choices[0].message.content ?? "";
    }

    const clean = responseText.replace(/```json|```/g, "").trim();
    const json = JSON.parse(clean);
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
