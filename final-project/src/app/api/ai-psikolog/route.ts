import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import FormBrief from "@/server/models/FormBrief";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

const GeminiApiKey = process.env.GEMINI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!GeminiApiKey) throw new Error("Gemini API Key missing");
const genAI = new GoogleGenerativeAI(GeminiApiKey as string);

const geminiModel = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];

const OpenRouterModel = [
  "arcee-ai/trinity-large-preview:free",
  "openai/gpt-oss-20b:free",
];

const ChatPrompt = `
        Kamu adalah asisten ahli psikologi dari aplikasi Pendengarmu. 
        Tugasmu:
        1. Hanya menjawab pertanyaan seputar kesehatan mental, psikologi, emosi, dan kesejahteraan diri.
        2. Jika pertanyaan di luar topik psikologi (seperti koding, politik, matematika, dll), jawab tepat dengan kalimat: "Mohon maaf, itu di luar kapasitas saya sebagai asisten psikologi."
        3. Berikan jawaban yang SINGKAT, padat, dan menenangkan (maksimal 2-10 kalimat).
        4. Jangan pernah memberikan saran medis atau psikologis yang spesifik, selalu arahkan untuk konsultasi dengan profesional yang dimiliki jika diperlukan.
        5. Tawarkan di setiap akhir jawaban agar dibantu terhubung dengan psikolog setelah menjawab pertanyaan dari pengguna. Jika pengguna setuju, jawab dengan: "Baik, saya akan membantu menghubungkan Anda dengan psikolog kami. Silakan tunggu sebentar."
      `;


const AnalyzeSystemPrompt = `
Kamu adalah AI clinical assistant yang membantu psikolog profesional...
(TANPA aturan penolakan user)
`;

async function callGeminiAPI(message: string,systemPrompt: string, history?: Content[]) {
  for (const modelName of geminiModel) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
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
    }
  }
  throw Error("Semua model Gemini gagal merespons.");
}

async function callOpenRouterAPI(message: string, history?: Content[]) {
  for (const modelName of OpenRouterModel) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterApiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: Prompt },
              ...(history || []),
              { role: "user", content: message },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Error with OpenRouter model ${modelName}:`, error);
    }
  }
  throw Error("Semua model OpenRouter gagal merespons.");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!GeminiApiKey && !openRouterApiKey) {
      return NextResponse.json(
        { error: "API Key belum dikonfigurasi" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      message,
      history,
      type,
      form,
    }: { message: string; history?: Content[]; type: string; form?: any } =
      body;

    if (type === "analyze") {
      const analizePrompt = `Kamu adalah AI clinical assistant yang membantu psikolog profesional dalam melakukan asesmen awal klien.

                                PENTING:
                                - Output hanya untuk psikolog, bukan untuk klien
                                - Gunakan bahasa profesional (psikologi klinis), bukan bahasa awam
                                - Hindari kesimpulan diagnosis final
                                - Fokus pada hipotesis klinis awal berbasis data

                                ========================
                                DATA KLIEN:
                                ${JSON.stringify(form)}
                                ========================

                                Berikan output dengan struktur berikut:

                                1. CLINICAL SUMMARY
                                Ringkasan kondisi klien secara klinis, mencakup:
                                - presenting issues
                                - durasi
                                - konteks utama

                                2. PRELIMINARY CLINICAL IMPRESSION
                                Hipotesis awal (bukan diagnosis) berdasarkan DSM-5 framework jika memungkinkan.
                                Contoh:
                                - indikasi Generalized Anxiety features
                                - indikasi depressive symptoms ringan

                                3. SYMPTOM CLUSTER ANALYSIS
                                Kelompokkan gejala:
                                - kognitif (overthinking, negative belief)
                                - emosional (cemas, sedih, dll)
                                - perilaku (withdrawal, avoidance)
                                - fisiologis (insomnia, fatigue)

                                4. POSSIBLE UNDERLYING FACTORS
                                Analisis faktor:
                                - lingkungan
                                - pekerjaan
                                - relasi
                                - pengalaman masa lalu (jika ada indikasi)

                                5. RISK ASSESSMENT
                                Evaluasi risiko:
                                - self-harm (low / medium / high)
                                - burnout
                                - social isolation
                                Berikan justifikasi singkat

                                6. RECOMMENDED THERAPEUTIC APPROACH
                                Pendekatan yang disarankan:
                                - CBT
                                - ACT
                                - psychodynamic
                                - mindfulness-based
                                Sertakan alasan klinis singkat

                                7. SESSION FOCUS SUGGESTION
                                Apa yang sebaiknya difokuskan di 1–2 sesi awal

                                8. CLINICAL QUESTIONS (FOR THERAPIST USE)
                                Buat 5–7 pertanyaan eksploratif untuk sesi

                                9. NOTES FOR THERAPIST
                                - batasan analisis
                                - hal yang perlu divalidasi ulang saat sesi langsung

                                Gunakan tone:
                                - profesional
                                - ringkas tapi tajam
                                - tidak menghakimi
                                - tidak terlalu verbose`;
      try {
        const result = await callGeminiAPI(analizePrompt, AnalyzeSystemPrompt);
        await FormBrief.create({
          _id: new ObjectId(),
          userId: new ObjectId(userId),
          brief: JSON.stringify(form),
          result: result,
          createdAt: new Date(),
        });
        return NextResponse.json({ response: result });
      } catch (err) {
        console.error("Gemini API error:", err);
      }
    }
    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 },
      );
    }
    try {
      const result = await callGeminiAPI(message, ChatPrompt, history);
      return NextResponse.json({ response: result });
    } catch (err) {
      console.error("Gemini API error:", err);
    }
    try {
      const result = await callOpenRouterAPI(message, history);
      return NextResponse.json({ response: result });
    } catch (err) {
      console.error("OpenRouter API error:", err);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
