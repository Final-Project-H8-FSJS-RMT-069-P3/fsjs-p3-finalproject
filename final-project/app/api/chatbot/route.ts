import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
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

    // --- MODIFIKASI UTAMA: SYSTEM INSTRUCTION ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Menggunakan versi stabil terbaru
      systemInstruction: `
        Kamu adalah asisten ahli psikologi dari aplikasi AuraMind. 
        Tugasmu:
        1. Hanya menjawab pertanyaan seputar kesehatan mental, psikologi, emosi, dan kesejahteraan diri.
        2. Jika pertanyaan di luar topik psikologi (seperti koding, politik, matematika, dll), jawab tepat dengan kalimat: "Mohon maaf, itu di luar kapasitas saya sebagai asisten psikologi."
        3. Berikan jawaban yang SINGKAT, padat, dan menenangkan (maksimal 2-10 kalimat).
        4. Jangan pernah memberikan saran medis atau psikologis yang spesifik, selalu arahkan untuk konsultasi dengan profesional yang dimiliki jika diperlukan.
        5. Tawarkan di setiap akhir jawaban agar dibantu terhubung dengan psikolog setelah menjawab pertanyaan dari pengguna. Jika pengguna setuju, jawab dengan: "Baik, saya akan membantu menghubungkan Anda dengan psikolog kami. Silakan tunggu sebentar."
      `,
    });

    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 5000, // Dibatasi agar jawaban tetap singkat
        temperature: 0.5,     // Lebih fokus dan tidak terlalu kreatif
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan", details: error.message },
      { status: 500 }
    );
  }
}