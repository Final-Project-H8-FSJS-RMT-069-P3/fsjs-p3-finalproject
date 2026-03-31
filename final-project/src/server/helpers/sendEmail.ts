import { EmailTemplate, EmailTemplateProps } from "@/components/EmailTemplate";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("RESEND_API_KEY is not set in environment");
}
const resend = new Resend(apiKey);

// prefer full "Name <email>" in RESEND_FROM, but accept plain email
const rawFrom = process.env.RESEND_FROM ?? "";
const from = rawFrom.includes("<")
  ? rawFrom
  : rawFrom
    ? `PendengarMu <${rawFrom}>`
    : "PendengarMu <no-reply@watisdis.web.id>";

export async function SendEmail(payload: EmailTemplateProps) {
  if (!payload?.doctorEmail) {
    throw new Error("Missing recipient email in SendEmail payload");
  }

  try {
    const result = await resend.emails.send({
      from,
      to: [payload.doctorEmail],
      subject: `New booking — ${payload.patientName}`,
      react: EmailTemplate(payload),
    });

    // SDK may return an object with an `error` property; check safely without `any`
    if (typeof result === "object" && result !== null) {
      const resObj = result as Record<string, unknown>;
      if (resObj.error) {
        throw resObj.error;
      }
    }

    console.log("SendEmail result:", result);
    return result;
  } catch (err) {
    console.error("SendEmail error:", err);
    throw err;
  }
}
