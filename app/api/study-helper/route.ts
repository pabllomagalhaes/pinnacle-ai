import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GROQ_API_KEY; 

    if (!apiKey) {
      console.error("Erro: GROQ_API_KEY não encontrada no .env.local");
      return NextResponse.json({ error: "Chave Ausente" }, { status: 500 });
    }

    const prompt = `
      Atue como um Tutor Acadêmico de Excelência. O estudante está na sua sessão de estudos sobre o seguinte tópico:
      Materia/Tópico: "${body.title}"

      Gere um guia de estudos estruturado estritamente em formato HTML (use apenas tags como <h3>, <p>, <ul>, <li>, <strong>). Não use blocos de código markdown (\`\`\`html) no retorno.

      O guia deve conter:
      1. Um resumo explicativo e didático dos conceitos fundamentais desse assunto.
      2. Uma seção com exatamente 3 perguntas de fixação práticas baseadas nesse tópico. Coloque as respostas de forma compacta no final.
    `;

    // Chamada direta para a API do Groq (sem SDKs que causam bugs)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Erro retornado pelo Groq:", data);
        return NextResponse.json({ error: "Falha na comunicação com a IA" }, { status: 500 });
    }

    const content = data.choices[0].message.content;
    return NextResponse.json({ content });

  } catch (error) {
    console.error("Erro de execução no servidor:", error);
    return NextResponse.json({ error: "Falha interna do sistema" }, { status: 500 });
  }
}