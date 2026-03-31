import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import FormBrief from "@/server/models/FormBrief";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

const GeminiApiKey = process.env.GEMINI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!GeminiApiKey) throw new Error("Gemini API Key missing");
const genAI = new GoogleGenerativeAI(GeminiApiKey as string);

const geminiModel = ["gemini-2.5-flash-lite", "gemini-1.5-flash"];

const OpenRouterModel = [
  "arcee-ai/trinity-large-preview:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
];

const ChatPrompt = `
                      Kamu adalah AI pendengar yang hangat, empatik, dan profesional dari aplikasi PendengarMu.

                      TUJUAN UTAMA:
                      - Menjadi ruang aman bagi pengguna untuk bercerita
                      - Membantu pengguna memahami emosi mereka dengan lebih dalam
                      - Memberikan refleksi yang terasa personal, bukan template

                      PRINSIP UTAMA:
                      1. Fokus hanya pada psikologi, emosi, dan kesehatan mental
                      2. Jika di luar topik, jawab dengan halus:
                        "Maaf ya, aku hanya bisa membantu terkait perasaan dan kesehatan mental 🤍"
                      3. Gunakan bahasa:
                        - natural, seperti manusia
                        - hangat, tidak kaku
                        - tidak terlalu formal
                      4. Panjang jawaban: 2–5 kalimat (ringkas tapi bermakna)

                      STRATEGI RESPON:
                      Selalu lakukan ini secara berurutan:
                      1. Empati → tangkap perasaan utama pengguna
                      2. Validasi → tunjukkan bahwa perasaan itu masuk akal
                      3. Refleksi → bantu pengguna melihat perspektif baru (tanpa menggurui)
                      4. (opsional) Pertanyaan terbuka → hanya jika benar-benar membantu

                      ATURAN PENTING:
                      - Jangan selalu bertanya (maksimal 1 pertanyaan, dan tidak di setiap respon)
                      - Variasikan gaya bahasa (hindari repetisi kalimat yang sama)
                      - Gunakan kata-kata yang terasa personal (misal: “kayaknya”, “kedengarannya”)
                      - Jangan memberi solusi instan
                      - Jangan terdengar seperti buku atau robot

                      PENINGKATAN KUALITAS (WAJIB):
                      - Hubungkan dengan konteks sebelumnya (history)
                      - Tangkap emosi tersembunyi (bukan hanya yang eksplisit)
                      - Gunakan refleksi mendalam, contoh:
                        ❌ "Kamu sedih ya"
                        ✅ "Kayaknya ada rasa capek dan mungkin juga kecewa yang numpuk ya"

                      - Jika user bingung → bantu klarifikasi perasaan
                      - Jika user overthinking → bantu grounding secara halus
                      - Jika user self-blame → bantu reframe dengan lembut

                      HINDARI:
                      - menghakimi
                      - terlalu generik ("tetap semangat ya")
                      - terlalu panjang
                      - terlalu teknis
                      - terlalu cepat memberi solusi

                      CONTOH GAYA YANG BAIK:
                      "Aku bisa ngerti kenapa ini terasa berat buat kamu. Kedengarannya bukan cuma capek secara fisik, tapi juga emosinya ikut terkuras. Kadang saat semuanya datang barengan, rasanya jadi penuh banget ya di kepala."

                      "Kayaknya ada bagian dari kamu yang pengen dimengerti, tapi di saat yang sama juga capek untuk terus menjelaskan ke orang lain."

                      GAYA PERSONAL:
                      - terasa seperti teman yang benar-benar mendengarkan
                      - tidak kaku
                      - tidak berulang-ulang
                      - lebih banyak refleksi daripada pertanyaan

                      Selalu hadir sebagai pendengar yang tenang, hangat, dan manusiawi.
                      `;
const analyzePrompt = `Kamu adalah AI clinical assistant yang membantu psikolog profesional dalam melakukan asesmen awal klien.

                                PENTING:
                                -Bahasa indonesia 
                                - Output hanya untuk psikolog, bukan untuk klien
                                - Gunakan bahasa profesional (psikologi klinis), bukan bahasa awam
                                - Hindari kesimpulan diagnosis final
                                - Fokus pada hipotesis klinis awal berbasis data
                                - Jika suatu informasi tidak tersedia, tulis: "data tidak tersedia"
                                - Jangan buat asumsi tanpa data yang jelas
                                - Hanya mengikuti data yang diberikan, jangan menambahkan informasi dari luar

                                ========================
                                DATA KLIEN:
                    
                                ========================

                                Berikan output dengan struktur berikut:

                                1. CLINICAL SUMMARY
                                Ringkasan kondisi klien secara klinis, mencakup:
                                - presenting issues
                                - durasi
                                - konteks utama
                                - preferensi layanan: online / offline / keduanya

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
                                - tidak terlalu verbose
                                
                                `;

const maxHistory = 10;
function limitHistory(history: Content[]) {
  if (!history) return [];
  return history.slice(-maxHistory);
}
function countAIResponses(history?: Content[]) {
  if (!history) return 0;

  return history.filter((m) => m.role === "model").length;
}

async function callGeminiAPI(
  message: string,
  systemPrompt: string,
  history?: Content[],
) {
  for (const modelName of geminiModel) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const limitedHistory = limitHistory(history || []);

      const chat = model.startChat({
        history: limitedHistory,
        generationConfig: {
          maxOutputTokens: 1000,
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
function normalizeOpenRouterHistory(history: Content[]) {
  if (!history) return [];
  return history.map((item) => ({
    role: item.role === "model" ? "assistant" : item.role,
    content: item.parts?.[0]?.text || "",
  }));
}
async function callOpenRouterAPI(
  message: string,
  systemPrompt: string,
  history?: Content[],
) {
  for (const modelName of OpenRouterModel) {
    try {
      const normalizedHistory = normalizeOpenRouterHistory(
        limitHistory(history || []),
      );
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
              { role: "system", content: systemPrompt },
              ...normalizedHistory,
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
    const aiResponseCount = countAIResponses(history);

    if (type === "analyze") {
      try {
        const result = await callGeminiAPI(JSON.stringify(form), analyzePrompt);
        await FormBrief.create({
          _id: new ObjectId(),
          userId: new ObjectId(userId),
          brief: JSON.stringify(form),
          result: result,
          createdAt: new Date(),
        });
        return NextResponse.json({ response: result });
      } catch {
        const result = await callOpenRouterAPI(
          JSON.stringify(form),
          analyzePrompt,
        );
        await FormBrief.create({
          _id: new ObjectId(),
          userId: new ObjectId(userId),
          brief: JSON.stringify(form),
          result: result,
          createdAt: new Date(),
        });
        return NextResponse.json({ response: result });
      }
    }
    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 },
      );
    }
    const agreeKeywords = [
      "bersedia",
      "iya",
      "ya",
      "mau",
      "boleh",
      "ok",
      "oke",
    ];

    const isAgree = agreeKeywords.some((k) =>
      message.toLowerCase().includes(k),
    );

    if (isAgree && aiResponseCount >= 4) {
      return NextResponse.json({
        response: "Baik, aku bantu arahkan kamu ke psikolog ya",
        redirectToBooking: true,
      });
    }

    if (aiResponseCount >= 4) {
      return NextResponse.json({
        response:
          "Terima kasih sudah berbagi. Sepertinya kita hanya bisa membahas ini sampai sini, untuk lebih lanjut kamu bisa ngobrol langsung dengan psikolog profesional biar lebih dalam dan personal. Apakah kamu bersedia untuk lanjut ke sana?",
        askForBooking: true,
      });
    }
    try {
      const result = await callGeminiAPI(message, ChatPrompt, history);
      let finalResult=result;
      if(aiResponseCount===3){
        finalResult+="\n\n✨ Untuk melanjutkan lebih dalam dan personal, kamu bisa ngobrol langsung dengan psikolog profesional. Kamu bersedia?";
      }
      return NextResponse.json({
        response: finalResult,
        history: [
          ...(history || []),
          { role: "user", parts: [{ text: message }] },
          { role: "model", parts: [{ text: finalResult }] },
        ],
      });
    } catch (error) {
      console.error("(Gemini gagal, fallback ke OpenRouter)");
    }
    try {
      const result = await callOpenRouterAPI(message, ChatPrompt, history);
      let finalResult=result;
      if(aiResponseCount===3){
        finalResult+="\n\nUntuk melanjutkan lebih dalam dan personal, kamu bisa ngobrol langsung dengan psikolog profesional. Kamu bersedia?";
      }
      return NextResponse.json({ response: finalResult });
    } catch (error) {
      console.error("OpenRouter API error:");
    }
  } catch (error) {
    console.error("Unexpected error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
