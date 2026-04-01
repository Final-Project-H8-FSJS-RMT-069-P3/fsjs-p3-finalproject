import { log } from "console";

function formatPhone(phone: string) {
    phone = phone.replace(/\D/g, "");

    if (phone.startsWith("0")) {
        return "62" + phone.slice(1);
    }
    if (phone.startsWith("62")) {
        return phone;
    }
    if (phone.startsWith("8")) {
        return "62" + phone;
    }
    return phone;
}

export async function sendWhatsApp(phone: string, message: string) {
  try {
    log("[wablas] sending message", { phone, message });
    log("[wablas] formatted phone", formatPhone(phone));
    const res = await fetch("https://kudus.wablas.com/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.WABLAS_TOKEN!,
      },
      body: JSON.stringify({
        phone: formatPhone(phone),
        message,
      }),
    });

    const data = await res.json();
    console.log("[wablas] success:", {
      original: phone,
      formatted: formatPhone(phone),
      response: data,
    });
  } catch (err) {
    console.error("[wablas] failed:", err);
  }
}
