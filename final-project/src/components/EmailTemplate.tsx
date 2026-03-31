import * as React from "react";

export interface EmailTemplateProps {
  doctorEmail: string;
  doctorName?: string;
  patientName: string;
  patientPhone?: string;
  patientAddress?: string;
  bookingDate: string;
  bookingTime?: string;
  priceTier?: string;
  notes?: string;
}

export function EmailTemplate(props: EmailTemplateProps) {
  const {
    doctorName,
    doctorEmail,
    patientName,
    patientPhone,
    patientAddress,
    bookingDate,
    bookingTime,
    priceTier,
    notes,
  } = props;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#111",
        lineHeight: 1.4,
      }}
    >
      <h2>New Booking</h2>

      <p>
        <strong>Doctor:</strong> {doctorName ?? doctorEmail}
      </p>

      <h3>Patient info</h3>
      <ul>
        <li>
          <strong>Name:</strong> {patientName}
        </li>
        <li>
          <strong>Phone:</strong> {patientPhone ?? "-"}
        </li>
        <li>
          <strong>Address:</strong> {patientAddress ?? "-"}
        </li>
      </ul>

      <h3>Schedule</h3>
      <p>
        {bookingDate}
        {bookingTime ? " at " + bookingTime : ""}
      </p>

      <p>
        <strong>Price tier:</strong> {priceTier ?? "Standard"}
      </p>

      {notes && (
        <>
          <h4>Notes</h4>
          <p>{notes}</p>
        </>
      )}

      <hr />

      <p style={{ fontSize: 12, color: "#666" }}>
        This notification was sent automatically.
      </p>
    </div>
  );
}
