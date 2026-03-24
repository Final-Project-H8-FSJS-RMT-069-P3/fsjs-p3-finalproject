import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const GeminiapiKey = process.env.GEMINI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const genAI = new GoogleGenerativeAI(GeminiapiKey as string);

const geminiModel = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash"
]

const OpenRouterModel = [
    "arcee-ai/trinity-large-preview:free",
    "openai/gpt-oss-20b:free"
]

const Prompt = `
        Kamu adalah asisten ahli psikologi dari aplikasi AuraMind. 
        Tugasmu:
        1. Hanya menjawab pertanyaan seputar kesehatan mental, psikologi, emosi, dan kesejahteraan diri.
        2. Jika pertanyaan di luar topik psikologi (seperti koding, politik, matematika, dll), jawab tepat dengan kalimat: "Mohon maaf, itu di luar kapasitas saya sebagai asisten psikologi."
        3. Berikan jawaban yang SINGKAT, padat, dan menenangkan (maksimal 2-10 kalimat).
        4. Jangan pernah memberikan saran medis atau psikologis yang spesifik, selalu arahkan untuk konsultasi dengan profesional yang dimiliki jika diperlukan.
        5. Tawarkan di setiap akhir jawaban agar dibantu terhubung dengan psikolog setelah menjawab pertanyaan dari pengguna. Jika pengguna setuju, jawab dengan: "Baik, saya akan membantu menghubungkan Anda dengan psikolog kami. Silakan tunggu sebentar."
      `;

async function callGeminiAPI(message: string, history?: Content[]) {
    for (const modelName of geminiModel) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName, 
                systemInstruction: Prompt,
            });

            const chat = model.startChat({
                history: history || [],
                generationConfig: {
                    maxOutputTokens: 5000,
                    temperature: 0.5,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
            
        } catch (error) {
            console.error(`Error with model ${modelName}:`, error);
            // Coba model berikutnya jika terjadi error
        }
    }
    throw new Error("Semua model Gemini gagal merespons.");
}

async function callOpenRouterAPI(message: string, history?: Content[]) {
    for (const modelName of OpenRouterModel) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openRouterApiKey}`,
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: Prompt },
                    ]
              }) 
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error(`Error with OpenRouter model ${modelName}:`, error);
            // Coba model berikutnya jika terjadi error
        }
    }
    throw new Error("Semua model OpenRouter gagal merespons.");
}

                       
export async function POST(req: NextRequest) {
  try {
    if (!GeminiapiKey || !openRouterApiKey) {
      return NextResponse.json(
        { error: "API Key belum dikonfigurasi" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, history }: { message: string; history?: Content[] } = body;

    if (!message) {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 });
    }
    try {
        const result = await callGeminiAPI(message, history);
        return NextResponse.json({ response: result });
    }catch (err){
        console.error("Gemini API error:", err);
    }
    try { 
        const result = await callOpenRouterAPI(message, history);
        return NextResponse.json({ response: result });
    }catch (err) {
        console.error("OpenRouter API error:", err);
    }
} catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}