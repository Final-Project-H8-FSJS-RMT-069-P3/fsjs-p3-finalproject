import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendDoctorBookingNotification(params: {
  doctorEmail: string;
  doctorName?: string;
  patientName: string;
  patientPhone?: string;
  patientAddress?: string;
  bookingDate: string;
  bookingTime?: string;
  priceTier?: string;
  notes?: string;
}) {
  const {
    doctorEmail,
    doctorName,
    patientName,
    patientPhone,
    patientAddress,
    bookingDate,
    bookingTime,
    priceTier,
    notes,
  } = params;

  const subject = `New booking from ${patientName} — ${bookingDate}${bookingTime ? " " + bookingTime : ""}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.4">
      <h2>New Booking</h2>
      <p><strong>Doctor:</strong> ${doctorName || doctorEmail}</p>
      <h3>Patient info</h3>
      <ul>
        <li><strong>Name:</strong> ${patientName}</li>
        <li><strong>Phone:</strong> ${patientPhone || "-"}</li>
        <li><strong>Address:</strong> ${patientAddress || "-"}</li>
      </ul>
      <h3>Schedule</h3>
      <p>${bookingDate}${bookingTime ? " at " + bookingTime : ""}</p>
      <p><strong>Price tier:</strong> ${priceTier || "Standard"}</p>
      ${notes ? `<h4>Notes</h4><p>${notes}</p>` : ""}
      <hr/>
      <p style="font-size:12px;color:#666">This notification was sent automatically.</p>
    </div>
  `;

  return resend.emails.send({
    from: process.env.RESEND_FROM || "no-reply@pendengarmu.com",
    to: doctorEmail,
    subject,
    html,
  });
}
